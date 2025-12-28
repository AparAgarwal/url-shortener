import jwt from 'jsonwebtoken';
import {
    HTTP_STATUS,
    MESSAGES,
    COOKIE_ACCESS_TOKEN_EXPIRY,
    COOKIE_REFRESH_TOKEN_EXPIRY,
    REFRESH_TOKEN_ABSOLUTE_EXPIRY
} from '../constants.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
    extractAccessToken,
    extractRefreshToken,
    isApiRequest,
    getCookieOptions
} from '../utils/helpers.js';

export const verifyAccessToken = asyncHandler(async (req, res, next) => {
    const token = extractAccessToken(req);
    if (!token) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    }

    let verifiedToken;
    try {
        verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            const wantsJson = isApiRequest(req);
            if (wantsJson) {
                throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.TOKEN_EXPIRED);
            }
            return await autoRefreshToken(req, res, next);
        }
        // JsonWebTokenError, signature mismatch, malformed tokens: Return 401
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_TOKEN);
    }

    const user = await User.findById(verifiedToken?._id).select('+tokenVersion');

    if (!user) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    }
    if (verifiedToken.tokenVersion !== user.tokenVersion) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_TOKEN);
    }

    req.user = user;
    next();
});

export const verifyAndRotateRefreshToken = asyncHandler(async (req, res, next) => {
    const refreshToken = extractRefreshToken(req);

    if (!refreshToken) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.TOKEN_EXPIRED);
    }

    const wantsJson = isApiRequest(req);
    let verifiedRefreshToken;

    // Verify JWT signature and expiry
    try {
        verifiedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        if (!wantsJson) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).render('login', {
                error: MESSAGES.SESSION_EXPIRED
            });
        }
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_REFRESH_TOKEN);
    }

    // Load user with refresh token hash and metadata
    const user = await User.findById(verifiedRefreshToken?._id).select(
        '+refreshTokenHash +refreshTokenCreatedAt +tokenVersion'
    );

    if (!user) {
        if (!wantsJson) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).render('login', {
                error: MESSAGES.INVALID_REFRESH_TOKEN
            });
        }
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const isValidRefreshToken = await user.verifyRefreshToken(refreshToken);

    if (!isValidRefreshToken) {
        // REUSE DETECTION: This token was already used and rotated, or is forged - invalidate ALL sessions
        console.warn(`[SECURITY] Refresh token reuse detected for user ${user._id}`);

        // Increment tokenVersion to invalidate all existing access tokens
        user.tokenVersion += 1;
        user.refreshTokenHash = undefined;
        user.refreshTokenCreatedAt = undefined;
        await user.save({ validateBeforeSave: false });

        if (!wantsJson) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).render('login', {
                error: MESSAGES.TOKEN_REUSE_DETECTED
            });
        }
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.TOKEN_REUSE_DETECTED);
    }

    const now = Date.now();
    const absoluteExpiry =
        new Date(user.refreshTokenCreatedAt).getTime() + REFRESH_TOKEN_ABSOLUTE_EXPIRY;

    if (now > absoluteExpiry) {
        user.refreshTokenHash = undefined;
        user.refreshTokenCreatedAt = undefined;
        await user.save({ validateBeforeSave: false });

        if (!wantsJson) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).render('login', {
                error: MESSAGES.SESSION_EXPIRED
            });
        }
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.SESSION_EXPIRED);
    }

    // Generate new refresh token (rotation for security)
    const newRefreshToken = user.generateRefreshToken();

    // Hash and store the new refresh token
    user.refreshTokenHash = await user.hashRefreshToken(newRefreshToken);

    await user.save({ validateBeforeSave: false });

    // Attach user & new refresh token to request
    req.user = user;
    req.newRefreshToken = newRefreshToken;
    next();
});

