// Authentication Middleware
import { type Request, type Response, type NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';
import prisma from '../utils/prisma';
import { COOKIE_NAMES } from '../utils/cookieConfig';
import { updateRequestContext } from '../utils/requestContext';

/**
 * Authentication middleware
 * Verifies JWT token from either httpOnly cookie or Authorization header
 * Supports both cookie-based (preferred) and header-based authentication
 * Also updates session activity timestamp to prevent idle timeout during active use
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Priority 1: Check httpOnly cookie (preferred for security)
    token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];

    // Priority 2: Fallback to Authorization header for API clients
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify token
    const payload = authService.verifyAccessToken(token);

    // Get user
    const user = await authService.getCurrentUser(payload.sub);

    // Attach user and prisma to request
    req.user = user;
    req.userId = user.id;
    req.prisma = prisma;

    // Update request context with userId for logging
    updateRequestContext({ userId: user.id });

    // Update session activity to prevent idle timeout
    // This ensures that as long as the user is making authenticated requests,
    // their session remains active
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];
    if (refreshToken) {
      authService.updateActivity(refreshToken).catch((error) => {
        // Log error with more context for debugging
        logger.warn('Failed to update session activity in middleware', {
          error: error instanceof Error ? error.message : 'Unknown error',
          path: req.path,
          method: req.method,
          userId: req.userId,
        });
      });
    } else {
      // Log when no refresh token is present - this could indicate a problem
      logger.debug('No refresh token cookie found during authenticated request', {
        path: req.path,
        method: req.method,
        userId: req.userId,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check cookie first
    token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];

    // Fallback to header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (token) {
      const payload = authService.verifyAccessToken(token);
      const user = await authService.getCurrentUser(payload.sub);
      req.user = user;
      req.userId = user.id;
      // Update request context with userId for logging
      updateRequestContext({ userId: user.id });
    }

    next();
  } catch (error) {
    // Log error for debugging but don't fail the request for optional auth
    logger.debug('Optional auth failed (non-blocking)', { error });
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRoles = (...roles: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Get user's role in the team (if teamId is in params)
      const teamId = req.params.teamId ?? req.body.teamId;

      if (teamId) {
        const teamMember = await req.prisma?.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId,
              userId: req.user.id,
            },
          },
        });

        if (!teamMember || !roles.includes(teamMember.role)) {
          throw new UnauthorizedError('Insufficient permissions');
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authenticate;
