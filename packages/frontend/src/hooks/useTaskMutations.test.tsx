import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';

import { useTaskMutations, type CreateTaskInput, type UpdateTaskInput } from './useTaskMutations';
import { apiService } from '../services';
import type { Task } from '../types';

vi.mock('../services', () => ({
  apiService: {
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

const createMockTask = (id: string, title: string): Task => ({
  id,
  title,
  description: `Description for ${title}`,
  status: 'TODO',
  estimatedHours: 4,
  remainingHours: 4,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

describe('useTaskMutations', () => {
  const mockSprintId = 'sprint-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const mockTask = createMockTask('task-1', 'New Task');
      const input: CreateTaskInput = {
        title: 'New Task',
        description: 'Task description',
        status: 'TODO',
      };

      vi.mocked(apiService.createTask).mockResolvedValue({
        success: true,
        data: mockTask,
      });

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createTask(input);
      });

      await waitFor(() => {
        expect(apiService.createTask).toHaveBeenCalledWith(mockSprintId, input);
      });
    });

    it('should throw error when no sprint is selected', async () => {
      const input: CreateTaskInput = {
        title: 'New Task',
        status: 'TODO',
      };

      const { result } = renderHook(() => useTaskMutations({ sprintId: undefined }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createTask(input);
      });

      await waitFor(() => {
        expect(result.current.createError).not.toBeNull();
        expect(result.current.createError?.message).toBe('No sprint selected');
      });
    });

    it('should call onSuccess callback after successful creation', async () => {
      const mockTask = createMockTask('task-1', 'New Task');
      const onSuccess = vi.fn();
      const input: CreateTaskInput = {
        title: 'New Task',
        status: 'TODO',
      };

      vi.mocked(apiService.createTask).mockResolvedValue({
        success: true,
        data: mockTask,
      });

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId, onSuccess }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createTask(input);
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('create', mockTask);
      });
    });

    it('should call onError callback on failure', async () => {
      const onError = vi.fn();
      const input: CreateTaskInput = {
        title: 'New Task',
        status: 'TODO',
      };

      vi.mocked(apiService.createTask).mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId, onError }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createTask(input);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          'create',
          expect.objectContaining({
            message: 'Creation failed',
          })
        );
      });
    });

    it('should reset create error', async () => {
      const input: CreateTaskInput = {
        title: 'New Task',
        status: 'TODO',
      };

      vi.mocked(apiService.createTask).mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createTask(input);
      });

      await waitFor(() => {
        expect(result.current.createError).not.toBeNull();
      });

      act(() => {
        result.current.resetCreateError();
      });

      await waitFor(() => {
        expect(result.current.createError).toBeNull();
      });
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const mockTask = createMockTask('task-1', 'Updated Task');
      const input: UpdateTaskInput = {
        id: 'task-1',
        title: 'Updated Task',
        status: 'IN_PROGRESS',
      };

      vi.mocked(apiService.updateTask).mockResolvedValue({
        success: true,
        data: mockTask,
      });

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.updateTask(input);
      });

      await waitFor(() => {
        expect(apiService.updateTask).toHaveBeenCalledWith(
          mockSprintId,
          'task-1',
          expect.objectContaining({ title: 'Updated Task', status: 'IN_PROGRESS' })
        );
      });
    });

    it('should call onSuccess callback after successful update', async () => {
      const mockTask = createMockTask('task-1', 'Updated Task');
      const onSuccess = vi.fn();
      const input: UpdateTaskInput = {
        id: 'task-1',
        title: 'Updated Task',
      };

      vi.mocked(apiService.updateTask).mockResolvedValue({
        success: true,
        data: mockTask,
      });

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId, onSuccess }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.updateTask(input);
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('update', mockTask);
      });
    });

    it('should reset update error', async () => {
      const input: UpdateTaskInput = {
        id: 'task-1',
        title: 'Updated Task',
      };

      vi.mocked(apiService.updateTask).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.updateTask(input);
      });

      await waitFor(() => {
        expect(result.current.updateError).not.toBeNull();
      });

      act(() => {
        result.current.resetUpdateError();
      });

      await waitFor(() => {
        expect(result.current.updateError).toBeNull();
      });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      vi.mocked(apiService.deleteTask).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.deleteTask('task-1');
      });

      await waitFor(() => {
        expect(apiService.deleteTask).toHaveBeenCalledWith(mockSprintId, 'task-1');
      });
    });

    it('should call onSuccess callback after successful deletion', async () => {
      const onSuccess = vi.fn();

      vi.mocked(apiService.deleteTask).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId, onSuccess }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.deleteTask('task-1');
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledWith('delete');
      });
    });

    it('should reset delete error', async () => {
      vi.mocked(apiService.deleteTask).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.deleteTask('task-1');
      });

      await waitFor(() => {
        expect(result.current.deleteError).not.toBeNull();
      });

      act(() => {
        result.current.resetDeleteError();
      });

      await waitFor(() => {
        expect(result.current.deleteError).toBeNull();
      });
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status successfully', async () => {
      const mockTask = createMockTask('task-1', 'Task');
      mockTask.status = 'IN_PROGRESS';

      vi.mocked(apiService.updateTask).mockResolvedValue({
        success: true,
        data: mockTask,
      });

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.updateTaskStatus('task-1', 'IN_PROGRESS');
      });

      await waitFor(() => {
        expect(apiService.updateTask).toHaveBeenCalledWith(
          mockSprintId,
          'task-1',
          expect.objectContaining({ status: 'IN_PROGRESS' })
        );
      });
    });

    it('should update task status with additional updates', async () => {
      const mockTask = createMockTask('task-1', 'Task');
      mockTask.status = 'DONE';
      mockTask.remainingHours = 0;

      vi.mocked(apiService.updateTask).mockResolvedValue({
        success: true,
        data: mockTask,
      });

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.updateTaskStatus('task-1', 'DONE', { remainingHours: 0 });
      });

      await waitFor(() => {
        expect(apiService.updateTask).toHaveBeenCalledWith(
          mockSprintId,
          'task-1',
          expect.objectContaining({ status: 'DONE', remainingHours: 0 })
        );
      });
    });
  });

  describe('error handling', () => {
    it('should handle API error responses', async () => {
      const input: CreateTaskInput = {
        title: 'New Task',
        status: 'TODO',
      };

      const apiError = {
        response: {
          data: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            errors: { title: ['Title is required'] },
          },
        },
      };

      vi.mocked(apiService.createTask).mockRejectedValue(apiError);

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createTask(input);
      });

      await waitFor(() => {
        expect(result.current.createError).toEqual({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { title: ['Title is required'] },
        });
      });
    });

    it('should handle validation errors', async () => {
      const input: CreateTaskInput = {
        title: 'New Task',
        status: 'TODO',
      };

      const validationError = {
        errors: { title: ['Title must be at least 3 characters'] },
      };

      vi.mocked(apiService.createTask).mockRejectedValue(validationError);

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createTask(input);
      });

      await waitFor(() => {
        expect(result.current.createError).toEqual({
          message: 'Validation failed while createing task',
          code: 'VALIDATION_ERROR',
          details: { title: ['Title must be at least 3 characters'] },
        });
      });
    });

    it('should handle unknown errors', async () => {
      const input: CreateTaskInput = {
        title: 'New Task',
        status: 'TODO',
      };

      vi.mocked(apiService.createTask).mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createTask(input);
      });

      await waitFor(() => {
        expect(result.current.createError).toEqual({
          message: 'An unexpected error occurred while createing task',
          code: 'UNKNOWN_ERROR',
        });
      });
    });

    it('should handle Error instances', async () => {
      const input: CreateTaskInput = {
        title: 'New Task',
        status: 'TODO',
      };

      vi.mocked(apiService.createTask).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createTask(input);
      });

      await waitFor(() => {
        expect(result.current.createError).toEqual({
          message: 'Network error',
          code: 'UNKNOWN_ERROR',
        });
      });
    });
  });

  describe('loading states', () => {
    it('should track creating state', async () => {
      const mockTask = createMockTask('task-1', 'New Task');
      const input: CreateTaskInput = {
        title: 'New Task',
        status: 'TODO',
      };

      vi.mocked(apiService.createTask).mockResolvedValue({
        success: true,
        data: mockTask,
      });

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId }), {
        wrapper: createWrapper(),
      });

      expect(result.current.isCreating).toBe(false);

      act(() => {
        result.current.createTask(input);
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });
    });

    it('should track updating state', async () => {
      const mockTask = createMockTask('task-1', 'Updated Task');
      const input: UpdateTaskInput = {
        id: 'task-1',
        title: 'Updated Task',
      };

      vi.mocked(apiService.updateTask).mockResolvedValue({
        success: true,
        data: mockTask,
      });

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId }), {
        wrapper: createWrapper(),
      });

      expect(result.current.isUpdating).toBe(false);

      act(() => {
        result.current.updateTask(input);
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });
    });

    it('should track deleting state', async () => {
      vi.mocked(apiService.deleteTask).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const { result } = renderHook(() => useTaskMutations({ sprintId: mockSprintId }), {
        wrapper: createWrapper(),
      });

      expect(result.current.isDeleting).toBe(false);

      act(() => {
        result.current.deleteTask('task-1');
      });

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });
    });
  });
});
