import type { AxiosError } from 'axios';

import type { ApiResponse } from '../types';
import { i18nInstance } from '../i18n/config';

import { logger } from './logger';

/**
 * Converts an error into a user-friendly message.
 * Handles Axios error responses, network errors, timeouts, and generic Error objects.
 * Uses i18n translations with graceful fallback to English for network/timeout errors.
 */
export function getFriendlyErrorMessage(error: unknown, defaultMessage: string): string {
  if (!error) return defaultMessage;

  const axiosError = error as AxiosError<ApiResponse<never>>;
  if (axiosError.response?.data.error?.message) {
    return axiosError.response.data.error.message;
  }

  if (error instanceof Error) {
    if (error.message.includes('network') || error.message.includes('Network')) {
      try {
        if (i18nInstance.isInitialized) {
          const translated = i18nInstance.t('networkErrors.networkError');
          if (translated) return translated;
        }
      } catch (err) {
        logger.warn('i18n translation failed for network error', undefined, { originalError: err });
      }
      return 'Network error. Please check your connection and try again.';
    }
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      try {
        if (i18nInstance.isInitialized) {
          const translated = i18nInstance.t('networkErrors.timeout');
          if (translated) return translated;
        }
      } catch (err) {
        logger.warn('i18n translation failed for timeout error', undefined, { originalError: err });
      }
      return 'Request timed out. Please try again.';
    }
    return error.message || defaultMessage;
  }

  return defaultMessage;
}
