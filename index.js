import app from './app.js';
import 'dotenv/config';
import validateEnv from './utils/validateEnv.js';
import connectDB from './config/db.js';

// Validate environment variables before starting the server
validateEnv();

const PORT = process.env.PORT || 3000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`\n🚀 Server running at http://localhost:${PORT}\n`);
        });
    })
    .catch(err => {
        console.error('✗ Failed to start application:', err.message);
        process.exit(1);
    });
