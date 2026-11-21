const books = require("../output/raw-books.json");

const missingDescriptions = books.filter(
  (book) => !book.description
).length;

const moreMarkers = books.filter(
  (book) => book.description && /\.{3,}more/i.test(book.description)
).length;

const duplicateOpening = books.filter((book) => {
  const description = book.description || "";
  const sentenceEnd = description.search(/[.!?]\s/);

  if (sentenceEnd < 0) {
    return false;
  }

  const firstSentence = description.slice(0, sentenceEnd + 1);

  return description.indexOf(firstSentence, sentenceEnd + 1) !== -1;
}).length;

console.log("Total books:", books.length);
console.log("Descriptions missing:", missingDescriptions);
console.log("Descriptions with ...more:", moreMarkers);
console.log("Descriptions with duplicate opening:", duplicateOpening);
