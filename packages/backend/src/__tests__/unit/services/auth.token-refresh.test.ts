import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock modules with factory functions (hoisted, so no external variables allowed)
vi.mock('../../../utils/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
    teamMember: {
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    notification: {
      deleteMany: vi.fn(),
    },
    dailyUpdate: {
      deleteMany: vi.fn(),
    },
    task: {
      updateMany: vi.fn(),
    },
    impediment: {
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    retrospectiveItem: {
      updateMany: vi.fn(),
    },
    retroActionItem: {
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    sprintBacklogChange: {
      updateMany: vi.fn(),
    },
    doDChecklistVerification: {
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    doRChecklistVerification: {
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    retroItemVote: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn((password: string, rounds: number) => Promise.resolve(`$2b$${rounds}$${password}`)),
    compare: vi.fn((password: string, hash: string) => {
      if (hash.startsWith('$2b$') || hash.startsWith('$2a$')) {
        return Promise.resolve(hash.includes(password));
      }
      return Promise.resolve(false);
    }),
    genSalt: vi.fn((rounds: number) => Promise.resolve(`salt_${rounds}`)),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn((payload: object, secret: string) => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
        'base64url'
      );
      const body = Buffer.from(
        JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 900000 })
      ).toString('base64url');
      const signature = Buffer.from(`${header}.${body}.${secret}`).toString('base64url');
      return `${header}.${body}.${signature}`;
    }),
    verify: vi.fn((token: string, _secret: string) => {
      const parts = token.split('.');
      if (parts.length !== 3 || !parts[1]) {
        throw new Error('invalid token');
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      if (payload.exp && payload.exp < Date.now()) {
        throw new Error('jwt expired');
      }
      return payload;
    }),
    decode: vi.fn((token: string) => {
      try {
        const parts = token.split('.');
        if (parts.length !== 3 || !parts[1]) return null;
        return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      } catch {
        return null;
      }
    }),
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

// Import the service and other dependencies
import { authService } from '../../../services/auth.service';
import prisma from '../../../utils/prisma';
import { fixtures } from '../../fixtures';
import { SessionAbsoluteTimeoutError } from '../../../utils/errors';
import crypto from 'node:crypto';

describe('AuthService - Token Refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.stopCleanupJob();
  });

  afterEach(() => {
    authService.stopCleanupJob();
    vi.useRealTimers();
  });

  describe('refreshAccessToken with session timeouts', () => {
    it('should refresh successfully even when idle timeout exceeded (refresh counts as activity)', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));

      // Create a token with lastActivityAt 1 hour ago (would exceed 30 min idle timeout)
      // But the refresh operation itself updates the activity time, so it should succeed
      const mockToken = {
        ...fixtures.tokens.validRefreshToken({
          tokenHash: crypto.createHash('sha256').update('idle-token').digest('hex'),
        }),
        lastActivityAt: new Date('2024-01-01T11:00:00Z'),
      };
      const mockUser = fixtures.users.validUser({ id: mockToken.userId });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.refreshToken.update).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({
        ...mockToken,
        id: 'new-token-id',
      });

      // Refresh operation should succeed because it updates activity time
      const result = await authService.refreshAccessToken('idle-token');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      vi.useRealTimers();
    });

    it('should throw SessionAbsoluteTimeoutError when absolute timeout exceeded', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-02T12:00:00Z'));

      const mockToken = {
        ...fixtures.tokens.validRefreshToken({
          tokenHash: crypto.createHash('sha256').update('absolute-timeout-token').digest('hex'),
        }),
        createdAt: new Date('2024-01-01T10:00:00Z'),
        lastActivityAt: new Date('2024-01-02T11:00:00Z'),
      };
      const mockUser = fixtures.users.validUser({ id: mockToken.userId });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 });

      await expect(authService.refreshAccessToken('absolute-timeout-token')).rejects.toThrow(
        SessionAbsoluteTimeoutError
      );

      vi.useRealTimers();
    });

    it('should successfully refresh when within timeout limits', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));

      const mockToken = fixtures.tokens.validRefreshToken({
        tokenHash: crypto.createHash('sha256').update('valid-token').digest('hex'),
        lastActivityAt: new Date('2024-01-01T11:30:00Z'),
        createdAt: new Date('2024-01-01T10:00:00Z'),
      });
      const mockUser = fixtures.users.validUser({ id: mockToken.userId });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.refreshToken.update).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({
        ...mockToken,
        id: 'new-token-id',
      });

      const result = await authService.refreshAccessToken('valid-token');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      vi.useRealTimers();
    });
  });

  describe('Session cleanup', () => {
    it('should cleanup expired sessions', async () => {
      vi.mocked(prisma.refreshToken.deleteMany).mockResolvedValue({ count: 5 });

      const result = await authService.cleanupExpiredSessions();

      expect(result.deleted).toBe(5);
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [{ expiresAt: { lt: expect.any(Date) } }, { revokedAt: { lt: expect.any(Date) } }],
        },
      });
    });
  });

  describe('Token validation edge cases', () => {
    it('should handle token with no lastActivityAt gracefully', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));

      const mockToken = {
        ...fixtures.tokens.validRefreshToken({
          tokenHash: crypto.createHash('sha256').update('token-without-activity').digest('hex'),
        }),
        lastActivityAt: null as unknown as Date,
        createdAt: new Date('2024-01-01T10:00:00Z'),
      };
      const mockUser = fixtures.users.validUser({ id: mockToken.userId });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.refreshToken.update).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({
        ...mockToken,
        id: 'new-token-id',
      } as any);

      const result = await authService.refreshAccessToken('token-without-activity');

      expect(result.accessToken).toBeDefined();

      vi.useRealTimers();
    });

    it('should handle database errors during activity update gracefully', async () => {
      const mockToken = fixtures.tokens.validRefreshToken({
        tokenHash: crypto.createHash('sha256').update('valid-token').digest('hex'),
      });
      const mockUser = fixtures.users.validUser({ id: mockToken.userId });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      // Mock the activity update to fail (this error should be caught and logged, not thrown)
      vi.mocked(prisma.refreshToken.update).mockRejectedValueOnce(new Error('DB Error'));
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({
        ...mockToken,
        id: 'new-token-id',
      });

      // Should succeed even when activity update fails (error is caught and logged)
      const result = await authService.refreshAccessToken('valid-token');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });
});
