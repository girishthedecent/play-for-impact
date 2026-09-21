import { z } from 'zod';

export const createDrawSchema = z.object({
  drawDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  prizePool: z.number().min(0, 'Prize pool must be zero or positive').optional(),
  jackpotRollover: z.number().min(0).optional().default(0),
});
