import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { AxiosError } from 'axios';

import { useAuthStore } from '../store';
import { apiService } from '../services';
import { logger } from '../utils/logger';
import type { DeletionEligibilityResult, ApiResponse } from '../types';

function getFriendlyErrorMessage(error: unknown, defaultMessage: string, t: TFunction): string {
  if (!error) return defaultMessage;

  const axiosError = error as AxiosError<ApiResponse<never>>;
  if (axiosError.response?.data.error?.message) {
    return axiosError.response.data.error.message;
  }

  if (error instanceof Error) {
    if (error.message.includes('network') || error.message.includes('Network')) {
      return t(
        'accountDeletion.networkError',
        'Network error. Please check your connection and try again.'
      );
    }
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return t('accountDeletion.timeoutError', 'Request timed out. Please try again.');
    }
    return error.message || defaultMessage;
  }

  return defaultMessage;
}

export interface UseAccountDeletionReturn {
  deletionEligibility: DeletionEligibilityResult | null;
  isLoadingEligibility: boolean;
  isDeleting: boolean;
  isScheduling: boolean;
  isCancelling: boolean;
  isForceDeleting: boolean;
  deleteError: string | null;
  deleteModalOpen: boolean;
  setDeleteModalOpen: (open: boolean) => void;
  handleDeleteClick: () => void;
  handleDeleteAccount: (confirmation: string) => Promise<void>;
  handleScheduleDeletion: (confirmation: string) => Promise<void>;
  handleCancelDeletion: () => Promise<void>;
  handleForceDelete: (confirmation: string) => Promise<void>;
  fetchDeletionEligibility: (force?: boolean) => Promise<void>;
}

export function useAccountDeletion(
  userMenuOpen: boolean,
  onUserMenuClose?: () => void
): UseAccountDeletionReturn {
  const { t } = useTranslation('common');
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletionEligibility, setDeletionEligibility] = useState<DeletionEligibilityResult | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isForceDeleting, setIsForceDeleting] = useState(false);

  const fetchDeletionEligibility = useCallback(
    async (force = false) => {
      if (isLoadingEligibility) return;
      if (!force && deletionEligibility) return;

      setIsLoadingEligibility(true);
      try {
        const response = await apiService.checkDeletionEligibility();
        if (response.success && response.data) {
          setDeletionEligibility(response.data);
        }
      } catch (error) {
        logger.error('Failed to fetch deletion eligibility', undefined, { error });
      } finally {
        setIsLoadingEligibility(false);
      }
    },
    [isLoadingEligibility, deletionEligibility]
  );

  const handleDeleteClick = useCallback(() => {
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteAccount = useCallback(
    async (confirmation: string) => {
      setIsDeleting(true);
      setDeleteError(null);

      try {
        const response = await apiService.deleteAccount(confirmation);
        if (response.success) {
          setDeleteModalOpen(false);
          onUserMenuClose?.();
          void logout();
          void navigate('/login', {
            replace: true,
            state: {
              message: t('accountDeletion.success', 'Your account has been successfully deleted.'),
            },
          });
        } else {
          setDeleteError(
            response.error?.message ??
              t('accountDeletion.deleteFailed', 'Failed to delete account. Please try again.')
          );
        }
      } catch (error) {
        setDeleteError(
          getFriendlyErrorMessage(
            error,
            t('accountDeletion.deleteFailed', 'Failed to delete account. Please try again.'),
            t
          )
        );
      } finally {
        setIsDeleting(false);
      }
    },
    [logout, navigate, onUserMenuClose, t]
  );

  const handleScheduleDeletion = useCallback(
    async (confirmation: string) => {
      setIsScheduling(true);
      setDeleteError(null);

      try {
        const response = await apiService.scheduleDeletion(confirmation);
        if (response.success) {
          setDeletionEligibility(null);
          void fetchDeletionEligibility(true);
        } else {
          setDeleteError(
            response.error?.message ??
              t('accountDeletion.scheduleFailed', 'Failed to schedule deletion. Please try again.')
          );
        }
      } catch (error) {
        setDeleteError(
          getFriendlyErrorMessage(
            error,
            t('accountDeletion.scheduleFailed', 'Failed to schedule deletion. Please try again.'),
            t
          )
        );
      } finally {
        setIsScheduling(false);
      }
    },
    [fetchDeletionEligibility, t]
  );

  const handleCancelDeletion = useCallback(async () => {
    setIsCancelling(true);
    setDeleteError(null);

    try {
      const response = await apiService.cancelScheduledDeletion();
      if (response.success) {
        setDeletionEligibility(null);
        void fetchDeletionEligibility(true);
      } else {
        setDeleteError(
          response.error?.message ??
            t('accountDeletion.cancelFailed', 'Failed to cancel deletion. Please try again.')
        );
      }
    } catch (error) {
      setDeleteError(
        getFriendlyErrorMessage(
          error,
          t('accountDeletion.cancelFailed', 'Failed to cancel deletion. Please try again.'),
          t
        )
      );
    } finally {
      setIsCancelling(false);
    }
  }, [fetchDeletionEligibility, t]);

  const handleForceDelete = useCallback(
    async (confirmation: string) => {
      setIsForceDeleting(true);
      setDeleteError(null);

      try {
        const response = await apiService.forceDeleteAccount(confirmation);
        if (response.success) {
          setDeleteModalOpen(false);
          onUserMenuClose?.();
          void logout();
          void navigate('/login', {
            replace: true,
            state: {
              message: t('accountDeletion.success', 'Your account has been successfully deleted.'),
            },
          });
        } else {
          setDeleteError(
            response.error?.message ??
              t('accountDeletion.deleteFailed', 'Failed to delete account. Please try again.')
          );
        }
      } catch (error) {
        setDeleteError(
          getFriendlyErrorMessage(
            error,
            t('accountDeletion.deleteFailed', 'Failed to delete account. Please try again.'),
            t
          )
        );
      } finally {
        setIsForceDeleting(false);
      }
    },
    [logout, navigate, onUserMenuClose, t]
  );

  // Fetch eligibility when user menu opens
  useEffect(() => {
    if (userMenuOpen && !deletionEligibility && !isLoadingEligibility) {
      void fetchDeletionEligibility();
    }
  }, [userMenuOpen, deletionEligibility, isLoadingEligibility, fetchDeletionEligibility]);

  // Reset delete error when modal closes
  useEffect(() => {
    if (!deleteModalOpen) {
      setDeleteError(null);
    }
  }, [deleteModalOpen]);

  return {
    deletionEligibility,
    isLoadingEligibility,
    isDeleting,
    isScheduling,
    isCancelling,
    isForceDeleting,
    deleteError,
    deleteModalOpen,
    setDeleteModalOpen,
    handleDeleteClick,
    handleDeleteAccount,
    handleScheduleDeletion,
    handleCancelDeletion,
    handleForceDelete,
    fetchDeletionEligibility,
  };
}
