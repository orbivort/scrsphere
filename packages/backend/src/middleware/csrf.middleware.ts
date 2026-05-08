import crypto from 'node:crypto';
import { type Request, type Response, type NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';
import config from '../config';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_HEADER_NAME = 'x-csrf-token';

function generateCsrfToken(): { token: string; signedToken: string } {
  const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const signature = crypto.createHmac('sha256', config.jwt.secret).update(token).digest('hex');

  const signedToken = `${token}.${signature}`;

  return { token, signedToken };
}

function verifyCsrfToken(signedToken: string): { valid: boolean; token?: string } {
  const parts = signedToken.split('.');
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [token, signature] = parts;

  if (!token || !signature) {
    return { valid: false };
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.jwt.secret)
    .update(token)
    .digest('hex');

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    return isValid ? { valid: true, token } : { valid: false };
  } catch {
    return { valid: false };
  }
}

function getCsrfCookieOptions() {
  return {
    httpOnly: false,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  };
}

export function generateCsrfTokenHandler(_req: Request, res: Response): void {
  const { signedToken } = generateCsrfToken();

  res.cookie(CSRF_COOKIE_NAME, signedToken, getCsrfCookieOptions());

  res.json({
    success: true,
    data: {
      token: signedToken,
    },
  });
}

export function csrfProtectionMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const csrfCookie = req.cookies[CSRF_COOKIE_NAME];

  if (!csrfCookie) {
    logger.warn('CSRF token missing in cookie', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    throw new ForbiddenError('CSRF token missing');
  }

  const cookieValidation = verifyCsrfToken(csrfCookie);
  if (!cookieValidation.valid) {
    logger.warn('Invalid CSRF token in cookie', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    throw new ForbiddenError('Invalid CSRF token');
  }

  const csrfHeader = req.headers[CSRF_HEADER_NAME];

  if (!csrfHeader || typeof csrfHeader !== 'string') {
    logger.warn('CSRF token missing in header', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    throw new ForbiddenError('CSRF token missing in header');
  }

  const headerValidation = verifyCsrfToken(csrfHeader);
  if (!headerValidation.valid) {
    logger.warn('Invalid CSRF token in header', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    throw new ForbiddenError('Invalid CSRF token in header');
  }

  if (cookieValidation.token !== headerValidation.token) {
    logger.warn('CSRF token mismatch between cookie and header', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    throw new ForbiddenError('CSRF token mismatch');
  }

  next();
}

export function ensureCsrfToken(req: Request, res: Response, next: NextFunction): void {
  const csrfCookie = req.cookies[CSRF_COOKIE_NAME];

  if (!csrfCookie) {
    const { signedToken } = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, signedToken, getCsrfCookieOptions());
  } else {
    const validation = verifyCsrfToken(csrfCookie);
    if (!validation.valid) {
      const { signedToken } = generateCsrfToken();
      res.cookie(CSRF_COOKIE_NAME, signedToken, getCsrfCookieOptions());
    }
  }

  next();
}

export const CSRF_CONSTANTS = {
  COOKIE_NAME: CSRF_COOKIE_NAME,
  HEADER_NAME: CSRF_HEADER_NAME,
};
