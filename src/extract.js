const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const { discoverBooks } = require("./discover");

const CACHE_DIR = path.join(__dirname, "..", "cache");
const OUTPUT_DIR = path.join(__dirname, "..", "output");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getCacheFile(url) {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);

  // The book slug is the folder immediately before index.html.
  const bookSlug = segments[segments.length - 2];

  return path.join(CACHE_DIR, `book-${bookSlug}.html`);
}

async function fetchBookPage(url) {
  const cacheFile = getCacheFile(url);

  // Use cached HTML if it already exists.
  if (fs.existsSync(cacheFile)) {
    console.log(`CACHE HIT: ${url}`);
    return fs.readFileSync(cacheFile, "utf8");
  }

  console.log(`FETCH: ${url}`);

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "FlyRankInternship-A9/1.0 (+https://github.com/Chidinma-Git)"
    },
    signal: AbortSignal.timeout(10000)
  });

  if (response.status !== 200) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const html = await response.text();

  fs.writeFileSync(cacheFile, html, "utf8");

  console.log(`Saved: ${cacheFile}`);

  return html;
}

function extractBook(html, productUrl, sourcePage) {
  const $ = cheerio.load(html);

  const title = $("div.product_main h1").text().trim();

  const priceText = $("div.product_main .price_color").text().trim();

  const availabilityText = $("div.product_main .availability")
    .text()
    .replace(/\s+/g, " ")
    .trim();

  const ratingText =
    $("div.product_main p.star-rating")
      .attr("class")
      ?.replace("star-rating", "")
      .trim() || null;

  let description =
  $("#product_description").next("p").text().trim() || null;

if (description) {
  description = description.replace(/\s+/g, " ").trim();

  // Remove the trailing "...more" marker.
  description = description.replace(/\s*\.{3,}more$/i, "").trim();

  // Remove a duplicated introductory fragment if it appears.
  const firstSentenceEnd = description.search(/[.!?]\s/);

  if (firstSentenceEnd !== -1) {
    const firstSentence = description.slice(0, firstSentenceEnd + 1);
    const secondOccurrence = description.indexOf(firstSentence, firstSentenceEnd + 1);

    if (secondOccurrence !== -1) {
      description = description.slice(secondOccurrence).trim();
    }
  }
}
  return {
    title: title || null,
    product_url: productUrl,
    price_text: priceText || null,
    availability_text: availabilityText || null,
    rating_text: ratingText,
    description,
    source_page: sourcePage,
    fetched_at: new Date().toISOString()
  };
}

async function main() {
  const booksToExtract = await discoverBooks();

  const extractedBooks = [];

  for (let i = 0; i < booksToExtract.length; i++) {
    const book = booksToExtract[i];

    console.log(`\nExtracting ${i + 1}/${booksToExtract.length}`);

    try {
      // Wait 500ms between book requests.
      if (i > 0) {
        await delay(500);
      }

      const html = await fetchBookPage(book.url);

      const record = extractBook(html, book.url, book.sourcePage);

      extractedBooks.push(record);

      console.log(`Extracted: ${record.title}`);
    } catch (error) {
      console.error(`Failed to extract ${book.url}:`, error.message);
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const outputFile = path.join(OUTPUT_DIR, "raw-books.json");

  fs.writeFileSync(
    outputFile,
    JSON.stringify(extractedBooks, null, 2),
    "utf8"
  );

  console.log("\n--- Extraction Summary ---");
  console.log(`Discovered: ${booksToExtract.length}`);
  console.log(`Extracted: ${extractedBooks.length}`);
  console.log(`Saved: ${outputFile}`);
}

main().catch((error) => {
  console.error("Extraction failed:", error.message);
  process.exitCode = 1;
});