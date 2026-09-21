import { z } from 'zod';

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'admin']).optional(),
  subscriptionStatus: z.enum(['inactive', 'active', 'cancelled', 'expired']).optional(),
});

export const updateUserScoresSchema = z.object({
  stablefordPoints: z.number().int().min(1).max(45),
  courseName: z.string().min(1).max(255),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const updateSettingsSchema = z.object({
  platformName: z.string().min(1).max(255).optional(),
  defaultPrizePoolPercentage: z.number().min(0).max(100).optional(),
  minimumContributionPercent: z.number().int().min(0).max(100).optional(),
  maximumScoresPerUser: z.number().int().min(1).max(20).optional(),
  tier1MatchShare: z.number().min(0).max(100).optional(),
  tier2MatchShare: z.number().min(0).max(100).optional(),
  tier3MatchShare: z.number().min(0).max(100).optional(),
  jackpotRolloverEnabled: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  supportEmail: z.string().email().optional(),
});
