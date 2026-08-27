import { Router } from 'express';
import submissionController from '../controllers/submission.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { submissionLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

// Publicly reachable boundary for script form submits (with spam protection)
router.post('/:public_api_key', submissionLimiter, submissionController.handleSubmission);

// Authenticated tenant boundary for viewing captured leads
router.get('/', requireAuth, submissionController.getMySubmissions);

export default router;