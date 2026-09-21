import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/helpers/auth.helper';
import { UnauthorizedError, ForbiddenError } from '../utils/errors/app.error';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('No token provided'));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    next(new ForbiddenError('Admin access required'));
    return;
  }
  next();
};

export const subscriptionMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { next(new UnauthorizedError('Not authenticated')); return; }
  
  // Admins are exempt from subscription requirement
  if (req.user.role === 'admin') { next(); return; }
  
  // Check subscription status from DB (real-time check, not just JWT)
  try {
    const { query: dbQuery } = await import('../services/supabase.service');
    const sub = await dbQuery<{ status: string }>(
      `SELECT status FROM subscriptions WHERE user_id = $1 AND status = 'active'`,
      [req.user.userId]
    );
    if (sub.rows.length === 0) {
      next(new ForbiddenError('Active subscription required to access this feature'));
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
};
