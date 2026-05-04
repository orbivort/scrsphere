import { type Request, type Response } from 'express';
import crypto from 'node:crypto';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  generateCsrfTokenHandler,
  csrfProtectionMiddleware,
  ensureCsrfToken,
  CSRF_CONSTANTS,
} from '../../../middleware/csrf.middleware';
import { ForbiddenError } from '../../../utils/errors';
import config from '../../../config';

vi.mock('../../../utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('CSRF Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: Mock;

  beforeEach(() => {
    mockRequest = {
      method: 'POST',
      path: '/api/v1/test',
      ip: '127.0.0.1',
      cookies: {},
      headers: {},
    };
    mockResponse = {
      cookie: vi.fn(),
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('generateCsrfTokenHandler', () => {
    it('should generate a CSRF token and set it in a cookie', () => {
      generateCsrfTokenHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        CSRF_CONSTANTS.COOKIE_NAME,
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          secure: config.nodeEnv === 'production',
          sameSite: 'strict',
          path: '/',
        })
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          token: expect.any(String),
        },
      });
    });

    it('should generate a token with correct format (token.signature)', () => {
      generateCsrfTokenHandler(mockRequest as Request, mockResponse as Response);

      const mockCalls = (mockResponse.cookie as Mock).mock.calls;
      expect(mockCalls.length).toBeGreaterThan(0);
      const cookieCall = mockCalls[0] as [string, string, object];
      expect(cookieCall).toBeDefined();
      const token = cookieCall[1];

      expect(token).toMatch(/^[a-f0-9]{64}\.[a-f0-9]{64}$/);
    });

    it('should generate unique tokens on each call', () => {
      generateCsrfTokenHandler(mockRequest as Request, mockResponse as Response);
      const mockCalls1 = (mockResponse.cookie as Mock).mock.calls;
      expect(mockCalls1.length).toBeGreaterThan(0);
      const firstCall = mockCalls1[0] as [string, string, object];
      const firstToken = firstCall[1];

      generateCsrfTokenHandler(mockRequest as Request, mockResponse as Response);
      const mockCalls2 = (mockResponse.cookie as Mock).mock.calls;
      expect(mockCalls2.length).toBeGreaterThan(1);
      const secondCall = mockCalls2[1] as [string, string, object];
      const secondToken = secondCall[1];

      expect(firstToken).not.toBe(secondToken);
    });
  });

  describe('csrfProtectionMiddleware', () => {
    describe('Safe methods (GET, HEAD, OPTIONS)', () => {
      it('should skip CSRF validation for GET requests', () => {
        mockRequest.method = 'GET';

        csrfProtectionMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
      });

      it('should skip CSRF validation for HEAD requests', () => {
        mockRequest.method = 'HEAD';

        csrfProtectionMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
      });

      it('should skip CSRF validation for OPTIONS requests', () => {
        mockRequest.method = 'OPTIONS';

        csrfProtectionMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
      });
    });

    describe('State-changing methods (POST, PUT, DELETE, PATCH)', () => {
      it('should reject request without CSRF cookie', () => {
        mockRequest.method = 'POST';
        mockRequest.cookies = {};
        mockRequest.headers = { 'x-csrf-token': 'some-token' };

        expect(() =>
          csrfProtectionMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
        ).toThrow(ForbiddenError);

        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject request without CSRF header', () => {
        mockRequest.method = 'POST';
        const validToken = generateValidToken();
        mockRequest.cookies = { [CSRF_CONSTANTS.COOKIE_NAME]: validToken };
        mockRequest.headers = {};

        expect(() =>
          csrfProtectionMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
        ).toThrow(ForbiddenError);
      });

      it('should reject request with invalid CSRF cookie format', () => {
        mockRequest.method = 'POST';
        mockRequest.cookies = { [CSRF_CONSTANTS.COOKIE_NAME]: 'invalid-token' };
        mockRequest.headers = { 'x-csrf-token': 'invalid-token' };

        expect(() =>
          csrfProtectionMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
        ).toThrow(ForbiddenError);
      });

      it('should reject request with mismatched CSRF tokens', () => {
        mockRequest.method = 'POST';
        const token1 = generateValidToken();
        const token2 = generateValidToken();
        mockRequest.cookies = { [CSRF_CONSTANTS.COOKIE_NAME]: token1 };
        mockRequest.headers = { 'x-csrf-token': token2 };

        expect(() =>
          csrfProtectionMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
        ).toThrow(ForbiddenError);
      });

      it('should accept request with valid matching CSRF tokens', () => {
        mockRequest.method = 'POST';
        const validToken = generateValidToken();
        mockRequest.cookies = { [CSRF_CONSTANTS.COOKIE_NAME]: validToken };
        mockRequest.headers = { 'x-csrf-token': validToken };

        csrfProtectionMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
      });

      it('should accept PUT request with valid CSRF token', () => {
        mockRequest.method = 'PUT';
        const validToken = generateValidToken();
        mockRequest.cookies = { [CSRF_CONSTANTS.COOKIE_NAME]: validToken };
        mockRequest.headers = { 'x-csrf-token': validToken };

        csrfProtectionMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should accept DELETE request with valid CSRF token', () => {
        mockRequest.method = 'DELETE';
        const validToken = generateValidToken();
        mockRequest.cookies = { [CSRF_CONSTANTS.COOKIE_NAME]: validToken };
        mockRequest.headers = { 'x-csrf-token': validToken };

        csrfProtectionMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should accept PATCH request with valid CSRF token', () => {
        mockRequest.method = 'PATCH';
        const validToken = generateValidToken();
        mockRequest.cookies = { [CSRF_CONSTANTS.COOKIE_NAME]: validToken };
        mockRequest.headers = { 'x-csrf-token': validToken };

        csrfProtectionMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should reject request with tampered token signature', () => {
        mockRequest.method = 'POST';
        const validToken = generateValidToken();
        const parts = validToken.split('.');
        expect(parts.length).toBe(2);
        const tokenPart = parts[0];
        const signaturePart = parts[1];
        expect(signaturePart).toBeDefined();
        const tamperedSignature = signaturePart!.replace(/a/g, 'b');
        const tamperedToken = `${tokenPart}.${tamperedSignature}`;

        mockRequest.cookies = { [CSRF_CONSTANTS.COOKIE_NAME]: tamperedToken };
        mockRequest.headers = { 'x-csrf-token': tamperedToken };

        expect(() =>
          csrfProtectionMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
        ).toThrow(ForbiddenError);
      });

      it('should reject request with token from different secret', () => {
        mockRequest.method = 'POST';
        const token = crypto.randomBytes(32).toString('hex');
        const wrongSignature = crypto
          .createHmac('sha256', 'wrong-secret')
          .update(token)
          .digest('hex');
        const invalidToken = `${token}.${wrongSignature}`;

        mockRequest.cookies = { [CSRF_CONSTANTS.COOKIE_NAME]: invalidToken };
        mockRequest.headers = { 'x-csrf-token': invalidToken };

        expect(() =>
          csrfProtectionMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
        ).toThrow(ForbiddenError);
      });
    });
  });

  describe('ensureCsrfToken', () => {
    it('should set a new CSRF cookie if none exists', () => {
      mockRequest.cookies = {};

      ensureCsrfToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        CSRF_CONSTANTS.COOKIE_NAME,
        expect.any(String),
        expect.any(Object)
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not set a new cookie if valid one exists', () => {
      const validToken = generateValidToken();
      mockRequest.cookies = { [CSRF_CONSTANTS.COOKIE_NAME]: validToken };

      ensureCsrfToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.cookie).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should replace invalid CSRF cookie with a new one', () => {
      mockRequest.cookies = { [CSRF_CONSTANTS.COOKIE_NAME]: 'invalid-token' };

      ensureCsrfToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        CSRF_CONSTANTS.COOKIE_NAME,
        expect.any(String),
        expect.any(Object)
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('CSRF_CONSTANTS', () => {
    it('should have correct cookie name', () => {
      expect(CSRF_CONSTANTS.COOKIE_NAME).toBe('csrfToken');
    });

    it('should have correct header name', () => {
      expect(CSRF_CONSTANTS.HEADER_NAME).toBe('x-csrf-token');
    });
  });
});

function generateValidToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  const signature = crypto.createHmac('sha256', config.jwt.secret).update(token).digest('hex');
  return `${token}.${signature}`;
}
