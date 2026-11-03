export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error description
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409, 429, 500, etc.)
   * @param {string} errorCode - Machine-readable error code (e.g. VALIDATION_ERROR, NOT_FOUND)
   * @param {any} [details=null] - Additional context, e.g. field errors from Zod
   */
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', details = null) {
    return new AppError(message, 400, 'VALIDATION_ERROR', details);
  }

  static unauthenticated(message = 'Authentication required') {
    return new AppError(message, 401, 'UNAUTHENTICATED');
  }

  static forbidden(message = 'Access denied') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static conflict(message = 'Resource already exists') {
    return new AppError(message, 409, 'CONFLICT');
  }

  static fileTooLarge(message = 'File size exceeds maximum allowed limit (5 MB)') {
    return new AppError(message, 413, 'FILE_TOO_LARGE');
  }

  static unsupportedFileType(message = 'Unsupported file type. Only PDF and DOCX files are allowed') {
    return new AppError(message, 415, 'UNSUPPORTED_FILE_TYPE');
  }

  static rateLimited(message = 'Too many requests. Please try again later') {
    return new AppError(message, 429, 'RATE_LIMITED');
  }
}

