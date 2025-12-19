import express from 'express';
import { getAllUrlsPage } from '../controllers/url.controller.js';

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

router.get("/test/all-urls", getAllUrlsPage);

export default router;