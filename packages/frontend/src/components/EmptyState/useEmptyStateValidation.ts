/**
 * useEmptyStateValidation Hook
 *
 * Provides validation logic for empty states across different pages.
 * Determines which empty state (if any) should be displayed based on
 * the current page and application state.
 *
 * Validation Rules:
 * 1. No Team Selected - Mandatory for all pages except TeamManagement
 * 2. No Active Goal - Mandatory for: Dashboard, Backlog, SprintPlanning,
 *    SprintBoard, DailyScrum, Impediments, Increment, SprintReview, Retrospective
 * 3. No Active Sprint - Mandatory for: SprintBoard, DailyScrum, Impediments
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type {
  AppPage,
  EmptyStateType,
  UseEmptyStateValidationProps,
  UseEmptyStateValidationResult,
  EmptyStateValidationConfig,
} from './types';

/**
 * Validation configuration for each page
 * Defines which checks are required for each page
 */
const PAGE_VALIDATION_CONFIG: Record<AppPage, EmptyStateValidationConfig> = {
  // Pages requiring ALL checks (Team, Goal, Sprint)
  SprintBoard: {
    checkTeam: true,
    checkActiveGoal: true,
    checkActiveSprint: true,
  },
  DailyScrum: {
    checkTeam: true,
    checkActiveGoal: true,
    checkActiveSprint: true,
  },
  Impediments: {
    checkTeam: true,
    checkActiveGoal: true,
    checkActiveSprint: true,
  },

  // Pages requiring Team and Goal checks
  Dashboard: {
    checkTeam: true,
    checkActiveGoal: true,
    checkActiveSprint: false,
  },
  Backlog: {
    checkTeam: true,
    checkActiveGoal: true,
    checkActiveSprint: false,
  },
  SprintPlanning: {
    checkTeam: true,
    checkActiveGoal: true,
    checkActiveSprint: false,
  },
  Increment: {
    checkTeam: true,
    checkActiveGoal: true,
    checkActiveSprint: false,
  },
  SprintReview: {
    checkTeam: true,
    checkActiveGoal: true,
    checkActiveSprint: false,
  },
  Retrospective: {
    checkTeam: true,
    checkActiveGoal: true,
    checkActiveSprint: false,
  },

  // Pages requiring only Team check
  ProductGoals: {
    checkTeam: true,
    checkActiveGoal: false,
    checkActiveSprint: false,
  },

  // Pages with no mandatory checks (or handled differently)
  TeamManagement: {
    checkTeam: false,
    checkActiveGoal: false,
    checkActiveSprint: false,
  },
  Settings: {
    checkTeam: false,
    checkActiveGoal: false,
    checkActiveSprint: false,
  },
  Reports: {
    checkTeam: true,
    checkActiveGoal: false,
    checkActiveSprint: false,
  },
  Notifications: {
    checkTeam: false,
    checkActiveGoal: false,
    checkActiveSprint: false,
  },
};

/**
 * Default messages for each empty state type
 */
const EMPTY_STATE_MESSAGES: Record<
  Exclude<EmptyStateType, 'custom' | 'no-data' | 'error' | 'no-completed-sprint'>,
  {
    title: string;
    description: string;
    actionLabel: string;
    actionPath: string;
  }
> = {
  'no-team': {
    title: 'No Team Selected',
    description: 'Please select a team to continue.',
    actionLabel: 'Select Team',
    actionPath: '/team',
  },
  'no-active-goal': {
    title: 'No Active Goal',
    description: 'Please set an active product goal before continuing.',
    actionLabel: 'Go to Product Goals',
    actionPath: '/product-goals',
  },
  'no-active-sprint': {
    title: 'No Active Sprint',
    description: 'Start a new sprint from Sprint Planning to continue.',
    actionLabel: 'Go to Sprint Planning',
    actionPath: '/sprint-planning',
  },
};

