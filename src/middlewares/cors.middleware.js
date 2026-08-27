import cors from 'cors';
import widgetRepository from '../repositories/widget.repository.js';
import dotenv from 'dotenv';

dotenv.config();

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5173';

const corsOptionsDelegate = async (req, callback) => {
  const origin = req.header('Origin');

  // 1. If no origin is provided (e.g., Postman, curl, or standard server-side request)
  if (!origin) {
    return callback(null, { origin: true, credentials: true });
  }

  // 2. Check if the request is for a public widget endpoint
  // Config endpoint: /api/widgets/:key/config
  const configMatch = req.originalUrl.match(/^\/api\/widgets\/([a-zA-Z0-9_-]+)\/config/);
  // Submission endpoint: /api/submissions/:key
  const submitMatch = req.originalUrl.match(/^\/api\/submissions\/([a-zA-Z0-9_-]+)/);
  
  const publicApiKey = configMatch ? configMatch[1] : (submitMatch ? submitMatch[1] : null);

  if (publicApiKey) {
    try {
      const widget = await widgetRepository.findByApiKey(publicApiKey);
      if (widget && widget.allowed_origins) {
        const allowedOrigins = JSON.parse(widget.allowed_origins);

        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          // Origin is whitelisted by the widget owner!
          return callback(null, { origin: true });
        }
      }
    } catch (err) {
      console.error('[CORS Middleware] Database Error:', err);
    }

    // If we reach here, the origin was NOT found in the widget's allowed list
    return callback(null, { origin: false });
  }

  // 3. For all other routes (Dashboard CRUD, Auth, etc.), only allow the dashboard URL
  if (origin === DASHBOARD_URL) {
    return callback(null, { origin: true, credentials: true });
  }

  // Reject all other origins
  return callback(null, { origin: false });
};

export const dynamicCors = cors(corsOptionsDelegate);