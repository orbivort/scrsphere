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
  AccountDeletionBlockedError,
  InvalidConfirmationError,
  EmailError,
  EmailRateLimitError,
  EmailProviderError,
  EmailConnectionError,
  EmailAuthenticationError,
  EmailTemplateError,
  EmailValidationError,
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

    it('should create SessionIdleTimeoutError with custom message', () => {
      const error = new SessionIdleTimeoutError('Custom idle timeout');
      expect(error.message).toBe('Custom idle timeout');
    });

    it('should create SessionAbsoluteTimeoutError', () => {
      const error = new SessionAbsoluteTimeoutError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('SESSION_ABSOLUTE_TIMEOUT');
      expect(error.message).toBe('Session expired due to maximum duration reached');
    });

    it('should create SessionAbsoluteTimeoutError with custom message', () => {
      const error = new SessionAbsoluteTimeoutError('Custom absolute timeout');
      expect(error.message).toBe('Custom absolute timeout');
    });

    it('should create SessionRevokedError', () => {
      const error = new SessionRevokedError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('SESSION_REVOKED');
      expect(error.message).toBe('Session has been revoked');
    });

    it('should create SessionRevokedError with custom message', () => {
      const error = new SessionRevokedError('Custom revoked');
      expect(error.message).toBe('Custom revoked');
    });

    it('should create SessionExpiredError', () => {
      const error = new SessionExpiredError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('SESSION_EXPIRED');
      expect(error.message).toBe('Session has expired');
    });

    it('should create SessionExpiredError with custom message', () => {
      const error = new SessionExpiredError('Custom expired');
      expect(error.message).toBe('Custom expired');
    });
  });

  describe('AccountDeletion Errors', () => {
    it('should create AccountDeletionBlockedError', () => {
      const teams = [{ id: 'team-1', name: 'Test Team' }];
      const error = new AccountDeletionBlockedError(teams);
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.teams).toEqual(teams);
      expect(error.guidance).toContain('Account deletion is blocked');
    });

    it('should create AccountDeletionBlockedError with custom guidance', () => {
      const teams = [{ id: 'team-1', name: 'Test Team' }];
      const error = new AccountDeletionBlockedError(teams, 'Custom guidance');
      expect(error.guidance).toBe('Custom guidance');
    });

    it('should create InvalidConfirmationError', () => {
      const error = new InvalidConfirmationError();
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toContain('DELETE MY ACCOUNT');
    });
  });

  describe('Email Errors', () => {
    it('should create EmailError with default values', () => {
      const error = new EmailError();
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('EMAIL_ERROR');
      expect(error.message).toBe('Email error');
    });

    it('should create EmailError with custom values', () => {
      const details = [{ field: 'to', message: 'Invalid recipient' }];
      const error = new EmailError('Custom email error', 'CUSTOM_EMAIL_CODE', details);
      expect(error.message).toBe('Custom email error');
      expect(error.code).toBe('CUSTOM_EMAIL_CODE');
      expect(error.details).toEqual(details);
    });

    it('should create EmailRateLimitError with default values', () => {
      const error = new EmailRateLimitError();
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('EMAIL_RATE_LIMIT');
      expect(error.message).toBe('Email rate limit exceeded');
      expect(error.retryAfter).toBe(60);
    });

    it('should create EmailRateLimitError with custom values', () => {
      const error = new EmailRateLimitError('Too many emails', 120);
      expect(error.message).toBe('Too many emails');
      expect(error.retryAfter).toBe(120);
    });

    it('should create EmailProviderError with default values', () => {
      const error = new EmailProviderError();
      expect(error.statusCode).toBe(502);
      expect(error.code).toBe('EMAIL_PROVIDER_ERROR');
      expect(error.message).toBe('Email provider error');
      expect(error.providerError).toBeUndefined();
    });

    it('should create EmailProviderError with custom values', () => {
      const error = new EmailProviderError('SendGrid error', 'Connection refused');
      expect(error.message).toBe('SendGrid error');
      expect(error.providerError).toBe('Connection refused');
    });

    it('should create EmailConnectionError with default values', () => {
      const error = new EmailConnectionError();
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('EMAIL_CONNECTION_ERROR');
      expect(error.message).toBe('Failed to connect to email server');
      expect(error.host).toBeUndefined();
    });

    it('should create EmailConnectionError with custom values', () => {
      const error = new EmailConnectionError('Cannot reach SMTP', 'smtp.gmail.com');
      expect(error.message).toBe('Cannot reach SMTP');
      expect(error.host).toBe('smtp.gmail.com');
    });

    it('should create EmailAuthenticationError with default values', () => {
      const error = new EmailAuthenticationError();
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('EMAIL_AUTH_ERROR');
      expect(error.message).toBe('Email authentication failed');
    });

    it('should create EmailAuthenticationError with custom message', () => {
      const error = new EmailAuthenticationError('Invalid credentials');
      expect(error.message).toBe('Invalid credentials');
    });

    it('should create EmailTemplateError with default values', () => {
      const error = new EmailTemplateError();
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('EMAIL_TEMPLATE_ERROR');
      expect(error.message).toBe('Email template error');
      expect(error.templateName).toBeUndefined();
    });

    it('should create EmailTemplateError with custom values', () => {
      const error = new EmailTemplateError('Template rendering failed', 'welcome.html');
      expect(error.message).toBe('Template rendering failed');
      expect(error.templateName).toBe('welcome.html');
    });

    it('should create EmailValidationError with default values', () => {
      const error = new EmailValidationError();
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Invalid email address');
    });

    it('should create EmailValidationError with custom values', () => {
      const details = [{ field: 'email', message: 'Invalid format' }];
      const error = new EmailValidationError('Custom validation error', details);
      expect(error.message).toBe('Custom validation error');
      expect(error.details).toEqual(details);
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
