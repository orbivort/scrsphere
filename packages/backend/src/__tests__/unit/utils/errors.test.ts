import { describe, it, expect, vi } from 'vitest';
import {
  AppError,
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
  createErrorResponse,
  createSuccessResponse,
  asyncHandler,
  formatValidationErrors,
} from '../../../utils/errors';
import { type Request, type Response, type NextFunction } from 'express';

describe('Error Utilities', () => {
  describe('AppError', () => {
    it('should create an error with default values', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.details).toBeUndefined();
    });

    it('should create an error with custom values', () => {
      const details = [{ field: 'email', message: 'Invalid email' }];
      const error = new AppError('Custom error', 400, 'CUSTOM_ERROR', details, false);
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.details).toEqual(details);
      expect(error.isOperational).toBe(false);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Error');
    });
  });

  describe('BadRequestError', () => {
    it('should create a 400 error with default message', () => {
      const error = new BadRequestError();
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Bad Request');
    });

    it('should create a 400 error with custom message', () => {
      const error = new BadRequestError('Invalid input');
      expect(error.message).toBe('Invalid input');
    });

    it('should create a 400 error with details', () => {
      const details = [{ field: 'name', message: 'Name is required' }];
      const error = new BadRequestError('Validation failed', details);
      expect(error.details).toEqual(details);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create a 401 error with default message', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Unauthorized');
    });

    it('should create a 401 error with custom message', () => {
      const error = new UnauthorizedError('Token expired');
      expect(error.message).toBe('Token expired');
    });
  });

  describe('ForbiddenError', () => {
    it('should create a 403 error with default message', () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe('Forbidden');
    });

    it('should create a 403 error with custom message', () => {
      const error = new ForbiddenError('Access denied');
      expect(error.message).toBe('Access denied');
    });
  });

  describe('NotFoundError', () => {
    it('should create a 404 error with default message', () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
    });

    it('should create a 404 error with resource name', () => {
      const error = new NotFoundError('User');
      expect(error.message).toBe('User not found');
    });
  });

  describe('ConflictError', () => {
    it('should create a 409 error with default message', () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toBe('Conflict');
    });

    it('should create a 409 error with custom message', () => {
      const error = new ConflictError('Email already exists');
      expect(error.message).toBe('Email already exists');
    });
  });

  describe('ValidationError', () => {
    it('should create a 422 error with details', () => {
      const details = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' },
      ];
      const error = new ValidationError(details);
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Validation failed');
      expect(error.details).toEqual(details);
    });
  });

  describe('InternalServerError', () => {
    it('should create a 500 error with default message', () => {
      const error = new InternalServerError();
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.message).toBe('Internal Server Error');
      expect(error.isOperational).toBe(false);
    });

    it('should create a 500 error with custom message', () => {
      const error = new InternalServerError('Database connection failed');
      expect(error.message).toBe('Database connection failed');
    });
  });

  describe('Session Errors', () => {
    it('should create SessionIdleTimeoutError', () => {
      const error = new SessionIdleTimeoutError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('SESSION_IDLE_TIMEOUT');
      expect(error.message).toBe('Session expired due to inactivity');
    });

    it('should create SessionAbsoluteTimeoutError', () => {
      const error = new SessionAbsoluteTimeoutError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('SESSION_ABSOLUTE_TIMEOUT');
      expect(error.message).toBe('Session expired due to maximum duration reached');
    });

    it('should create SessionRevokedError', () => {
      const error = new SessionRevokedError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('SESSION_REVOKED');
      expect(error.message).toBe('Session has been revoked');
    });

    it('should create SessionExpiredError', () => {
      const error = new SessionExpiredError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('SESSION_EXPIRED');
      expect(error.message).toBe('Session has expired');
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response object', () => {
      const response = createErrorResponse('BAD_REQUEST', 'Invalid input');
      expect(response).toEqual({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid input',
        },
      });
    });

    it('should create an error response with details', () => {
      const details = [{ field: 'email', message: 'Invalid email' }];
      const response = createErrorResponse('VALIDATION_ERROR', 'Validation failed', details);
      expect(response).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details,
        },
      });
    });
  });

  describe('createSuccessResponse', () => {
    it('should create a success response object', () => {
      const data = { id: '123', name: 'Test' };
      const response = createSuccessResponse(data);
      expect(response).toEqual({
        success: true,
        data,
      });
    });

    it('should handle null data', () => {
      const response = createSuccessResponse(null);
      expect(response).toEqual({
        success: true,
        data: null,
      });
    });

    it('should handle array data', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const response = createSuccessResponse(data);
      expect(response).toEqual({
        success: true,
        data,
      });
    });
  });

  describe('asyncHandler', () => {
    it('should call next with error when async function throws', async () => {
      const mockReq = {} as Request;
      const mockRes = {} as Response;
      const mockNext = vi.fn() as unknown as NextFunction;

      const handler = asyncHandler(async () => {
        throw new Error('Test error');
      });

      handler(mockReq, mockRes, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should resolve when async function succeeds', async () => {
      const mockReq = {} as Request;
      const mockRes = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as unknown as Response;
      const mockNext = vi.fn() as unknown as NextFunction;

      const handler = asyncHandler(async (_req, res) => {
        res.json({ success: true });
      });

      handler(mockReq, mockRes, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('formatValidationErrors', () => {
    it('should format validation errors', () => {
      const errors = [
        { path: 'email', message: 'Invalid email' },
        { path: 'password', message: 'Too short' },
      ];

      const formatted = formatValidationErrors(errors);
      expect(formatted).toEqual([
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' },
      ]);
    });

    it('should handle empty errors array', () => {
      const formatted = formatValidationErrors([]);
      expect(formatted).toEqual([]);
    });
  });
});
