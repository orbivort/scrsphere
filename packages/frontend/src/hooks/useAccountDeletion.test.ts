import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { AxiosError } from 'axios';

import { useAccountDeletion } from './useAccountDeletion';
import type { DeletionEligibilityResult, ApiResponse } from '../types';

const mockLogout = vi.fn();
const mockNavigate = vi.fn();
const mockOnUserMenuClose = vi.fn();

const mockCheckDeletionEligibility = vi.fn();
const mockDeleteAccount = vi.fn();
const mockScheduleDeletion = vi.fn();
const mockCancelScheduledDeletion = vi.fn();
const mockForceDeleteAccount = vi.fn();

vi.mock('../store', () => ({
  useAuthStore: () => ({
    logout: mockLogout,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../services', () => ({
  apiService: {
    checkDeletionEligibility: (...args: unknown[]) => mockCheckDeletionEligibility(...args),
    deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
    scheduleDeletion: (...args: unknown[]) => mockScheduleDeletion(...args),
    cancelScheduledDeletion: (...args: unknown[]) => mockCancelScheduledDeletion(...args),
    forceDeleteAccount: (...args: unknown[]) => mockForceDeleteAccount(...args),
  },
}));

vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
  setStoreProvider: vi.fn(),
}));

describe('useAccountDeletion', () => {
  const mockEligibility: DeletionEligibilityResult = {
    canDelete: true,
    canSchedule: false,
    scheduledForDeletion: false,
    hasOwnedTeams: false,
    hasActiveSprints: false,
    message: 'You can delete your account',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useAccountDeletion(false));

      expect(result.current.deletionEligibility).toBeNull();
      expect(result.current.isLoadingEligibility).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.isScheduling).toBe(false);
      expect(result.current.isCancelling).toBe(false);
      expect(result.current.isForceDeleting).toBe(false);
      expect(result.current.deleteError).toBeNull();
      expect(result.current.deleteModalOpen).toBe(false);
    });
  });

  describe('handleDeleteClick', () => {
    it('should open delete modal', () => {
      const { result } = renderHook(() => useAccountDeletion(false));

      act(() => {
        result.current.handleDeleteClick();
      });

      expect(result.current.deleteModalOpen).toBe(true);
    });
  });

  describe('setDeleteModalOpen', () => {
    it('should set modal open state', () => {
      const { result } = renderHook(() => useAccountDeletion(false));

      act(() => {
        result.current.setDeleteModalOpen(true);
      });

      expect(result.current.deleteModalOpen).toBe(true);

      act(() => {
        result.current.setDeleteModalOpen(false);
      });

      expect(result.current.deleteModalOpen).toBe(false);
    });

    it('should clear delete error when modal closes', () => {
      const { result } = renderHook(() => useAccountDeletion(false));

      act(() => {
        result.current.setDeleteModalOpen(true);
      });

      result.current.deleteError = 'Some error';

      act(() => {
        result.current.setDeleteModalOpen(false);
      });

      expect(result.current.deleteError).toBeNull();
    });
  });

  describe('fetchDeletionEligibility', () => {
    it('should fetch eligibility when user menu opens', async () => {
      mockCheckDeletionEligibility.mockResolvedValue({
        success: true,
        data: mockEligibility,
      });

      const { result } = renderHook(() => useAccountDeletion(true));

      await waitFor(() => {
        expect(mockCheckDeletionEligibility).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(result.current.deletionEligibility).toEqual(mockEligibility);
      });
    });

    it('should not fetch if eligibility already exists', async () => {
      mockCheckDeletionEligibility.mockResolvedValue({
        success: true,
        data: mockEligibility,
      });

      const { result, rerender } = renderHook(({ open }) => useAccountDeletion(open), {
        initialProps: { open: true },
      });

      await waitFor(() => {
        expect(result.current.deletionEligibility).toEqual(mockEligibility);
      });

      rerender({ open: false });
      rerender({ open: true });

      expect(mockCheckDeletionEligibility).toHaveBeenCalledTimes(1);
    });

    it('should force fetch when force parameter is true', async () => {
      mockCheckDeletionEligibility.mockResolvedValue({
        success: true,
        data: mockEligibility,
      });

      const { result } = renderHook(() => useAccountDeletion(true));

      await waitFor(() => {
        expect(result.current.deletionEligibility).toEqual(mockEligibility);
      });

      await act(async () => {
        await result.current.fetchDeletionEligibility(true);
      });

      expect(mockCheckDeletionEligibility).toHaveBeenCalledTimes(2);
    });

    it('should handle fetch error gracefully', async () => {
      mockCheckDeletionEligibility.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAccountDeletion(true));

      await waitFor(() => {
        expect(result.current.isLoadingEligibility).toBe(false);
      });

      expect(result.current.deletionEligibility).toBeNull();
    });
  });

  describe('handleDeleteAccount', () => {
    it('should delete account successfully', async () => {
      mockDeleteAccount.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useAccountDeletion(false, mockOnUserMenuClose));

      act(() => {
        result.current.setDeleteModalOpen(true);
      });

      await act(async () => {
        await result.current.handleDeleteAccount('DELETE');
      });

      expect(mockDeleteAccount).toHaveBeenCalledWith('DELETE');
      expect(mockOnUserMenuClose).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        replace: true,
        state: { message: 'Your account has been successfully deleted.' },
      });
    });

    it('should set deleting state during deletion', async () => {
      mockDeleteAccount.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      const { result } = renderHook(() => useAccountDeletion(false));

      let promise: Promise<void>;
      act(() => {
        promise = result.current.handleDeleteAccount('DELETE');
      });

      expect(result.current.isDeleting).toBe(true);

      await act(async () => {
        await promise!;
      });

      expect(result.current.isDeleting).toBe(false);
    });

    it('should handle deletion failure', async () => {
      mockDeleteAccount.mockResolvedValue({
        success: false,
        error: { message: 'Deletion failed' },
      });

      const { result } = renderHook(() => useAccountDeletion(false));

      await act(async () => {
        await result.current.handleDeleteAccount('DELETE');
      });

      expect(result.current.deleteError).toBe('Deletion failed');
      expect(result.current.isDeleting).toBe(false);
    });

    it('should handle deletion error with network message', async () => {
      mockDeleteAccount.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAccountDeletion(false));

      await act(async () => {
        await result.current.handleDeleteAccount('DELETE');
      });

      expect(result.current.deleteError).toBe(
        'Network error. Please check your connection and try again.'
      );
      expect(result.current.isDeleting).toBe(false);
    });

    it('should handle network error message', async () => {
      mockDeleteAccount.mockRejectedValue(new Error('Network error occurred'));

      const { result } = renderHook(() => useAccountDeletion(false));

      await act(async () => {
        await result.current.handleDeleteAccount('DELETE');
      });

      expect(result.current.deleteError).toContain('Network error');
    });

    it('should handle timeout error message', async () => {
      mockDeleteAccount.mockRejectedValue(new Error('Request timeout'));

      const { result } = renderHook(() => useAccountDeletion(false));

      await act(async () => {
        await result.current.handleDeleteAccount('DELETE');
      });

      expect(result.current.deleteError).toContain('timed out');
    });
  });

  describe('handleScheduleDeletion', () => {
    it('should schedule deletion successfully', async () => {
      mockScheduleDeletion.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useAccountDeletion(false));

      await act(async () => {
        await result.current.handleScheduleDeletion('SCHEDULE');
      });

      expect(mockScheduleDeletion).toHaveBeenCalledWith('SCHEDULE');
    });

    it('should refresh eligibility after scheduling', async () => {
      mockScheduleDeletion.mockResolvedValue({
        success: true,
      });
      mockCheckDeletionEligibility.mockResolvedValue({
        success: true,
        data: { ...mockEligibility, scheduledForDeletion: true },
      });

      const { result } = renderHook(() => useAccountDeletion(false));

      await act(async () => {
        await result.current.handleScheduleDeletion('SCHEDULE');
      });

      expect(mockCheckDeletionEligibility).toHaveBeenCalled();
    });

    it('should handle scheduling failure', async () => {
      mockScheduleDeletion.mockResolvedValue({
        success: false,
        error: { message: 'Scheduling failed' },
      });

      const { result } = renderHook(() => useAccountDeletion(false));

      await act(async () => {
        await result.current.handleScheduleDeletion('SCHEDULE');
      });

      expect(result.current.deleteError).toBe('Scheduling failed');
    });

    it('should set scheduling state during operation', async () => {
      mockScheduleDeletion.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      const { result } = renderHook(() => useAccountDeletion(false));

      let promise: Promise<void>;
      act(() => {
        promise = result.current.handleScheduleDeletion('SCHEDULE');
      });

      expect(result.current.isScheduling).toBe(true);

      await act(async () => {
        await promise!;
      });

      expect(result.current.isScheduling).toBe(false);
    });
  });

  describe('handleCancelDeletion', () => {
    it('should cancel scheduled deletion', async () => {
      mockCancelScheduledDeletion.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useAccountDeletion(false));

      await act(async () => {
        await result.current.handleCancelDeletion();
      });

      expect(mockCancelScheduledDeletion).toHaveBeenCalled();
    });

    it('should refresh eligibility after cancelling', async () => {
      mockCancelScheduledDeletion.mockResolvedValue({
        success: true,
      });
      mockCheckDeletionEligibility.mockResolvedValue({
        success: true,
        data: { ...mockEligibility, scheduledForDeletion: false },
      });

      const { result } = renderHook(() => useAccountDeletion(false));

      await act(async () => {
        await result.current.handleCancelDeletion();
      });

      expect(mockCheckDeletionEligibility).toHaveBeenCalled();
    });

    it('should handle cancel failure', async () => {
      mockCancelScheduledDeletion.mockResolvedValue({
        success: false,
        error: { message: 'Cancel failed' },
      });

      const { result } = renderHook(() => useAccountDeletion(false));

      await act(async () => {
        await result.current.handleCancelDeletion();
      });

      expect(result.current.deleteError).toBe('Cancel failed');
    });

    it('should set cancelling state during operation', async () => {
      mockCancelScheduledDeletion.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      const { result } = renderHook(() => useAccountDeletion(false));

      let promise: Promise<void>;
      act(() => {
        promise = result.current.handleCancelDeletion();
      });

      expect(result.current.isCancelling).toBe(true);

      await act(async () => {
        await promise!;
      });

      expect(result.current.isCancelling).toBe(false);
    });
  });

  describe('handleForceDelete', () => {
    it('should force delete account successfully', async () => {
      mockForceDeleteAccount.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useAccountDeletion(false, mockOnUserMenuClose));

      await act(async () => {
        await result.current.handleForceDelete('FORCE DELETE');
      });

      expect(mockForceDeleteAccount).toHaveBeenCalledWith('FORCE DELETE');
      expect(mockOnUserMenuClose).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        replace: true,
        state: { message: 'Your account has been successfully deleted.' },
      });
    });

    it('should set force deleting state during operation', async () => {
      mockForceDeleteAccount.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      const { result } = renderHook(() => useAccountDeletion(false));

      let promise: Promise<void>;
      act(() => {
        promise = result.current.handleForceDelete('FORCE DELETE');
      });

      expect(result.current.isForceDeleting).toBe(true);

      await act(async () => {
        await promise!;
      });

      expect(result.current.isForceDeleting).toBe(false);
    });

    it('should handle force delete failure', async () => {
      mockForceDeleteAccount.mockResolvedValue({
        success: false,
        error: { message: 'Force delete failed' },
      });

      const { result } = renderHook(() => useAccountDeletion(false));

      await act(async () => {
        await result.current.handleForceDelete('FORCE DELETE');
      });

      expect(result.current.deleteError).toBe('Force delete failed');
    });
  });

  describe('error handling', () => {
    it('should handle axios error with response message', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            error: {
              message: 'Custom API error',
            },
          },
        },
      } as unknown as AxiosError<ApiResponse<never>>;

      mockDeleteAccount.mockRejectedValue(axiosError);

      const { result } = renderHook(() => useAccountDeletion(false));

      await act(async () => {
        await result.current.handleDeleteAccount('DELETE');
      });

      expect(result.current.deleteError).toBe('Custom API error');
    });

    it('should clear error before new operations', async () => {
      mockDeleteAccount.mockRejectedValue(new Error('First error'));

      const { result } = renderHook(() => useAccountDeletion(false));

      await act(async () => {
        await result.current.handleDeleteAccount('DELETE');
      });

      expect(result.current.deleteError).toContain('First error');

      mockDeleteAccount.mockResolvedValue({ success: true });

      await act(async () => {
        await result.current.handleDeleteAccount('DELETE');
      });

      expect(result.current.deleteError).toBeNull();
    });
  });
});
