import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import widgetRoutes from './routes/widget.routes.js';
import deliveryRoutes from './routes/delivery.routes.js';
import db from './config/db.js';

dotenv.config();

const app = express();

app.use(express.json());

// Session Middleware with secure cookie settings and maxAge of 1 day
app.use(
  session({
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'super_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.get('/health', async (req, res) => {
    try {
        await db.raw('SELECT 1');
        res.status(200).json({ status: 'OK', database: 'Connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Use the routes
app.use('/api/auth', authRoutes);
app.use('/api/widgets', widgetRoutes);

// Publicly readable delivery routes (No requireAuth middleware)
app.use('/', deliveryRoutes);

export default app;
