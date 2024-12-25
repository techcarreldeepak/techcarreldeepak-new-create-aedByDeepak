const { error_detector } = require("./error-detector");
const error_man = async (err, req, res, next) => {
  console.log(err); // Log the error for debugging

  const method = req.method;
  const fullPath =
    req.protocol +
    "://" +
    req.get("host") +
    req.originalUrl +
    " --> " +
    method +
    " ☹ ";

  // Construct the error details
  const lastError = {
    message: err.message,
    url: fullPath,
    originalUrl: req.originalUrl,
    request_body: req.body,
    response_body: {
      success: false,
      message: "An error occurred",
      type: err.name, // Include the type of error
    },
  };

  // Handle specific errors
  switch (err.name) {
    case "SequelizeDatabaseError":
      lastError.response_body.message = "Database error: " + err.message;
      lastError.response_body.type = "SequelizeDatabaseError"; // Set specific error type
      break;

    case "SequelizeValidationError":
      lastError.response_body.message =
        "Validation error: " + err.errors.map((e) => e.message).join(", ");
      lastError.response_body.type = "SequelizeValidationError"; // Set specific error type
      break;

    case "NotFoundError":
      lastError.response_body.message = "Resource not found: " + err.message;
      lastError.response_body.type = "NotFoundError"; // Set specific error type
      res.status(404); // Send a 404 status for not found errors
      break;

    case "ValidationError":
      lastError.response_body.message =
        "Input validation failed: " + err.message;
      lastError.response_body.type = "ValidationError"; // Set specific error type
      break;

    default:
      lastError.response_body.message = "Internal server error: " + err.message; // Generic error message
      lastError.response_body.type = "InternalError"; // Set generic error type
      break;
  }

  // Log the error using your error detector (which sends to Slack)
  try {
    await error_detector(
      lastError.message,
      lastError.url,
      lastError.originalUrl,
      lastError.request_body,
      lastError.response_body
    );
  } catch (loggingError) {
    console.error("Failed to send error to Slack:", loggingError);
  }

  // Send response with the error
  // res.status(lastError.status || 500).json(lastError.response_body);
};

module.exports = {
  error_man,
};
