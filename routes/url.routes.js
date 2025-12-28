import express from 'express';
import { createShortUrl, deleteUrl, getAllUrls } from '../controllers/url.controller.js';
import { createUrlValidation, shortIdValidation } from '../middlewares/validators.js';
import { verifyAccessToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * URL Routes - Supports both API (JSON) and Web (HTML) responses
 * Content negotiation handled in controller via isApiRequest()
 * All routes are protected and require authentication
 */

// GET /api/v1/url - Get all URLs (JSON response) - Protected
router.get('/', verifyAccessToken, getAllUrls);

// POST /api/v1/url - Create short URL (JSON or HTML response based on request) - Protected
router.post('/', verifyAccessToken, createUrlValidation, createShortUrl);

// DELETE /api/v1/url/:shortId - Delete URL (JSON response only) - Protected
router.delete('/:shortId', verifyAccessToken, shortIdValidation, deleteUrl);

export default router;
