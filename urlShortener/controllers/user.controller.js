import User from "../models/user.model.js";
import bcrypt from "bcrypt";

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const userSignUp = async (req, res) => {
    const { fullName, username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        await User.create({ fullName, username, email, password: hashedPassword });
        return res.render("signup", {
            success: "User created successfully! Redirecting...",
            redirectTo: "/",
            delay: 1500
        });
    } catch (err) {
        if (err.code === 11000) {
            const duplicateField = Object.keys(err.keyPattern)[0];
            return res.status(400).render("signup", {
                error: `${capitalize(duplicateField)} already exists. Please choose another or log in.`,
                fullName,
                username,
                email
            })
        }
        return res.status(500).render("signup", {
            error: "Something went wrong. Please try again."
        });
    }
}
export const userLogin = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).render("login", { error: "Invalid username or password" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).render("login", { error: "Invalid username or password" });
    return res.render("login", {
        success: "LogIn Successfull! Redirecting...",
        redirectTo: "/",
        delay: 1500
    });
}