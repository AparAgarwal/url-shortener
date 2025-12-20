import express from 'express';
import {
    createShortUrl,
    deleteUrl,
    getAllUrls
} from '../controllers/url.controller.js';

const router = express.Router();

// GET /api/v1/url - Get all URLs
router.get('/', getAllUrls);

// POST /api/v1/url - Create short URL
router.post('/', createShortUrl);

// DELETE /api/v1/url/:shortId - Delete URL
router.delete("/:shortId", deleteUrl);

export default router;