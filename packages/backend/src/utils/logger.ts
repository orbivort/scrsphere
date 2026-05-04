// Winston Logger Configuration
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config from '../config';
import { getRequestContext } from './requestContext';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom log format for console output
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const metaStr = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

// Custom format that includes request context when available
const contextFormat = winston.format((info) => {
  const context = getRequestContext();
  if (context) {
    info.requestId = context.requestId;
    if (context.userId) {
      info.userId = context.userId;
    }
    if (context.teamId) {
      info.teamId = context.teamId;
    }
  }
  return info;
});

// Get log directory from config or use default
const logDir = config.logging.directory || 'logs';

// Create rotating transport for error logs
const errorRotateTransport = new DailyRotateFile({
  filename: `${logDir}/error-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: config.logging.maxSize || '20m',
  maxFiles: config.logging.maxFiles || '14d',
  level: 'error',
});

// Create rotating transport for combined logs
const combinedRotateTransport = new DailyRotateFile({
  filename: `${logDir}/combined-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: config.logging.maxSize || '20m',
  maxFiles: config.logging.maxFiles || '14d',
});

// Create rotating transport for audit logs
const auditRotateTransport = new DailyRotateFile({
  filename: `${logDir}/audit-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: config.logging.maxSize || '20m',
  maxFiles: config.logging.maxFiles || '30d',
});

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(contextFormat(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
  defaultMeta: { service: 'agile-scrum-api' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: combine(
        contextFormat(),
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
  ],
});

// Add file transports in production and development
if (config.nodeEnv === 'production' || config.nodeEnv === 'development') {
  logger.add(errorRotateTransport);
  logger.add(combinedRotateTransport);
  logger.add(auditRotateTransport);
}

/**
 * Dedicated audit logger for compliance and security events
 * Logs to separate audit log file for easier compliance reporting
 */
export const auditLogger = winston.createLogger({
  level: 'info',
  format: combine(contextFormat(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
  defaultMeta: { service: 'agile-scrum-api', logType: 'audit' },
  transports: [
    // Audit logs always go to console for visibility
    new winston.transports.Console({
      format: combine(
        contextFormat(),
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
  ],
});

// Add audit file transport in production and development
if (config.nodeEnv === 'production' || config.nodeEnv === 'development') {
  auditLogger.add(auditRotateTransport);
}

// Helper functions
export const logRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  requestId?: string
) => {
  logger.info('HTTP Request', {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    requestId,
  });
};

export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

/**
 * Log with explicit context (useful when context is not available via AsyncLocalStorage)
 * @param level - Log level
 * @param message - Log message
 * @param context - Additional context to include
 */
export const logWithContext = (
  level: 'error' | 'warn' | 'info' | 'debug',
  message: string,
  context?: Record<string, unknown>
): void => {
  const requestContext = getRequestContext();
  const logData = {
    ...context,
    ...(requestContext && {
      requestId: requestContext.requestId,
      userId: requestContext.userId,
      teamId: requestContext.teamId,
    }),
  };

  logger.log(level, message, logData);
};

export default logger;
