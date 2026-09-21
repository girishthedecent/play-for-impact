import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { sendSuccess } from '../utils/helpers/response.helper';
import { UnauthorizedError } from '../utils/errors/app.error';
import { AuthRequest } from '../middlewares/auth.middleware';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, fullName } = req.body;
    const result = await authService.register({ email, password, fullName });
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError('Not authenticated');
    }

    const user = await authService.getProfile(userId);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { fullName, email, currentPassword, newPassword } = req.body;
    const user = await authService.updateProfile(userId, {
      fullName,
      email,
      currentPassword,
      newPassword,
    });

    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};
