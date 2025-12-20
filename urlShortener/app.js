import express from 'express';
import connectDB from './config/db.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import urlRoutes from './routes/url.routes.js';
import staticRoute from './routes/static.routes.js';
import userRoutes from './routes/user.routes.js';

import errorHandler from './middlewares/errorHandler.js';

const app = express();
connectDB();

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// Middlewares
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static(path.resolve("./public")));

// Routes
app.use('/', staticRoute);

// API v1 Routes
app.use('/api/v1/url', urlRoutes);
app.use('/api/v1/user', userRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;