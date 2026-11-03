import { ZodError } from 'zod';
import { AppError } from '../utils/appError.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let error = err;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
  }

  // Handle Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    const message = fields.length > 0
      ? `A record with that ${fields.join(', ')} already exists`
      : 'Duplicate resource error';
    error = new AppError(message, 409, 'CONFLICT', err.keyValue);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
  }

  // Handle Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    error = new AppError(`Invalid value for field: ${err.path}`, 400, 'VALIDATION_ERROR', {
      field: err.path,
      value: err.value,
    });
  }

  // Handle Multer file size error
  if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File size exceeds the 5 MB limit', 413, 'FILE_TOO_LARGE');
  }

  const statusCode = error.statusCode || 500;
  const errorCode = error.errorCode || 'INTERNAL_SERVER_ERROR';
  const message = error.message || 'Internal server error';

  const responseBody = {
    error: {
      code: errorCode,
      message,
      ...(error.details ? { details: error.details } : {}),
      ...(env.NODE_ENV !== 'production' && error.stack ? { stack: error.stack } : {}),
    },
  };

  if (statusCode === 500 && env.NODE_ENV !== 'test') {
    console.error('💥 Unhandled Server Error:', err);
  }

  res.status(statusCode).json(responseBody);
};

