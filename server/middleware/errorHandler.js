// Centralized Error Handling Middleware
// Catches and formats all unhandled backend errors
const errorHandler = (err, req, res, next) => {
  console.error("Server Error Log:", err.stack || err.message);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};

module.exports = errorHandler;
