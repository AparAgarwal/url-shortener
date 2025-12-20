import express from 'express';
import { getAllUrls, redirectToUrl } from '../controllers/url.controller.js';

const router = express.Router();

router.get("/", (req, res) => {
    return res.render("home");
});

router.get("/signup", (req, res)=>{
    return res.render("signup");
})
router.get("/login", (req, res)=>{
    return res.render("login"); 
})

router.get("/test/all-urls", getAllUrls);

// GET /:shortId - Redirect to original URL (must be last to avoid conflicts)
router.get("/:shortId", redirectToUrl);

export default router;