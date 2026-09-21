import { Response, NextFunction } from 'express';
import { winnersService } from '../services';
import { sendSuccess } from '../utils/helpers/response.helper';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UnauthorizedError, ForbiddenError } from '../utils/errors/app.error';

export const getMyWinnings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { throw new UnauthorizedError('Not authenticated'); }

    const winnings = await winnersService.getUserWinnings(userId);
    sendSuccess(res, winnings);
  } catch (error) {
    next(error);
  }
};

export const uploadProof = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const id = req.params.id as string;
    if (!userId) throw new ForbiddenError('Not authenticated');

    const proof = await winnersService.uploadProof(userId, id, req.file);
    sendSuccess(res, proof, 201);
  } catch (error) {
    next(error);
  }
};

export const getWinners = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const winners = await winnersService.getAllWinners();
    sendSuccess(res, winners);
  } catch (error) {
    next(error);
  }
};

export const getWinnerById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const winner = await winnersService.getWinnerById(id);
    sendSuccess(res, winner);
  } catch (error) {
    next(error);
  }
};

export const approveWinner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const adminId = req.user?.userId;
    await winnersService.approveWinner(adminId, id);
    sendSuccess(res, { message: 'Winner approved successfully' });
  } catch (error) {
    next(error);
  }
};

export const rejectWinner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    const adminId = req.user?.userId;
    await winnersService.rejectWinner(adminId, id, reason);
    sendSuccess(res, { message: 'Winner rejected successfully' });
  } catch (error) {
    next(error);
  }
};

export const markPaid = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const adminId = req.user?.userId;
    await winnersService.markPaid(adminId, id);
    sendSuccess(res, { message: 'Winner marked as paid successfully' });
  } catch (error) {
    next(error);
  }
};
