import { Router } from 'express';
import widgetController from '../controllers/widget.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Protection for all widget endpoints
router.use(requireAuth);

router.post('/', widgetController.createWidget);
router.get('/', widgetController.getMyWidgets);
router.delete('/:id', widgetController.deleteWidget);

export default router;