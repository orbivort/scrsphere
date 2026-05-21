import type { Request } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import config from '../config';

// Check if we're in test environment
const isTestEnvironment = config.nodeEnv === 'test';

// Default rate limit window (15 minutes)
const DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export const notificationRateLimit = rateLimit({
  windowMs: parseInt(
    process.env.NOTIFICATION_RATE_LIMIT_WINDOW_MS ?? String(DEFAULT_RATE_LIMIT_WINDOW_MS),
    10
  ),
  max: parseInt(process.env.NOTIFICATION_RATE_LIMIT_MAX ?? '200', 10),
  message: {
    success: false,
    error: {
      message: 'Too many notification requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: parseInt(
    process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? String(DEFAULT_RATE_LIMIT_WINDOW_MS),
    10
  ),
  // Use environment variable if set, otherwise use higher limit for test environment
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? (isTestEnvironment ? '1000000' : '5'), 10),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export const tokenRefreshRateLimit = rateLimit({
  windowMs: parseInt(
    process.env.TOKEN_REFRESH_RATE_LIMIT_WINDOW_MS ?? String(DEFAULT_RATE_LIMIT_WINDOW_MS),
    10
  ),
  // Higher limit for token refresh - this is an automatic operation triggered by the frontend
  // when the access token expires. Multiple tabs or rapid page refreshes can trigger
  // multiple refresh attempts, so we need a higher limit than login/register.
  max: parseInt(
    process.env.TOKEN_REFRESH_RATE_LIMIT_MAX ?? (isTestEnvironment ? '1000000' : '50'),
    10
  ),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many token refresh attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const loginRateLimit = rateLimit({
  windowMs: parseInt(
    process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? String(DEFAULT_RATE_LIMIT_WINDOW_MS),
    10
  ),
  // Use environment variable if set, otherwise use higher limit for test environment
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX ?? (isTestEnvironment ? '1000000' : '10'), 10),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const email = req.body?.email?.toLowerCase() ?? '';
    const ip = req.ip ?? req.connection.remoteAddress ?? 'unknown';
    return `${ipKeyGenerator(ip)}:${email}`;
  },
});

export const forgotPasswordRateLimit = rateLimit({
  windowMs: parseInt(
    process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS ?? String(DEFAULT_RATE_LIMIT_WINDOW_MS),
    10
  ),
  // Use environment variable if set, otherwise use higher limit for test environment
  max: parseInt(
    process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX ?? (isTestEnvironment ? '1000000' : '3'),
    10
  ),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const email = req.body?.email?.toLowerCase() ?? 'unknown';
    return `forgot-password:${email}`;
  },
});

export const resetPasswordRateLimit = rateLimit({
  windowMs: parseInt(
    process.env.RESET_PASSWORD_RATE_LIMIT_WINDOW_MS ?? String(DEFAULT_RATE_LIMIT_WINDOW_MS),
    10
  ),
  // Use environment variable if set, otherwise use higher limit for test environment
  max: parseInt(
    process.env.RESET_PASSWORD_RATE_LIMIT_MAX ?? (isTestEnvironment ? '1000000' : '5'),
    10
  ),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
