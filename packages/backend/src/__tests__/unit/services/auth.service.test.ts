import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../../../services/auth.service';
import { UnauthorizedError, ConflictError, NotFoundError } from '../../../utils/errors';
import prisma from '../../../utils/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Mock prisma
vi.mock('../../../utils/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    teamMember: {
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    consentRecord: {
      createMany: vi.fn(),
    },
    scheduledDeletion: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    notification: {
      deleteMany: vi.fn(),
      create: vi.fn(),
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
      deleteMany: vi.fn(),
    },
    sprintBacklogChange: {
      updateMany: vi.fn(),
    },
    doDChecklistVerification: {
      deleteMany: vi.fn(),
    },
    doRChecklistVerification: {
      deleteMany: vi.fn(),
    },
    retroItemVote: {
      deleteMany: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    emailLog: {
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
  hash: vi.fn(),
  compare: vi.fn(),
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock-access-token'),
    verify: vi.fn(),
  },
  sign: vi.fn().mockReturnValue('mock-access-token'),
  verify: vi.fn(),
}));

// Mock config
vi.mock('../../../config', () => ({
  default: {
    jwt: {
      secret: 'test-secret',
      expiresIn: '15m',
      refreshExpiresIn: '7d',
    },
    bcrypt: {
      saltRounds: 10,
    },
    session: {
      idleTimeoutMs: 1800000,
      absoluteTimeoutMs: 86400000,
      warningThresholdMs: 300000,
      maxConcurrentSessions: 5,
      cleanupIntervalMs: 3600000,
    },
    deletion: {
      gracePeriodDays: 14,
      scheduleConfirmationPhrase: 'SCHEDULE DELETE',
    },
    email: {
      provider: 'test',
      testMode: {
        enabled: true,
        outputDirectory: 'test-emails',
        logToConsole: false,
        saveToFile: false,
      },
      frontendUrl: 'http://localhost:5173',
      defaults: {
        fromName: 'Test',
        fromAddress: 'test@example.com',
      },
    },
  },
  config: {
    jwt: {
      secret: 'test-secret',
      expiresIn: '15m',
      refreshExpiresIn: '7d',
    },
    bcrypt: {
      saltRounds: 10,
    },
    session: {
      idleTimeoutMs: 1800000,
      absoluteTimeoutMs: 86400000,
      warningThresholdMs: 300000,
      maxConcurrentSessions: 5,
      cleanupIntervalMs: 3600000,
    },
    deletion: {
      gracePeriodDays: 14,
      scheduleConfirmationPhrase: 'SCHEDULE DELETE',
    },
    email: {
      provider: 'test',
      testMode: {
        enabled: true,
        outputDirectory: 'test-emails',
        logToConsole: false,
        saveToFile: false,
      },
      frontendUrl: 'http://localhost:5173',
      defaults: {
        fromName: 'Test',
        fromAddress: 'test@example.com',
      },
    },
  },
}));

// Mock email service
vi.mock('../../../services/email/index.js', () => ({
  emailService: {
    send: vi.fn().mockResolvedValue({ success: true, messageId: 'test-message-id' }),
    isHealthy: vi.fn().mockResolvedValue(true),
  },
}));

