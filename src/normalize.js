const fs = require("fs");
const path = require("path");
const { z } = require("zod");

// Define the schema for a normalized book
const BookSchema = z.object({
  title: z.string().min(1),
  product_url: z.string().url(),
  price_text: z.string(),
  price_gbp: z.number().nonnegative(),
  availability_text: z.string(),
  rating_text: z.string(),
  description: z.string().nullable(),
  source_page: z.string().url(),
  fetched_at: z.string(),
});

// Convert raw price text into a numeric GBP value
function normalizePrice(priceText) {
  const cleanedPrice = priceText.replace(/[£\s]/g, "");
  const price = Number(cleanedPrice);

  if (!Number.isFinite(price)) {
    throw new Error(`Invalid price: ${priceText}`);
  }

  return price;
}

// Normalize one book record
function normalizeBook(rawBook) {
  return {
    ...rawBook,
    price_gbp: normalizePrice(rawBook.price_text),
  };
}

// File paths
const INPUT_FILE = path.join(__dirname, "../output/raw-books.json");
const BOOKS_FILE = path.join(__dirname, "../output/books.json");
const ERRORS_FILE = path.join(__dirname, "../output/errors.json");

// Read raw scraped data
const rawBooks = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));

const validBooks = [];
const errors = [];

// Process and validate each book individually
rawBooks.forEach((rawBook, index) => {
  try {
    const normalizedBook = normalizeBook(rawBook);

    const result = BookSchema.safeParse(normalizedBook);

    if (!result.success) {
      errors.push({
        index,
        title: rawBook.title || "Unknown book",
        issues: result.error.issues,
      });
    } else {
      validBooks.push(result.data);
    }
  } catch (error) {
    errors.push({
      index,
      title: rawBook.title || "Unknown book",
      error: error.message,
    });
  }
});

// Save validated books
fs.writeFileSync(
  BOOKS_FILE,
  JSON.stringify(validBooks, null, 2)
);

// Save rejected records
fs.writeFileSync(
  ERRORS_FILE,
  JSON.stringify(errors, null, 2)
);

// Report results
console.log("Raw books:", rawBooks.length);
console.log("Valid books:", validBooks.length);
console.log("Invalid books:", errors.length);
console.log("Saved:", BOOKS_FILE);
console.log("Saved:", ERRORS_FILE);
