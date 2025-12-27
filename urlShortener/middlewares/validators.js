import { body, param, validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';
import {
    SHORT_ID_LENGTH,
    MAX_URL_LENGTH,
    MIN_USERNAME_LENGTH,
    MAX_USERNAME_LENGTH,
    MIN_FULLNAME_LENGTH,
    MAX_FULLNAME_LENGTH,
    MIN_PASSWORD_LENGTH,
    MAX_PASSWORD_LENGTH,
    MAX_EMAIL_LENGTH,
    HTTP_STATUS
} from '../constants.js';

/**
 * Middleware to check validation results and throw error if validation fails
 */
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, errorMessages[0], errors.array());
    }
    next();
};

/**
 * Sanitizer to prevent NoSQL injection
 * Removes $ and prevents object injection
 * Note: Does not remove dots (.) as they are valid in emails
 */
const sanitizeNoSQL = value => {
    if (typeof value === 'string') {
        // Remove MongoDB operators like $, but keep dots for emails
        return value.replace(/\$/g, '');
    }
    // If value is an object or array, convert to string to prevent NoSQL injection
    if (typeof value === 'object') {
        return String(value);
    }
    return value;
};

/**
 * URL Validation Rules
 */
export const createUrlValidation = [
    body('redirectUrl')
        .trim()
        .notEmpty()
        .withMessage('URL is required')
        .isLength({ max: MAX_URL_LENGTH })
        .withMessage(`URL is too long (max ${MAX_URL_LENGTH} characters)`)
        .custom(value => {
            // Require protocol explicitly
            if (!/^https?:\/\//i.test(value)) {
                throw new Error('URL must start with http:// or https://');
            }
            try {
                const url = new URL(value);
                // Block dangerous protocols
                if (!['http:', 'https:'].includes(url.protocol)) {
                    throw new Error('Only HTTP and HTTPS protocols are allowed');
                }
                return true;
            } catch {
                throw new Error('Invalid URL format');
            }
        }),
    body('expiry')
        .optional({ values: 'null' })
        .custom(value => {
            // Allow empty string, null, or undefined to be treated as no expiry
            if (value === '' || value === null || value === undefined) {
                return true;
            }
            const numValue = Number(value);
            // Allow 0 for "never expires" or valid range 1 to 1 year
            if (numValue === 0 || (numValue >= 1 && numValue <= 31536000)) {
                return true;
            }
            throw new Error(
                'Expiry must be 0 (never) or between 1 second and 1 year (31536000 seconds)'
            );
        })
        .customSanitizer(value => {
            if (value === '' || value === null || value === undefined) {
                return null;
            }
            return Number(value);
        }),
    validate
];

export const shortIdValidation = [
    param('shortId')
        .trim()
        .notEmpty()
        .withMessage('Short ID is required')
        .isLength({ min: SHORT_ID_LENGTH, max: SHORT_ID_LENGTH })
        .withMessage('Invalid short ID format')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Short ID contains invalid characters')
        .customSanitizer(sanitizeNoSQL), // Prevent NoSQL injection
    validate
];

/**
 * User Validation Rules
 */
export const signupValidation = [
    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Full name is required')
        .isLength({ min: MIN_FULLNAME_LENGTH, max: MAX_FULLNAME_LENGTH })
        .withMessage(
            `Full name must be between ${MIN_FULLNAME_LENGTH} and ${MAX_FULLNAME_LENGTH} characters`
        )
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Full name can only contain letters and spaces')
        .customSanitizer(sanitizeNoSQL) // Prevent NoSQL injection
        .escape(), // Sanitize against XSS

    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: MIN_USERNAME_LENGTH, max: MAX_USERNAME_LENGTH })
        .withMessage(
            `Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters`
        )
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores')
        .toLowerCase()
        .customSanitizer(sanitizeNoSQL) // Prevent NoSQL injection
        .escape(), // Sanitize against XSS

    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail()
        .isLength({ max: MAX_EMAIL_LENGTH })
        .withMessage(`Email is too long (max ${MAX_EMAIL_LENGTH} characters)`)
        .customSanitizer(sanitizeNoSQL), // Prevent NoSQL injection

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD_LENGTH })
        .withMessage(
            `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`
        )
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage(
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),

    validate
];

export const loginValidation = [
    body('identifier')
        .trim()
        .notEmpty()
        .withMessage('Username or email is required')
        .isLength({ max: MAX_EMAIL_LENGTH })
        .withMessage('Identifier is too long')
        .customSanitizer(sanitizeNoSQL) // Prevent NoSQL injection
        .escape(), // Sanitize against XSS

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 1, max: MAX_PASSWORD_LENGTH })
        .withMessage('Invalid password'),

    validate
];
