const test = require("node:test");
const assert = require("node:assert");
const { resolveBookUrl, uniqueBooksByUrl } = require("./discover");
const { extractBook } = require("./extract");

// Test 1: Relative catalogue links become absolute URLs.
test("converts relative URLs to absolute URLs", () => {
  const result = resolveBookUrl(
    "../book/example-book/index.html",
    "https://books.toscrape.com/catalogue/page-2.html"
  );

  assert.strictEqual(
    result,
    "https://books.toscrape.com/book/example-book/index.html"
  );
});

// Test 2: Duplicate URLs are removed.
test("removes duplicate books based on URL", () => {
  const books = [
    { url: "https://example.com/book-1", title: "Book One" },
    { url: "https://example.com/book-2", title: "Book Two" },
    { url: "https://example.com/book-1", title: "Book One Duplicate" },
  ];

  const result = uniqueBooksByUrl(books);

  assert.strictEqual(result.length, 2);
});

// Test 3: Missing description returns null.
test("handles a missing book description", () => {
  const html = `
    <html>
      <body>
        <h1>Test Book</h1>
        <p class="price_color">£10.00</p>
        <p class="availability">In stock</p>
        <p class="star-rating Three"></p>
      </body>
    </html>
  `;

  const result = extractBook(
    html,
    "https://books.toscrape.com/catalogue/test-book/index.html",
    "https://books.toscrape.com/"
  );

  assert.strictEqual(result.description, null);
});

// // Test 4: Parser handles incomplete or malformed HTML without crashing.
test("handles malformed HTML and missing fields", () => {
  const html = `
    <html>
      <body>
        <h1>Incomplete Book</h1>
        <p class="price_color">£15.50</p>
        <div class="availability">In stock
        <div class="star-rating Three">
  `;

  const result = extractBook(
    html,
    "https://books.toscrape.com/catalogue/incomplete/index.html",
    "https://books.toscrape/"
  );

  assert.strictEqual(result.title, "Incomplete Book");
  assert.strictEqual(result.price_text, "£15.50");
  assert.strictEqual(result.description, null);
});