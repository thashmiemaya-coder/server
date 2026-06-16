import ErrorResponse from '../utils/ErrorResponse.js';

export const notFound = (req, _res, next) =>
  next(new ErrorResponse(`Route not found: ${req.originalUrl}`, 404));

// Central error handler — normalizes Mongoose & JWT errors.
export const errorHandler = (err, _req, res, _next) => {
  let error = { ...err, message: err.message };

  if (err.name === 'CastError') error = new ErrorResponse(`Resource not found`, 404);
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    error = new ErrorResponse(`Duplicate value for '${field}'`, 400);
  }
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map((e) => e.message).join(', ');
    error = new ErrorResponse(msg, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
