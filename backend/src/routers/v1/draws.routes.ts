import { Router } from 'express';
import {
  getDraws,
  getMyDraws,
  getDrawById,
  createDraw,
  simulateDraw,
  publishDraw,
  getUpcomingDraws,
} from '../../controllers/draws.controller';
import { validateRequestBody, validateUUIDParam } from '../../validators/index';
import { createDrawSchema } from '../../validators/draws.validator';
import { authMiddleware, adminMiddleware, subscriptionMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// Protected routes (before /:id to avoid conflict)
router.get('/my', authMiddleware, subscriptionMiddleware, getMyDraws);

// Public routes
router.get('/upcoming', getUpcomingDraws);
router.get('/', getDraws);
router.get('/:id', validateUUIDParam('id'), getDrawById);

// Admin routes
router.post('/create', authMiddleware, adminMiddleware, validateRequestBody(createDrawSchema), createDraw);
router.post('/:id/simulate', authMiddleware, adminMiddleware, validateUUIDParam('id'), simulateDraw);
router.post('/:id/publish', authMiddleware, adminMiddleware, validateUUIDParam('id'), publishDraw);

export default router;
