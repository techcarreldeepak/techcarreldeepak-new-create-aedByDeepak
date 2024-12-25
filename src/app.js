const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const routes = require("./routes/v1/index");
const dotenv = require("dotenv");
const swaggerDocs = require("./config/swagger");
const compression = require("compression");
const { error_man } = require("./error-man");
dotenv.config();


const app = express();
app.use(compression());

const PORT = parseInt(process.env.PORT || 3000);
swaggerDocs(app, PORT);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// const responseHandlerMiddleware = require('./middleware/responseHandler.middleware');
// app.use(responseHandlerMiddleware);

// const container = require('./config/di');
// app.use((req, res, next) => {
//   req.container = container.createScope();
//   next();
// });


// API routes
app.use("/api/v1", routes);

// Health check route
app.get("/health", (req, res) => {
  return res.status(200).json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use(error_man);
// app.use(async (err, req, res, next) => {
//   console.log(err)
//   const method = req.method;
//   const fullPath =
//     req.protocol +
//     "://" +
//     req.get("host") +
//     req.originalUrl +
//     " --> " +
//     method +
//     " ☹ ";

//   // Construct the error details
//   const lastError = {
//     message: err.message,
//     url: fullPath,
//     originalUrl: req.originalUrl,
//     request_body: req.body,
//     response_body: {
//       success: false,
//       message: "An error occurred",
//     },
//   };

//   // Handle specific errors
//   if (err.name === "SequelizeDatabaseError") {
//     lastError.response_body.message = "Database error: " + err.message;
//   } else if (err.name === "SequelizeValidationError") {
//     lastError.response_body.message =
//       "Validation error: " + err.errors.map((e) => e.message).join(", ");
//   } else {
//     lastError.response_body.message = err.message; // Generic error message
//   }

//   // Log the error using your error detector (which sends to Slack)
//   try {
//     await error_detector(
//       lastError.message,
//       lastError.url,
//       lastError.originalUrl,
//       lastError.request_body,
//       lastError.response_body
//     );
//   } catch (loggingError) {
//     console.error("Failed to send error to Slack:", loggingError);
//   }

//   // Send response with the error
//   res.status(err.status || 500).json(lastError.response_body);
// });

// app.use(errorMiddleware);

module.exports = app;
