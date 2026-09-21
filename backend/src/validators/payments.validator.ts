import { z } from 'zod';

export const createCheckoutSessionSchema = z.object({
  planType: z.enum(['basic', 'premium', 'vip', 'basic_yearly', 'premium_yearly', 'vip_yearly']),
});
