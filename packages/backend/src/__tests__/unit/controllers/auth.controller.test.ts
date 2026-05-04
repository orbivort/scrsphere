import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  logout,
  refreshToken,
  updateActivity,
  revokeSession,
  checkDeletionEligibility,
  deleteAccount,
  scheduleDeletion,
  cancelScheduledDeletion,
  forceDeleteAccount,
  getDeletionStatus,
} from '../../../controllers/auth.controller';
import { authService } from '../../../services/auth.service';
import { BadRequestError } from '../../../utils/errors';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup/testSetup';

vi.mock('../../../services/auth.service', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    logoutAllSessions: vi.fn(),
    refreshAccessToken: vi.fn(),
    updateActivity: vi.fn(),
    getCurrentUser: vi.fn(),
    getActiveSessions: vi.fn(),
    revokeSession: vi.fn(),
    checkDeletionEligibility: vi.fn(),
    deleteAccount: vi.fn(),
    scheduleDeletion: vi.fn(),
    cancelScheduledDeletion: vi.fn(),
    forceDeleteAccount: vi.fn(),
    getDeletionStatus: vi.fn(),
  },
}));

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  auditLogger: {
    info: vi.fn(),
  },
}));

vi.mock('../../../utils/auditLogger', () => ({
  auditAuthEvent: vi.fn(),
  auditLog: vi.fn(),
  auditResourceEvent: vi.fn(),
  AuditEventTypes: {
    AUTH: 'AUTH',
    USER: 'USER',
    TEAM: 'TEAM',
    SPRINT: 'SPRINT',
    PROJECT: 'PROJECT',
    SESSION: 'SESSION',
  },
  AuditActions: {
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    VIEW: 'VIEW',
    EXPORT: 'EXPORT',
    IMPORT: 'IMPORT',
    ASSIGN: 'ASSIGN',
    UNASSIGN: 'UNASSIGN',
  },
  AuditResults: {
    SUCCESS: 'SUCCESS',
    FAILURE: 'FAILURE',
    DENIED: 'DENIED',
  },
}));

