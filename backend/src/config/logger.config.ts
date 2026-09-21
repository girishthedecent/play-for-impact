import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { AsyncLocalStorage } from 'async_hooks';

export const asyncLocalStorage = new AsyncLocalStorage<{ correlationId: string }>();

const getCorrelationId = (): string => {
  const store = asyncLocalStorage.getStore();
  return store?.correlationId || 'no-correlation';
};

const customPrintf = winston.format.printf(({ level, message, timestamp, stack }) => {
  const correlationId = getCorrelationId();
  const logMessage = stack || message;
  return `${timestamp} [${level}] [${correlationId}] ${logMessage}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    customPrintf
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customPrintf
      ),
    }),
    new DailyRotateFile({
      filename: 'logs/%DATE%-app.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

export default logger;
