/**
 * Application Constants
 * Centralized configuration values used across the application
 */

// Security
export const BCRYPT_SALT_ROUNDS = 12;

// URL Shortener
export const SHORT_ID_LENGTH = 8;
export const MAX_URL_LENGTH = 2048;
export const MIN_SHORT_ID_LENGTH = 8;
export const MAX_SHORT_ID_LENGTH = 8;
export const BASE_URL = process.env.BASE_URL;

// User Validation
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;
export const MIN_FULLNAME_LENGTH = 2;
export const MAX_FULLNAME_LENGTH = 100;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_EMAIL_LENGTH = 255;

// UI
export const REDIRECT_DELAY_MS = 1500;

// Tokens Expiry
export const COOKIE_ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes
export const COOKIE_REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
export const REFRESH_TOKEN_ABSOLUTE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

// HTTP Status Codes (for clarity)
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};

// Success Messages
export const MESSAGES = {
    USER_CREATED: 'User created successfully!',
    LOGIN_SUCCESS: 'Login successful!',
    LOGOUT_SUCCESS: 'Logout successful!',
    URL_CREATED: 'Short URL created successfully',
    URL_DELETED: 'URL deleted successfully',
    URLS_FETCHED: 'URLs fetched successfully',

    // Error Messages
    INVALID_URL: 'Invalid URL format',
    URL_NOT_FOUND: "This URL doesn't exist",
    INVALID_CREDENTIALS: 'Invalid username or password',
    ALL_FIELDS_REQUIRED: 'All fields are required',
    DUPLICATE_EXISTS: 'already exists. Please choose another or log in.',
    UNAUTHORIZED: 'Unauthorized Request',
    SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',

    // Token related messages
    TOKEN_REFRESHED: 'Token refreshed successfully',
    TOKEN_EXPIRED: 'Token expired. Please login again.',
    SESSION_EXPIRED: 'Session expired. Please login again.',
    INVALID_TOKEN: 'Invalid token. Please login again.',
    INVALID_REFRESH_TOKEN: 'Invalid refresh token. Please login again.',
    TOKEN_REUSE_DETECTED: 'Security alert: Token reuse detected. Please login again.'
};

// Redirect Messages (for web UI)
export const REDIRECT_MESSAGES = {
    USER_CREATED: 'User created successfully! Redirecting...',
    LOGIN_SUCCESS: 'LogIn Successful! Redirecting...',
    LOGOUT_SUCCESS: 'Successfully Logged Out. Redirecting...'
};
