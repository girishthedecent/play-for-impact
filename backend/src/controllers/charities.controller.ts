import { Response, NextFunction } from 'express';
import { charitiesService } from '../services';
import { sendSuccess } from '../utils/helpers/response.helper';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UnauthorizedError } from '../utils/errors/app.error';

export const getCharities = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const charities = await charitiesService.getCharities();
    sendSuccess(res, charities);
  } catch (error) {
    next(error);
  }
};

export const getCharityById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const charity = await charitiesService.getCharityById(id);
    sendSuccess(res, charity);
  } catch (error) {
    next(error);
  }
};

export const getCharityStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const stats = await charitiesService.getCharityStats(id);
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};

export const selectCharity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { throw new UnauthorizedError('Not authenticated'); }

    const { charityId, contributionPercent } = req.body;
    await charitiesService.selectCharity(userId, charityId, contributionPercent);

    sendSuccess(res, { message: 'Charity selected successfully' });
  } catch (error) {
    next(error);
  }
};

export const createCharity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, website, imageUrl } = req.body;
    const newCharity = await charitiesService.createCharity({
      name,
      description,
      website,
      imageUrl,
    });
    sendSuccess(res, newCharity, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCharity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, description, website, imageUrl, isActive } = req.body;

    const updated = await charitiesService.updateCharity(id, {
      name,
      description,
      website,
      imageUrl,
      isActive,
    });

    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
};

export const deleteCharity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    await charitiesService.deleteCharity(id);
    sendSuccess(res, { message: 'Charity deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

export const donateToCharity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { amount } = req.body;
    const userId = req.user?.userId;

    if (!userId) { throw new UnauthorizedError('Not authenticated'); }

    const donation = await charitiesService.donateToCharity(userId, id, amount);
    sendSuccess(res, { message: 'Donation recorded successfully', amount: donation?.amount ?? parseFloat(String(amount)) }, 201);
  } catch (error) {
    next(error);
  }
};
