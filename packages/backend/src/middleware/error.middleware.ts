// Error Handling Middleware
import crypto from 'node:crypto';
import { type Request, type Response, type NextFunction } from 'express';
import { Prisma } from '../generated/prisma/client';
import {
  AppError,
  createErrorResponse,
  SessionIdleTimeoutError,
  SessionAbsoluteTimeoutError,
  SessionRevokedError,
  SessionExpiredError,
} from '../utils/errors';
import { logger, logError } from '../utils/logger';
import { t } from '../i18n/requestT.js';

const SENSITIVE_FIELDS = [
  'password',
  'passwordConfirm',
  'currentPassword',
  'newPassword',
  'refreshToken',
  'accessToken',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'sessionId',
];

/**
 * Generate a unique fingerprint for an error to help with error grouping and tracking
 * Creates a SHA-256 hash from: error.name, error.message (first line), req.path, req.method
 * @param error - The error object
 * @param req - The request object
 * @returns A SHA-256 hash fingerprint
 */
const generateErrorFingerprint = (error: Error, req: Request): string => {
  // Get the first line of the error message
  const firstLineOfMessage = error.message.split('\n')[0] ?? '';

  // Create fingerprint components
  const fingerprintData = [error.name, firstLineOfMessage, req.path, req.method].join(':');

  // Generate SHA-256 hash
  return crypto.createHash('sha256').update(fingerprintData).digest('hex').substring(0, 16);
};

const sanitizeValue = (_value: unknown): string => {
  return '[REDACTED]';
};

const sanitizeObject = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some(
      (field) => lowerKey === field.toLowerCase() || lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = sanitizeValue(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        item && typeof item === 'object' ? sanitizeObject(item as Record<string, unknown>) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

const sanitizeRequestBody = (body: unknown): unknown => {
  if (!body || typeof body !== 'object') {
    return body;
  }
  return sanitizeObject(body as Record<string, unknown>);
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Generate error fingerprint for tracking and grouping
  const fingerprint = generateErrorFingerprint(error, req);

  logError(error, {
    method: req.method,
    path: req.path,
    body: sanitizeRequestBody(req.body),
    query: req.query,
    params: req.params,
    userId: req.userId,
    fingerprint,
  });

  if (error instanceof AppError) {
    res
      .status(error.statusCode)
      .json(createErrorResponse(error.code, error.message, error.details));
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(error, res, fingerprint);
    return;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    res
      .status(400)
      .json(createErrorResponse('VALIDATION_ERROR', 'Invalid data provided', undefined));
    return;
  }

  if (error.name === 'JsonWebTokenError') {
    res.status(401).json(createErrorResponse('INVALID_TOKEN', t('errors:invalidToken')));
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json(createErrorResponse('TOKEN_EXPIRED', t('errors:tokenExpired')));
    return;
  }

  if (error instanceof SessionIdleTimeoutError) {
    res
      .status(401)
      .json(
        createErrorResponse(error.code, error.message, [
          { field: 'session', message: t('errors:pleaseLoginAgain') },
        ])
      );
    return;
  }

  if (error instanceof SessionAbsoluteTimeoutError) {
    res
      .status(401)
      .json(
        createErrorResponse(error.code, error.message, [
          { field: 'session', message: t('errors:pleaseLoginAgain') },
        ])
      );
    return;
  }

  if (error instanceof SessionRevokedError) {
    res
      .status(401)
      .json(
        createErrorResponse(error.code, error.message, [
          { field: 'session', message: 'This session is no longer valid' },
        ])
      );
    return;
  }

  if (error instanceof SessionExpiredError) {
    res
      .status(401)
      .json(
        createErrorResponse(error.code, error.message, [
          { field: 'session', message: t('errors:pleaseLoginAgain') },
        ])
      );
    return;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  res
    .status(500)
    .json(
      createErrorResponse(
        'INTERNAL_ERROR',
        isProduction ? t('errors:unexpectedError') : error.message
      )
    );
};

const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError,
  res: Response,
  fingerprint: string
): void => {
  switch (error.code) {
    case 'P2002': {
      const field = (error.meta?.target as string[] | undefined)?.[0] ?? 'field';
      res
        .status(409)
        .json(
          createErrorResponse('CONFLICT', t('errors:fieldAlreadyExists', { field }), [
            { field, message: t('errors:fieldAlreadyTaken', { field }) },
          ])
        );
      break;
    }

    case 'P2025':
      res.status(404).json(createErrorResponse('NOT_FOUND', t('errors:recordNotFound')));
      break;

    case 'P2003':
      res.status(400).json(createErrorResponse('INVALID_REFERENCE', t('errors:invalidReference')));
      break;

    case 'P2014':
      res.status(400).json(createErrorResponse('RELATION_VIOLATION', t('errors:invalidRelation')));
      break;

    default:
      logger.error('Unhandled Prisma error', {
        code: error.code,
        meta: error.meta,
        fingerprint,
      });
      res.status(500).json(createErrorResponse('DATABASE_ERROR', t('errors:databaseError')));
  }
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res
    .status(404)
    .json(
      createErrorResponse(
        'NOT_FOUND',
        t('errors:routeNotFound', { method: req.method, path: req.path })
      )
    );
};

export default errorHandler;
