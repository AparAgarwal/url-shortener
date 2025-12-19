import express from 'express';
import connectDB from './config/db.js';
import path from 'path';

import urlRoutes from './routes/url.routes.js';
import staticRoute from './routes/static.routes.js';
import userRoutes from './routes/user.routes.js';

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
app.use('/url', urlRoutes);
app.use('/user', userRoutes);

export default app;