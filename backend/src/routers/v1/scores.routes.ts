import { Router } from 'express';
import { getScores, createScore, updateScore, deleteScore, getLeaderboard } from '../../controllers/scores.controller';
import { validateRequestBody, validateUUIDParam } from '../../validators/index';
import { createScoreSchema, updateScoreSchema } from '../../validators/scores.validator';
import { authMiddleware, subscriptionMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// Public route
router.get('/leaderboard', getLeaderboard);

// Protected routes
router.get('/', authMiddleware, getScores);
router.post('/', authMiddleware, subscriptionMiddleware, validateRequestBody(createScoreSchema), createScore);
router.put('/:id', authMiddleware, subscriptionMiddleware, validateUUIDParam('id'), validateRequestBody(updateScoreSchema), updateScore);
router.delete('/:id', authMiddleware, subscriptionMiddleware, validateUUIDParam('id'), deleteScore);

export default router;
