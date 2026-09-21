import { Response } from 'express';

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200): void => {
  res.status(statusCode).json({
    success: true,
    data,
  });
};

export const sendError = (res: Response, error: string, statusCode = 500, details?: unknown): void => {
  res.status(statusCode).json({
    success: false,
    error,
    details,
  });
};
