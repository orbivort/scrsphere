/**
 * EmptyState Component Types
 *
 * Shared types for the EmptyState component system
 */

/**
 * Predefined empty state types for common scenarios
 */
export type EmptyStateType =
  | 'no-team'
  | 'no-active-goal'
  | 'no-active-sprint'
  | 'no-completed-sprint'
  | 'no-data'
  | 'error'
  | 'custom';

/**
 * Application pages that require empty state validation
 */
export type AppPage =
  | 'Dashboard'
  | 'Backlog'
  | 'SprintPlanning'
  | 'SprintBoard'
  | 'DailyScrum'
  | 'Impediments'
  | 'Increment'
  | 'SprintReview'
  | 'Retrospective'
  | 'ProductGoals'
  | 'TeamManagement'
  | 'Settings'
  | 'Reports'
  | 'Notifications';

/**
 * Configuration for empty state validation per page
 */
export interface EmptyStateValidationConfig {
  /** Whether to check for team selection */
  checkTeam: boolean;
  /** Whether to check for active goal */
  checkActiveGoal: boolean;
  /** Whether to check for active sprint */
  checkActiveSprint: boolean;
}

/**
 * Props for the EmptyState component
 */
export interface EmptyStateProps {
  /** Predefined empty state type (uses default icons/messages) */
  type?: EmptyStateType;
  /** Custom icon (overrides type's default icon) */
  icon?: React.ReactNode;
  /** Custom title (overrides type's default title) */
  title?: string;
  /** Custom description (overrides type's default description) */
  description?: string;
  /** Optional action button configuration */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    href?: string;
  };
  /** Visual variant for different contexts */
  variant?: 'default' | 'compact' | 'full-page';
  /** ARIA role for accessibility */
  role?: string;
  /** ARIA live region for accessibility */
  'aria-live'?: 'polite' | 'assertive';
  /** Additional CSS class */
  className?: string;
  /** Data test id for testing */
  'data-testid'?: string;
}

/**
 * Props for the useEmptyStateValidation hook
 */
export interface UseEmptyStateValidationProps {
  /** Current page identifier */
  currentPage: AppPage;
  /** Whether a team is selected */
  hasTeam: boolean;
  /** Whether an active goal exists */
  hasActiveGoal: boolean;
  /** Whether an active sprint exists */
  hasActiveSprint: boolean;
  /** Optional loading state */
  isLoading?: boolean;
}

/**
 * Result from the useEmptyStateValidation hook
 */
export interface UseEmptyStateValidationResult {
  /** Whether any empty state should be shown */
  shouldShowEmptyState: boolean;
  /** The type of empty state to show, if any */
  emptyStateType: EmptyStateType | null;
  /** Configuration for the empty state */
  config: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
      variant?: 'primary' | 'secondary';
    };
  } | null;
}

/**
 * Default configuration for each empty state type
 */
export interface EmptyStateTypeConfig {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
}
