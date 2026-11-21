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

## Stage 5: Resilience and Run Reporting

The scraper includes resilience mechanisms to handle individual book-page failures without stopping the entire scraping process.

### Resilience features

- **Timeout protection:** Requests time out after 10 seconds.
- **Retry mechanism:** Retries network failures and HTTP 5xx server errors once.
- **Permanent HTTP failures:** HTTP 403 and 404 errors are not retried.
- **Page-level error handling:** A failed book page does not stop the remaining scraping process.
- **Caching:** Previously fetched book pages are reused to reduce unnecessary requests.
- **Polite scraping:** A 500ms delay is applied between book-page processing.
- **Run reporting:** The scraper generates a JSON report containing the number of books discovered, extracted, failed, and the run status.

### Run report

The report is saved to:

`output/run-report.json`

### Successful run results

- Catalogue pages: 3
- Books discovered: 60
- Books extracted: 60
- Failed books: 0
- Status: completed

### Failure test

A deliberately nonexistent book URL was used to test permanent HTTP 404 handling.

The test confirmed that:

- HTTP 404 was detected.
- The request was not retried.
- The error was caught.
- The test script completed without crashing.

### Files

- `src/extract.js` — book extraction, caching, timeout and retry handling.
- `src/test-failure.js` — deliberate HTTP 404 failure test.
- `output/run-report.json` — run summary and failure information.
- `output/raw-books.json` — extracted raw book records.
