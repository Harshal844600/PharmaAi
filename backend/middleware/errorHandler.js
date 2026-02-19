/**
 * middleware/errorHandler.js
 *
 * Centralized Express error handling middleware.
 * Catches all errors from routes and services and returns consistent JSON.
 *
 * Always returns:
 * {
 *   "error": true,
 *   "code": "ERROR_CODE",
 *   "message": "Human-readable message",
 *   "details": "..." (optional)
 * }
 */

const multer = require('multer');

/**
 * Global error handler.
 * Must have 4 parameters for Express to treat it as an error handler.
 */
function errorHandler(err, req, res, next) {
  console.error(`[ErrorHandler] ${err.code || 'UNKNOWN_ERROR'}: ${err.message}`);

  // ─── Multer: file too large ──────────────────────────────────────────────────
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: true,
      code: 'FILE_TOO_LARGE',
      message: 'Uploaded file exceeds the 5 MB limit.',
    });
  }

  // ─── Multer: unexpected field name ──────────────────────────────────────────
  if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: true,
      code: 'UNEXPECTED_FILE_FIELD',
      message: 'File must be uploaded in the "vcf_file" field.',
    });
  }

  // ─── Custom: invalid file type ───────────────────────────────────────────────
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      error: true,
      code: 'INVALID_FILE_TYPE',
      message: err.message || 'Only .vcf files are accepted.',
    });
  }

  // ─── MongoDB: connection errors ──────────────────────────────────────────────
  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
    return res.status(503).json({
      error: true,
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database connection error. Analysis was performed but results could not be saved.',
      details: err.message,
    });
  }

  // ─── Mongoose: validation errors ─────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Data validation failed.',
      details: err.message,
    });
  }

  // ─── Generic / unhandled error ───────────────────────────────────────────────
  const statusCode = err.statusCode || err.status || 500;
  console.error('[ErrorHandler] Full stack:', err.stack);
  res.status(statusCode).json({
    error: true,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred. Please try again.',
    details: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });
}

module.exports = { errorHandler };
