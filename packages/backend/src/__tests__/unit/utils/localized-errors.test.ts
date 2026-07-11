import { describe, it, expect, beforeEach, vi } from 'vitest';
import { notFound, localizedError, AppError, NotFoundError } from '../../../utils/errors.js';
import { setRequestContext, updateRequestContext } from '../../../utils/requestContext.js';

describe('localized error helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('notFound()', () => {
    it('should return NotFoundError with localized message', () => {
      const result = setRequestContext({ requestId: 'test-req' }, () => {
        return notFound('errors:validation.firstName');
      });

      expect(result).toBeInstanceOf(NotFoundError);
      expect(result.statusCode).toBe(404);
      expect(result.code).toBe('NOT_FOUND');
    });

    it('should include entity name in the message', () => {
      const result = setRequestContext({ requestId: 'test-req' }, () => {
        return notFound('errors:validation.firstName');
      });

      expect(result.message).toContain('not found');
    });

    it('should pass params through to translation', () => {
      const result = setRequestContext({ requestId: 'test-req' }, () => {
        return notFound('errors:entityNotFound', { entity: 'Sprint' });
      });

      expect(result).toBeInstanceOf(NotFoundError);
      expect(result.message).toContain('Sprint');
      expect(result.message).toContain('not found');
    });
  });

  describe('localizedError()', () => {
    it('should return AppError with default statusCode 400', () => {
      const result = setRequestContext({ requestId: 'test-req' }, () => {
        return localizedError('errors:forbidden');
      });

      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(400);
      expect(result.code).toBe('BAD_REQUEST');
    });

    it('should return AppError with custom statusCode', () => {
      const result = setRequestContext({ requestId: 'test-req' }, () => {
        return localizedError('errors:forbidden', {}, 403, 'FORBIDDEN');
      });

      expect(result.statusCode).toBe(403);
      expect(result.code).toBe('FORBIDDEN');
    });

    it('should use localized message from i18next', () => {
      const result = setRequestContext({ requestId: 'test-req' }, () => {
        return localizedError('errors:invalidCredentials');
      });

      expect(result.message).toBeTruthy();
      expect(typeof result.message).toBe('string');
    });

    it('should interpolate params into the message', () => {
      const result = setRequestContext({ requestId: 'test-req' }, () => {
        return localizedError('errors:emailAlreadyExists', { email: 'test@example.com' });
      });

      expect(result.message).toContain('test@example.com');
    });

    it('should use the locale from request context', () => {
      const result = setRequestContext({ requestId: 'test-req' }, () => {
        updateRequestContext({ locale: 'de' });
        return localizedError('errors:invalidCredentials');
      });

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBeTruthy();
    });

    it('should default to statusCode 400 and code BAD_REQUEST', () => {
      const result = setRequestContext({ requestId: 'test-req' }, () => {
        return localizedError('errors:forbidden');
      });

      expect(result.statusCode).toBe(400);
      expect(result.code).toBe('BAD_REQUEST');
    });
  });
});
