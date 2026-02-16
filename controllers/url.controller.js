import { nanoid } from 'nanoid';
import Url from '../models/url.model.js';
import User from '../models/user.model.js';
import Guest from '../models/guest.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { SHORT_ID_LENGTH, HTTP_STATUS, MESSAGES, BASE_URL } from '../constants.js';
import { isApiRequest } from '../utils/helpers.js';

export const createShortUrl = asyncHandler(async (req, res, next) => {
    // URL is already validated and sanitized by middleware
    const { redirectUrl, expiry } = req.body;
    let shortId;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    // --- Guest Logic vs User Logic ---
    let ownerData = {};
    let finalExpiry = null;

    if (req.user) {
        // User Logic
        ownerData = { createdBy: req.user._id };
        if (expiry && expiry > 0) {
            finalExpiry = new Date(Date.now() + expiry * 1000);
        }
    } else {
        // Guest Logic
        if (!req.guestId) {
            throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Unable to verify guest session.');
        }

        // Find or create guest
        let guest = await Guest.findOne({ guestId: req.guestId });
        if (!guest) {
            guest = await Guest.create({
                guestId: req.guestId,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
        } else {
            // Update tracking info
            guest.ipAddress = req.ip;
            guest.userAgent = req.headers['user-agent'];
            await guest.save();
        }

        // Check limits
        const activeCount = await Url.countDocuments({ guestId: req.guestId });
        if (activeCount >= 2) {
            const errorMsg = 'Guest limit (2 URLs) reached. Please login for more.';
            const wantsJson = isApiRequest(req);
            if (!wantsJson) {
                return res.status(HTTP_STATUS.FORBIDDEN).render('home', {
                    error: errorMsg,
                    user: {},
                    id: null,
                    redirectUrl: redirectUrl, // preserve input
                    baseUrl: BASE_URL
                });
            }
            throw new ApiError(HTTP_STATUS.FORBIDDEN, errorMsg);
        }

        ownerData = { guestId: req.guestId };
        finalExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour fixed
    }

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

    await Url.create({ shortId, redirectUrl, ...ownerData, expiresAt: finalExpiry });

    // Increment guest count if needed
    if (!req.user && req.guestId) {
        await Guest.updateOne({ guestId: req.guestId }, { $inc: { urlCount: 1 } });
    }

    const wantsJson = isApiRequest(req);

    if (wantsJson) {
        return res
            .status(HTTP_STATUS.CREATED)
            .json(
                new ApiResponse(HTTP_STATUS.CREATED, { shortId, redirectUrl }, MESSAGES.URL_CREATED)
            );
    }

    // Use 303 See Other to force GET request after POST
    return res.redirect(303, `/?shortId=${shortId}`);
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

    const wantsJson = isApiRequest(req);

    if (!url) {
        if (wantsJson) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.URL_NOT_FOUND);
        }
        // Web clients: render friendly error page (avoid redirecting to protected home)
        return res.status(HTTP_STATUS.NOT_FOUND).render('error', {
            error: MESSAGES.URL_NOT_FOUND
        });
    }

    // Check if URL has expired; TTL index will handle physical deletion
    if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
        if (wantsJson) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, 'This short URL has expired');
        }
        return res.status(HTTP_STATUS.NOT_FOUND).render('error', {
            error: 'This short URL has expired'
        });
    }

    return res.redirect(url.redirectUrl);
});

export const deleteUrl = asyncHandler(async (req, res, next) => {
    const { shortId } = req.params;
    let query = { shortId };
    if (req.user) {
        query.createdBy = req.user._id;
    } else if (req.guestId) {
        query.guestId = req.guestId;
    } else {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    }

    const url = await Url.findOneAndDelete(query);

    if (!url) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.URL_NOT_FOUND);
    }

    // If deleted by guest, decrement their count
    if (req.guestId) {
        await Guest.findOneAndUpdate({ guestId: req.guestId }, { $inc: { urlCount: -1 } });
    }

    return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, url, MESSAGES.URL_DELETED));
});

export const getAllUrls = asyncHandler(async (req, res, next) => {
    const now = new Date();
    let query = {
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    };

    if (req.user) {
        query.createdBy = req.user._id;
    } else if (req.guestId) {
        query.guestId = req.guestId;
    } else {
        // Should not happen if middleware is correct, but safe fallback
        query.createdBy = null;
        query.guestId = null;
    }

    const urls = await Url.find(query).sort({ createdAt: -1 });

    const wantsJson = isApiRequest(req);

    if (wantsJson) {
        return res
            .status(HTTP_STATUS.OK)
            .json(new ApiResponse(HTTP_STATUS.OK, urls, MESSAGES.URLS_FETCHED));
    }

    return res.render('manage-urls', {
        urls,
        baseUrl: BASE_URL,
        user: req.user // Pass user object (may be undefined for guests)
    });
});
