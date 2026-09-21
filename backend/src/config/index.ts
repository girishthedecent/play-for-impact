import dotenv from 'dotenv';

dotenv.config();

interface ServerConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  frontendUrl: string;
}

export const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
