import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useBacklogMutations } from './useBacklogMutations';
import { apiService } from '../../../services';
import { ItemStatus, MoSCoWPriority } from '../../../types';

vi.mock('../../../services', () => ({
  apiService: {
    createProductBacklogItem: vi.fn(),
    updateProductBacklogItem: vi.fn(),
    deleteProductBacklogItem: vi.fn(),
  },
}));

vi.mock('../../../hooks/useMutationErrorHandler', () => ({
  useMutationErrorHandler: () => ({
    handleMutationError: vi.fn((_error, options) => {
      if (options.setFormErrors) {
        options.setFormErrors({ title: 'Error occurred' });
      }
      if (options.showToast) {
        options.showToast('An error occurred');
      }
      if (options.setWorkflowError) {
        options.setWorkflowError('Workflow error');
      }
    }),
  }),
}));

vi.mock('../../../hooks/queryKeys', () => ({
  queryKeys: {
    productBacklog: {
      all: ['productBacklog'],
    },
    productGoal: {
      all: ['productGoal'],
    },
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
);

const createMockBacklogItem = (overrides = {}) => ({
  id: 'pbi-1',
  teamId: 'team-1',
  title: 'Test Item',
  description: 'Test description',
  status: ItemStatus.NEW,
  priority: MoSCoWPriority.MUST_HAVE,
  storyPoints: 8,
  businessValue: 10,
  labels: ['frontend'],
  acceptanceCriteria: 'Test criteria',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  createdBy: 'user-1',
  ...overrides,
});

describe('useBacklogMutations', () => {
  let resetForm: ReturnType<typeof vi.fn>;
  let setFormErrors: ReturnType<typeof vi.fn>;
  let setWorkflowError: ReturnType<typeof vi.fn>;
  let setSelectedItem: ReturnType<typeof vi.fn>;
  let onCreateSuccess: ReturnType<typeof vi.fn>;
  let onEditSuccess: ReturnType<typeof vi.fn>;
  let onDeleteSuccess: ReturnType<typeof vi.fn>;
  let onSuccessToast: ReturnType<typeof vi.fn>;
  let onErrorToast: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    resetForm = vi.fn();
    setFormErrors = vi.fn();
    setWorkflowError = vi.fn();
    setSelectedItem = vi.fn();
    onCreateSuccess = vi.fn();
    onEditSuccess = vi.fn();
    onDeleteSuccess = vi.fn();
    onSuccessToast = vi.fn();
    onErrorToast = vi.fn();
  });

  const getProps = () => ({
    resetForm,
    setFormErrors,
    setWorkflowError,
    setSelectedItem,
    onCreateSuccess,
    onEditSuccess,
    onDeleteSuccess,
    onSuccessToast,
    onErrorToast,
  });

  describe('createItemMutation', () => {
    it('should create item successfully', async () => {
      const mockItem = createMockBacklogItem();
      vi.mocked(apiService.createProductBacklogItem).mockResolvedValue({
        success: true,
        data: mockItem,
      });

      const { result } = renderHook(() => useBacklogMutations(getProps()), {
        wrapper,
      });

      act(() => {
        result.current.createItemMutation.mutate({
          title: 'New Item',
          teamId: 'team-1',
        });
      });

      await waitFor(() => {
        expect(result.current.createItemMutation.isSuccess).toBe(true);
      });

      expect(apiService.createProductBacklogItem).toHaveBeenCalled();
      expect(onSuccessToast).toHaveBeenCalledWith('Backlog item created successfully');
      expect(onCreateSuccess).toHaveBeenCalled();
      expect(resetForm).toHaveBeenCalled();
    });

    it('should handle create error', async () => {
      vi.mocked(apiService.createProductBacklogItem).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useBacklogMutations(getProps()), {
        wrapper,
      });

      act(() => {
        result.current.createItemMutation.mutate({
          title: 'New Item',
          teamId: 'team-1',
        });
      });

      await waitFor(() => {
        expect(result.current.createItemMutation.isError).toBe(true);
      });

      expect(onErrorToast).toHaveBeenCalled();
    });

    it('should pass correct data to API', async () => {
      const mockItem = createMockBacklogItem();
      vi.mocked(apiService.createProductBacklogItem).mockResolvedValue({
        success: true,
        data: mockItem,
      });

      const { result } = renderHook(() => useBacklogMutations(getProps()), {
        wrapper,
      });

      const itemData = {
        title: 'New Feature',
        description: 'Feature description',
        teamId: 'team-1',
        goalId: 'goal-1',
        priority: MoSCoWPriority.MUST_HAVE,
      };

      act(() => {
        result.current.createItemMutation.mutate(itemData);
      });

      await waitFor(() => {
        expect(result.current.createItemMutation.isSuccess).toBe(true);
      });

      expect(apiService.createProductBacklogItem).toHaveBeenCalledWith(itemData);
    });
  });

  describe('updateItemMutation', () => {
    it('should update item status successfully', async () => {
      const mockItem = createMockBacklogItem({ status: ItemStatus.REFINED });
      vi.mocked(apiService.updateProductBacklogItem).mockResolvedValue({
        success: true,
        data: mockItem,
      });

      const { result } = renderHook(() => useBacklogMutations(getProps()), {
        wrapper,
      });

      act(() => {
        result.current.updateItemMutation.mutate({
          id: 'pbi-1',
          updates: { status: ItemStatus.REFINED },
        });
      });

      await waitFor(() => {
        expect(result.current.updateItemMutation.isSuccess).toBe(true);
      });

      expect(apiService.updateProductBacklogItem).toHaveBeenCalledWith('pbi-1', {
        status: ItemStatus.REFINED,
      });
      expect(onSuccessToast).toHaveBeenCalledWith('Status updated successfully');
    });

    it('should update item priority successfully', async () => {
      const mockItem = createMockBacklogItem({ priority: MoSCoWPriority.SHOULD_HAVE });
      vi.mocked(apiService.updateProductBacklogItem).mockResolvedValue({
        success: true,
        data: mockItem,
      });

      const { result } = renderHook(() => useBacklogMutations(getProps()), {
        wrapper,
      });

      act(() => {
        result.current.updateItemMutation.mutate({
          id: 'pbi-1',
          updates: { priority: MoSCoWPriority.SHOULD_HAVE },
        });
      });

      await waitFor(() => {
        expect(result.current.updateItemMutation.isSuccess).toBe(true);
      });

      expect(onSuccessToast).toHaveBeenCalledWith('Priority updated successfully');
    });

    it('should handle update error', async () => {
      vi.mocked(apiService.updateProductBacklogItem).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useBacklogMutations(getProps()), {
        wrapper,
      });

      act(() => {
        result.current.updateItemMutation.mutate({
          id: 'pbi-1',
          updates: { status: ItemStatus.REFINED },
        });
      });

      await waitFor(() => {
        expect(result.current.updateItemMutation.isError).toBe(true);
      });

      expect(onErrorToast).toHaveBeenCalled();
    });
  });

  describe('editItemMutation', () => {
    it('should edit item successfully', async () => {
      const mockItem = createMockBacklogItem({ title: 'Updated Title' });
      vi.mocked(apiService.updateProductBacklogItem).mockResolvedValue({
        success: true,
        data: mockItem,
      });

      const { result } = renderHook(() => useBacklogMutations(getProps()), {
        wrapper,
      });

      act(() => {
        result.current.editItemMutation.mutate({
          id: 'pbi-1',
          updates: { title: 'Updated Title' },
        });
      });

      await waitFor(() => {
        expect(result.current.editItemMutation.isSuccess).toBe(true);
      });

      expect(apiService.updateProductBacklogItem).toHaveBeenCalledWith('pbi-1', {
        title: 'Updated Title',
      });
      expect(onSuccessToast).toHaveBeenCalledWith('Backlog item updated successfully');
      expect(onEditSuccess).toHaveBeenCalled();
      expect(setSelectedItem).toHaveBeenCalledWith(null);
      expect(resetForm).toHaveBeenCalled();
      expect(setWorkflowError).toHaveBeenCalledWith(null);
    });

    it('should handle edit error with workflow error', async () => {
      vi.mocked(apiService.updateProductBacklogItem).mockRejectedValue(
        new Error('Invalid workflow transition')
      );

      const { result } = renderHook(() => useBacklogMutations(getProps()), {
        wrapper,
      });

      act(() => {
        result.current.editItemMutation.mutate({
          id: 'pbi-1',
          updates: { status: ItemStatus.DONE },
        });
      });

      await waitFor(() => {
        expect(result.current.editItemMutation.isError).toBe(true);
      });

      expect(onErrorToast).toHaveBeenCalled();
    });
  });

  describe('deleteItemMutation', () => {
    it('should delete item successfully', async () => {
      vi.mocked(apiService.deleteProductBacklogItem).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useBacklogMutations(getProps()), {
        wrapper,
      });

      act(() => {
        result.current.deleteItemMutation.mutate('pbi-1');
      });

      await waitFor(() => {
        expect(result.current.deleteItemMutation.isSuccess).toBe(true);
      });

      expect(apiService.deleteProductBacklogItem).toHaveBeenCalledWith('pbi-1');
      expect(onSuccessToast).toHaveBeenCalledWith('Backlog item deleted successfully');
      expect(onDeleteSuccess).toHaveBeenCalled();
      expect(setSelectedItem).toHaveBeenCalledWith(null);
      expect(setWorkflowError).toHaveBeenCalledWith(null);
    });

    it('should handle delete error', async () => {
      vi.mocked(apiService.deleteProductBacklogItem).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useBacklogMutations(getProps()), {
        wrapper,
      });

      act(() => {
        result.current.deleteItemMutation.mutate('pbi-1');
      });

      await waitFor(() => {
        expect(result.current.deleteItemMutation.isError).toBe(true);
      });

      expect(onErrorToast).toHaveBeenCalled();
    });
  });

  describe('Mutation States', () => {
    it('should track pending state for create mutation', async () => {
      vi.mocked(apiService.createProductBacklogItem).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: createMockBacklogItem(),
                }),
              100
            )
          )
      );

      const { result } = renderHook(() => useBacklogMutations(getProps()), {
        wrapper,
      });

      act(() => {
        result.current.createItemMutation.mutate({
          title: 'New Item',
          teamId: 'team-1',
        });
      });

      await waitFor(() => {
        expect(result.current.createItemMutation.isPending).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.createItemMutation.isSuccess).toBe(true);
      });
    });

    it('should track pending state for update mutation', async () => {
      vi.mocked(apiService.updateProductBacklogItem).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: createMockBacklogItem(),
                }),
              100
            )
          )
      );

      const { result } = renderHook(() => useBacklogMutations(getProps()), {
        wrapper,
      });

      act(() => {
        result.current.updateItemMutation.mutate({
          id: 'pbi-1',
          updates: { status: ItemStatus.REFINED },
        });
      });

      await waitFor(() => {
        expect(result.current.updateItemMutation.isPending).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.updateItemMutation.isSuccess).toBe(true);
      });
    });

    it('should track pending state for delete mutation', async () => {
      vi.mocked(apiService.deleteProductBacklogItem).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      const { result } = renderHook(() => useBacklogMutations(getProps()), {
        wrapper,
      });

      act(() => {
        result.current.deleteItemMutation.mutate('pbi-1');
      });

      await waitFor(() => {
        expect(result.current.deleteItemMutation.isPending).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.deleteItemMutation.isSuccess).toBe(true);
      });
    });
  });

  describe('Optional Callbacks', () => {
    it('should work without optional callbacks', async () => {
      vi.mocked(apiService.createProductBacklogItem).mockResolvedValue({
        success: true,
        data: createMockBacklogItem(),
      });

      const propsWithoutCallbacks = {
        resetForm,
        setFormErrors,
        setWorkflowError,
        setSelectedItem,
      };

      const { result } = renderHook(() => useBacklogMutations(propsWithoutCallbacks), { wrapper });

      act(() => {
        result.current.createItemMutation.mutate({
          title: 'New Item',
          teamId: 'team-1',
        });
      });

      await waitFor(() => {
        expect(result.current.createItemMutation.isSuccess).toBe(true);
      });

      expect(resetForm).toHaveBeenCalled();
    });

    it('should use default toast callbacks when not provided', async () => {
      const propsWithoutToasts = {
        resetForm,
        setFormErrors,
        setWorkflowError,
        setSelectedItem,
        onCreateSuccess,
      };

      vi.mocked(apiService.createProductBacklogItem).mockResolvedValue({
        success: true,
        data: createMockBacklogItem(),
      });

      const { result } = renderHook(() => useBacklogMutations(propsWithoutToasts), { wrapper });

      act(() => {
        result.current.createItemMutation.mutate({
          title: 'New Item',
          teamId: 'team-1',
        });
      });

      await waitFor(() => {
        expect(result.current.createItemMutation.isSuccess).toBe(true);
      });

      expect(onCreateSuccess).toHaveBeenCalled();
    });
  });
});
