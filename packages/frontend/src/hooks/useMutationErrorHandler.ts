// Centralized Mutation Error Handler
// Provides standardized error handling for React Query mutations

import { useCallback } from 'react';
import type { AxiosError } from 'axios';

import type { ApiResponse } from '../types';
import { logger } from '../utils/logger';

import { useApiError } from './useApiError';

export interface MutationErrorContext {
  operationName: string;
  setFormErrors?: (errors: Record<string, string>) => void;
  setWorkflowError?: (error: string | null) => void;
  setModalError?: (error: string | null) => void;
  showToast?: (message: string) => void;
  onError?: (error: unknown, message: string) => void;
}

export interface UseMutationErrorHandlerResult {
  handleMutationError: (error: unknown, context: MutationErrorContext) => string;
  createMutationConfig: <TData, TVariables>(
    operationName: string,
    context: Omit<MutationErrorContext, 'operationName'>
  ) => {
    onError: (error: unknown) => void;
    onSuccess: (data: TData, variables: TVariables) => void;
  };
}

/**
 * Checks if an error is a permission transition error that should not be logged.
 * These are expected errors that are already displayed in the UI.
 */
function isPermissionTransitionError(error: unknown): boolean {
  const isAxiosError =
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as { isAxiosError?: boolean }).isAxiosError === true;

  if (!isAxiosError) {
    return false;
  }

  const axiosError = error as AxiosError<ApiResponse<never>>;
  const errorMessage = axiosError.response?.data?.error?.message;

  return (
    (axiosError.response?.status === 403 || axiosError.response?.status === 400) &&
    typeof errorMessage === 'string' &&
    errorMessage.includes('You do not have permission to perform this transition')
  );
}

/**
 * Centralized hook for handling mutation errors consistently
 *
 * @example
 * const { handleMutationError } = useMutationErrorHandler();
 *
 * const mutation = useMutation({
 *   mutationFn: apiService.createItem,
 *   onError: (error) => handleMutationError(error, {
 *     operationName: 'create item',
 *     setFormErrors,
 *     showToast: (msg) => toast.error(msg),
 *   }),
 * });
 */
export const useMutationErrorHandler = (): UseMutationErrorHandlerResult => {
  const { handleError } = useApiError();

  /**
   * Handles mutation errors with standardized logic
   */
  const handleMutationError = useCallback(
    (error: unknown, context: MutationErrorContext): string => {
      const { operationName, setFormErrors, setWorkflowError, setModalError, showToast, onError } =
        context;

      // Log error in development, but skip expected permission transition errors
      if (import.meta.env.DEV && !isPermissionTransitionError(error)) {
        logger.error(`Failed to ${operationName}`, undefined, { error });
      }

      // Check if this is a permission transition error for user-friendly messaging
      const isPermissionError = isPermissionTransitionError(error);

      // Extract user-friendly message
      let userMessage = handleError(error, `Failed to ${operationName}`);

      // For permission transition errors, show a cleaner message
      if (isPermissionError) {
        userMessage = 'You do not have permission to perform this transition.';
      }

      // Handle validation errors (400)
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 400
      ) {
        const response = (error as { response?: { data?: { error?: { message?: string } } } })
          .response;
        const errorMessage = response?.data?.error?.message;

        if (errorMessage) {
          if (errorMessage.includes('teamId') && setFormErrors) {
            setFormErrors({ teamId: errorMessage });
          } else if (
            setWorkflowError &&
            (errorMessage.includes('Transition') ||
              errorMessage.includes('not allowed') ||
              errorMessage.includes('Cannot modify') ||
              errorMessage.includes('You do not have permission'))
          ) {
            // Use user-friendly message for permission errors
            setWorkflowError(isPermissionError ? userMessage : errorMessage);
          } else if (setFormErrors) {
            setFormErrors({ title: userMessage });
          }
        }
      }

      // Handle permission errors (403)
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 403
      ) {
        const response = (error as { response?: { data?: { error?: { message?: string } } } })
          .response;
        const errorMessage = response?.data?.error?.message;
        if (setWorkflowError) {
          setWorkflowError(errorMessage || 'You do not have permission to perform this action');
        }
      }

      // Set modal error if provided
      if (setModalError) {
        setModalError(userMessage);
      }

      // Show toast if provided (skip for permission errors if workflow error is already set)
      if (showToast && !(isPermissionError && setWorkflowError)) {
        showToast(userMessage);
      }

      // Call custom error handler if provided
      if (onError) {
        onError(error, userMessage);
      }

      return userMessage;
    },
    [handleError]
  );

  /**
   * Creates standardized mutation configuration
   */
  const createMutationConfig = useCallback(
    <TData, TVariables>(
      operationName: string,
      context: Omit<MutationErrorContext, 'operationName'>
    ) => ({
      onError: (error: unknown) => {
        handleMutationError(error, { operationName, ...context });
      },
      onSuccess: (_data: TData, _variables: TVariables) => {
        // Clear errors on success
        if (context.setFormErrors) {
          context.setFormErrors({});
        }
        if (context.setWorkflowError) {
          context.setWorkflowError(null);
        }
        if (context.setModalError) {
          context.setModalError(null);
        }
      },
    }),
    [handleMutationError]
  );

  return {
    handleMutationError,
    createMutationConfig,
  };
};

export default useMutationErrorHandler;
