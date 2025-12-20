/**
 * Global Error Handling Middleware
 * Catches all errors from async handlers and other middleware
 * Returns standardized error response to client
 * 
 * @param {Error} err - Error object (could be ApiError or native Error)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const errors = err.errors || [];

    // Log error for debugging (in production, use proper logging service)
    if (process.env.NODE_ENV !== "production") {
        console.error("Error:", err);
    }

    // For EJS views, render error page or redirect with error message
    if (req.accepts('html') && !req.xhr) {
        // If it's a page request (not AJAX/API), render with error
        const previousView = req.originalUrl.split('/')[1] || 'home';
        return res.status(statusCode).render(previousView, {
            error: message,
            ...req.body // Preserve form data
        });
    }

    // For API requests, send JSON response
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
    });
};

export default errorHandler;
