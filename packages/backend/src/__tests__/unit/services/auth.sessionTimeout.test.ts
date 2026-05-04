import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import prisma from '../../../utils/prisma';
import { authService } from '../../../services/auth.service';
import config from '../../../config';
import crypto from 'node:crypto';

vi.mock('../../../utils/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn().mockResolvedValue(true as any),
    hash: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
  },
  compare: vi.fn().mockResolvedValue(true as any),
  hash: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('AuthService - Session Timeout', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'hashedpassword',
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

  const createMockRefreshToken = (overrides = {}) => ({
    id: 'token-id',
    token: 'refresh-token-value',
    tokenHash: crypto.createHash('sha256').update('refresh-token-value').digest('hex'),
    userId: 'test-user-id',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    createdBy: null as string | null,
    updatedAt: new Date(),
    updatedBy: null as string | null,
    lastActivityAt: new Date(),
    revokedAt: null as Date | null,
    userAgent: 'test-agent',
    ipAddress: '127.0.0.1',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    authService.stopCleanupJob();
  });

  describe('Session Validation', () => {
    it('should validate a valid session', async () => {
      const mockRefreshToken = createMockRefreshToken();
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockRefreshToken as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.refreshToken.update).mockResolvedValue(mockRefreshToken as any);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({
        ...mockRefreshToken,
        id: 'new-token-id',
        token: 'new-token',
      });

      const result = await authService.refreshAccessToken('refresh-token-value');

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject expired session', async () => {
      const expiredToken = createMockRefreshToken({
        expiresAt: new Date(Date.now() - 1000),
      });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(expiredToken as any);

      await expect(authService.refreshAccessToken('refresh-token-value')).rejects.toThrow(
        'expired'
      );
    });

    it('should reject non-existent token', async () => {
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(null as any);

      await expect(authService.refreshAccessToken('non-existent-token')).rejects.toThrow('expired');
    });
  });

  describe('Activity Tracking', () => {
    it('should update lastActivityAt on activity update', async () => {
      vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 });

      await authService.updateActivity('refresh-token-value');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          token: expect.any(String),
          revokedAt: null,
        },
        data: { lastActivityAt: expect.any(Date) },
      });
    });

    it('should handle update activity with no matching token', async () => {
      vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 0 });

      await expect(authService.updateActivity('non-existent-token')).resolves.not.toThrow();
    });
  });

  describe('Session Cleanup', () => {
    it('should cleanup expired sessions', async () => {
      vi.mocked(prisma.refreshToken.deleteMany).mockResolvedValue({ count: 10 });

      const result = await authService.cleanupExpiredSessions();

      expect(result.deleted).toBe(10);
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [{ expiresAt: { lt: expect.any(Date) } }, { revokedAt: { lt: expect.any(Date) } }],
        },
      });
    });
  });

  describe('Logout All Sessions', () => {
    it('should revoke all sessions for a user', async () => {
      vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 3 });

      await authService.logoutAllSessions('test-user-id');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('Get Active Sessions', () => {
    it('should return all active sessions for a user', async () => {
      const sessions = [createMockRefreshToken()];
      vi.mocked(prisma.refreshToken.findMany).mockResolvedValue(sessions as any);

      const result = await authService.getActiveSessions('test-user-id');

      expect(result).toHaveLength(1);
      expect(prisma.refreshToken.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'test-user-id',
          revokedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
        orderBy: { lastActivityAt: 'desc' },
      });
    });
  });

  describe('Revoke Session', () => {
    it('should revoke a specific session', async () => {
      vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 });

      await authService.revokeSession('token-id', 'test-user-id');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { id: 'token-id', userId: 'test-user-id' },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});

describe('Session Configuration', () => {
  it('should have correct default values', () => {
    expect(config.session.idleTimeoutMs).toBe(30 * 60 * 1000);
    expect(config.session.absoluteTimeoutMs).toBe(24 * 60 * 60 * 1000);
    expect(config.session.warningThresholdMs).toBe(2 * 60 * 1000);
    expect(config.session.cleanupIntervalMs).toBe(60 * 60 * 1000);
    expect(config.session.maxConcurrentSessions).toBe(5);
  });
});
