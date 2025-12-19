import express from "express";
import { userSignUp, userLogin } from "../controllers/user.controller.js";

const router = express.Router();

router.post('/', userSignUp);
router.post('/login', userLogin);

export default router;