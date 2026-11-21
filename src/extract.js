
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const { discoverBooks } = require("./discover");

const CACHE_DIR = path.join(__dirname, "../cache");
const OUTPUT_DIR = path.join(__dirname, "../output");
const RAW_OUTPUT_FILE = path.join(OUTPUT_DIR, "raw-books.json");
const REPORT_FILE = path.join(OUTPUT_DIR, "run-report.json");

const USER_AGENT =
  "FlyRankInternship-A9/1.0 (+https://github.com/Chidinma-Git)";

const REQUEST_TIMEOUT = 10000;
const MAX_ATTEMPTS = 2;
const POLITE_DELAY = 500;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Create a separate cache file for each book.
function getCacheFile(url) {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);

  const bookSlug = segments[segments.length - 2];

  return path.join(CACHE_DIR, `book-${bookSlug}.html`);
}

// Fetch a book page, using cache and retry protection.
async function fetchBookPage(url) {
  const cacheFile = getCacheFile(url);

  // Use cached HTML if available.
  if (fs.existsSync(cacheFile)) {
    console.log(`CACHE HIT: ${url}`);
    return fs.readFileSync(cacheFile, "utf8");
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`FETCH attempt ${attempt}/${MAX_ATTEMPTS}: ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });

      // Permanent failures: do not retry.
      if (response.status === 403 || response.status === 404) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      // Retry server errors (5xx).
      if (response.status >= 500 && response.status <= 599) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      // Do not retry other HTTP client errors (4xx).
      if (response.status >= 400 && response.status <= 499) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      const html = await response.text();

      fs.writeFileSync(cacheFile, html, "utf8");

      console.log(`Saved cache: ${cacheFile}`);

      return html;
    } catch (error) {
      const isPermanentFailure =
        error.message.includes("HTTP 403") ||
        error.message.includes("HTTP 404") ||
        (error.message.startsWith("HTTP ") &&
          error.message.includes("4"));

      const isLastAttempt = attempt === MAX_ATTEMPTS;

      if (isPermanentFailure || isLastAttempt) {
        throw error;
      }

      console.warn(`Request failed: ${error.message}`);
      console.warn("Retrying after 500ms...");

      await delay(POLITE_DELAY);
    }
  }

  throw new Error(`Failed to fetch ${url}`);
}

// Extract the required information from a book page.
function extractBook(html, productUrl, sourcePage) {
  const $ = cheerio.load(html);

  const title = $("h1").text().trim();

  const priceText = $(".price_color").first().text().trim();

  const availabilityText = $(".availability").text().trim();

  const ratingText = $(".star-rating").attr("class") || "";

  let description =
    $("#product_description").next("p").text().trim() || null;

  if (description) {
    description = description.replace(/\s+/g, " ").trim();

    // Remove the trailing "...more" marker.
    description = description.replace(/\s*\.{3,}more$/i, "").trim();

    // Remove a duplicated introductory fragment if present.
    const firstSentenceEnd = description.search(/[.!?]\s/);

    if (firstSentenceEnd !== -1) {
      const firstSentence = description.slice(
        0,
        firstSentenceEnd + 1
      );

      const secondOccurrence = description.indexOf(
        firstSentence,
        firstSentenceEnd + 1
      );

      if (secondOccurrence !== -1) {
        description = description.slice(secondOccurrence).trim();
      }
    }
  }

  return {
    title,
    product_url: productUrl,
    price_text: priceText,
    availability_text: availabilityText,
    rating_text: ratingText,
    description,
    source_page: sourcePage,
    fetched_at: new Date().toISOString(),
  };
}

// Main scraping process.
async function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const startedAt = new Date().toISOString();

  const runReport = {
    started_at: startedAt,
    completed_at: null,
    catalogue_pages: 3,
    discovered: 0,
    extracted: 0,
    failed: 0,
    failures: [],
    status: "running",
  };

  const rawBooks = [];

  try {
    console.log("Discovering books...");

    const books = await discoverBooks();

    runReport.discovered = books.length;

    console.log(`Discovered ${books.length} books.`);

    for (let i = 0; i < books.length; i++) {
      const book = books[i];

      console.log(`\nProcessing book ${i + 1}/${books.length}`);
      console.log(book.url);

      try {
        const html = await fetchBookPage(book.url);

        const extractedBook = extractBook(
          html,
          book.url,
          book.sourcePage
        );

        rawBooks.push(extractedBook);

        console.log(`SUCCESS: ${extractedBook.title}`);
      } catch (error) {
        console.error(`FAILED: ${book.url}`);
        console.error(error.message);

        runReport.failures.push({
          url: book.url,
          source_page: book.sourcePage,
          error: error.message,
          failed_at: new Date().toISOString(),
        });
      }

      // Wait between book requests.
      if (i < books.length - 1) {
        await delay(POLITE_DELAY);
      }
    }

    // Remove duplicate books based on product URL.
    const uniqueBooks = [
      ...new Map(
        rawBooks.map((book) => [book.product_url, book])
      ).values(),
    ];

    fs.writeFileSync(
      RAW_OUTPUT_FILE,
      JSON.stringify(uniqueBooks, null, 2),
      "utf8"
    );

    runReport.extracted = uniqueBooks.length;
    runReport.failed = runReport.failures.length;
    runReport.completed_at = new Date().toISOString();

    runReport.status =
      runReport.failed === 0 ? "completed" : "completed_with_errors";

    fs.writeFileSync(
      REPORT_FILE,
      JSON.stringify(runReport, null, 2),
      "utf8"
    );

    console.log("\n========== RUN SUMMARY ==========");
    console.log(`Discovered: ${runReport.discovered}`);
    console.log(`Extracted: ${runReport.extracted}`);
    console.log(`Failed: ${runReport.failed}`);
    console.log(`Status: ${runReport.status}`);
    console.log(`Raw data: ${RAW_OUTPUT_FILE}`);
    console.log(`Run report: ${REPORT_FILE}`);
    console.log("================================");
  } catch (error) {
    runReport.status = "failed";
    runReport.completed_at = new Date().toISOString();
    runReport.fatal_error = error.message;

    fs.writeFileSync(
      REPORT_FILE,
      JSON.stringify(runReport, null, 2),
      "utf8"
    );

    console.error("Scraping process failed:", error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fetchBookPage, extractBook, getCacheFile, delay };
