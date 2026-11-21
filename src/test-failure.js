
const { fetchBookPage } = require("./extract");

async function testFailure() {
  const fakeUrl =
    "https://books.toscrape.com/catalogue/this-book-does-not-exist-9999/index.html";

  console.log("Testing failure handling...");
  console.log(`Test URL: ${fakeUrl}`);

  try {
    await fetchBookPage(fakeUrl);

    console.log("Unexpected success: the fake URL returned a page.");
  } catch (error) {
    console.log("\nEXPECTED FAILURE CAUGHT!");
    console.log(error.message);
    console.log("\nThe test completed without crashing the test script.");
  }
}

testFailure();

