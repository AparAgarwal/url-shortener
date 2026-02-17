import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import {
    COOKIE_ACCESS_TOKEN_EXPIRY,
    COOKIE_REFRESH_TOKEN_EXPIRY,
    REFRESH_TOKEN_ABSOLUTE_EXPIRY
} from '../constants.js';
import { getCookieOptions } from './helpers.js';

export const verifyAccessTokenAndUser = async token => {
    if (!token) {
        return { valid: false, user: null, error: 'NO_TOKEN', tokenExpired: false };
    }

    try {
        const verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(verifiedToken?._id).select('+tokenVersion');

        if (!user) {
            return { valid: false, user: null, error: 'USER_NOT_FOUND', tokenExpired: false };
        }

        if (verifiedToken.tokenVersion !== user.tokenVersion) {
            return {
                valid: false,
                user: null,
                error: 'TOKEN_VERSION_MISMATCH',
                tokenExpired: false
            };
        }

        return { valid: true, user, error: null, tokenExpired: false };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return { valid: false, user: null, error: 'TOKEN_EXPIRED', tokenExpired: true };
        }
        return { valid: false, user: null, error: 'INVALID_TOKEN', tokenExpired: false };
    }
};

export const verifyRefreshTokenAndUser = async refreshToken => {
    if (!refreshToken) {
        return { valid: false, user: null, error: 'NO_REFRESH_TOKEN' };
    }

    try {
        const verifiedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(verifiedRefreshToken?._id).select(
            '+refreshTokenHash +refreshTokenCreatedAt +tokenVersion +previousRefreshTokenHash +previousRefreshTokenExpiry'
        );

        if (!user) {
            return { valid: false, user: null, error: 'USER_NOT_FOUND' };
        }

        const isValidRefreshToken = user.verifyRefreshToken(refreshToken);
        if (!isValidRefreshToken) {
            return { valid: false, user: null, error: 'REFRESH_TOKEN_REPLACED' };
        }

        // Check absolute expiry
        const now = Date.now();
        const absoluteExpiry =
            new Date(user.refreshTokenCreatedAt).getTime() + REFRESH_TOKEN_ABSOLUTE_EXPIRY;

        if (now > absoluteExpiry) {
            // Return user object so middleware can perform cleanup
            return { valid: false, user, error: 'REFRESH_TOKEN_EXPIRED' };
        }

        return { valid: true, user, error: null };
    } catch (error) {
        return { valid: false, user: null, error: 'INVALID_REFRESH_TOKEN' };
    }
};

export const setAuthCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        ...getCookieOptions(),
        maxAge: COOKIE_ACCESS_TOKEN_EXPIRY
    }).cookie('refreshToken', refreshToken, {
        ...getCookieOptions(),
        maxAge: COOKIE_REFRESH_TOKEN_EXPIRY
    });
};

export const generateAndStoreTokens = async (user, options = {}) => {
    const { incrementVersion = false, setVersionToZero = false } = options;

    if (setVersionToZero) {
        user.tokenVersion = 0;
    } else if (incrementVersion) {
        user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshTokenHash = user.hashRefreshToken(refreshToken);
    user.refreshTokenCreatedAt = new Date();

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

export const clearUserTokens = async (user, incrementVersion = true) => {
    user.refreshTokenHash = undefined;
    user.refreshTokenCreatedAt = undefined;

    if (incrementVersion) {
        user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    await user.save({ validateBeforeSave: false });
};
