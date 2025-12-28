/**
 * Custom API Error Class
 * Extends native Error class to create standardized error objects
 * with additional properties for better error handling
 *
 * @class ApiError
 * @extends Error
 */
class ApiError extends Error {
    /**
     * @param {number} statusCode - HTTP status code (400, 404, 500, etc.)
     * @param {string} message - Error message (default: "Something went wrong")
     * @param {Array} errors - Additional error details (default: [])
     * @param {string} stack - Error stack trace (optional)
     */
    constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;