describe('Auth Controller', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('logout', () => {
    it('should handle logout without refresh token', async () => {
      mockReq.cookies = {};

      logout(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(authService.logout).not.toHaveBeenCalled();
      expect(mockRes.clearCookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshToken', () => {
    it('should throw BadRequestError without refresh token', async () => {
      mockReq.cookies = {};

      refreshToken(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe('updateActivity', () => {
    it('should handle request without refresh token', async () => {
      mockReq.cookies = {};

      updateActivity(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(authService.updateActivity).not.toHaveBeenCalled();
      expect(mockRes._json.success).toBe(true);
    });
  });

  describe('revokeSession', () => {
    it('should throw BadRequestError without tokenId', async () => {
      mockReq.userId = 'user-id';
      mockReq.params = {};

      revokeSession(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe('checkDeletionEligibility', () => {
    it('should return deletion eligibility result', async () => {
      mockReq.userId = 'user-id';
      const mockResult = {
        canDelete: true,
        teams: [],
        blockedReason: null,
      };

      (authService.checkDeletionEligibility as any).mockResolvedValue(mockResult);

      // The asyncHandler doesn't return a promise, so we need to wait for the async operation
      checkDeletionEligibility(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for microtask queue

      expect(mockNext).not.toHaveBeenCalled();
      expect(authService.checkDeletionEligibility).toHaveBeenCalledWith('user-id');
      expect(mockRes._json).not.toBeNull();
      expect(mockRes._json.success).toBe(true);
      expect(mockRes._json.data).toEqual(mockResult);
    });

    it('should return blocked result when user is only PO', async () => {
      mockReq.userId = 'user-id';
      const mockResult = {
        canDelete: false,
        teams: [
          {
            id: 'team-id',
            name: 'Test Team',
            role: 'PRODUCT_OWNER',
            isLastPO: true,
          },
        ],
        blockedReason: 'You are the only Product Owner for 1 team(s): Test Team.',
      };

      (authService.checkDeletionEligibility as any).mockResolvedValue(mockResult);

      // The asyncHandler doesn't return a promise, so we need to wait for the async operation
      checkDeletionEligibility(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for microtask queue

      expect(mockNext).not.toHaveBeenCalled();
      expect(authService.checkDeletionEligibility).toHaveBeenCalledWith('user-id');
      expect(mockRes._json).not.toBeNull();
      expect(mockRes._json.success).toBe(true);
      expect(mockRes._json.data.canDelete).toBe(false);
      expect(mockRes._json.data.blockedReason).toContain('Test Team');
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      mockReq.userId = 'user-id';
      mockReq.body = { confirmation: 'DELETE MY ACCOUNT' };

      (authService.deleteAccount as any).mockResolvedValue(undefined);

      deleteAccount(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(authService.deleteAccount).toHaveBeenCalledWith('user-id', 'DELETE MY ACCOUNT');
      expect(mockRes.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockRes._json).not.toBeNull();
      expect(mockRes._json.success).toBe(true);
      expect(mockRes._json.data.message).toBe('Account deleted successfully');
    });

    it('should pass error to next when service throws', async () => {
      mockReq.userId = 'user-id';
      mockReq.body = { confirmation: 'WRONG CONFIRMATION' };

      const error = new Error('Invalid confirmation');
      (authService.deleteAccount as any).mockRejectedValue(error);

      deleteAccount(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('scheduleDeletion', () => {
    it('should schedule deletion and return 201', async () => {
      mockReq.userId = 'user-id';
      mockReq.body = { confirmation: 'SCHEDULE DELETION' };

      const mockResult = {
        id: 'deletion-id',
        requestedAt: new Date(),
        scheduledDeletionAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        gracePeriodDays: 14,
        status: 'PENDING',
        blockedTeamIds: [],
      };

      (authService.scheduleDeletion as any).mockResolvedValue(mockResult);

      scheduleDeletion(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(authService.scheduleDeletion).toHaveBeenCalledWith('user-id', 'SCHEDULE DELETION');
      expect(mockRes._status).toBe(201);
      expect(mockRes._json).not.toBeNull();
      expect(mockRes._json.success).toBe(true);
    });
  });

  describe('cancelScheduledDeletion', () => {
    it('should cancel scheduled deletion and return 200', async () => {
      mockReq.userId = 'user-id';

      (authService.cancelScheduledDeletion as any).mockResolvedValue(undefined);

      cancelScheduledDeletion(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(authService.cancelScheduledDeletion).toHaveBeenCalledWith('user-id');
      expect(mockRes._json).not.toBeNull();
      expect(mockRes._json.success).toBe(true);
      expect(mockRes._json.data.message).toBe('Scheduled deletion cancelled successfully');
    });
  });

  describe('forceDeleteAccount', () => {
    it('should force delete account and clear cookies', async () => {
      mockReq.userId = 'user-id';
      mockReq.body = { confirmation: 'DELETE MY ACCOUNT' };

      (authService.forceDeleteAccount as any).mockResolvedValue(undefined);

      forceDeleteAccount(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(authService.forceDeleteAccount).toHaveBeenCalledWith('user-id', 'DELETE MY ACCOUNT');
      expect(mockRes.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockRes._json).not.toBeNull();
      expect(mockRes._json.success).toBe(true);
      expect(mockRes._json.data.message).toBe('Account deleted successfully');
    });
  });

  describe('getDeletionStatus', () => {
    it('should return deletion status', async () => {
      mockReq.userId = 'user-id';

      const mockResult = {
        id: 'deletion-id',
        requestedAt: new Date(),
        scheduledDeletionAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        gracePeriodDays: 14,
        status: 'PENDING',
        blockedTeamIds: [],
        canForceDelete: false,
        daysRemaining: 14,
      };

      (authService.getDeletionStatus as any).mockResolvedValue(mockResult);

      getDeletionStatus(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(authService.getDeletionStatus).toHaveBeenCalledWith('user-id');
      expect(mockRes._json).not.toBeNull();
      expect(mockRes._json.success).toBe(true);
      expect(mockRes._json.data).toEqual(mockResult);
    });
  });
});
