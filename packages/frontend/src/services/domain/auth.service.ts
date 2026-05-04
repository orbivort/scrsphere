// Authentication Service
import type {
  LoginCredentials,
  RegisterData,
  User,
  ApiResponse,
  DeletionEligibilityResult,
} from '../../types';
import { coreApiService, setAuthCallbacks } from '../core/api.core';
import { logger } from '../../utils/logger';

class AuthService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  async login(credentials: LoginCredentials): Promise<
    ApiResponse<{
      user: User;
      sessionInfo: {
        expiresAt: string;
        idleTimeoutMs: number;
        absoluteTimeoutMs: number;
        warningThresholdMs: number;
      };
    }>
  > {
    const { data } = await this.api.post('/auth/login', credentials);
    return data;
  }

  async register(userData: RegisterData): Promise<
    ApiResponse<{
      user: User;
      sessionInfo: {
        expiresAt: string;
        idleTimeoutMs: number;
        absoluteTimeoutMs: number;
        warningThresholdMs: number;
      };
    }>
  > {
    const { data } = await this.api.post('/auth/register', userData);
    return data;
  }

  async logout(): Promise<ApiResponse<never>> {
    try {
      const { data } = await this.api.post('/auth/logout');
      return data;
    } catch (error) {
      logger.error('Logout failed', undefined, { error });
      return {
        success: false,
        error: { code: 'LOGOUT_FAILED', message: 'Logout failed' },
      };
    }
  }

  async logoutAllSessions(): Promise<ApiResponse<{ message: string }>> {
    const { data } = await this.api.post('/auth/logout-all');
    return data;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const { data } = await this.api.get('/auth/me');
    return data;
  }

  async updateActivity(): Promise<ApiResponse<{ message: string }>> {
    const { data } = await this.api.post('/auth/activity');
    return data;
  }

  async getActiveSessions(): Promise<
    ApiResponse<
      Array<{
        id: string;
        createdAt: string;
        lastActivityAt: string;
        expiresAt: string;
        userAgent: string | null;
        ipAddress: string | null;
      }>
    >
  > {
    const { data } = await this.api.get('/auth/sessions');
    return data;
  }

  async revokeSession(tokenId: string): Promise<ApiResponse<{ message: string }>> {
    const { data } = await this.api.delete(`/auth/sessions/${tokenId}`);
    return data;
  }

  async checkDeletionEligibility(): Promise<ApiResponse<DeletionEligibilityResult>> {
    const { data } = await this.api.get('/auth/me/deletion-check');
    return data;
  }

  async deleteAccount(confirmation: string): Promise<ApiResponse<void>> {
    const { data } = await this.api.delete('/auth/me', {
      data: { confirmation },
    });
    return data;
  }

  async scheduleDeletion(confirmation: string): Promise<
    ApiResponse<{
      id: string;
      requestedAt: string;
      scheduledDeletionAt: string;
      gracePeriodDays: number;
      status: string;
      blockedTeamIds: string[];
    }>
  > {
    const { data } = await this.api.post('/auth/me/schedule-deletion', { confirmation });
    return data;
  }

  async cancelScheduledDeletion(): Promise<ApiResponse<{ message: string }>> {
    const { data } = await this.api.delete('/auth/me/schedule-deletion');
    return data;
  }

  async forceDeleteAccount(confirmation: string): Promise<ApiResponse<void>> {
    const { data } = await this.api.post('/auth/me/force-delete', { confirmation });
    return data;
  }

  async getDeletionStatus(): Promise<
    ApiResponse<{
      id: string;
      requestedAt: string;
      scheduledDeletionAt: string;
      gracePeriodDays: number;
      status: string;
      blockedTeamIds: string[];
      canForceDelete: boolean;
      daysRemaining: number;
    } | null>
  > {
    const { data } = await this.api.get('/auth/me/deletion-status');
    return data;
  }

  async updateProfile(profileData: {
    firstName: string;
    lastName: string;
  }): Promise<ApiResponse<User>> {
    const { data } = await this.api.put('/auth/me/profile', profileData);
    return data;
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    const { data } = await this.api.put('/auth/me/password', passwordData);
    return data;
  }

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    const { data } = await this.api.post('/auth/forgot-password', { email });
    return data;
  }

  async validateResetToken(
    token: string
  ): Promise<ApiResponse<{ valid: boolean; email?: string }>> {
    const { data } = await this.api.get(`/auth/reset-password/${token}`);
    return data;
  }

  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    const { data } = await this.api.post('/auth/reset-password', {
      token,
      newPassword,
      confirmPassword,
    });
    return data;
  }
}

export const authService = new AuthService();
export { setAuthCallbacks };
