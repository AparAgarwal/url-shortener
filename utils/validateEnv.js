/**
 * Validates required environment variables at application startup
 * Throws error if any required variable is missing
 * This ensures the app fails fast with clear error messages
 */
const validateEnv = () => {
    const requiredEnvVars = [
        'MONGO_URI',
        'PORT',
        'ACCESS_TOKEN_SECRET',
        'REFRESH_TOKEN_SECRET',
        'ACCESS_TOKEN_EXPIRY',
        'REFRESH_TOKEN_EXPIRY',
        'BASE_URL'
    ];

    const missing = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
                'Please check your .env file and ensure all required variables are set.'
        );
    }

    // Validate MONGO_URI format
    if (!process.env.MONGO_URI.startsWith('mongodb')) {
        throw new Error(
            'MONGO_URI must be a valid MongoDB connection string (starting with mongodb:// or mongodb+srv://)'
        );
    }

    // Validate PORT is a number
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error('PORT must be a valid port number between 1 and 65535');
    }

    if (process.env.ACCESS_TOKEN_SECRET === process.env.REFRESH_TOKEN_SECRET) {
        throw new Error('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be different');
    }

    console.log('✓ Environment variables validated successfully');
};

export default validateEnv;
