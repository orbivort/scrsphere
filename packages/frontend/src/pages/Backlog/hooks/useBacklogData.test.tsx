import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useBacklogData } from './useBacklogData';
import { apiService } from '../../../services';
import { ItemStatus, MoSCoWPriority } from '../../../types';
import type { FilterState } from '../types/backlog.types';

vi.mock('../../../services', () => ({
  apiService: {
    getProductBacklog: vi.fn(),
    getProductGoals: vi.fn(),
  },
}));

vi.mock('../../../hooks/queryKeys', () => ({
  queryKeys: {
    productBacklog: {
      list: vi.fn().mockReturnValue(['productBacklog', 'list']),
      all: ['productBacklog'],
    },
    productGoal: {
      list: vi.fn().mockReturnValue(['productGoal', 'list']),
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

const createMockGoal = (overrides = {}) => ({
  id: 'goal-1',
  teamId: 'team-1',
  title: 'Test Goal',
  description: 'Test goal description',
  status: 'ACTIVE',
  targetDate: '2026-12-31T00:00:00Z',
  successMetrics: 'Test metrics',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const defaultFilters: FilterState = {
  status: [],
  search: '',
};

describe('useBacklogData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return loading states initially', () => {
      vi.mocked(apiService.getProductBacklog).mockImplementation(() => new Promise(() => {}));
      vi.mocked(apiService.getProductGoals).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useBacklogData('team-1', defaultFilters), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isLoadingGoals).toBe(true);
    });

    it('should return undefined data initially', () => {
      vi.mocked(apiService.getProductBacklog).mockImplementation(() => new Promise(() => {}));
      vi.mocked(apiService.getProductGoals).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useBacklogData('team-1', defaultFilters), { wrapper });

      expect(result.current.backlogData).toBeUndefined();
      expect(result.current.goalsData).toBeUndefined();
      expect(result.current.activeGoal).toBeNull();
      expect(result.current.filteredItems).toEqual([]);
    });
  });

  describe('Data Fetching', () => {
    it('should fetch backlog items successfully', async () => {
      const mockItems = [createMockBacklogItem()];

      vi.mocked(apiService.getProductBacklog).mockResolvedValue({
        success: true,
        data: mockItems,
        pagination: { page: 1, limit: 100, totalPages: 1, total: mockItems.length },
      });
      vi.mocked(apiService.getProductGoals).mockResolvedValue({
        success: true,
        data: [],
      });

      const { result } = renderHook(() => useBacklogData('team-1', defaultFilters), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.backlogData?.data).toEqual(mockItems);
    });

    it('should fetch goals successfully', async () => {
      const mockGoals = [createMockGoal()];

      vi.mocked(apiService.getProductBacklog).mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 100, totalPages: 1, total: 0 },
      });
      vi.mocked(apiService.getProductGoals).mockResolvedValue({
        success: true,
        data: mockGoals,
      });

      const { result } = renderHook(() => useBacklogData('team-1', defaultFilters), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingGoals).toBe(false);
      });

      expect(result.current.goalsData?.data).toEqual(mockGoals);
    });

    it('should not fetch when teamId is undefined', async () => {
      const { result } = renderHook(() => useBacklogData(undefined, defaultFilters), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiService.getProductBacklog).not.toHaveBeenCalled();
      expect(apiService.getProductGoals).not.toHaveBeenCalled();
    });
  });

  describe('Active Goal Computation', () => {
    it('should compute active goal from goals data', async () => {
      const activeGoal = createMockGoal({ id: 'goal-active', status: 'ACTIVE' });
      const inactiveGoal = createMockGoal({ id: 'goal-inactive', status: 'COMPLETED' });

      vi.mocked(apiService.getProductBacklog).mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 100, totalPages: 1, total: 0 },
      });
      vi.mocked(apiService.getProductGoals).mockResolvedValue({
        success: true,
        data: [inactiveGoal, activeGoal],
      });

      const { result } = renderHook(() => useBacklogData('team-1', defaultFilters), { wrapper });

      await waitFor(() => {
        expect(result.current.activeGoal).not.toBeNull();
      });

      expect(result.current.activeGoal?.id).toBe('goal-active');
    });

    it('should return null when no active goal exists', async () => {
      const completedGoal = createMockGoal({ status: 'COMPLETED' });

      vi.mocked(apiService.getProductBacklog).mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 100, totalPages: 1, total: 0 },
      });
      vi.mocked(apiService.getProductGoals).mockResolvedValue({
        success: true,
        data: [completedGoal],
      });

      const { result } = renderHook(() => useBacklogData('team-1', defaultFilters), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingGoals).toBe(false);
      });

      expect(result.current.activeGoal).toBeNull();
    });

    it('should return null when goals data is empty', async () => {
      vi.mocked(apiService.getProductBacklog).mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 100, totalPages: 1, total: 0 },
      });
      vi.mocked(apiService.getProductGoals).mockResolvedValue({
        success: true,
        data: [],
      });

      const { result } = renderHook(() => useBacklogData('team-1', defaultFilters), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingGoals).toBe(false);
      });

      expect(result.current.activeGoal).toBeNull();
    });

    it('should handle lowercase active status', async () => {
      const activeGoal = createMockGoal({ status: 'active' });

      vi.mocked(apiService.getProductBacklog).mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 100, totalPages: 1, total: 0 },
      });
      vi.mocked(apiService.getProductGoals).mockResolvedValue({
        success: true,
        data: [activeGoal],
      });

      const { result } = renderHook(() => useBacklogData('team-1', defaultFilters), { wrapper });

      await waitFor(() => {
        expect(result.current.activeGoal).not.toBeNull();
      });
    });
  });

  describe('Filtered Items Computation', () => {
    it('should filter items by active goal', async () => {
      const activeGoal = createMockGoal({ id: 'goal-1' });
      const item1 = createMockBacklogItem({ id: 'pbi-1', goalId: 'goal-1' });
      const item2 = createMockBacklogItem({ id: 'pbi-2', goalId: 'goal-2' });

      vi.mocked(apiService.getProductBacklog).mockResolvedValue({
        success: true,
        data: [item1, item2],
        pagination: { page: 1, limit: 100, totalPages: 1, total: 2 },
      });
      vi.mocked(apiService.getProductGoals).mockResolvedValue({
        success: true,
        data: [activeGoal],
      });

      const { result } = renderHook(() => useBacklogData('team-1', defaultFilters), { wrapper });

      await waitFor(() => {
        expect(result.current.filteredItems.length).toBe(1);
      });

      expect(result.current.filteredItems[0]?.id).toBe('pbi-1');
    });

    it('should filter items by status', async () => {
      const activeGoal = createMockGoal({ id: 'goal-1' });
      const item1 = createMockBacklogItem({
        id: 'pbi-1',
        goalId: 'goal-1',
        status: ItemStatus.NEW,
      });
      const item2 = createMockBacklogItem({
        id: 'pbi-2',
        goalId: 'goal-1',
        status: ItemStatus.REFINED,
      });

      vi.mocked(apiService.getProductBacklog).mockResolvedValue({
        success: true,
        data: [item1, item2],
        pagination: { page: 1, limit: 100, totalPages: 1, total: 2 },
      });
      vi.mocked(apiService.getProductGoals).mockResolvedValue({
        success: true,
        data: [activeGoal],
      });

      const filters: FilterState = {
        status: [ItemStatus.NEW],
        search: '',
      };

      const { result } = renderHook(() => useBacklogData('team-1', filters), { wrapper });

      await waitFor(() => {
        expect(result.current.filteredItems.length).toBe(1);
      });

      expect(result.current.filteredItems[0]?.id).toBe('pbi-1');
    });

    it('should filter items by multiple statuses', async () => {
      const activeGoal = createMockGoal({ id: 'goal-1' });
      const item1 = createMockBacklogItem({
        id: 'pbi-1',
        goalId: 'goal-1',
        status: ItemStatus.NEW,
      });
      const item2 = createMockBacklogItem({
        id: 'pbi-2',
        goalId: 'goal-1',
        status: ItemStatus.REFINED,
      });
      const item3 = createMockBacklogItem({
        id: 'pbi-3',
        goalId: 'goal-1',
        status: ItemStatus.DONE,
      });

      vi.mocked(apiService.getProductBacklog).mockResolvedValue({
        success: true,
        data: [item1, item2, item3],
        pagination: { page: 1, limit: 100, totalPages: 1, total: 3 },
      });
      vi.mocked(apiService.getProductGoals).mockResolvedValue({
        success: true,
        data: [activeGoal],
      });

      const filters: FilterState = {
        status: [ItemStatus.NEW, ItemStatus.REFINED],
        search: '',
      };

      const { result } = renderHook(() => useBacklogData('team-1', filters), { wrapper });

      await waitFor(() => {
        expect(result.current.filteredItems.length).toBe(2);
      });
    });

    it('should filter items by search term in title', async () => {
      const activeGoal = createMockGoal({ id: 'goal-1' });
      const item1 = createMockBacklogItem({
        id: 'pbi-1',
        goalId: 'goal-1',
        title: 'Authentication Feature',
      });
      const item2 = createMockBacklogItem({
        id: 'pbi-2',
        goalId: 'goal-1',
        title: 'Dashboard UI',
      });

      vi.mocked(apiService.getProductBacklog).mockResolvedValue({
        success: true,
        data: [item1, item2],
        pagination: { page: 1, limit: 100, totalPages: 1, total: 2 },
      });
      vi.mocked(apiService.getProductGoals).mockResolvedValue({
        success: true,
        data: [activeGoal],
      });

      const filters: FilterState = {
        status: [],
        search: 'authentication',
      };

      const { result } = renderHook(() => useBacklogData('team-1', filters), { wrapper });

      await waitFor(() => {
        expect(result.current.filteredItems.length).toBe(1);
      });

      expect(result.current.filteredItems[0]?.id).toBe('pbi-1');
    });

    it('should filter items by search term in description', async () => {
      const activeGoal = createMockGoal({ id: 'goal-1' });
      const item1 = createMockBacklogItem({
        id: 'pbi-1',
        goalId: 'goal-1',
        description: 'Implement user login functionality',
      });
      const item2 = createMockBacklogItem({
        id: 'pbi-2',
        goalId: 'goal-1',
        description: 'Create dashboard widgets',
      });

      vi.mocked(apiService.getProductBacklog).mockResolvedValue({
        success: true,
        data: [item1, item2],
        pagination: { page: 1, limit: 100, totalPages: 1, total: 2 },
      });
      vi.mocked(apiService.getProductGoals).mockResolvedValue({
        success: true,
        data: [activeGoal],
      });

      const filters: FilterState = {
        status: [],
        search: 'login',
      };

      const { result } = renderHook(() => useBacklogData('team-1', filters), { wrapper });

      await waitFor(() => {
        expect(result.current.filteredItems.length).toBe(1);
      });

      expect(result.current.filteredItems[0]?.id).toBe('pbi-1');
    });

    it('should filter items by search term in labels', async () => {
      const activeGoal = createMockGoal({ id: 'goal-1' });
      const item1 = createMockBacklogItem({
        id: 'pbi-1',
        goalId: 'goal-1',
        labels: ['security', 'authentication'],
      });
      const item2 = createMockBacklogItem({
        id: 'pbi-2',
        goalId: 'goal-1',
        labels: ['ui', 'frontend'],
      });

      vi.mocked(apiService.getProductBacklog).mockResolvedValue({
        success: true,
        data: [item1, item2],
        pagination: { page: 1, limit: 100, totalPages: 1, total: 2 },
      });
      vi.mocked(apiService.getProductGoals).mockResolvedValue({
        success: true,
        data: [activeGoal],
      });

      const filters: FilterState = {
        status: [],
        search: 'security',
      };

      const { result } = renderHook(() => useBacklogData('team-1', filters), { wrapper });

      await waitFor(() => {
        expect(result.current.filteredItems.length).toBe(1);
      });

      expect(result.current.filteredItems[0]?.id).toBe('pbi-1');
    });

    it('should be case-insensitive for search', async () => {
      const activeGoal = createMockGoal({ id: 'goal-1' });
      const item1 = createMockBacklogItem({
        id: 'pbi-1',
        goalId: 'goal-1',
        title: 'AUTHENTICATION Feature',
      });

      vi.mocked(apiService.getProductBacklog).mockResolvedValue({
        success: true,
        data: [item1],
        pagination: { page: 1, limit: 100, totalPages: 1, total: 1 },
      });
      vi.mocked(apiService.getProductGoals).mockResolvedValue({
        success: true,
        data: [activeGoal],
      });

      const filters: FilterState = {
        status: [],
        search: 'AUTHENTICATION',
      };

      const { result } = renderHook(() => useBacklogData('team-1', filters), { wrapper });

      await waitFor(() => {
        expect(result.current.filteredItems.length).toBe(1);
      });
    });

    it('should combine status and search filters', async () => {
      const activeGoal = createMockGoal({ id: 'goal-1' });
      const item1 = createMockBacklogItem({
        id: 'pbi-1',
        goalId: 'goal-1',
        status: ItemStatus.NEW,
        title: 'Authentication Feature',
      });
      const item2 = createMockBacklogItem({
        id: 'pbi-2',
        goalId: 'goal-1',
        status: ItemStatus.REFINED,
        title: 'Authentication Backend',
      });
      const item3 = createMockBacklogItem({
        id: 'pbi-3',
        goalId: 'goal-1',
        status: ItemStatus.NEW,
        title: 'Dashboard UI',
      });

      vi.mocked(apiService.getProductBacklog).mockResolvedValue({
        success: true,
        data: [item1, item2, item3],
        pagination: { page: 1, limit: 100, totalPages: 1, total: 3 },
      });
      vi.mocked(apiService.getProductGoals).mockResolvedValue({
        success: true,
        data: [activeGoal],
      });

      const filters: FilterState = {
        status: [ItemStatus.NEW],
        search: 'authentication',
      };

      const { result } = renderHook(() => useBacklogData('team-1', filters), { wrapper });

      await waitFor(() => {
        expect(result.current.filteredItems.length).toBe(1);
      });

      expect(result.current.filteredItems[0]?.id).toBe('pbi-1');
    });

    it('should return all items when no active goal', async () => {
      const item1 = createMockBacklogItem({ id: 'pbi-1', goalId: 'goal-1' });
      const item2 = createMockBacklogItem({ id: 'pbi-2', goalId: 'goal-2' });

      vi.mocked(apiService.getProductBacklog).mockResolvedValue({
        success: true,
        data: [item1, item2],
        pagination: { page: 1, limit: 100, totalPages: 1, total: 2 },
      });
      vi.mocked(apiService.getProductGoals).mockResolvedValue({
        success: true,
        data: [],
      });

      const { result } = renderHook(() => useBacklogData('team-1', defaultFilters), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.filteredItems.length).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      vi.mocked(apiService.getProductBacklog).mockRejectedValue(new Error('Network error'));
      vi.mocked(apiService.getProductGoals).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBacklogData('team-1', defaultFilters), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.backlogData).toBeUndefined();
    });
  });
});
