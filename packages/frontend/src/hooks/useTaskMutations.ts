import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiService } from '../services';
import type { Task, TaskStatus } from '../types';

import { queryKeys } from './queryKeys';

export interface CreateTaskInput {
  title: string;
  description?: string;
  pbiId?: string;
  assigneeId?: string;
  status: TaskStatus;
  estimatedHours?: number;
  remainingHours?: number;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  pbiId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  estimatedHours?: number;
  remainingHours?: number;
}

export interface TaskMutationError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface UseTaskMutationsOptions {
  sprintId?: string;
  onSuccess?: (action: 'create' | 'update' | 'delete', task?: Task) => void;
  onError?: (action: 'create' | 'update' | 'delete', error: TaskMutationError) => void;
}

export interface UseTaskMutationsReturn {
  // Create task
  createTask: (input: CreateTaskInput) => void;
  isCreating: boolean;
  createError: TaskMutationError | null;
  resetCreateError: () => void;

  // Update task
  updateTask: (input: UpdateTaskInput) => void;
  isUpdating: boolean;
  updateError: TaskMutationError | null;
  resetUpdateError: () => void;

  // Delete task
  deleteTask: (taskId: string) => void;
  isDeleting: boolean;
  deleteError: TaskMutationError | null;
  resetDeleteError: () => void;

  // Update task status (for drag & drop)
  updateTaskStatus: (taskId: string, status: TaskStatus, updates?: Partial<Task>) => void;
  isUpdatingStatus: boolean;

  // Centralized error handler
  handleMutationError: (
    error: unknown,
    action: 'create' | 'update' | 'delete'
  ) => TaskMutationError;
}

/**
 * Centralized error handler for task mutations
 */
function handleTaskMutationError(
  error: unknown,
  action: 'create' | 'update' | 'delete'
): TaskMutationError {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    };
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;

    // Handle API error responses
    if (err.response && typeof err.response === 'object') {
      const response = err.response as Record<string, unknown>;

      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;

        return {
          message: (data.message as string) || `Failed to ${action} task`,
          code: (data.code as string) || 'API_ERROR',
          details: data.errors as Record<string, string[]>,
        };
      }
    }

    // Handle validation errors
    if (err.errors && typeof err.errors === 'object') {
      return {
        message: `Validation failed while ${action}ing task`,
        code: 'VALIDATION_ERROR',
        details: err.errors as Record<string, string[]>,
      };
    }
  }

  return {
    message: `An unexpected error occurred while ${action}ing task`,
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * useTaskMutations Hook
 *
 * Centralizes all task mutation operations with consistent error handling.
 * Automatically invalidates related queries on success.
 */
export function useTaskMutations(options: UseTaskMutationsOptions = {}): UseTaskMutationsReturn {
  const { sprintId, onSuccess, onError } = options;
  const queryClient = useQueryClient();

  // Create task mutation
  const {
    mutate: createTask,
    isPending: isCreating,
    error: createErrorRaw,
    reset: resetCreateError,
  } = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      if (!sprintId) throw new Error('No sprint selected');
      return apiService.createTask(sprintId, input);
    },
    onSuccess: (response) => {
      // Invalidate related queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.task.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.burndown.all });

      onSuccess?.('create', response.data);
    },
    onError: (error) => {
      const handledError = handleTaskMutationError(error, 'create');
      onError?.('create', handledError);
    },
  });

  // Update task mutation
  const {
    mutate: updateTask,
    isPending: isUpdating,
    error: updateErrorRaw,
    reset: resetUpdateError,
  } = useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      if (!sprintId) throw new Error('No sprint selected');
      const { id, ...data } = input;
      return apiService.updateTask(sprintId, id, data);
    },
    onSuccess: (response) => {
      // Invalidate related queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.task.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.burndown.all });

      onSuccess?.('update', response.data);
    },
    onError: (error) => {
      const handledError = handleTaskMutationError(error, 'update');
      onError?.('update', handledError);
    },
  });

  // Delete task mutation
  const {
    mutate: deleteTask,
    isPending: isDeleting,
    error: deleteErrorRaw,
    reset: resetDeleteError,
  } = useMutation({
    mutationFn: async (taskId: string) => {
      if (!sprintId) throw new Error('No sprint selected');
      return apiService.deleteTask(sprintId, taskId);
    },
    onSuccess: () => {
      // Invalidate related queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.task.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.burndown.all });

      onSuccess?.('delete');
    },
    onError: (error) => {
      const handledError = handleTaskMutationError(error, 'delete');
      onError?.('delete', handledError);
    },
  });

  // Optimistic status update for drag & drop
  const { mutate: updateTaskStatusMutate, isPending: isUpdatingStatus } = useMutation({
    mutationFn: async ({
      taskId,
      status,
      updates = {},
    }: {
      taskId: string;
      status: TaskStatus;
      updates?: Partial<Task>;
    }) => {
      if (!sprintId) throw new Error('No sprint selected');
      return apiService.updateTask(sprintId, taskId, { status, ...updates });
    },
    onSuccess: () => {
      // Invalidate related queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.task.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.burndown.all });
    },
  });

  // Wrapper for updateTaskStatus to match expected signature
  const updateTaskStatus = (taskId: string, status: TaskStatus, updates?: Partial<Task>) => {
    updateTaskStatusMutate({ taskId, status, updates });
  };

  // Convert raw errors to TaskMutationError
  const createError = createErrorRaw ? handleTaskMutationError(createErrorRaw, 'create') : null;
  const updateError = updateErrorRaw ? handleTaskMutationError(updateErrorRaw, 'update') : null;
  const deleteError = deleteErrorRaw ? handleTaskMutationError(deleteErrorRaw, 'delete') : null;

  return {
    createTask,
    isCreating,
    createError,
    resetCreateError,
    updateTask,
    isUpdating,
    updateError,
    resetUpdateError,
    deleteTask,
    isDeleting,
    deleteError,
    resetDeleteError,
    updateTaskStatus,
    isUpdatingStatus,
    handleMutationError: handleTaskMutationError,
  };
}