export const autoRefreshToken = asyncHandler(async (req, res, next) => {
    // Reuse the refresh token validation and rotation logic
    await verifyAndRotateRefreshToken(req, res, async () => {
        // Generate new access token
        const newAccessToken = req.user.generateAccessToken();

        // Set both new tokens as HTTP-only, secure cookies
        res.cookie('accessToken', newAccessToken, {
            ...getCookieOptions(),
            maxAge: COOKIE_ACCESS_TOKEN_EXPIRY
        }).cookie('refreshToken', req.newRefreshToken, {
            ...getCookieOptions(),
            maxAge: COOKIE_REFRESH_TOKEN_EXPIRY
        });

        next();
    });
});

export const restrictToLogin = asyncHandler(async (req, res, next) => {
    const token = extractAccessToken(req);
    const refreshToken = extractRefreshToken(req);

    // No tokens at all - redirect to login
    if (!token && !refreshToken) {
        return res.redirect('/login');
    }

    // Only refresh token present OR access token expired - try to refresh
    if (!token || (token && refreshToken)) {
        let verifiedToken;

        if (token) {
            try {
                verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            } catch (error) {
                if (error.name === 'TokenExpiredError') {
                    verifiedToken = null;
                } else {
                    // Invalid token - redirect to login
                    return res.status(HTTP_STATUS.UNAUTHORIZED).render('login', {
                        error: MESSAGES.INVALID_TOKEN
                    });
                }
            }
        }

        // If no valid access token, use refresh token
        if (!verifiedToken && refreshToken) {
            // Use the same refresh logic, then set cookies and continue
            return await verifyAndRotateRefreshToken(req, res, async () => {
                const newAccessToken = req.user.generateAccessToken();

                res.cookie('accessToken', newAccessToken, {
                    ...getCookieOptions(),
                    maxAge: COOKIE_ACCESS_TOKEN_EXPIRY
                }).cookie('refreshToken', req.newRefreshToken, {
                    ...getCookieOptions(),
                    maxAge: COOKIE_REFRESH_TOKEN_EXPIRY
                });

                next();
            });
        }

        // Access token is valid - verify user and token version
        if (verifiedToken) {
            const user = await User.findById(verifiedToken?._id).select('+tokenVersion');
            if (!user) {
                return res.redirect('/login');
            }
            if (verifiedToken.tokenVersion !== user.tokenVersion) {
                return res.render('login', {
                    error: MESSAGES.INVALID_TOKEN
                });
            }

            req.user = user;
            return next();
        }
    }

    // Shouldn't reach here, but redirect to login as fallback
    return res.redirect('/login');
});

export const redirectIfLoggedIn = asyncHandler(async (req, res, next) => {
    const token = extractAccessToken(req);
    const refreshToken = extractRefreshToken(req);

    // No tokens at all - user is not logged in, allow access to login/signup
    if (!token && !refreshToken) {
        return next();
    }

    // Verify access token validity
    if (token) {
        try {
            const verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(verifiedToken?._id).select('+tokenVersion');

            // If user exists and token is valid, redirect to home
            if (user && verifiedToken.tokenVersion === user.tokenVersion) {
                return res.redirect('/');
            }
        } catch (error) {
            // Token expired or invalid - check refresh token next
        }
    }

    // If access token is expired/invalid but refresh token exists, verify refresh token
    if (refreshToken) {
        try {
            const verifiedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const user = await User.findById(verifiedRefreshToken?._id).select(
                '+refreshTokenHash +refreshTokenCreatedAt +tokenVersion'
            );

            // Verify refresh token is valid
            if (user) {
                const isValidRefreshToken = await user.verifyRefreshToken(refreshToken);

                // Check absolute expiry
                const now = Date.now();
                const absoluteExpiry =
                    new Date(user.refreshTokenCreatedAt).getTime() + REFRESH_TOKEN_ABSOLUTE_EXPIRY;

                // If refresh token is valid and not expired, user is logged in
                if (isValidRefreshToken && now <= absoluteExpiry) {
                    return res.redirect('/');
                }
            }
        } catch (error) {
            // Refresh token invalid or expired - allow access to login/signup
        }
    }

    // No valid tokens - allow access to login/signup
    return next();
});
