import { HTTP_STATUS, MESSAGES } from '../constants.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
    extractAccessToken,
    extractRefreshToken,
    isApiRequest,
    getCookieOptions
} from '../utils/helpers.js';
import {
    verifyAccessTokenAndUser,
    verifyRefreshTokenAndUser,
    setAuthCookies,
    clearUserTokens
} from '../utils/auth.helpers.js';

export const verifyAccessToken = asyncHandler(async (req, res, next) => {
    const token = extractAccessToken(req);

    const { valid, user, error, tokenExpired } = await verifyAccessTokenAndUser(token);

    if (!valid) {
        // Handle token expiration with auto-refresh for web requests
        if (tokenExpired) {
            const wantsJson = isApiRequest(req);
            if (wantsJson) {
                throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.TOKEN_EXPIRED);
            }
            return await autoRefreshToken(req, res, next);
        }

        // Map error codes to appropriate messages
        const errorMessage = error === 'NO_TOKEN' ? MESSAGES.UNAUTHORIZED : MESSAGES.INVALID_TOKEN;
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, errorMessage);
    }

    req.user = user;
    next();
});

export const verifyAndRotateRefreshToken = asyncHandler(async (req, res, next) => {
    const refreshToken = extractRefreshToken(req);
    const wantsJson = isApiRequest(req);

    const { valid, user, error } = await verifyRefreshTokenAndUser(refreshToken);

    if (!valid) {
        // Handle expired refresh token - clear user data if needed
        if (error === 'REFRESH_TOKEN_EXPIRED' && user) {
            await clearUserTokens(user, false); // Don't increment version for natural expiry
        }

        // Clear cookies for invalid refresh tokens
        // Clear cookies for invalid refresh tokens
        if (error === 'INVALID_REFRESH_TOKEN' || error === 'REFRESH_TOKEN_REPLACED') {
            res.clearCookie('accessToken', getCookieOptions());
            res.clearCookie('refreshToken', getCookieOptions());
        }

        const errorMessage =
            error === 'NO_REFRESH_TOKEN'
                ? MESSAGES.TOKEN_EXPIRED
                : error === 'USER_NOT_FOUND' || error === 'INVALID_REFRESH_TOKEN'
                  ? MESSAGES.INVALID_REFRESH_TOKEN
                  : error === 'REFRESH_TOKEN_REPLACED'
                    ? MESSAGES.SESSION_INVALIDATED
                    : MESSAGES.SESSION_EXPIRED;

        if (!wantsJson) {
            // BUG FIX: If POST request, redirect to login instead of rendering
            // This prevents "Cannot POST /login" errors when session expires mid-action
            if (req.method !== 'GET' && req.method !== 'HEAD') {
                res.cookie('flash_error', errorMessage, { maxAge: 5000, ...getCookieOptions() });
                return res.redirect(303, '/login');
            }

            return res.status(HTTP_STATUS.UNAUTHORIZED).render('login', {
                error: errorMessage
            });
        }
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, errorMessage);
    }

    // Generate new refresh token (rotation for security)
    const newRefreshToken = user.generateRefreshToken();

    // Grace Period: Move current token to previous before overwriting
    if (user.refreshTokenHash) {
        user.previousRefreshTokenHash = user.refreshTokenHash;
        user.previousRefreshTokenExpiry = new Date(Date.now() + 60 * 1000); // 1 minute grace period
    }

    // Hash and store the new refresh token
    user.refreshTokenHash = user.hashRefreshToken(newRefreshToken);
    user.refreshTokenCreatedAt = new Date();

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
        setAuthCookies(res, newAccessToken, req.newRefreshToken);

        const wantsJson = isApiRequest(req);

        // Check if this is a direct call to the refresh endpoint (has _isRefreshEndpoint flag)
        const isDirectRefreshCall = req._isRefreshEndpoint;

        // If used as dedicated refresh endpoint, send response
        if (isDirectRefreshCall) {
            if (wantsJson) {
                return res
                    .status(HTTP_STATUS.OK)
                    .json(
                        new ApiResponse(
                            HTTP_STATUS.OK,
                            { accessToken: newAccessToken },
                            MESSAGES.TOKEN_REFRESHED
                        )
                    );
            }
            // Web refresh is silent — redirect back to referrer or home
            return res.redirect(req.get('Referer') || '/');
        }

        // If used as middleware helper, continue to next
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

    // Verify access token
    const { valid, user, tokenExpired } = await verifyAccessTokenAndUser(token);

    if (valid) {
        req.user = user;
        return next();
    }

    // If token expired or invalid, try refresh token
    if (tokenExpired) {
        res.clearCookie('accessToken', getCookieOptions());
    }

    if (!refreshToken) {
        return res.redirect('/login');
    }

    // Use the same refresh logic, then set cookies and continue
    await autoRefreshToken(req, res, next);
});

export const redirectIfLoggedIn = asyncHandler(async (req, res, next) => {
    const token = extractAccessToken(req);
    const refreshToken = extractRefreshToken(req);

    // No tokens at all - user is not logged in, allow access to login/signup
    if (!token && !refreshToken) {
        return next();
    }

    // Verify access token
    const { valid: accessTokenValid } = await verifyAccessTokenAndUser(token);

    if (accessTokenValid) {
        return res.redirect('/');
    }

    // Verify refresh token
    const { valid: refreshTokenValid } = await verifyRefreshTokenAndUser(refreshToken);

    if (refreshTokenValid) {
        return res.redirect('/');
    }

    // No valid tokens - allow access to login/signup
    return next();
});
