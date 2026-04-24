/**
 * Custom Error Class for Application Errors
 * Extends native Error class with additional properties
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create 400 Bad Request error
   * @param {string} message
   * @returns {AppError}
   */
  static badRequest(message = "Bad request") {
    return new AppError(message, 400);
  }

  /**
   * Create 401 Unauthorized error
   * @param {string} message
   * @returns {AppError}
   */
  static unauthorized(message = "Unauthorized access") {
    return new AppError(message, 401);
  }

  /**
   * Create 403 Forbidden error
   * @param {string} message
   * @returns {AppError}
   */
  static forbidden(message = "Access forbidden") {
    return new AppError(message, 403);
  }

  /**
   * Create 404 Not Found error
   * @param {string} message
   * @returns {AppError}
   */
  static notFound(message = "Resource not found") {
    return new AppError(message, 404);
  }

  /**
   * Create 409 Conflict error
   * @param {string} message
   * @returns {AppError}
   */
  static conflict(message = "Resource conflict") {
    return new AppError(message, 409);
  }

  /**
   * Create 500 Internal Server Error
   * @param {string} message
   * @returns {AppError}
   */
  static internalError(message = "Internal server error") {
    return new AppError(message, 500);
  }
}

export default AppError;
