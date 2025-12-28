import { getCookieOptions } from '../utils/helpers.js';

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
    const message = err.message || 'Internal Server Error';
    const errors = err.errors || [];

    // Log error for debugging (in production, use proper logging service)
    if (process.env.NODE_ENV !== 'production') {
        console.error('Error:', err);
    }

    // For EJS views, render error page or redirect with error message
    if (req.accepts('html') && !req.xhr && !req.originalUrl.startsWith('/api')) {
        const routeName = req.originalUrl.split('/')[1]?.split('?')[0] || 'home';

        // If it's a form submission route, use cookies to pass error without showing in URL
        if (routeName === 'url') {
            // Store error and form data in cookies temporarily (auto-expire in 5 seconds)
            res.cookie('flash_error', message, { maxAge: 5000, ...getCookieOptions() });
            if (req.body.redirectUrl) {
                res.cookie('flash_redirectUrl', req.body.redirectUrl, {
                    maxAge: 5000,
                    ...getCookieOptions()
                });
            }
            return res.redirect('/');
        }

        // For other routes, render the view directly
        const viewMap = {
            login: 'login',
            signup: 'signup',
            'manage-urls': 'manage-urls'
        };

        const viewName = viewMap[routeName] || 'error';

        return res.status(statusCode).render(viewName, {
            error: message,
            ...req.body // Preserve form data
        });
    }

    // For API requests, send JSON response
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

export default errorHandler;
