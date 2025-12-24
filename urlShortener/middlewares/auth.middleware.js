import jwt from 'jsonwebtoken';
import { HTTP_STATUS, MESSAGES } from '../constants.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { extractAccessToken, extractRefreshToken, isApiRequest } from '../utils/helpers.js';

export const verifyAccessToken = asyncHandler(async (req, res, next) => {
    const token = extractAccessToken(req);
    if (!token) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    }
    let verifiedToken;
    try {
        verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.TOKEN_EXPIRED);
    }
    const user = await User.findById(verifiedToken?._id);

    if (!user) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    }

    req.user = user;
    next();
});

export const verifyAndRotateRefreshToken = asyncHandler(async (req, res, next) => {
    const token = extractRefreshToken(req);
    if (!token) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.TOKEN_EXPIRED);
    }
    const wantsJson = isApiRequest(req);
    let verifiedToken;
    try {
        verifiedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const user = await User.findById(verifiedToken?._id).select(
        '+refreshToken +refreshTokenCreatedAt'
    );

    if (!user) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found');
    }

    if (user.refreshToken !== token) {
        if (!wantsJson) {
            return res.render('login', {
                error: MESSAGES.INVALID_REFRESH_TOKEN
            });
        }
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const now = Date.now();

    const maxLifeTime = 30 * 24 * 60 * 60 * 1000; // 30 days
    const absoluteExpiry = new Date(user.refreshTokenCreatedAt).getTime() + maxLifeTime;

    if (now > absoluteExpiry) {
        // User needs to login again
        user.refreshToken = undefined;
        user.refreshTokenCreatedAt = undefined;
        await user.save({ validateBeforeSave: false });
        if (!wantsJson) {
            return res.redirect('login', {
                error: MESSAGES.SESSION_EXPIRED
            });
        }
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.SESSION_EXPIRED);
    }

    // Create new refresh token
    const newRefreshToken = user.generateRefreshToken();
    user.refreshToken = newRefreshToken;

    await user.save({ validateBeforeSave: false });

    // Attach user & new refresh token to request
    req.user = user;
    req.newRefreshToken = newRefreshToken;
    next();
});

export const restrictToLogin = asyncHandler(async (req, res, next) => {
    const token = extractAccessToken(req);
    const refreshToken = extractRefreshToken(req);
    if (!token && refreshToken) {
        return res.redirect('/refresh');
    } else if (!token && !refreshToken) {
        return res.redirect('login');
    }
    let verifiedToken;
    try {
        verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).redirect('login', {
            error: MESSAGES.INVALID_TOKEN
        });
    }

    const user = await User.findById(verifiedToken?._id);
    if (!user) {
        return res.redirect('login');
    }
    req.user = user;
    next();
});
