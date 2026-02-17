import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { BCRYPT_SALT_ROUNDS } from '../constants.js';

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        avatarUrl: {
            type: String
        },
        password: {
            type: String,
            required: true,
            select: false // Exclude password from queries by default
        },
        refreshTokenHash: {
            type: String,
            select: false,
            sparse: true
        },
        refreshTokenCreatedAt: {
            type: Date, // Timestamp when refresh token was first issued
            select: false
        },
        previousRefreshTokenHash: {
            type: String,
            select: false,
            sparse: true
        },
        previousRefreshTokenExpiry: {
            type: Date,
            select: false
        },
        tokenVersion: {
            type: Number,
            default: 0,
            select: false
        }
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
});

userSchema.methods.comparePassword = async function (pass) {
    return bcrypt.compare(pass, this.password);
};

// Generate short-lived access token (5-15 minutes)
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            fullName: this.fullName,
            username: this.username,
            email: this.email,
            tokenVersion: this.tokenVersion // Include for revocation checking
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY // Should be 5-15 minutes
        }
    );
};

// Generate medium-lived refresh token (7-14 days)
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            tokenVersion: this.tokenVersion // Include for revocation checking
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY // Should be 7-14 days
        }
    );
};

// Hash refresh token using SHA-256 (deterministic for reliable comparison)
userSchema.methods.hashRefreshToken = function (refreshToken) {
    return crypto.createHash('sha256').update(refreshToken).digest('hex');
};

// Compare incoming refresh token with stored hash
userSchema.methods.verifyRefreshToken = function (refreshToken) {
    if (!this.refreshTokenHash) {
        return false;
    }
    const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // 1. Check current token
    if (this.refreshTokenHash === incomingHash) {
        return true;
    }

    // 2. Check previous token (Grace Period)
    if (
        this.previousRefreshTokenHash &&
        this.previousRefreshTokenHash === incomingHash &&
        this.previousRefreshTokenExpiry &&
        new Date() < this.previousRefreshTokenExpiry
    ) {
        return true;
    }

    return false;
};

const User = mongoose.model('User', userSchema);

export default User;