/**
 * Hook to determine which empty state should be displayed
 *
 * @param props - Validation props including current page and state flags
 * @returns Object containing whether to show empty state and which type
 *
 * @example
 * const { shouldShowEmptyState, emptyStateType, config } = useEmptyStateValidation({
 *   currentPage: 'SprintBoard',
 *   hasTeam: !!currentTeam,
 *   hasActiveGoal: !!activeGoal,
 *   hasActiveSprint: !!activeSprint,
 *   isLoading: isLoadingTeam || isLoadingGoal,
 * });
 *
 * if (shouldShowEmptyState) {
 *   return <EmptyState type={emptyStateType} />;
 * }
 */
export const useEmptyStateValidation = ({
  currentPage,
  hasTeam,
  hasActiveGoal,
  hasActiveSprint,
  isLoading = false,
}: UseEmptyStateValidationProps): UseEmptyStateValidationResult => {
  const navigate = useNavigate();

  return useMemo(() => {
    // Don't show empty state while loading
    if (isLoading) {
      return {
        shouldShowEmptyState: false,
        emptyStateType: null,
        config: null,
      };
    }

    const config = PAGE_VALIDATION_CONFIG[currentPage];

    // Check 1: No Team Selected (highest priority)
    if (config.checkTeam && !hasTeam) {
      const messages = EMPTY_STATE_MESSAGES['no-team'];
      return {
        shouldShowEmptyState: true,
        emptyStateType: 'no-team',
        config: {
          icon: null, // Will use default
          title: messages.title,
          description: messages.description,
          action: {
            label: messages.actionLabel,
            onClick: () => navigate(messages.actionPath),
            variant: 'primary',
          },
        },
      };
    }

    // Check 2: No Active Goal (medium priority)
    if (config.checkActiveGoal && !hasActiveGoal) {
      const messages = EMPTY_STATE_MESSAGES['no-active-goal'];
      return {
        shouldShowEmptyState: true,
        emptyStateType: 'no-active-goal',
        config: {
          icon: null, // Will use default
          title: messages.title,
          description: messages.description,
          action: {
            label: messages.actionLabel,
            onClick: () => navigate(messages.actionPath),
            variant: 'primary',
          },
        },
      };
    }

    // Check 3: No Active Sprint (lowest priority)
    if (config.checkActiveSprint && !hasActiveSprint) {
      const messages = EMPTY_STATE_MESSAGES['no-active-sprint'];
      return {
        shouldShowEmptyState: true,
        emptyStateType: 'no-active-sprint',
        config: {
          icon: null, // Will use default
          title: messages.title,
          description: messages.description,
          action: {
            label: messages.actionLabel,
            onClick: () => navigate(messages.actionPath),
            variant: 'primary',
          },
        },
      };
    }

    // All checks passed - no empty state needed
    return {
      shouldShowEmptyState: false,
      emptyStateType: null,
      config: null,
    };
  }, [currentPage, hasTeam, hasActiveGoal, hasActiveSprint, isLoading, navigate]);
};

/**
 * Helper function to check if a page requires team selection
 */
export const requiresTeam = (page: AppPage): boolean => {
  return PAGE_VALIDATION_CONFIG[page].checkTeam;
};

/**
 * Helper function to check if a page requires active goal
 */
export const requiresActiveGoal = (page: AppPage): boolean => {
  return PAGE_VALIDATION_CONFIG[page].checkActiveGoal;
};

/**
 * Helper function to check if a page requires active sprint
 */
export const requiresActiveSprint = (page: AppPage): boolean => {
  return PAGE_VALIDATION_CONFIG[page].checkActiveSprint;
};

/**
 * Get all pages that require a specific validation check
 */
export const getPagesRequiringCheck = (checkType: 'team' | 'goal' | 'sprint'): AppPage[] => {
  return (Object.keys(PAGE_VALIDATION_CONFIG) as AppPage[]).filter((page) => {
    const config = PAGE_VALIDATION_CONFIG[page];
    switch (checkType) {
      case 'team':
        return config.checkTeam;
      case 'goal':
        return config.checkActiveGoal;
      case 'sprint':
        return config.checkActiveSprint;
      default:
        return false;
    }
  });
};

export default useEmptyStateValidation;
