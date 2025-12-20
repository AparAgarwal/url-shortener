import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const userSignUp = asyncHandler(async (req, res, next) => {
    const { fullName, username, email, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({ fullName, username, email, password: hashedPassword });
        
        // Return JSON for API requests
        if (req.headers.accept?.includes('application/json') || req.xhr) {
            const userResponse = {
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email
            };
            return res.status(201).json(
                new ApiResponse(201, userResponse, "User created successfully")
            );
        }
        
        // Render view for browser
        return res.render("signup", {
            success: "User created successfully! Redirecting...",
            redirectTo: "/",
            delay: 1500
        });
    } catch (err) {
        if (err.code === 11000) {
            const duplicateField = Object.keys(err.keyPattern)[0];
            const errorMessage = `${capitalize(duplicateField)} already exists. Please choose another or log in.`;
            
            // Return JSON error for API requests
            if (req.headers.accept?.includes('application/json') || req.xhr) {
                throw new ApiError(409, errorMessage);
            }
            
            return res.status(400).render("signup", {
                error: errorMessage,
                fullName,
                username,
                email
            });
        }
        throw new ApiError(500, "Something went wrong. Please try again.");
    }
});
export const userLogin = asyncHandler(async (req, res, next) => {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
        const errorMessage = "Invalid username or password";
        
        // Return JSON error for API requests
        if (req.headers.accept?.includes('application/json') || req.xhr) {
            throw new ApiError(401, errorMessage);
        }
        
        return res.status(401).render("login", { error: errorMessage });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const errorMessage = "Invalid username or password";
        
        // Return JSON error for API requests
        if (req.headers.accept?.includes('application/json') || req.xhr) {
            throw new ApiError(401, errorMessage);
        }
        
        return res.status(401).render("login", { error: errorMessage });
    }
    
    // Return JSON for API requests
    if (req.headers.accept?.includes('application/json') || req.xhr) {
        const userResponse = {
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email
        };
        return res.status(200).json(
            new ApiResponse(200, userResponse, "Login successful")
        );
    }
    
    // Render view for browser
    return res.render("login", {
        success: "LogIn Successfull! Redirecting...",
        redirectTo: "/",
        delay: 1500
    });
});