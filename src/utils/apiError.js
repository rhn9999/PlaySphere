export class ApiError extends Error {
  constructor(statusCode, message, errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.success = false;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(msg = 'Bad Request', errors = []) {
    return new ApiError(400, msg, errors);
  }

  static unauthorized(msg = 'Unauthorized') {
    return new ApiError(401, msg);
  }

  static forbidden(msg = 'Forbidden: Access denied') {
    return new ApiError(403, msg);
  }

  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg);
  }

  static conflict(msg = 'Conflict detected') {
    return new ApiError(409, msg);
  }

  static unprocessableEntity(msg = 'Unprocessable Entity', errors = []) {
    return new ApiError(422, msg, errors);
  }

  static tooManyRequests(msg = 'Too Many Requests') {
    return new ApiError(429, msg);
  }

  static internal(msg = 'Internal server error') {
    return new ApiError(500, msg);
  }
}
