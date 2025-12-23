import jwt from 'jsonwebtoken';
import { HTTP_STATUS, MESSAGES } from '../constants.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const verifyAccessToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    }
    try {
        const verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(verifiedToken?._id);

        if (!user) {
            throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, error?.message || 'Invalid Access Token');
    }
});

export const verifyRefreshToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.refreshToken || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    }
    try {
        const verifiedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(verifiedToken?._id);

        if (!user) {
            throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, error?.message || 'Invalid Refresh Token');
    }
});

export const restrictToLogin = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.redirect('login');
    }
    const verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(verifiedToken?._id);
    if (!user) {
        return res.redirect('login');
    }
    req.user = user;
    next();
});
