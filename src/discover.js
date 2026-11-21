const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const BASE_URL = "https://books.toscrape.com/";
const CACHE_DIR = path.join(__dirname, "..", "cache");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Convert a catalogue link into an absolute URL.
function resolveBookUrl(href, currentPageUrl) {
  return new URL(href, currentPageUrl).href;
}

// Remove duplicate books using their URLs.
function uniqueBooksByUrl(books) {
  return [
    ...new Map(books.map((book) => [book.url, book])).values(),
  ];
}
async function fetchPage(url) {
  const filename =
    new URL(url).pathname.split("/").filter(Boolean).pop() || "home";

  const cacheFile = path.join(CACHE_DIR, `page-${filename}.html`);

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

  return html;
}

async function discoverBooks() {
  let currentPageUrl = BASE_URL;

  const cataloguePages = [];
  const bookMap = new Map();

  for (let pageNumber = 1; pageNumber <= 3; pageNumber++) {
    if (pageNumber > 1) {
      await delay(500);
    }

    const html = await fetchPage(currentPageUrl);
    const $ = cheerio.load(html);

    cataloguePages.push(currentPageUrl);

    $("article.product_pod h3 a").each((_, element) => {
      const href = $(element).attr("href");

      if (href) {
             
        if (!bookMap.has(absoluteUrl)) {
          bookMap.set(absoluteUrl, currentPageUrl);
        }
      }
    });

    const nextLink = $("li.next a").attr("href");

    if (pageNumber < 3 && nextLink) {
      currentPageUrl = new URL(nextLink, currentPageUrl).href;
    }
  }

  const books = [...bookMap.entries()].map(([url, sourcePage]) => ({
    url,
    sourcePage
  }));

  console.log("\n--- Discovery Summary ---");
  console.log(`catalogue_pages=${cataloguePages.length}`);
  console.log(`discovered=${books.length}`);
  console.log(`unique_urls=${books.length}`);

  console.log("\nCatalogue pages visited:");
  cataloguePages.forEach((url) => console.log(url));

  return books;
}

if (require.main === module) {
  discoverBooks().catch((error) => {
    console.error("Discovery failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { discoverBooks, resolveBookUrl, uniqueBooksByUrl };