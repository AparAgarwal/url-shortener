import express from 'express';
import {
    restrictToLogin,
    verifyAccessToken,
    verifyAndRotateRefreshToken,
    redirectIfLoggedIn
} from '../middlewares/auth.middleware.js';
import { getAllUrls, redirectToUrl, createShortUrl } from '../controllers/url.controller.js';
import { BASE_URL } from '../constants.js';
import {
    userSignUp,
    userLogin,
    userLogout,
    refreshAccessToken
} from '../controllers/user.controller.js';
import {
    shortIdValidation,
    createUrlValidation,
    signupValidation,
    loginValidation
} from '../middlewares/validators.js';

const router = express.Router();

/**
 * Static/View Routes
 * These routes serve HTML pages, handle web form submissions, and redirects
 */

// ===== View Pages =====
// GET / - Home page
router.get('/', restrictToLogin, (req, res) => {
    const shortId = req.query.shortId || null;
    const user = req.user || null;

    // Get flash messages from cookies
    const error = req.cookies.flash_error || null;
    const redirectUrl = req.cookies.flash_redirectUrl || null;

    // Clear flash cookies after reading
    if (error) res.clearCookie('flash_error');
    if (redirectUrl) res.clearCookie('flash_redirectUrl');

    return res.render('home', {
        id: shortId,
        error,
        redirectUrl,
        user,
        baseUrl: BASE_URL
    });
});

// GET /signup - Signup page
router.get('/signup', redirectIfLoggedIn, (req, res) => {
    return res.render('signup');
});

// GET /login - Login page
router.get('/login', redirectIfLoggedIn, (req, res) => {
    return res.render('login');
});

// GET /manage-urls - View all URLs page
router.get('/manage-urls', restrictToLogin, getAllUrls);

// GET /profile - User profile page
router.get('/profile', restrictToLogin, (req, res) => {
    return res.render('profile', {
        user: req.user
    });
});

// ===== Web Form Submissions =====
// POST /url - Create short URL via web form
router.post('/url', restrictToLogin, createUrlValidation, createShortUrl);

// POST /user/register - User registration via web form
router.post('/user/register', signupValidation, userSignUp);

// POST /user/login - User login via web form
router.post('/user/login', loginValidation, userLogin);

// Logout (web)
router.get('/logout', verifyAccessToken, userLogout);

// Refresh token (web, silent)
router.get('/refresh', verifyAndRotateRefreshToken, refreshAccessToken);

// ===== URL Redirect (must be last) =====
// GET /:shortId - Redirect to original URL (must be last to avoid conflicts)
router.get('/:shortId', shortIdValidation, redirectToUrl);

export default router;
