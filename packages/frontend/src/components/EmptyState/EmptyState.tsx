/**
 * EmptyState Component
 *
 * A reusable empty state component for displaying various empty state scenarios
 * including: No Team Selected, No Active Goal, No Active Sprint, and custom states.
 *
 * @example
 * // Predefined type usage
 * <EmptyState type="no-active-sprint" />
 *
 * @example
 * // Custom empty state
 * <EmptyState
 *   icon={<CustomIcon />}
 *   title="Custom Title"
 *   description="Custom description text"
 *   action={{ label: "Take Action", onClick: handleAction }}
 * />
 */

import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';

import type { EmptyStateProps, EmptyStateType } from './types';
import {
  UsersIcon,
  GoalIcon,
  SprintIcon,
  InboxIcon,
  ErrorIcon,
  SearchIcon,
  ClipboardListIcon,
  ArrowRightIcon,
} from './icons';
import styles from './EmptyState.module.css';

/**
 * Default configurations for predefined empty state types
 */
const DEFAULT_CONFIGS: Record<
  EmptyStateType,
  {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: {
      label: string;
      path: string;
      variant: 'primary' | 'secondary';
    };
  }
> = {
  'no-team': {
    icon: <UsersIcon size={64} />,
    title: 'No Team Selected',
    description: 'Please select a team to continue.',
  },
  'no-active-goal': {
    icon: <GoalIcon size={64} />,
    title: 'No Active Goal',
    description: 'Please set an active product goal before continuing.',
    action: {
      label: 'Go to Product Goals',
      path: '/product-goals',
      variant: 'primary',
    },
  },
  'no-active-sprint': {
    icon: <SprintIcon size={64} />,
    title: 'No Active Sprint',
    description: 'Start a new sprint from Sprint Planning to continue.',
    action: {
      label: 'Go to Sprint Planning',
      path: '/sprint-planning',
      variant: 'primary',
    },
  },
  'no-completed-sprint': {
    icon: <ClipboardListIcon size={64} />,
    title: 'No Completed Sprint',
    description: 'Complete a sprint to start tracking.',
  },
  'no-data': {
    icon: <InboxIcon size={64} />,
    title: 'No Data Available',
    description: 'There is no data to display at this time.',
  },
  error: {
    icon: <ErrorIcon size={64} />,
    title: 'Something Went Wrong',
    description: 'An error occurred while loading the data. Please try again.',
  },
  custom: {
    icon: <SearchIcon size={64} />,
    title: '',
    description: '',
  },
};

/**
 * EmptyState Component
 *
 * Displays an empty state with icon, title, description, and optional action button.
 * Supports predefined types for common scenarios or fully custom content.
 */
export const EmptyState = memo<EmptyStateProps>(
  ({
    type = 'custom',
    icon,
    title,
    description,
    action,
    variant = 'default',
    role = 'status',
    'aria-live': ariaLive = 'polite',
    className = '',
    'data-testid': dataTestId = 'empty-state',
  }) => {
    const navigate = useNavigate();
    const config = DEFAULT_CONFIGS[type];

    // Determine final values (custom props override defaults)
    const finalIcon = icon ?? config.icon;
    const finalTitle = title ?? config.title;
    const finalDescription = description ?? config.description;

    // Handle action - use custom action or default from config
    const finalAction =
      action ??
      (config.action
        ? {
            label: config.action.label,
            variant: config.action.variant,
            onClick: () => {
              const actionPath = config.action?.path ?? '';
              void navigate(actionPath);
            },
          }
        : undefined);

    // Build CSS class names
    const containerClasses = [styles['empty-state-container'], styles[variant], className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={containerClasses} role={role} aria-live={ariaLive} data-testid={dataTestId}>
        <div className={styles['empty-state-content']}>
          {finalIcon && (
            <span className={styles['empty-state-icon']} aria-hidden="true">
              {finalIcon}
            </span>
          )}

          {finalTitle && <h2 className={styles['empty-state-title']}>{finalTitle}</h2>}

          {finalDescription && (
            <p className={styles['empty-state-description']}>{finalDescription}</p>
          )}

          {finalAction && (
            <div className={styles['empty-state-actions']}>
              <button
                className={`${styles['empty-state-button']} ${styles[`button-${finalAction.variant}`]}`}
                onClick={finalAction.onClick}
                type="button"
              >
                <ArrowRightIcon size={16} className={styles['button-icon']} />
                {finalAction.label}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

/**
 * Convenience exports for common empty state types
 */
export const NoTeamSelected: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="no-team" {...props} />
);

export const NoActiveGoal: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="no-active-goal" {...props} />
);

export const NoActiveSprint: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="no-active-sprint" {...props} />
);

export default EmptyState;
