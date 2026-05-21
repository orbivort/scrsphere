import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { apiService } from '../../../services';
import { queryKeys } from '../../../hooks/queryKeys';
import { type ProductBacklogItem, type ProductGoal, type ApiResponse } from '../../../types';
import { type FilterState } from '../types/backlog.types';

const BACKLOG_ITEM_LIMIT = parseInt(import.meta.env.VITE_BACKLOG_ITEM_LIMIT ?? '100', 10);

export interface UseBacklogDataReturn {
  backlogData: { data: ProductBacklogItem[] } | undefined;
  goalsData: ApiResponse<ProductGoal[]> | undefined;
  activeGoal: ProductGoal | null;
  filteredItems: ProductBacklogItem[];
  isLoading: boolean;
  isLoadingGoals: boolean;
  totalCount: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  isAutoLoading: boolean;
}

export const useBacklogData = (
  teamId: string | undefined,
  filters: FilterState
): UseBacklogDataReturn => {
  const {
    data: infiniteData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.productBacklog.list({ teamId, limit: BACKLOG_ITEM_LIMIT }),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiService.getProductBacklog(teamId ?? '', {
        page: pageParam,
        limit: BACKLOG_ITEM_LIMIT,
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!teamId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: goalsData, isLoading: isLoadingGoals } = useQuery({
    queryKey: queryKeys.productGoal.list({ teamId }),
    queryFn: () => apiService.getProductGoals(teamId ?? ''),
    enabled: !!teamId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const backlogData = useMemo(() => {
    if (!infiniteData) return undefined;
    const allItems = infiniteData.pages.flatMap((page) => page.data);
    return { data: allItems };
  }, [infiniteData]);

  const totalCount = useMemo(() => {
    if (!infiniteData?.pages[0]) return 0;
    return infiniteData.pages[0].pagination.total;
  }, [infiniteData]);

  const activeGoal = useMemo(() => {
    const goals = goalsData?.data ?? [];
    const activeGoals = goals.filter((g) => g.status.toUpperCase() === 'ACTIVE');
    return activeGoals.length > 0 ? (activeGoals[0] ?? null) : null;
  }, [goalsData?.data]);

  const filteredItems = useMemo(() => {
    let items = backlogData?.data ?? [];

    if (activeGoal?.id) {
      items = items.filter((item) => item.goalId === activeGoal.id);
    }

    if (filters.status.length > 0) {
      items = items.filter((item) => filters.status.includes(item.status));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          (item.description?.toLowerCase().includes(searchLower) ?? false) ||
          item.labels.some((l) => l.toLowerCase().includes(searchLower))
      );
    }

    return items;
  }, [backlogData?.data, filters, activeGoal?.id]);

  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const isAutoLoadingRef = useRef(false);

  useEffect(() => {
    if (filters.search && hasNextPage && !isFetchingNextPage && !isAutoLoadingRef.current) {
      isAutoLoadingRef.current = true;
      void fetchNextPage();
    }

    if (!filters.search) {
      isAutoLoadingRef.current = false;
    }

    if (!hasNextPage) {
      isAutoLoadingRef.current = false;
    }
  }, [filters.search, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const isAutoLoading = Boolean(filters.search && hasNextPage && isFetchingNextPage);

  return {
    backlogData,
    goalsData,
    activeGoal,
    filteredItems,
    isLoading,
    isLoadingGoals,
    totalCount,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: handleFetchNextPage,
    isAutoLoading,
  };
};
