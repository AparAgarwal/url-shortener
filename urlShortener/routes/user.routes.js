import express from 'express';
import {
    userSignUp,
    userLogin,
    userLogout,
    refreshAccessToken
} from '../controllers/user.controller.js';
import { signupValidation, loginValidation } from '../middlewares/validators.js';
import { verifyAccessToken, verifyAndRotateRefreshToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * User Routes - Supports both API (JSON) and Web (HTML) responses
 * Content negotiation handled in controller via isApiRequest()
 */

// POST /api/v1/user/register - User registration (JSON or HTML response based on request)
router.post('/register', signupValidation, userSignUp);

// POST /api/v1/user/login - User login (JSON or HTML response based on request)
router.post('/login', loginValidation, userLogin);

// POST /api/v1/user/logout - User Logout
router.post('/logout', verifyAccessToken, userLogout);
router.post('/refresh-token', verifyAndRotateRefreshToken, refreshAccessToken);
export default router;
