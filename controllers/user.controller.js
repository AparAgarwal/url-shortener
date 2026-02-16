import User from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import {
    HTTP_STATUS,
    MESSAGES,
    REDIRECT_MESSAGES,
    REDIRECT_DELAY_MS
} from '../constants.js';
import { capitalize, isApiRequest, getCookieOptions } from '../utils/helpers.js';
import { generateAvatarFromName } from '../utils/generateAvatars.js';
import { setAuthCookies, generateAndStoreTokens, clearUserTokens } from '../utils/auth.helpers.js';

export const userSignUp = asyncHandler(async (req, res) => {
    // Data is already validated and sanitized by middleware
    const { fullName, username, email, password } = req.body;
    const avatarUrl = generateAvatarFromName(fullName);

    try {
        const user = await User.create({ fullName, username, email, password, avatarUrl });

        const wantsJson = isApiRequest(req);

        // Generate and store tokens
        const { accessToken, refreshToken } = await generateAndStoreTokens(user, { setVersionToZero: true });

        setAuthCookies(res, accessToken, refreshToken);

        if (wantsJson) {
            const userResponse = {
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl
            };
            return res
                .status(HTTP_STATUS.CREATED)
                .json(new ApiResponse(HTTP_STATUS.CREATED, userResponse, MESSAGES.USER_CREATED));
        }

        // Render view for browser
        return res.render('signup', {
            success: REDIRECT_MESSAGES.USER_CREATED,
            redirectTo: '/',
            delay: REDIRECT_DELAY_MS
        });
    } catch (err) {
        if (err.code === 11000) {
            const duplicateField = Object.keys(err.keyPattern)[0];
            const errorMessage = `${capitalize(duplicateField)} ${MESSAGES.DUPLICATE_EXISTS}`;

            const wantsJson = isApiRequest(req);

            if (wantsJson) {
                throw new ApiError(HTTP_STATUS.CONFLICT, errorMessage);
            }

            return res.status(HTTP_STATUS.BAD_REQUEST).render('signup', {
                error: errorMessage,
                fullName,
                username,
                email
            });
        }
        throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, MESSAGES.SOMETHING_WENT_WRONG, err);
    }
});

export const userLogin = asyncHandler(async (req, res, next) => {
    // Data is already validated and sanitized by middleware
    const { identifier, password } = req.body;

    const identifierQuery = identifier?.includes('@')
        ? { email: identifier }
        : { username: identifier };

    // Need to select password explicitly since it's excluded by default
    const user = await User.findOne(identifierQuery).select('+password +tokenVersion +refreshTokenHash +refreshTokenCreatedAt');
    const isMatch = await user?.comparePassword(password);

    const wantsJson = isApiRequest(req);

    if (!user || !isMatch) {
        if (wantsJson) {
            throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_CREDENTIALS);
        }

        return res.status(HTTP_STATUS.UNAUTHORIZED).render('login', {
            error: MESSAGES.INVALID_CREDENTIALS
        });
    }

    try {
        // Generate and store tokens (incrementing version to invalidate old sessions)
        const { accessToken, refreshToken } = await generateAndStoreTokens(user, { incrementVersion: true });

        setAuthCookies(res, accessToken, refreshToken);
    } catch (error) {
        if (wantsJson) {
            throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, MESSAGES.SOMETHING_WENT_WRONG);
        }

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).render('login', {
            error: error.message || MESSAGES.SOMETHING_WENT_WRONG
        });
    }

    if (wantsJson) {
        // Don't send password in response
        const userResponse = {
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email
        };
        return res
            .status(HTTP_STATUS.OK)
            .json(new ApiResponse(HTTP_STATUS.OK, userResponse, MESSAGES.LOGIN_SUCCESS));
    }

    // Render view for browser
    return res.render('login', {
        success: REDIRECT_MESSAGES.LOGIN_SUCCESS,
        redirectTo: '/',
        delay: REDIRECT_DELAY_MS
    });
});

export const userLogout = asyncHandler(async (req, res) => {
    await clearUserTokens(req.user);

    const cookieOptions = getCookieOptions();

    const wantsJson = isApiRequest(req);

    res.clearCookie('accessToken', cookieOptions).clearCookie('refreshToken', cookieOptions);

    if (wantsJson) {
        return res
            .status(HTTP_STATUS.OK)
            .json(new ApiResponse(HTTP_STATUS.OK, {}, MESSAGES.LOGOUT_SUCCESS));
    }

    // Render view for browser
    return res.render('logout', {
        redirectTo: '/login',
        delay: 3000
    });
});
