/**
 * EmptyState Component
 *
 * A comprehensive empty state solution for the application including:
 * - EmptyState component with predefined and custom configurations
 * - useEmptyStateValidation hook for automatic validation logic
 * - Helper functions for page-based validation checks
 * - Type definitions for TypeScript support
 *
 * @example
 * // Basic usage with predefined type
 * import { EmptyState } from './components/EmptyState';
 *
 * <EmptyState type="no-active-sprint" />
 *
 * @example
 * // With validation hook
 * import { EmptyState, useEmptyStateValidation } from './components/EmptyState';
 *
 * const { shouldShowEmptyState, emptyStateType } = useEmptyStateValidation({
 *   currentPage: 'SprintBoard',
 *   hasTeam: !!currentTeam,
 *   hasActiveGoal: !!activeGoal,
 *   hasActiveSprint: !!activeSprint,
 * });
 *
 * if (shouldShowEmptyState) {
 *   return <EmptyState type={emptyStateType!} />;
 * }
 */

// Main component
export { EmptyState, NoTeamSelected, NoActiveGoal, NoActiveSprint } from './EmptyState';

// Validation hook
export {
  useEmptyStateValidation,
  requiresTeam,
  requiresActiveGoal,
  requiresActiveSprint,
  getPagesRequiringCheck,
} from './useEmptyStateValidation';

// Icons (for custom empty states)
export {
  UsersIcon,
  GoalIcon,
  SprintIcon,
  RunningIcon,
  InboxIcon,
  ErrorIcon,
  SearchIcon,
  FlagIcon,
} from './icons';

// Types
export type {
  EmptyStateType,
  AppPage,
  EmptyStateValidationConfig,
  EmptyStateProps,
  UseEmptyStateValidationProps,
  UseEmptyStateValidationResult,
  EmptyStateTypeConfig,
} from './types';

// Default export
export { EmptyState as default } from './EmptyState';
