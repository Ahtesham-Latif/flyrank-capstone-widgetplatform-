import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import widgetRoutes from './routes/widget.routes.js';
import deliveryRoutes from './routes/delivery.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import db from './config/db.js';
import { dynamicCors } from './middlewares/cors.middleware.js';
import { sessionMiddleware } from './middlewares/session.middleware.js';

dotenv.config();

const app = express();

//Proxy 
app.set('trust proxy', 1);

// Apply dynamic CORS validation
app.use(dynamicCors);

app.use(express.json());

// Session Middleware
app.use(sessionMiddleware);

app.get('/health', async (req, res) => {
    try {
        await db.raw('SELECT 1');
        res.status(200).json({ status: 'OK', database: 'Connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Public delivery routes MUST be registered before /api/widgets so that
// GET /api/widgets/:key/config is NOT intercepted by widgetRoutes' requireAuth middleware.
app.use('/', deliveryRoutes);

// Authenticated routes
app.use('/api/auth', authRoutes);
app.use('/api/widgets', widgetRoutes);
app.use('/api/submissions', submissionRoutes);

export default app;
