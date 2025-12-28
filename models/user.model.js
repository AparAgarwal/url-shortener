import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
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
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY // Should be 7-14 days
        }
    );
};

// SECURITY: Hash refresh token before storing in database
userSchema.methods.hashRefreshToken = async function (refreshToken) {
    return await bcrypt.hash(refreshToken, BCRYPT_SALT_ROUNDS);
};

// SECURITY: Compare incoming refresh token with stored hash
userSchema.methods.verifyRefreshToken = async function (refreshToken) {
    if (!this.refreshTokenHash) {
        return false;
    }
    return await bcrypt.compare(refreshToken, this.refreshTokenHash);
};

const User = mongoose.model('User', userSchema);

export default User;
