import { Router } from 'express';
import {
  getCharities,
  getCharityById,
  getCharityStats,
  selectCharity,
  createCharity,
  updateCharity,
  deleteCharity,
  donateToCharity,
} from '../../controllers/charities.controller';
import { validateRequestBody, validateUUIDParam } from '../../validators/index';
import { selectCharitySchema, createCharitySchema, updateCharitySchema } from '../../validators/charities.validator';
import { authMiddleware, adminMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// Protected routes (before /:id to avoid conflict)
router.put('/select', authMiddleware, validateRequestBody(selectCharitySchema), selectCharity);

// Public routes
router.get('/', getCharities);
router.get('/:id', validateUUIDParam('id'), getCharityById);
router.get('/:id/stats', validateUUIDParam('id'), getCharityStats);

// User: independent donation (not tied to gameplay)
router.post('/:id/donate', authMiddleware, validateUUIDParam('id'), donateToCharity);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, validateRequestBody(createCharitySchema), createCharity);
router.put('/:id', authMiddleware, adminMiddleware, validateUUIDParam('id'), validateRequestBody(updateCharitySchema), updateCharity);
router.delete('/:id', authMiddleware, adminMiddleware, validateUUIDParam('id'), deleteCharity);

export default router;
