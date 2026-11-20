const fs = require("fs");
const path = require("path");

const PAGE_URL = "https://books.toscrape.com/";
const CACHE_FILE = path.join(__dirname, "..", "cache", "catalogue-page-1.html");

async function fetchCataloguePage() {
  // If the HTML is already cached, read it locally.
  if (fs.existsSync(CACHE_FILE)) {
    const cachedHTML = fs.readFileSync(CACHE_FILE, "utf8");

    console.log("CACHE HIT");
    console.log(`Response size: ${Buffer.byteLength(cachedHTML)} bytes`);

    return cachedHTML;
  }

  console.log("FETCH");

  try {
    const response = await fetch(PAGE_URL, {
      headers: {
        "User-Agent":
          "FlyRankInternship-A9/1.0 (+https://github.com/Chidinma-Git)"
      },
      signal: AbortSignal.timeout(10000)
    });

    // Check the HTTP status before processing the HTML.
    if (response.status !== 200) {
      throw new Error(`HTTP request failed: ${response.status}`);
    }

    const html = await response.text();

    // Save the HTML locally for future runs.
    fs.writeFileSync(CACHE_FILE, html, "utf8");

    console.log(`Response size: ${Buffer.byteLength(html)} bytes`);
    console.log("HTML saved to cache/catalogue-page-1.html");

    return html;
  } catch (error) {
    console.error("Fetch failed:", error.message);
    process.exitCode = 1;
  }
}

fetchCataloguePage();