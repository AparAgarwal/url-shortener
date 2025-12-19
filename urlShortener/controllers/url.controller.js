import { nanoid } from "nanoid";
import Url from "../models/url.model.js";

export const createShortUrl = async (req, res) => {
    let { redirectUrl } = req.body;
    // Add protocol if missing
    if (!/^https?:\/\//i.test(redirectUrl)) {
        redirectUrl = `https://${redirectUrl}`;
    }
    // Validate URL
    try {
        new URL(redirectUrl);
    } catch (err) {
        return res.status(400).render("home", {error: "Invalid URL"});
    }
    const shortId = nanoid(8);
    await Url.create({ shortId, redirectUrl });
    return res.render("home", { id: shortId });
};


export const redirectToUrl = async (req, res) => {
    const { shortId } = req.params;
    const url = await Url.findOne({ shortId });
    if (!url) return res.status(404).json({ error: "This url doesn't exists" });
    return res.redirect(url.redirectUrl);
}

export const deleteUrl = async (req, res) => {
    const { shortId } = req.params;
    const url = await Url.findOneAndDelete({ shortId });
    if (!url) return res.status(404).json({error: "This URL doesn't exist"});
    return res.status(200).json({message: "Success",data: url});
};

export const getAllUrlsPage = async (req, res) => {
    try {
        const urls = await Url.find().sort({ createdAt: -1 });
        return res.render("manage-urls", { urls });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch URLs" });
    }
};