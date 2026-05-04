import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorHandler, notFoundHandler } from '../../../middleware/error.middleware';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  SessionIdleTimeoutError,
  SessionAbsoluteTimeoutError,
  SessionRevokedError,
  SessionExpiredError,
} from '../../../utils/errors';
import { logger, logError } from '../../../utils/logger';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup/testSetup';
import { Prisma } from '../../../generated/prisma/client';

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  logError: vi.fn(),
}));

describe('Error Middleware', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('errorHandler', () => {
    it('should log error with request context', () => {
      const error = new Error('Test error');
      mockReq.method = 'POST';
      mockReq.path = '/api/users';
      mockReq.body = { name: 'test' };
      mockReq.query = { filter: 'active' };
      mockReq.params = { id: '123' };
      mockReq.userId = 'user-123';

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(logError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          method: 'POST',
          path: '/api/users',
          body: { name: 'test' },
          query: { filter: 'active' },
          params: { id: '123' },
          userId: 'user-123',
          fingerprint: expect.any(String),
        })
      );
    });

    it('should sanitize sensitive fields in request body', () => {
      const error = new Error('Test error');
      mockReq.body = {
        email: 'test@example.com',
        password: 'secret123',
        passwordConfirm: 'secret123',
        currentPassword: 'old',
        newPassword: 'new',
        refreshToken: 'token',
        accessToken: 'token',
        token: 'mytoken',
        secret: 'secret',
        apiKey: 'key123',
        api_key: 'key456',
        authorization: 'Bearer token',
        sessionId: 'session-123',
      };

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      const logCall = vi.mocked(logError).mock.calls[0] as any;
      const loggedBody = logCall?.[1]?.body;
      expect(loggedBody.email).toBe('test@example.com');
      expect(loggedBody.password).toBe('[REDACTED]');
      expect(loggedBody.passwordConfirm).toBe('[REDACTED]');
      expect(loggedBody.currentPassword).toBe('[REDACTED]');
      expect(loggedBody.newPassword).toBe('[REDACTED]');
      expect(loggedBody.refreshToken).toBe('[REDACTED]');
      expect(loggedBody.accessToken).toBe('[REDACTED]');
      expect(loggedBody.token).toBe('[REDACTED]');
      expect(loggedBody.secret).toBe('[REDACTED]');
      expect(loggedBody.apiKey).toBe('[REDACTED]');
      expect(loggedBody.api_key).toBe('[REDACTED]');
      expect(loggedBody.authorization).toBe('[REDACTED]');
      expect(loggedBody.sessionId).toBe('[REDACTED]');
    });

    it('should sanitize nested objects in request body', () => {
      const error = new Error('Test error');
      mockReq.body = {
        user: {
          name: 'test',
          password: 'secret',
        },
      };

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      const logCall = vi.mocked(logError).mock.calls[0] as any;
      const loggedBody = logCall?.[1]?.body;
      expect(loggedBody.user.name).toBe('test');
      expect(loggedBody.user.password).toBe('[REDACTED]');
    });

    it('should sanitize arrays of objects in request body', () => {
      const error = new Error('Test error');
      mockReq.body = {
        users: [
          { name: 'user1', password: 'secret1' },
          { name: 'user2', password: 'secret2' },
        ],
      };

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      const logCall = vi.mocked(logError).mock.calls[0] as any;
      const loggedBody = logCall?.[1]?.body;
      expect(loggedBody.users[0].name).toBe('user1');
      expect(loggedBody.users[0].password).toBe('[REDACTED]');
      expect(loggedBody.users[1].name).toBe('user2');
      expect(loggedBody.users[1].password).toBe('[REDACTED]');
    });

    it('should handle non-object body values', () => {
      const error = new Error('Test error');
      mockReq.body = 'string body';

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      const logCall = vi.mocked(logError).mock.calls[0] as any;
      const loggedBody = logCall?.[1]?.body;
      expect(loggedBody).toBe('string body');
    });

    it('should handle null body', () => {
      const error = new Error('Test error');
      mockReq.body = null;

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      const logCall = vi.mocked(logError).mock.calls[0] as any;
      const loggedBody = logCall?.[1]?.body;
      expect(loggedBody).toBeNull();
    });

    it('should handle AppError with correct status code and response', () => {
      const error = new BadRequestError('Invalid input');

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid input',
          details: undefined,
        },
      });
    });

    it('should handle AppError with validation details', () => {
      const details = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' },
      ];
      const error = new ValidationError(details);

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details,
        },
      });
    });

    it('should handle UnauthorizedError', () => {
      const error = new UnauthorizedError('Not authenticated');

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
          details: undefined,
        },
      });
    });

    it('should handle ForbiddenError', () => {
      const error = new ForbiddenError('Access denied');

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
          details: undefined,
        },
      });
    });

    it('should handle NotFoundError', () => {
      const error = new NotFoundError('User');

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          details: undefined,
        },
      });
    });

    it('should handle ConflictError', () => {
      const error = new ConflictError('Email already exists');

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Email already exists',
          details: undefined,
        },
      });
    });

    it('should handle InternalServerError', () => {
      const error = new InternalServerError('Something broke');

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something broke',
          details: undefined,
        },
      });
    });

    it('should handle PrismaClientKnownRequestError P2002 (unique constraint)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['email'] },
      });

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'email already exists',
          details: [{ field: 'email', message: 'This email is already taken' }],
        },
      });
    });

    it('should handle PrismaClientKnownRequestError P2025 (record not found)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
          details: undefined,
        },
      });
    });

    it('should handle PrismaClientKnownRequestError P2003 (invalid reference)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Foreign key constraint', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_REFERENCE',
          message: 'Referenced record does not exist',
          details: undefined,
        },
      });
    });

    it('should handle PrismaClientKnownRequestError P2014 (relation violation)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Relation violation', {
        code: 'P2014',
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RELATION_VIOLATION',
          message: 'Invalid relation',
          details: undefined,
        },
      });
    });

    it('should handle unhandled Prisma error with 500 status', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unknown error', {
        code: 'P9999',
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'A database error occurred',
          details: undefined,
        },
      });
      expect(logger.error).toHaveBeenCalledWith(
        'Unhandled Prisma error',
        expect.objectContaining({
          code: 'P9999',
          meta: undefined,
          fingerprint: expect.any(String),
        })
      );
    });

    it('should handle PrismaClientValidationError', () => {
      const error = new Prisma.PrismaClientValidationError('Invalid query', {
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data provided',
          details: undefined,
        },
      });
    });

    it('should handle JsonWebTokenError', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
          details: undefined,
        },
      });
    });

    it('should handle TokenExpiredError', () => {
      const error = new Error('Token has expired');
      error.name = 'TokenExpiredError';

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
          details: undefined,
        },
      });
    });

    it('should handle SessionIdleTimeoutError', () => {
      const error = new SessionIdleTimeoutError();

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SESSION_IDLE_TIMEOUT',
          message: 'Session expired due to inactivity',
          details: undefined,
        },
      });
    });

    it('should handle SessionAbsoluteTimeoutError', () => {
      const error = new SessionAbsoluteTimeoutError();

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SESSION_ABSOLUTE_TIMEOUT',
          message: 'Session expired due to maximum duration reached',
          details: undefined,
        },
      });
    });

    it('should handle SessionRevokedError', () => {
      const error = new SessionRevokedError();

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SESSION_REVOKED',
          message: 'Session has been revoked',
          details: undefined,
        },
      });
    });

    it('should handle SessionExpiredError', () => {
      const error = new SessionExpiredError();

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired',
          details: undefined,
        },
      });
    });

    it('should handle generic Error in development with error message', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Something went wrong');

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
          details: undefined,
        },
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle generic Error in production with generic message', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Internal details');

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: undefined,
        },
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle error without userId in request', () => {
      const error = new Error('Test error');
      mockReq.userId = undefined;

      errorHandler(error, mockReq as any, mockRes as any, mockNext);

      expect(logError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          userId: undefined,
        })
      );
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with method and path in message', () => {
      mockReq.method = 'GET';
      mockReq.path = '/api/nonexistent';

      notFoundHandler(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route GET /api/nonexistent not found',
          details: undefined,
        },
      });
    });

    it('should handle POST requests', () => {
      mockReq.method = 'POST';
      mockReq.path = '/api/users';

      notFoundHandler(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route POST /api/users not found',
          details: undefined,
        },
      });
    });
  });
});
