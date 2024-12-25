const express = require("express");
const aedRouter = require("../../modules/aed_relatives/combine/aedRouter");

const router = express.Router();

const defaultRoutes = [
  {
    path: "/",
    route: aedRouter,
  },
];

// Mount all routes
defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

// API documentation route (if you decide to add Swagger or similar)
router.use("/docs", (req, res) => {
  res.send("API documentation will be available here");
});

// Health check route
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API is healthy and running",
  });
});

module.exports = router;
