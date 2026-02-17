import { v4 as uuidv4 } from 'uuid';
import { verifyAccessTokenAndUser, verifyRefreshTokenAndUser } from '../utils/auth.helpers.js';
import { extractAccessToken, extractRefreshToken, getCookieOptions } from '../utils/helpers.js';
import { autoRefreshToken } from './auth.middleware.js';

export const handleGuest = (req, res, next) => {
    // If user is already logged in (from softAuth), skip guest logic
    if (req.user) {
        if (req.cookies.guest_token) {
            res.clearCookie('guest_token', getCookieOptions());
        }
        return next();
    }

    let guestId = req.cookies.guest_token;

    if (!guestId) {
        guestId = uuidv4();
        // Set a long-lived cookie for the guest
        res.cookie('guest_token', guestId, {
            ...getCookieOptions(),
            maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
        });
    }

    req.guestId = guestId;
    req.guestInfo = {
        ip: req.ip,
        userAgent: req.headers['user-agent']
    };

    next();
};

export const softAuth = async (req, res, next) => {
    const token = extractAccessToken(req);

    // 1. Try Access Token first
    if (token) {
        try {
            const { valid, user } = await verifyAccessTokenAndUser(token);
            if (valid && user) {
                req.user = user;
                return next();
            }
        } catch (error) {
            // Ignore access token errors, proceed to refresh token
        }
    }

    // 2. Try Refresh Token
    const refreshToken = extractRefreshToken(req);
    if (refreshToken) {
        try {
            return autoRefreshToken(req, res, next);
        } catch (error) {
            // Ignore refresh errors - proceed as guest
        }
    }

    next();
};
