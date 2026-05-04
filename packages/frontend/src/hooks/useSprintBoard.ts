import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiService } from '../services';
import type { Sprint, ProductBacklogItem, Task } from '../types';

import { queryKeys } from './queryKeys';

export interface SprintStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  totalPbis: number;
  completedPbis: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  totalEstimatedHours: number;
  totalRemainingHours: number;
  progressPercentage: number;
}

export interface UseSprintBoardOptions {
  teamId: string | null;
}

export interface UseSprintBoardReturn {
  // Data
  sprint: Sprint | null;
  sprintItems: ProductBacklogItem[];
  sprintStats: SprintStats;
  sprintDuration: number;
  daysRemaining: number;

  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Actions
  completeSprint: () => void;
  isCompleting: boolean;
  completeSprintError: Error | null;
  resetCompleteSprintError: () => void;
}

/**
 * useSprintBoard Hook
 *
 * Manages sprint data, statistics, and actions.
 * Encapsulates all sprint-related queries and mutations.
 */
export function useSprintBoard({ teamId }: UseSprintBoardOptions): UseSprintBoardReturn {
  const queryClient = useQueryClient();

  // Fetch active sprint
  const {
    data: sprintData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.sprint.active(teamId || ''),
    queryFn: () => apiService.getActiveSprint(teamId!),
    enabled: !!teamId,
  });

  const sprint = sprintData?.data || null;
  const sprintItems = sprint?.items || [];

  // Calculate sprint duration
  const sprintDuration = useMemo(() => {
    if (!sprint) return 0;
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [sprint]);

  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    if (!sprint) return 0;
    const today = new Date();
    const end = new Date(sprint.endDate);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [sprint]);

  // Calculate sprint statistics
  const sprintStats = useMemo((): SprintStats => {
    const tasks = sprint?.tasks || [];

    const totalTasks = tasks.length;
    const todoTasks = tasks.filter((t: Task) => t.status === 'TODO').length;
    const inProgressTasks = tasks.filter((t: Task) => t.status === 'IN_PROGRESS').length;
    const doneTasks = tasks.filter((t: Task) => t.status === 'DONE').length;

    const totalPbis = sprintItems.length;
    const completedPbis = sprintItems.filter((item) => item.status === 'DONE').length;

    const totalStoryPoints = sprintItems.reduce((sum, item) => sum + (item.storyPoints || 0), 0);
    const completedStoryPoints = sprintItems
      .filter((item) => item.status === 'DONE')
      .reduce((sum, item) => sum + (item.storyPoints || 0), 0);

    const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
    const totalRemainingHours = tasks.reduce(
      (sum, task) => sum + (task.remainingHours || task.estimatedHours || 0),
      0
    );

    const progressPercentage =
      totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0;

    return {
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      totalPbis,
      completedPbis,
      totalStoryPoints,
      completedStoryPoints,
      totalEstimatedHours,
      totalRemainingHours,
      progressPercentage,
    };
  }, [sprint?.tasks, sprintItems]);

  // Complete sprint mutation
  const {
    mutate: completeSprint,
    isPending: isCompleting,
    error: completeSprintError,
    reset: resetCompleteSprintError,
  } = useMutation({
    mutationFn: async () => {
      if (!sprint?.id) throw new Error('No active sprint');
      return apiService.completeSprint(sprint.id);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.task.all });
    },
  });

  return {
    sprint,
    sprintItems,
    sprintStats,
    sprintDuration,
    daysRemaining,
    isLoading,
    isError,
    error: error as Error | null,
    completeSprint,
    isCompleting,
    completeSprintError: completeSprintError as Error | null,
    resetCompleteSprintError,
  };
}
