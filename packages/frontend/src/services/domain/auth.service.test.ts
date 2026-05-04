import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import { coreApiService } from '../core/api.core';

// Mock the core API service
vi.mock('../core/api.core', () => ({
  coreApiService: {
    axiosInstance: {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  },
  setAuthCallbacks: vi.fn(),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  },
  setStoreProvider: vi.fn(),
}));

describe('AuthService', () => {
  const mockApi = coreApiService.axiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: { id: '1', email: 'test@example.com' },
            sessionInfo: {
              expiresAt: '2024-12-31T23:59:59Z',
              idleTimeoutMs: 1800000,
              absoluteTimeoutMs: 28800000,
              warningThresholdMs: 300000,
            },
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await authService.login(credentials);

      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('test@example.com');
    });

    it('should handle login failure', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong' };
      vi.mocked(mockApi.post).mockRejectedValue(new Error('Invalid credentials'));

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: { id: '2', email: 'new@example.com', firstName: 'John', lastName: 'Doe' },
            sessionInfo: {
              expiresAt: '2024-12-31T23:59:59Z',
              idleTimeoutMs: 1800000,
              absoluteTimeoutMs: 28800000,
              warningThresholdMs: 300000,
            },
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await authService.register(userData);

      expect(mockApi.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result.success).toBe(true);
      expect(result.data?.user.firstName).toBe('John');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const mockResponse = { data: { success: true } };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await authService.logout();

      expect(mockApi.post).toHaveBeenCalledWith('/auth/logout');
      expect(result.success).toBe(true);
    });

    it('should handle logout failure gracefully', async () => {
      vi.mocked(mockApi.post).mockRejectedValue(new Error('Network error'));

      const result = await authService.logout();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('LOGOUT_FAILED');
    });
  });

  describe('logoutAllSessions', () => {
    it('should logout all sessions', async () => {
      const mockResponse = {
        data: { success: true, data: { message: 'All sessions logged out' } },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await authService.logoutAllSessions();

      expect(mockApi.post).toHaveBeenCalledWith('/auth/logout-all');
      expect(result.success).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await authService.getCurrentUser();

      expect(mockApi.get).toHaveBeenCalledWith('/auth/me');
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
    });
  });

  describe('updateActivity', () => {
    it('should update user activity', async () => {
      const mockResponse = {
        data: { success: true, data: { message: 'Activity updated' } },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await authService.updateActivity();

      expect(mockApi.post).toHaveBeenCalledWith('/auth/activity');
      expect(result.success).toBe(true);
    });
  });

  describe('getActiveSessions', () => {
    it('should get active sessions', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'session-1',
              createdAt: '2024-01-01T00:00:00Z',
              lastActivityAt: '2024-01-01T12:00:00Z',
              expiresAt: '2024-01-02T00:00:00Z',
              userAgent: 'Mozilla/5.0',
              ipAddress: '192.168.1.1',
            },
          ],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await authService.getActiveSessions();

      expect(mockApi.get).toHaveBeenCalledWith('/auth/sessions');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session', async () => {
      const mockResponse = {
        data: { success: true, data: { message: 'Session revoked' } },
      };
      vi.mocked(mockApi.delete).mockResolvedValue(mockResponse);

      const result = await authService.revokeSession('session-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/auth/sessions/session-1');
      expect(result.success).toBe(true);
    });
  });

  describe('checkDeletionEligibility', () => {
    it('should check deletion eligibility', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            canDelete: true,
            teams: [],
            blockedReason: null,
            pendingDeletion: null,
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await authService.checkDeletionEligibility();

      expect(mockApi.get).toHaveBeenCalledWith('/auth/me/deletion-check');
      expect(result.success).toBe(true);
      expect(result.data?.canDelete).toBe(true);
    });
  });

  describe('deleteAccount', () => {
    it('should delete account with confirmation', async () => {
      const mockResponse = { data: { success: true } };
      vi.mocked(mockApi.delete).mockResolvedValue(mockResponse);

      const result = await authService.deleteAccount('DELETE');

      expect(mockApi.delete).toHaveBeenCalledWith('/auth/me', {
        data: { confirmation: 'DELETE' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('scheduleDeletion', () => {
    it('should schedule account deletion', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'deletion-1',
            requestedAt: '2024-01-01T00:00:00Z',
            scheduledDeletionAt: '2024-01-31T00:00:00Z',
            gracePeriodDays: 30,
            status: 'PENDING',
            blockedTeamIds: [],
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await authService.scheduleDeletion('DELETE');

      expect(mockApi.post).toHaveBeenCalledWith('/auth/me/schedule-deletion', {
        confirmation: 'DELETE',
      });
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('PENDING');
    });
  });

  describe('cancelScheduledDeletion', () => {
    it('should cancel scheduled deletion', async () => {
      const mockResponse = {
        data: { success: true, data: { message: 'Deletion cancelled' } },
      };
      vi.mocked(mockApi.delete).mockResolvedValue(mockResponse);

      const result = await authService.cancelScheduledDeletion();

      expect(mockApi.delete).toHaveBeenCalledWith('/auth/me/schedule-deletion');
      expect(result.success).toBe(true);
    });
  });

  describe('forceDeleteAccount', () => {
    it('should force delete account', async () => {
      const mockResponse = { data: { success: true } };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await authService.forceDeleteAccount('FORCE DELETE');

      expect(mockApi.post).toHaveBeenCalledWith('/auth/me/force-delete', {
        confirmation: 'FORCE DELETE',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getDeletionStatus', () => {
    it('should get deletion status', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'deletion-1',
            requestedAt: '2024-01-01T00:00:00Z',
            scheduledDeletionAt: '2024-01-31T00:00:00Z',
            gracePeriodDays: 30,
            status: 'PENDING',
            blockedTeamIds: [],
            canForceDelete: false,
            daysRemaining: 25,
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await authService.getDeletionStatus();

      expect(mockApi.get).toHaveBeenCalledWith('/auth/me/deletion-status');
      expect(result.success).toBe(true);
      expect(result.data?.daysRemaining).toBe(25);
    });

    it('should handle null deletion status', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: null,
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await authService.getDeletionStatus();

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update profile', async () => {
      const profileData = { firstName: 'Jane', lastName: 'Smith' };
      const mockResponse = {
        data: {
          success: true,
          data: { id: '1', email: 'test@example.com', firstName: 'Jane', lastName: 'Smith' },
        },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      const result = await authService.updateProfile(profileData);

      expect(mockApi.put).toHaveBeenCalledWith('/auth/me/profile', profileData);
      expect(result.success).toBe(true);
      expect(result.data?.firstName).toBe('Jane');
    });
  });

  describe('changePassword', () => {
    it('should change password', async () => {
      const passwordData = { currentPassword: 'oldpass', newPassword: 'newpass' };
      const mockResponse = {
        data: { success: true, data: { message: 'Password changed' } },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      const result = await authService.changePassword(passwordData);

      expect(mockApi.put).toHaveBeenCalledWith('/auth/me/password', passwordData);
      expect(result.success).toBe(true);
    });
  });
});
