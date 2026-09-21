import { z } from 'zod';

export const createScoreSchema = z.object({
  stablefordPoints: z.number().int().min(1).max(45),
  courseName: z.string().min(1).max(255),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const updateScoreSchema = z.object({
  stablefordPoints: z.number().int().min(1).max(45).optional(),
  courseName: z.string().min(1).max(255).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});
