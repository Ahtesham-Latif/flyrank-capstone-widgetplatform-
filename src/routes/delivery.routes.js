import { Router } from 'express';
import deliveryController from '../controllers/delivery.controller.js';

const router = Router();

// Publicly readable endpoints (No requireAuth middleware)
router.get('/widget.js', deliveryController.getWidgetScript);
router.get('/api/widgets/:public_api_key/config', deliveryController.getConfig);

export default router;