import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors/app.error';
import logger from '../config/logger.config';

export const appErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.error(`AppError: ${err.message}`);
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  _next(err);
};

export const genericErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
  });
};
