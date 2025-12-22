import express from 'express';
import connectDB from './config/db.js';
import path from 'path';
import cookieParser from 'cookie-parser';
import serveFavicon from 'serve-favicon';
import { fileURLToPath } from 'url';

// Route imports
import urlRoutes from './routes/url.routes.js';
import userRoutes from './routes/user.routes.js';
import staticRoutes from './routes/static.routes.js';

// Middleware imports
import errorHandler from './middlewares/errorHandler.js';

const app = express();
connectDB();

// Dummy Favicon setup to handle favicon errors
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(serveFavicon(path.join(__dirname, 'public', 'favicon.ico')));


app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.resolve('./public')));

// Routes
// Static pages (must be first to avoid conflicts with API routes)
app.use('/', staticRoutes);

// API routes with /api/v1 prefix
app.use('/api/v1/url', urlRoutes);
app.use('/api/v1/user', userRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
