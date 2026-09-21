import { Router } from 'express';
import {
  getAnalytics,
  getUsers,
  getUserById,
  updateUser,
  updateUserScores,
  cancelUserSubscription,
  deleteUser,
  getSettings,
  updateSettings,
  getDrawStats,
  getScoreFrequency,
} from '../../controllers/admin.controller';
import { validateRequestBody, validateUUIDParam } from '../../validators/index';
import { updateUserSchema, updateUserScoresSchema, updateSettingsSchema } from '../../validators/admin.validator';
import { authMiddleware, adminMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware, adminMiddleware);

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.get('/users/:id', validateUUIDParam('id'), getUserById);
router.put('/users/:id', validateUUIDParam('id'), validateRequestBody(updateUserSchema), updateUser);
router.put('/users/:id/scores', validateUUIDParam('id'), validateRequestBody(updateUserScoresSchema), updateUserScores);
router.post('/users/:id/cancel-subscription', validateUUIDParam('id'), cancelUserSubscription);
router.delete('/users/:id', validateUUIDParam('id'), deleteUser);
router.get('/settings', getSettings);
router.put('/settings', validateRequestBody(updateSettingsSchema), updateSettings);
router.get('/draw-stats', getDrawStats);
router.get('/score-frequency', getScoreFrequency);

export default router;
