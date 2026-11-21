# The Polite Scraper

A small, polite web-scraping pipeline built for the FlyRank Backend AI Engineering Week 5 assignment.

## Target Classification

### Target

Books to Scrape:

https://books.toscrape.com/

### Why this site?

Books to Scrape is a public practice sandbox specifically intended for learning and practicing web scraping.

### Scope

This scraper will process only the first three catalogue pages and discover the 60 books listed on those pages.

### Data collected

For each book, the scraper will collect:

- title
- product_url
- price_text
- availability_text
- rating_text
- description
- source_page
- fetched_at

The normalized records will also contain:

- price_gbp

### Why this is appropriate

Books to Scrape is a practice sandbox designed for scraping exercises, making it an appropriate target for this assignment.

### Robots.txt

Checked:

https://books.toscrape.com/robots.txt

Result:
The server returned HTTP 404 Not Found. No robots.txt file was found at the requested URL during this check.
### Scraping rule

I will not reuse this code on another site without checking its rules and terms first.

## Stage 4: Normalization and Validation

The raw scraped data is normalized and validated using Zod.

- Converts scraped prices from GBP text (e.g. £51.77) into numeric values.
- Validates book records against a Zod schema.
- Saves valid records to `output/books.json`.
- Saves validation errors to `output/errors.json`.

### Validation Results

- Raw records processed: 60
- Valid records: 60
- Invalid records: 0
- Validation library: Zod
