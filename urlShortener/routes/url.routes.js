import express from 'express';
import {
    createShortUrl,
    redirectToUrl,
    deleteUrl
} from '../controllers/url.controller.js';

const router = express.Router();

router.post('/', createShortUrl);

router.route("/:shortId").get(redirectToUrl).delete(deleteUrl);

export default router;