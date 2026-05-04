import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';

import { useSprintsData } from './useSprintsData';
import * as storeModule from '../store';
import { apiService } from '../services';
import type { GeneratedSprint } from '../types';

vi.mock('../store', () => ({
  useTeamStore: vi.fn(),
}));

vi.mock('../services', () => ({
  apiService: {
    getGeneratedSprints: vi.fn(),
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
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

const createMockSprint = (
  id: string,
  startDate: string,
  endDate: string,
  name?: string
): GeneratedSprint => ({
  id,
  name: name || `Sprint ${id}`,
  startDate,
  endDate,
  status: 'PLANNED',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

describe('useSprintsData', () => {
  const mockTeamId = 'team-1';

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(storeModule.useTeamStore).mockReturnValue({
      currentTeam: { id: mockTeamId, name: 'Test Team' } as any,
    } as any);
  });

  describe('data fetching', () => {
    it('should not fetch when teamId is null', () => {
      vi.mocked(storeModule.useTeamStore).mockReturnValue({
        currentTeam: null,
      } as any);

      renderHook(() => useSprintsData(2024), { wrapper: createWrapper() });

      expect(apiService.getGeneratedSprints).not.toHaveBeenCalled();
    });

    it('should fetch sprints when teamId is available', async () => {
      const mockSprints = [createMockSprint('1', '2024-01-01', '2024-01-14')];

      vi.mocked(apiService.getGeneratedSprints).mockResolvedValue({
        success: true,
        data: mockSprints,
      });

      renderHook(() => useSprintsData(2024), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(apiService.getGeneratedSprints).toHaveBeenCalledWith(mockTeamId, 2024);
      });
    });

    it('should return loading state correctly', async () => {
      vi.mocked(apiService.getGeneratedSprints).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useSprintsData(2024), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(true);
    });

    it('should return error state correctly', async () => {
      const mockError = new Error('Failed to fetch');

      vi.mocked(apiService.getGeneratedSprints).mockRejectedValue(mockError);

      const { result } = renderHook(() => useSprintsData(2024), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('sprint categorization', () => {
    it('should categorize sprints into current and future', async () => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 30);

      const currentSprint = createMockSprint(
        '1',
        today.toISOString().split('T')[0],
        new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'Current Sprint'
      );

      const futureSprint = createMockSprint(
        '2',
        futureDate.toISOString().split('T')[0],
        new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'Future Sprint'
      );

      vi.mocked(apiService.getGeneratedSprints).mockResolvedValue({
        success: true,
        data: [currentSprint, futureSprint],
      });

      const { result } = renderHook(() => useSprintsData(2024), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.sprints).toHaveLength(2);
      });

      expect(result.current.categorizedSprints.current).toHaveLength(1);
      expect(result.current.categorizedSprints.future).toHaveLength(1);
    });

    it('should exclude past sprints', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const pastSprint = createMockSprint(
        '1',
        new Date(pastDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        pastDate.toISOString().split('T')[0],
        'Past Sprint'
      );

      vi.mocked(apiService.getGeneratedSprints).mockResolvedValue({
        success: true,
        data: [pastSprint],
      });

      const { result } = renderHook(() => useSprintsData(2024), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.sprints).toHaveLength(1);
      });

      expect(result.current.categorizedSprints.current).toHaveLength(0);
      expect(result.current.categorizedSprints.future).toHaveLength(0);
    });

    it('should handle sprints without start/end dates', async () => {
      const sprintWithoutDates = {
        id: '1',
        name: 'Sprint 1',
        startDate: null,
        endDate: null,
        status: 'PLANNED',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      } as unknown as GeneratedSprint;

      vi.mocked(apiService.getGeneratedSprints).mockResolvedValue({
        success: true,
        data: [sprintWithoutDates],
      });

      const { result } = renderHook(() => useSprintsData(2024), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.sprints).toHaveLength(1);
      });

      expect(result.current.categorizedSprints.current).toHaveLength(0);
      expect(result.current.categorizedSprints.future).toHaveLength(0);
    });

    it('should sort sprints by start date', async () => {
      const today = new Date();
      const futureDate1 = new Date(today);
      futureDate1.setDate(futureDate1.getDate() + 14);
      const futureDate2 = new Date(today);
      futureDate2.setDate(futureDate2.getDate() + 7);

      const sprint1 = createMockSprint(
        '1',
        futureDate1.toISOString().split('T')[0],
        new Date(futureDate1.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'Sprint 1'
      );

      const sprint2 = createMockSprint(
        '2',
        futureDate2.toISOString().split('T')[0],
        new Date(futureDate2.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'Sprint 2'
      );

      vi.mocked(apiService.getGeneratedSprints).mockResolvedValue({
        success: true,
        data: [sprint1, sprint2],
      });

      const { result } = renderHook(() => useSprintsData(2024), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.categorizedSprints.future).toHaveLength(2);
      });

      expect(result.current.categorizedSprints.future[0].id).toBe('2');
      expect(result.current.categorizedSprints.future[1].id).toBe('1');
    });

    it('should return empty arrays when no data', async () => {
      vi.mocked(apiService.getGeneratedSprints).mockResolvedValue({
        success: true,
        data: null,
      });

      const { result } = renderHook(() => useSprintsData(2024), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.sprints).toEqual([]);
      });

      expect(result.current.categorizedSprints.current).toEqual([]);
      expect(result.current.categorizedSprints.future).toEqual([]);
    });
  });
});
