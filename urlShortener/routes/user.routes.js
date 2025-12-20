import express from "express";
import { userSignUp, userLogin } from "../controllers/user.controller.js";

const router = express.Router();

// POST /api/v1/user/register - User registration
router.post('/register', userSignUp);

// POST /api/v1/user/login - User login
router.post('/login', userLogin);

export default router;