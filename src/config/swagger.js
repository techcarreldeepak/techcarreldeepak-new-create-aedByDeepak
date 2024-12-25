const swaggerUi = require("swagger-ui-express");
const { routes } = require("../middleware/registerRoute"); // Assuming your routes are dynamically loaded from registerRoute.js
const BASE_URL = process.env.SERVER_URL || "http://localhost:3000"; // Default server URL

// Initialize the Swagger document object
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "API Documentation",
    version: "1.0.0",
    description: "API documentation for Your Project",
  },
  servers: [
    {
      url: BASE_URL + "/api/v1", // Base URL for the API
      description: "Development server",
    },
  ],
  paths: {}, // Will be dynamically populated
};

// Loop through the routes and dynamically generate Swagger paths
routes.forEach((route) => {
  const path = route.path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}"); // Convert route params to Swagger format

  if (!swaggerDocument.paths[path]) {
    swaggerDocument.paths[path] = {}; // Initialize the path if it doesn't exist
  }

  // Add details for each route method (GET, POST, etc.)
  swaggerDocument.paths[path][route.method] = {
    summary: route.summary,
    description: route.description, // Assuming description is provided in each route
    tags: route.tags, // Tags for grouping routes
    parameters: route.parameters, // Parameters for the route (query params, path params)
    requestBody: route.requestBody, // Request body schema (for POST, PUT, etc.)
    responses: route.responses, // Possible responses (200, 400, 500, etc.)
  };
});

function swaggerDocs(app, port) {
  // Serve Swagger UI documentation at /docs
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Expose Swagger JSON at /docs.json
  app.get("/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerDocument);
  });

  console.log(`Docs available at http://localhost:${port}/docs`);
}

module.exports = swaggerDocs;
