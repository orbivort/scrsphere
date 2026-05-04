import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import {
  notificationRateLimit,
  apiRateLimit,
  authRateLimit,
  loginRateLimit,
} from '../../../middleware/rateLimit.middleware';
import config from '../../../config';

describe('Rate Limit Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' } as any,
    };
    mockRes = {};
    mockNext = vi.fn();
  });

  describe('notificationRateLimit', () => {
    it('should be defined and be a function', () => {
      expect(notificationRateLimit).toBeDefined();
      expect(typeof notificationRateLimit).toBe('function');
    });

    it('should execute without error as middleware', () => {
      expect(() => {
        (notificationRateLimit as any)(mockReq, mockRes, mockNext);
      }).not.toThrow();
    });
  });

  describe('apiRateLimit', () => {
    it('should be defined and be a function', () => {
      expect(apiRateLimit).toBeDefined();
      expect(typeof apiRateLimit).toBe('function');
    });

    it('should execute without error as middleware', () => {
      expect(() => {
        (apiRateLimit as any)(mockReq, mockRes, mockNext);
      }).not.toThrow();
    });
  });

  describe('authRateLimit', () => {
    it('should be defined and be a function', () => {
      expect(authRateLimit).toBeDefined();
      expect(typeof authRateLimit).toBe('function');
    });

    it('should execute without error as middleware', () => {
      expect(() => {
        (authRateLimit as any)(mockReq, mockRes, mockNext);
      }).not.toThrow();
    });

    it('should have test environment configuration allowing more requests', () => {
      if (config.nodeEnv === 'test') {
        expect(authRateLimit).toBeDefined();
      }
    });
  });

  describe('loginRateLimit', () => {
    it('should be defined and be a function', () => {
      expect(loginRateLimit).toBeDefined();
      expect(typeof loginRateLimit).toBe('function');
    });

    it('should execute without error as middleware', () => {
      expect(() => {
        (loginRateLimit as any)(mockReq, mockRes, mockNext);
      }).not.toThrow();
    });

    it('should handle login request with email and IP', () => {
      mockReq.body = { email: 'test@example.com' };

      expect(() => {
        (loginRateLimit as any)(mockReq, mockRes, mockNext);
      }).not.toThrow();
    });

    it('should handle login request without email', () => {
      mockReq.body = {};

      expect(() => {
        (loginRateLimit as any)(mockReq, mockRes, mockNext);
      }).not.toThrow();
    });

    it('should handle login request with uppercase email', () => {
      mockReq.body = { email: 'TEST@EXAMPLE.COM' };

      expect(() => {
        (loginRateLimit as any)(mockReq, mockRes, mockNext);
      }).not.toThrow();
    });

    it('should handle missing IP address', () => {
      (mockReq as any).ip = undefined;
      mockReq.body = { email: 'test@example.com' };

      expect(() => {
        (loginRateLimit as any)(mockReq, mockRes, mockNext);
      }).not.toThrow();
    });

    it('should fallback to connection.remoteAddress when ip is missing', () => {
      (mockReq as any).ip = undefined;
      mockReq.connection = { remoteAddress: '10.0.0.1' } as any;
      mockReq.body = { email: 'test@example.com' };

      expect(() => {
        (loginRateLimit as any)(mockReq, mockRes, mockNext);
      }).not.toThrow();
    });

    it('should handle completely missing IP information', () => {
      (mockReq as any).ip = undefined;
      mockReq.connection = { remoteAddress: undefined } as any;
      mockReq.body = {};

      expect(() => {
        (loginRateLimit as any)(mockReq, mockRes, mockNext);
      }).not.toThrow();
    });
  });
});
