import { z } from 'zod';

export const selectCharitySchema = z.object({
  charityId: z.string().uuid('Invalid charity ID'),
  contributionPercent: z.number().int().min(10).max(100),
});

export const createCharitySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export const updateCharitySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});
