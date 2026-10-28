import { ApiError } from '../utils/apiError.js';
import { env } from '../config/env.js';

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Endpoint not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Invalid resource identifier: ${err.value}`;
    error = new ApiError(400, message);
  }

  // Handle Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    const message = `Duplicate value entered for field(s): ${fields}. Value must be unique.`;
    error = new ApiError(409, message, [{ fields, duplicate: err.keyValue }]);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((val) => ({
      path: val.path,
      message: val.message
    }));
    error = new ApiError(400, 'Mongoose Schema Validation Failed', errors);
  }

  // Handle JWT Malformed / Signature Errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid security token format');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  if (statusCode === 500) {
    console.error('🔥 Unexpected Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: error.errors || [],
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};
