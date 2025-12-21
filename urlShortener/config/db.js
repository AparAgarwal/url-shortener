import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI;

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000;
const CONNECTION_OPTIONS = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
};

mongoose.set('bufferCommands', false);

let reconnecting = false;
let retryCount = 0;

if (!MONGO_URI) {
    console.error('✗ MONGO_URI not defined');
    process.exit(1);
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const connect = async () => {
    await mongoose.connect(MONGO_URI, CONNECTION_OPTIONS);
    retryCount = 0; // reset after successful connection
};

const connectWithRetry = async (context = 'startup') => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await connect();
            console.log(`✓ MongoDB connected (${context})`);
            console.log(`  Host: ${mongoose.connection.host}`);
            console.log(`  DB: ${mongoose.connection.name}`);
            return;
        } catch (err) {
            console.error(
                `✗ MongoDB ${context} connection failed (${attempt}/${MAX_RETRIES})`
            );

            if (attempt === MAX_RETRIES) {
                console.error(`✗ MongoDB ${context} retries exhausted. Exiting.`);
                process.exit(1);
            }

            await sleep(RETRY_DELAY_MS);
        }
    }
};

/* ---- Initial startup ---- */
const connectDB = async () => {
    await connectWithRetry('startup');
};

/* ---- Controlled reconnect on disconnect ---- */
mongoose.connection.on('disconnected', async () => {
    if (reconnecting) return;

    reconnecting = true;
    console.warn('⚠ MongoDB disconnected. Attempting limited reconnect...');

    try {
        await connectWithRetry('reconnect');
    } finally {
        reconnecting = false;
    }
});

mongoose.connection.on('error', (err) => {
    console.error('✗ MongoDB error:', err.message);
});

/* ---- Graceful shutdown ---- */
process.on('SIGINT', async () => {
    await mongoose.connection.close(false);
    process.exit(0);
});

export default connectDB;
