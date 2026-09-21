import { Request, Response, NextFunction } from 'express';
import { type AnyZodObject, ZodError } from 'zod';
import { z } from 'zod';

export const validateRequestBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  };
};

export const validateQueryParams = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  };
};

const uuidSchema = z.string().uuid();

export const validateUUIDParam = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = uuidSchema.safeParse(req.params[paramName]);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: `Invalid ${paramName} format`,
        details: result.error.errors,
      });
      return;
    }
    next();
  };
};
