import app from '../app.js';
import 'dotenv/config';
import mongoose from 'mongoose';
import validateEnv from '../utils/validateEnv.js';
import connectDB from '../config/db.js';

// Validate environment variables
validateEnv();

// Connect to MongoDB (with connection pooling for serverless)
const connectToDatabase = async () => {
    // Check Mongoose connection state
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState === 1) {
        console.log('✓ Using existing database connection');
        return;
    }

    if (mongoose.connection.readyState === 2) {
        console.log('⏳ Connection already in progress, waiting...');
        // Wait for existing connection attempt
        await new Promise((resolve) => {
            mongoose.connection.once('connected', resolve);
        });
        return;
    }

    try {
        console.log('🔄 Establishing new database connection...');
        await connectDB();
        console.log('✓ New database connection established');
    } catch (err) {
        console.error('✗ Database connection failed:', err.message);
        throw err;
    }
};

// Vercel serverless function handler
export default async (req, res) => {
    try {
        // Ensure database is connected
        await connectToDatabase();

        // Let Express handle the request
        return app(req, res);
    } catch (error) {
        console.error('Serverless function error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
