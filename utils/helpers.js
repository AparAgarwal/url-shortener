/**
 * Utility Helper Functions
 * Centralized helper functions used across the application
 */

export const isApiRequest = req =>
    req.xhr ||
    req.headers.accept?.includes('application/json') ||
    req.originalUrl.startsWith('/api/');

export const capitalize = (str = '') => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');

export const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
});

export const extractAccessToken = req =>
    req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');

export const extractRefreshToken = req =>
    req.cookies?.refreshToken || req.header('Authorization')?.replace('Bearer ', '');
