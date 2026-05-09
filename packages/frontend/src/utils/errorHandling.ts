import type { AxiosError } from 'axios';

import type { ApiResponse } from '../types';

/**
 * Converts an error into a user-friendly message.
 * Handles Axios error responses, network errors, timeouts, and generic Error objects.
 */
export function getFriendlyErrorMessage(error: unknown, defaultMessage: string): string {
  if (!error) return defaultMessage;

  const axiosError = error as AxiosError<ApiResponse<never>>;
  if (axiosError.response?.data.error?.message) {
    return axiosError.response.data.error.message;
  }

  if (error instanceof Error) {
    if (error.message.includes('network') || error.message.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return 'Request timed out. Please try again.';
    }
    return error.message || defaultMessage;
  }

  return defaultMessage;
}
