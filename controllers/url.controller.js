import { nanoid } from 'nanoid';
import Url from '../models/url.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { SHORT_ID_LENGTH, HTTP_STATUS, MESSAGES } from '../constants.js';
import { isApiRequest } from '../utils/helpers.js';

export const createShortUrl = asyncHandler(async (req, res, next) => {
    // URL is already validated and sanitized by middleware
    const { redirectUrl, expiry } = req.body;
    let shortId;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    do {
        shortId = nanoid(SHORT_ID_LENGTH);
        const existing = await Url.findOne({ shortId });
        if (!existing) break;
        attempts++;
    } while (attempts < MAX_ATTEMPTS);

    if (attempts === MAX_ATTEMPTS) {
        throw new ApiError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            'Failed to generate a unique short ID. Please try again.'
        );
    }

    let expiresAt = null;
    if (expiry && expiry > 0) {
        expiresAt = new Date(Date.now() + expiry * 1000);
    }

    await Url.create({ shortId, redirectUrl, createdBy: req.user._id, expiresAt });
    const wantsJson = isApiRequest(req);

    if (wantsJson) {
        return res
            .status(HTTP_STATUS.CREATED)
            .json(
                new ApiResponse(HTTP_STATUS.CREATED, { shortId, redirectUrl }, MESSAGES.URL_CREATED)
            );
    }

    return res.redirect(`/?shortId=${shortId}`);
});

export const redirectToUrl = asyncHandler(async (req, res, next) => {
    const { shortId } = req.params;

    // Find and update click analytics atomically
    const url = await Url.findOneAndUpdate(
        { shortId },
        {
            $inc: { clickCount: 1 },
            $set: { lastClickedAt: new Date() }
        },
        { new: false } // Return the original document before update
    ).lean();

    if (!url) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.URL_NOT_FOUND);
    }

    // Check if URL has expired; TTL index will handle physical deletion
    if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'This short URL has expired');
    }

    return res.redirect(url.redirectUrl);
});

export const deleteUrl = asyncHandler(async (req, res, next) => {
    const { shortId } = req.params;
    const url = await Url.findOneAndDelete({ shortId, createdBy: req.user._id });

    if (!url) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.URL_NOT_FOUND);
    }

    return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, url, MESSAGES.URL_DELETED));
});

export const getAllUrls = asyncHandler(async (req, res, next) => {
    const now = new Date();
    const urls = await Url.find({
        createdBy: req.user._id,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    }).sort({ createdAt: -1 });

    const wantsJson = isApiRequest(req);

    if (wantsJson) {
        return res
            .status(HTTP_STATUS.OK)
            .json(new ApiResponse(HTTP_STATUS.OK, urls, MESSAGES.URLS_FETCHED));
    }

    return res.render('manage-urls', { urls });
});
