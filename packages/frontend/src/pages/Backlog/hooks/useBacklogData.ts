import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiService } from '../../../services';
import { queryKeys } from '../../../hooks/queryKeys';
import { type ProductBacklogItem, type ProductGoal, type ApiResponse } from '../../../types';
import { type FilterState } from '../types/backlog.types';

// Environment variable for backlog item limit (default: 200)
const BACKLOG_ITEM_LIMIT = parseInt(import.meta.env.VITE_BACKLOG_ITEM_LIMIT ?? '200', 10);

/**
 * Return type for useBacklogData hook
 */
export interface UseBacklogDataReturn {
  /** Raw backlog data from API */
  backlogData: { data: ProductBacklogItem[] } | undefined;
  /** Raw goals data from API */
  goalsData: ApiResponse<ProductGoal[]> | undefined;
  /** Currently active product goal */
  activeGoal: ProductGoal | null;
  /** Filtered backlog items based on active goal and filters */
  filteredItems: ProductBacklogItem[];
  /** Loading state for backlog data */
  isLoading: boolean;
  /** Loading state for goals data */
  isLoadingGoals: boolean;
}

/**
 * Hook for fetching and computing backlog data
 *
 * Extracts product backlog query, product goals query, and derived computations
 * for active goal and filtered items.
 *
 * @param teamId - The current team ID
 * @param filters - Filter state for backlog items
 * @returns Object containing backlog data, goals, active goal, filtered items, and loading states
 *
 * @example
 * ```tsx
 * const { backlogData, activeGoal, filteredItems, isLoading, isLoadingGoals } = useBacklogData(teamId, filters);
 * ```
 */
export const useBacklogData = (
  teamId: string | undefined,
  filters: FilterState
): UseBacklogDataReturn => {
  // Fetch product backlog items
  const { data: backlogData, isLoading } = useQuery({
    queryKey: queryKeys.productBacklog.list({ teamId, limit: BACKLOG_ITEM_LIMIT }),
    queryFn: () => apiService.getProductBacklog(teamId ?? '', { limit: BACKLOG_ITEM_LIMIT }),
    enabled: !!teamId,
    staleTime: 0, // Always fetch fresh data when component mounts
    refetchOnMount: 'always', // Refetch when component mounts
  });

  // Fetch product goals
  const { data: goalsData, isLoading: isLoadingGoals } = useQuery({
    queryKey: queryKeys.productGoal.list({ teamId }),
    queryFn: () => apiService.getProductGoals(teamId ?? ''),
    enabled: !!teamId,
    staleTime: 0, // Always fetch fresh data to ensure correct active goal
    refetchOnMount: 'always', // Refetch when component mounts
  });

  // Compute active goal from goals data
  const activeGoal = useMemo(() => {
    const goals = goalsData?.data ?? [];
    const activeGoals = goals.filter((g) => g.status.toUpperCase() === 'ACTIVE');
    return activeGoals.length > 0 ? (activeGoals[0] ?? null) : null;
  }, [goalsData?.data]);

  // Compute filtered items based on active goal and filters
  const filteredItems = useMemo(() => {
    let items = backlogData?.data ?? [];

    // Filter by active goal
    if (activeGoal?.id) {
      items = items.filter((item) => item.goalId === activeGoal.id);
    }

    // Filter by status
    if (filters.status.length > 0) {
      items = items.filter((item) => filters.status.includes(item.status));
    }

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter(
        (item) =>
          (item.title.toLowerCase().includes(searchLower) ||
            item.description?.toLowerCase().includes(searchLower)) ??
          item.labels.some((l) => l.toLowerCase().includes(searchLower))
      );
    }

    return items;
  }, [backlogData?.data, filters, activeGoal?.id]);

  return {
    backlogData,
    goalsData,
    activeGoal,
    filteredItems,
    isLoading,
    isLoadingGoals,
  };
};
