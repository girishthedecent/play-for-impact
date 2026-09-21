import { Response, NextFunction } from 'express';
import { scoresService } from '../services';
import { sendSuccess } from '../utils/helpers/response.helper';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UnauthorizedError } from '../utils/errors/app.error';

export const getScores = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { throw new UnauthorizedError('Not authenticated'); }

    const scores = await scoresService.getUserScores(userId);
    sendSuccess(res, scores);
  } catch (error) {
    next(error);
  }
};

export const createScore = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { throw new UnauthorizedError('Not authenticated'); }

    const { stablefordPoints, courseName, date } = req.body;
    const score = await scoresService.createScore(userId, {
      stablefordPoints,
      courseName,
      date,
    });

    sendSuccess(res, score, 201);
  } catch (error) {
    next(error);
  }
};

export const updateScore = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { throw new UnauthorizedError('Not authenticated'); }

    const id = req.params.id as string;
    const { stablefordPoints, courseName, date } = req.body;
    const updated = await scoresService.updateScore(userId, id, {
      stablefordPoints,
      courseName,
      date,
    });

    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
};

export const deleteScore = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { throw new UnauthorizedError('Not authenticated'); }

    const id = req.params.id as string;
    await scoresService.deleteScore(userId, id);
    sendSuccess(res, { message: 'Score deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const leaderboard = await scoresService.getLeaderboard(10);
    sendSuccess(res, leaderboard);
  } catch (error) {
    next(error);
  }
};
