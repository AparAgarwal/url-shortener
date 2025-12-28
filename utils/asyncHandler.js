/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass them to Express error handling middleware
 * This eliminates the need for try-catch blocks in every controller function
 *
 * @param {Function} requestHandler - The async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = requestHandler => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch(err => next(err));
    };
};

export default asyncHandler;