// Mock email templates
vi.mock('../../../services/email/templates/index.js', () => ({
  PasswordResetTemplate: class MockPasswordResetTemplate {
    render() {
      return { html: '<html>Mock reset email</html>', text: 'Mock reset email' };
    }
  },
  PasswordChangeTemplate: class MockPasswordChangeTemplate {
    render() {
      return { html: '<html>Mock change email</html>', text: 'Mock change email' };
    }
  },
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock uuid
vi.mock('../../../utils/uuid', () => ({
  generateUUIDv7: vi.fn().mockReturnValue('mock-uuid-123'),
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
        termsAcceptedAt: new Date(),
        marketingOptIn: false,
        marketingOptInAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue('hashed-password');
      (prisma.user.create as any).mockResolvedValue(mockUser);
      (prisma.consentRecord.createMany as any).mockResolvedValue({});
      (prisma.refreshToken.create as any).mockResolvedValue({});

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        termsAccepted: true,
        marketingOptIn: false,
      });

      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictError when email already exists', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'existing-user' });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          termsAccepted: true,
          marketingOptIn: false,
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      (prisma.refreshToken.findMany as any).mockResolvedValue([]);
      (prisma.refreshToken.create as any).mockResolvedValue({});

      const result = await authService.login('test@example.com', 'password123');

      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('mock-access-token');
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(authService.login('nonexistent@example.com', 'password123')).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('should throw UnauthorizedError when password is invalid', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      (prisma.refreshToken.updateMany as any).mockResolvedValue({ count: 1 });

      await authService.logout('refresh-token');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    });

    it('should handle logout with empty token gracefully', async () => {
      await authService.logout('');

      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('logoutAllSessions', () => {
    it('should revoke all sessions for user', async () => {
      (prisma.refreshToken.updateMany as any).mockResolvedValue({ count: 3 });

      await authService.logoutAllSessions('user-1');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        marketingOptIn: false,
        marketingOptInAt: null,
        termsAcceptedAt: new Date(),
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser('user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(authService.getCurrentUser('nonexistent-user')).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe('changePassword', () => {
    it('should change password with valid current password', async () => {
      const mockUser = {
        id: 'user-1',
        password: 'current-hashed-password',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      (bcrypt.hash as any).mockResolvedValue('new-hashed-password');
      (prisma.user.update as any).mockResolvedValue({});

      await authService.changePassword('user-1', 'currentpassword', 'newpassword123');

      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(
        authService.changePassword('nonexistent-user', 'currentpassword', 'newpassword123')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when current password is incorrect', async () => {
      const mockUser = {
        id: 'user-1',
        password: 'current-hashed-password',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        authService.changePassword('user-1', 'wrongpassword', 'newpassword123')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when new password is same as current', async () => {
      const mockUser = {
        id: 'user-1',
        password: 'current-hashed-password',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      await expect(
        authService.changePassword('user-1', 'samepassword', 'samepassword')
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        avatarUrl: null,
        password: 'hashed-password',
      };

      (prisma.user.update as any).mockResolvedValue(mockUser);

      const result = await authService.updateProfile('user-1', {
        firstName: 'Updated',
        lastName: 'Name',
      });

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
    });
  });

  describe('getActiveSessions', () => {
    it('should return active sessions for user', async () => {
      const mockSessions = [
        { id: 'session-1', userId: 'user-1', revokedAt: null },
        { id: 'session-2', userId: 'user-1', revokedAt: null },
      ];

      (prisma.refreshToken.findMany as any).mockResolvedValue(mockSessions);

      const result = await authService.getActiveSessions('user-1');

      expect(result).toHaveLength(2);
    });
  });

  describe('revokeSession', () => {
    it('should revoke a specific session', async () => {
      (prisma.refreshToken.updateMany as any).mockResolvedValue({ count: 1 });

      await authService.revokeSession('session-1', 'user-1');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { id: 'session-1', userId: 'user-1' },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete expired refresh tokens', async () => {
      (prisma.refreshToken.deleteMany as any).mockResolvedValue({ count: 5 });

      const result = await authService.cleanupExpiredSessions();

      expect(result.deleted).toBe(5);
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalled();
    });
  });

  describe('verifyAccessToken', () => {
    it('should validate and return decoded token', () => {
      const mockDecoded = {
        sub: 'user-1',
        email: 'test@example.com',
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };

      (jwt.verify as any).mockReturnValue(mockDecoded);

      const result = authService.verifyAccessToken('valid-token');

      expect(result).toEqual(mockDecoded);
    });

    it('should throw UnauthorizedError when token is invalid', () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => authService.verifyAccessToken('invalid-token')).toThrow(UnauthorizedError);
    });
  });

  describe('checkDeletionEligibility', () => {
    it('should return eligibility info for user', async () => {
      (prisma.teamMember.findMany as any).mockResolvedValue([]);
      (prisma.scheduledDeletion.findFirst as any).mockResolvedValue(null);

      const result = await authService.checkDeletionEligibility('user-1');

      expect(result.canDelete).toBe(true);
      expect(result.teams).toEqual([]);
    });

    it('should identify blocked teams when user is last PO', async () => {
      (prisma.teamMember.findMany as any).mockResolvedValue([
        { teamId: 'team-1', role: 'PRODUCT_OWNER', team: { id: 'team-1', name: 'Team 1' } },
      ]);
      (prisma.teamMember.count as any).mockResolvedValue(1);
      (prisma.scheduledDeletion.findFirst as any).mockResolvedValue(null);

      const result = await authService.checkDeletionEligibility('user-1');

      expect(result.canDelete).toBe(false);
      expect(result.blockedTeams).toHaveLength(1);
    });
  });

  describe('deleteAccount', () => {
    it('should delete account with correct confirmation', async () => {
      (prisma.teamMember.findMany as any).mockResolvedValue([]);
      (prisma.scheduledDeletion.findFirst as any).mockResolvedValue(null);
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          refreshToken: { deleteMany: vi.fn().mockResolvedValue({}) },
          notification: { deleteMany: vi.fn().mockResolvedValue({}) },
          teamMember: { deleteMany: vi.fn().mockResolvedValue({}) },
          dailyUpdate: { deleteMany: vi.fn().mockResolvedValue({}) },
          task: { updateMany: vi.fn().mockResolvedValue({}) },
          impediment: {
            deleteMany: vi.fn().mockResolvedValue({}),
            updateMany: vi.fn().mockResolvedValue({}),
          },
          retrospectiveItem: { updateMany: vi.fn().mockResolvedValue({}) },
          retroActionItem: { deleteMany: vi.fn().mockResolvedValue({}) },
          sprintBacklogChange: { updateMany: vi.fn().mockResolvedValue({}) },
          doDChecklistVerification: { deleteMany: vi.fn().mockResolvedValue({}) },
          doRChecklistVerification: { deleteMany: vi.fn().mockResolvedValue({}) },
          retroItemVote: { deleteMany: vi.fn().mockResolvedValue({}) },
          scheduledDeletion: { deleteMany: vi.fn().mockResolvedValue({}) },
          user: { delete: vi.fn().mockResolvedValue({}) },
        });
      });

      await authService.deleteAccount('user-1', 'DELETE MY ACCOUNT');

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('scheduleDeletion', () => {
    it('should schedule account deletion', async () => {
      (prisma.scheduledDeletion.findFirst as any).mockResolvedValue(null);
      (prisma.teamMember.findMany as any).mockResolvedValue([]);
      (prisma.scheduledDeletion.create as any).mockResolvedValue({
        id: 'deletion-1',
        userId: 'user-1',
        status: 'PENDING',
      });

      const result = await authService.scheduleDeletion('user-1', 'SCHEDULE DELETE');

      expect(result.status).toBe('PENDING');
    });

    it('should throw ConflictError when deletion already pending', async () => {
      (prisma.scheduledDeletion.findFirst as any).mockResolvedValue({
        id: 'existing-deletion',
        status: 'PENDING',
      });

      await expect(authService.scheduleDeletion('user-1', 'SCHEDULE DELETE')).rejects.toThrow(
        ConflictError
      );
    });
  });

  describe('cancelScheduledDeletion', () => {
    it('should cancel scheduled deletion', async () => {
      (prisma.scheduledDeletion.findFirst as any).mockResolvedValue({
        id: 'deletion-1',
        status: 'PENDING',
        blockedTeamIds: [],
      });
      (prisma.scheduledDeletion.update as any).mockResolvedValue({});

      await authService.cancelScheduledDeletion('user-1');

      expect(prisma.scheduledDeletion.update).toHaveBeenCalled();
    });

    it('should throw NotFoundError when no pending deletion', async () => {
      (prisma.scheduledDeletion.findFirst as any).mockResolvedValue(null);

      await expect(authService.cancelScheduledDeletion('user-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getDeletionStatus', () => {
    it('should return deletion status for user', async () => {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 14);

      (prisma.scheduledDeletion.findFirst as any).mockResolvedValue({
        id: 'deletion-1',
        requestedAt: new Date(),
        scheduledDeletionAt: scheduledDate,
        gracePeriodDays: 14,
        status: 'PENDING',
        blockedTeamIds: [],
      });

      const result = await authService.getDeletionStatus('user-1');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('PENDING');
      expect(result?.daysRemaining).toBeGreaterThan(0);
    });

    it('should return null when no pending deletion', async () => {
      (prisma.scheduledDeletion.findFirst as any).mockResolvedValue(null);

      const result = await authService.getDeletionStatus('user-1');

      expect(result).toBeNull();
    });
  });
});
