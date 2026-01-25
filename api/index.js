import app from '../app.js';
import 'dotenv/config';
import validateEnv from '../utils/validateEnv.js';
import connectDB from '../config/db.js';

// Validate environment variables
validateEnv();

// Connect to MongoDB (with connection pooling for serverless)
let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) {
        console.log('Using existing database connection');
        return;
    }

    try {
        await connectDB();
        isConnected = true;
        console.log('New database connection established');
    } catch (err) {
        console.error('Database connection failed:', err.message);
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
