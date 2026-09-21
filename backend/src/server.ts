import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { serverConfig } from './config';
import { correlationMiddleware } from './middlewares/correlation.middleware';
import { appErrorHandler, genericErrorHandler } from './middlewares/error.middleware';
import v1Router from './routers/v1/index.router';
import { handleWebhook } from './controllers/payments.controller';
import { startSubscriptionExpiryJob } from './utils/subscription-expiry';

const app = express();

// Ensure upload directories exist (with fallback for read-only serverless filesystems)
const uploadsDir = path.resolve(__dirname, '../uploads');
try {
  fs.mkdirSync(path.join(uploadsDir, 'winner-proofs'), { recursive: true });
} catch {
  // Read-only filesystem in serverless functions (handled by Supabase Storage)
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'http:', 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'data:'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin === serverConfig.frontendUrl ||
      origin === 'http://localhost:5173' ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Compression
app.use(compression());

// Stripe webhook MUST receive raw body before JSON parser
app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Body parsing (after webhook route)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files with explicit cross-origin headers
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  },
  express.static(uploadsDir)
);

// Correlation ID
app.use(correlationMiddleware);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', v1Router);

// Error handlers (must be after routes)
app.use(appErrorHandler);
app.use(genericErrorHandler);

// Start server (only in non-serverless long-running process)
if (!process.env.VERCEL) {
  app.listen(serverConfig.port, () => {
    console.log(`Server running on port ${serverConfig.port}`);
    console.log(`Environment: ${serverConfig.nodeEnv}`);
    startSubscriptionExpiryJob();
  });
}

export default app;
