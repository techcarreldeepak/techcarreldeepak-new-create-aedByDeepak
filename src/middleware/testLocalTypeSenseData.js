const { typeSenseClient } = require("../config/typeSenseCon");

const getLimitedTypeSenseData = async () => {
  try {
    const startTime = Date.now();
    const limit = 100; // Total limit for documents to fetch
    let page = 1; // Start from page 1 (TypeSense uses 1-based indexing)
    let allDocuments = [];

    while (allDocuments.length < limit) {
      // Perform the search with the current page number
      const result = await typeSenseClient
        .collections("Users")
        .documents()
        .search({
          q: '*', // Use '*' to fetch documents
          limit: limit - allDocuments.length, // Adjust limit based on already fetched documents
          page: page,
        });

      const documents = result.hits.map((hit) => hit.document);
      allDocuments = allDocuments.concat(documents);

      // Stop if there are no more documents to fetch
      if (documents.length < limit) {
        break; // Exit the loop if fewer documents than needed are returned
      }

      page++; // Increment page for the next iteration
    }

    // Trim the document list to exactly 100 if necessary
    if (allDocuments.length > limit) {
      allDocuments = allDocuments.slice(0, limit);
    }

    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    console.log(`Time taken to fetch data: ${timeTaken}ms`);
    console.log(`Fetched ${allDocuments.length} documents`);

    return allDocuments;
  } catch (error) {
    console.error("Error fetching data from TypeSense:", error);
    throw error;
  }
};

getLimitedTypeSenseData().then((data) => {
  console.log(data);
});
