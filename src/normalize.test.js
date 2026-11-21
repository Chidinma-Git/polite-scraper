const test = require("node:test");
const assert = require("node:assert");
const {
  normalizePrice,
  normalizeBook,
  BookSchema,
} = require("./normalize");

test("converts GBP price text to a number", () => {
  assert.strictEqual(normalizePrice("£51.77"), 51.77);
});

test("converts price with spaces", () => {
  assert.strictEqual(normalizePrice(" £10.00 "), 10);
});

test("rejects an invalid price", () => {
  assert.throws(() => normalizePrice("not-a-price"));
});

test("normalizes a book by adding numeric price", () => {
  const rawBook = {
    title: "Test Book",
    product_url: "https://books.toscrape.com/test-book/index.html",
    price_text: "£20.50",
    availability_text: "In stock",
    rating_text: "star-rating Three",
    description: "A test description",
    source_page: "https://books.toscrape.com/catalogue/page-1.html",
    fetched_at: "2026-11-21T10:00:00.000Z",
  };

  const normalized = normalizeBook(rawBook);

  assert.strictEqual(normalized.price_gbp, 20.5);
});

test("validates a normalized book record", () => {
  const book = {
    title: "Test Book",
    product_url: "https://books.toscrape.com/test-book/index.html",
    price_text: "£20.50",
    price_gbp: 20.5,
    availability_text: "In stock",
    rating_text: "star-rating Three",
    description: null,
    source_page: "https://books.toscrape.com/catalogue/page-1.html",
    fetched_at: "2026-11-21T10:00:00.000Z",
  };

  assert.strictEqual(BookSchema.safeParse(book).success, true);
});
