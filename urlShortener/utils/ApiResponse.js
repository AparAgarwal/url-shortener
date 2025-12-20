/**
 * Standardized API Response Class
 * Creates consistent response structure for all successful API responses
 * 
 * @class ApiResponse
 */
class ApiResponse {
    /**
     * @param {number} statusCode - HTTP status code (200, 201, etc.)
     * @param {*} data - Response data to send to client
     * @param {string} message - Success message (default: "Success")
     */
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

export default ApiResponse;
