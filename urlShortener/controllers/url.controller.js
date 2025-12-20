import { nanoid } from "nanoid";
import Url from "../models/url.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createShortUrl = asyncHandler(async (req, res, next) => {
    let { redirectUrl } = req.body;
    
    // Add protocol if missing
    if (!/^https?:\/\//i.test(redirectUrl)) {
        redirectUrl = `https://${redirectUrl}`;
    }
    
    // Validate URL
    try {
        new URL(redirectUrl);
    } catch (err) {
        // Check if request expects JSON
        if (req.headers.accept?.includes('application/json') || req.xhr) {
            throw new ApiError(400, "Invalid URL");
        }
        return res.status(400).render("home", { error: "Invalid URL" });
    }
    
    const shortId = nanoid(8);
    await Url.create({ shortId, redirectUrl });
    
    // Return JSON for API requests, render view for browser
    if (req.headers.accept?.includes('application/json') || req.xhr) {
        return res.status(201).json(
            new ApiResponse(201, { shortId, redirectUrl }, "Short URL created successfully")
        );
    }
    
    return res.render("home", { id: shortId });
});


export const redirectToUrl = asyncHandler(async (req, res, next) => {
    const { shortId } = req.params;
    const url = await Url.findOne({ shortId }).lean();
    
    if (!url) {
        throw new ApiError(404, "This url doesn't exist");
    }
    
    return res.redirect(url.redirectUrl);
});

export const deleteUrl = asyncHandler(async (req, res, next) => {
    const { shortId } = req.params;
    const url = await Url.findOneAndDelete({ shortId });
    
    if (!url) {
        throw new ApiError(404, "This URL doesn't exist");
    }
    
    return res.status(200).json(
        new ApiResponse(200, url, "URL deleted successfully")
    );
});

export const getAllUrls = asyncHandler(async (req, res, next) => {
    const urls = await Url.find().sort({ createdAt: -1 });
    
    // Return JSON for API requests, render view for browser
    if (req.headers.accept?.includes('application/json') || req.xhr) {
        return res.status(200).json(
            new ApiResponse(200, urls, "URLs fetched successfully")
        );
    }
    
    return res.render("manage-urls", { urls });
});