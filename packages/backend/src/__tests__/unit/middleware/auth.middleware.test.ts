import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authenticate, optionalAuth, requireRoles } from '../../../middleware/auth.middleware';
import { authService } from '../../../services/auth.service';
import { UnauthorizedError } from '../../../utils/errors';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup/testSetup';

vi.mock('../../../services/auth.service', () => ({
  authService: {
    verifyAccessToken: vi.fn(),
    getCurrentUser: vi.fn(),
    updateActivity: vi.fn(),
  },
}));

vi.mock('../../../utils/prisma', () => ({
  default: {
    teamMember: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import prisma from '../../../utils/prisma';

describe('Auth Middleware', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date(),
    updatedAt: new Date(),
    avatarUrl: null,
    termsAcceptedAt: null,
    marketingOptIn: false,
    marketingOptInAt: null,
    createdBy: null,
    updatedBy: null,
  };

  const mockTokenPayload = {
    sub: 'test-user-id',
    email: 'test@example.com',
    iat: Date.now(),
    exp: Date.now() + 3600000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('authenticate', () => {
    it('should authenticate with valid cookie token', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      vi.mocked(authService.verifyAccessToken).mockReturnValue(mockTokenPayload);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(authService.updateActivity).mockResolvedValue(undefined);

      await authenticate(mockReq as any, mockRes as any, mockNext);

      expect(authService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockReq.user).toEqual(mockUser);
      expect(mockReq.userId).toBe(mockUser.id);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should authenticate with bearer token', async () => {
      mockReq.headers.authorization = 'Bearer bearer-token';
      vi.mocked(authService.verifyAccessToken).mockReturnValue(mockTokenPayload);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      await authenticate(mockReq as any, mockRes as any, mockNext);

      expect(authService.verifyAccessToken).toHaveBeenCalledWith('bearer-token');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should prioritize cookie token over bearer token', async () => {
      mockReq.cookies = { accessToken: 'cookie-token' };
      mockReq.headers.authorization = 'Bearer bearer-token';
      vi.mocked(authService.verifyAccessToken).mockReturnValue(mockTokenPayload);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      await authenticate(mockReq as any, mockRes as any, mockNext);

      expect(authService.verifyAccessToken).toHaveBeenCalledWith('cookie-token');
    });

    it('should throw UnauthorizedError without token', async () => {
      mockReq.cookies = {};
      mockReq.headers = {};

      await authenticate(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should call next with error for invalid token', async () => {
      mockReq.cookies = { accessToken: 'invalid-token' };
      vi.mocked(authService.verifyAccessToken).mockImplementation(() => {
        throw new UnauthorizedError('Invalid token');
      });

      await authenticate(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should update activity when refresh token present', async () => {
      mockReq.cookies = { accessToken: 'valid-token', refreshToken: 'refresh-token' };
      vi.mocked(authService.verifyAccessToken).mockReturnValue(mockTokenPayload);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(authService.updateActivity).mockResolvedValue(undefined);

      await authenticate(mockReq as any, mockRes as any, mockNext);

      expect(authService.updateActivity).toHaveBeenCalledWith('refresh-token');
    });

    it('should not fail if activity update fails', async () => {
      mockReq.cookies = { accessToken: 'valid-token', refreshToken: 'refresh-token' };
      vi.mocked(authService.verifyAccessToken).mockReturnValue(mockTokenPayload);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(authService.updateActivity).mockRejectedValue(new Error('Update failed'));

      await authenticate(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should attach prisma to request', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      vi.mocked(authService.verifyAccessToken).mockReturnValue(mockTokenPayload);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      await authenticate(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.prisma).toBeDefined();
    });
  });

  describe('optionalAuth', () => {
    it('should attach user with valid token', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      vi.mocked(authService.verifyAccessToken).mockReturnValue(mockTokenPayload);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      await optionalAuth(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.user).toEqual(mockUser);
      expect(mockReq.userId).toBe(mockUser.id);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without user when no token', async () => {
      mockReq.cookies = {};
      mockReq.headers = {};

      await optionalAuth(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockReq.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without user when invalid token', async () => {
      mockReq.cookies = { accessToken: 'invalid-token' };
      vi.mocked(authService.verifyAccessToken).mockImplementation(() => {
        throw new UnauthorizedError('Invalid token');
      });

      await optionalAuth(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should use bearer token if no cookie token', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      vi.mocked(authService.verifyAccessToken).mockReturnValue(mockTokenPayload);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      await optionalAuth(mockReq as any, mockRes as any, mockNext);

      expect(authService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockReq.user).toEqual(mockUser);
    });
  });

  describe('requireRoles', () => {
    it('should throw UnauthorizedError if user not authenticated', async () => {
      mockReq.user = undefined;

      const middleware = requireRoles('ADMIN');
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should throw UnauthorizedError if not a team member', async () => {
      mockReq.user = mockUser;
      mockReq.params = { teamId: 'team-id' };
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null);

      const middleware = requireRoles('ADMIN');
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should pass if no teamId in params', async () => {
      mockReq.user = mockUser;
      mockReq.params = {};

      const middleware = requireRoles('ADMIN');
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw UnauthorizedError for insufficient role', async () => {
      mockReq.user = mockUser;
      mockReq.params = { teamId: 'team-id' };
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
        teamId: 'team-id',
        userId: mockUser.id,
        role: 'MEMBER',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      } as any);

      const middleware = requireRoles('ADMIN');
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });
});
