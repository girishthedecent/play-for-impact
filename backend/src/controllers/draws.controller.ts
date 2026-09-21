import { Response, NextFunction } from 'express';
import { drawsService } from '../services';
import { sendSuccess } from '../utils/helpers/response.helper';
import { AuthRequest } from '../middlewares/auth.middleware';
import { BadRequestError } from '../utils/errors/app.error';

export const getDraws = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const draws = await drawsService.getAllDraws();
    sendSuccess(res, draws);
  } catch (error) {
    next(error);
  }
};

export const getMyDraws = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { throw new BadRequestError('Not authenticated'); }

    const entries = await drawsService.getUserDrawEntries(userId);
    sendSuccess(res, entries);
  } catch (error) {
    next(error);
  }
};

export const getDrawById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await drawsService.getDrawDetails(id, req.user?.role);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const createDraw = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { drawDate, prizePool, jackpotRollover } = req.body;
    const created = await drawsService.createDraw({
      drawDate,
      prizePool,
      jackpotRollover,
    });
    sendSuccess(res, created, 201);
  } catch (error) {
    next(error);
  }
};

export const simulateDraw = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const algorithm = (req.body?.algorithm as 'random' | 'weighted') || 'random';
    const result = await drawsService.simulateDraw(id, algorithm);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const publishDraw = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await drawsService.publishDraw(id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getUpcomingDraws = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const upcoming = await drawsService.getUpcomingDraws();
    sendSuccess(res, upcoming);
  } catch (error) {
    next(error);
  }
};
