import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../middleware/validation.middleware';
import { ValidationError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup/testSetup';
import { z } from 'zod';

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Validation Middleware', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('validateBody', () => {
    it('should pass validation when body matches schema', async () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      });
      mockReq.body = { name: 'Test User', email: 'test@example.com' };

      const middleware = validateBody(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.validatedBody).toEqual({
        name: 'Test User',
        email: 'test@example.com',
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should transform and validate body', async () => {
      const schema = z.object({
        age: z.string().transform(Number),
      });
      mockReq.body = { age: '25' };

      const middleware = validateBody(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.validatedBody).toEqual({ age: 25 });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next with ValidationError on invalid body', async () => {
      const schema = z.object({
        email: z.string().email(),
      });
      mockReq.body = { email: 'invalid-email' };
      mockReq.path = '/api/users';
      mockReq.method = 'POST';

      const middleware = validateBody(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.details).toEqual([
        {
          field: 'email',
          message: 'Invalid email address',
        },
      ]);
    });

    it('should handle multiple validation errors', async () => {
      const schema = z.object({
        name: z.string().min(2),
        email: z.string().email(),
        age: z.number().min(18),
      });
      mockReq.body = { name: 'A', email: 'invalid', age: 10 };

      const middleware = validateBody(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.details.length).toBeGreaterThan(0);
    });

    it('should log validation warnings', async () => {
      const schema = z.object({
        email: z.string().email(),
      });
      mockReq.body = { email: 'invalid' };
      mockReq.path = '/api/users';
      mockReq.method = 'POST';

      const middleware = validateBody(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(logger.warn).toHaveBeenCalledWith('Body validation failed', {
        path: '/api/users',
        method: 'POST',
        errors: [
          {
            field: 'email',
            message: 'Invalid email address',
          },
        ],
      });
    });

    it('should log debug message for valid body', async () => {
      const schema = z.object({
        name: z.string(),
      });
      mockReq.body = { name: 'Test' };
      mockReq.path = '/api/users';
      mockReq.method = 'POST';

      const middleware = validateBody(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(logger.debug).toHaveBeenCalledWith('Validating request body', {
        path: '/api/users',
        method: 'POST',
      });
    });

    it('should pass through non-Zod errors', async () => {
      const schema = {
        parseAsync: vi.fn().mockRejectedValue(new Error('Unexpected error')),
      };
      mockReq.body = {};

      const middleware = validateBody(schema as any);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle nested object validation', async () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          address: z.object({
            city: z.string(),
          }),
        }),
      });
      mockReq.body = {
        user: {
          name: 'Test',
          address: { city: 'NYC' },
        },
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.validatedBody).toEqual({
        user: {
          name: 'Test',
          address: { city: 'NYC' },
        },
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle array validation', async () => {
      const schema = z.object({
        tags: z.array(z.string()),
      });
      mockReq.body = { tags: ['tag1', 'tag2'] };

      const middleware = validateBody(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.validatedBody).toEqual({ tags: ['tag1', 'tag2'] });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle optional fields', async () => {
      const schema = z.object({
        name: z.string(),
        nickname: z.string().optional(),
      });
      mockReq.body = { name: 'Test' };

      const middleware = validateBody(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.validatedBody).toEqual({ name: 'Test', nickname: undefined });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateParams', () => {
    it('should pass validation when params match schema', async () => {
      const schema = z.object({
        id: z.string().uuid(),
      });
      mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      const middleware = validateParams(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.validatedParams).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next with ValidationError on invalid params', async () => {
      const schema = z.object({
        id: z.string().uuid(),
      });
      mockReq.params = { id: 'invalid-id' };

      const middleware = validateParams(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should pass through non-Zod errors', async () => {
      const schema = {
        parseAsync: vi.fn().mockRejectedValue(new Error('Unexpected error')),
      };
      mockReq.params = {};

      const middleware = validateParams(schema as any);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle multiple params', async () => {
      const schema = z.object({
        teamId: z.string(),
        userId: z.string(),
      });
      mockReq.params = { teamId: 'team-123', userId: 'user-456' };

      const middleware = validateParams(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.validatedParams).toEqual({
        teamId: 'team-123',
        userId: 'user-456',
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateQuery', () => {
    it('should pass validation when query matches schema', async () => {
      const schema = z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
      });
      mockReq.query = { page: '1', limit: '10' };

      const middleware = validateQuery(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.validatedQuery).toEqual({ page: '1', limit: '10' });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next with ValidationError on invalid query', async () => {
      const schema = z.object({
        page: z.string().refine((val) => !isNaN(Number(val)), {
          message: 'Page must be a number',
        }),
      });
      mockReq.query = { page: 'invalid' };

      const middleware = validateQuery(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should pass through non-Zod errors', async () => {
      const schema = {
        parseAsync: vi.fn().mockRejectedValue(new Error('Unexpected error')),
      };
      mockReq.query = {};

      const middleware = validateQuery(schema as any);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle empty query', async () => {
      const schema = z.looseObject({});
      mockReq.query = {};

      const middleware = validateQuery(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.validatedQuery).toEqual({});
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle query with transformations', async () => {
      const schema = z.object({
        page: z.string().transform(Number),
        limit: z.string().transform(Number),
      });
      mockReq.query = { page: '1', limit: '20' };

      const middleware = validateQuery(schema);
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.validatedQuery).toEqual({ page: 1, limit: 20 });
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
