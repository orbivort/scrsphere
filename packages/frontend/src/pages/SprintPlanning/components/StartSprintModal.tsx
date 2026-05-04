import React, { useEffect, useRef } from 'react';

import styles from './StartSprintModal.module.css';

import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  FileTextIcon,
  RocketIcon,
  TargetIcon,
  UsersIcon,
  XIcon,
} from '@/components/common/Icons';
import { canStartSprint } from '@/utils/roleUtils';

export interface SprintStats {
  totalItems: number;
  totalPoints: number;
  totalTasks: number;
  estimatedHours: number;
}

export interface StartSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sprintName: string;
  sprintGoal?: string;
  sprintDuration: number;
  stats: SprintStats;
  teamCapacity: number;
  capacityPercentage: number;
  error?: string | null;
  isLoading?: boolean;
  userRole?: string | null;
}

// Icons imported from shared library

// Helper function to get user-friendly error message
const getFriendlyErrorMessage = (error: string): { title: string; message: string } => {
  const lowerError = error.toLowerCase();

  // Check for specific business logic errors first (before generic HTTP status codes)
  if (lowerError.includes('another sprint is already active')) {
    return {
      title: 'Active Sprint Exists',
      message:
        'Another sprint is already active. Please complete or cancel the current active sprint before starting a new one.',
    };
  }

  if (lowerError.includes('assignee')) {
    return {
      title: 'Invalid Task Assignment',
      message:
        'One or more tasks are assigned to invalid team members. Please review task assignments and ensure all assignees are current team members.',
    };
  }

  if (lowerError.includes('sprint goal') || lowerError.includes('goal is required')) {
    return {
      title: 'Sprint Goal Required',
      message: 'Please define a sprint goal before starting the sprint.',
    };
  }

  if (lowerError.includes('backlog') || lowerError.includes('no items')) {
    return {
      title: 'Invalid Sprint Backlog',
      message:
        'There is an issue with the sprint backlog items. Please remove and re-add the items, then try again.',
    };
  }

  // Check for HTTP status codes and generic errors
  if (lowerError.includes('401') || lowerError.includes('unauthorized')) {
    return {
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again and retry.',
    };
  }

  if (lowerError.includes('403') || lowerError.includes('forbidden')) {
    return {
      title: 'Permission Denied',
      message:
        'You do not have permission to start sprints. Please contact your team administrator.',
    };
  }

  if (lowerError.includes('404') || lowerError.includes('not found')) {
    return {
      title: 'Sprint Not Found',
      message:
        'The selected sprint no longer exists. It may have been deleted. Please refresh and select a different sprint.',
    };
  }

  if (lowerError.includes('409') || lowerError.includes('conflict')) {
    return {
      title: 'Sprint Conflict',
      message: 'This sprint is being modified by another user. Please wait a moment and try again.',
    };
  }

  if (lowerError.includes('400') || lowerError.includes('bad request')) {
    return {
      title: 'Invalid Request',
      message:
        'Please check your sprint data and try again. Make sure all required fields are filled correctly.',
    };
  }

  if (lowerError.includes('network') || lowerError.includes('fetch')) {
    return {
      title: 'Network Error',
      message:
        'Unable to connect to the server. Please check your internet connection and try again.',
    };
  }

  if (lowerError.includes('timeout')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long to complete. Please try again.',
    };
  }

  // Default fallback
  return {
    title: 'Unable to Start Sprint',
    message: error,
  };
};

export const StartSprintModal: React.FC<StartSprintModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sprintName,
  sprintGoal,
  sprintDuration,
  stats,
  teamCapacity,
  capacityPercentage,
  error,
  isLoading = false,
  userRole,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Get friendly error message if error exists
  // If error is already formatted (contains periods and spaces), display it directly
  const isPreFormatted = error && (error.includes('. ') || error.length > 100);
  const friendlyError = error
    ? isPreFormatted
      ? { title: 'Error', message: error }
      : getFriendlyErrorMessage(error)
    : null;

  // Reset and handle modal open/close
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!isLoading) {
          onClose();
        }
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Determine capacity status
  const getCapacityStatus = () => {
    if (capacityPercentage > 100) return 'danger';
    if (capacityPercentage > 80) return 'warning';
    return 'success';
  };

  const capacityStatus = getCapacityStatus();
  const hasPermissionToStart = canStartSprint(userRole ?? null);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-sprint-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient orb */}
        <div className={styles['gradient-orb']} aria-hidden="true" />

        {/* Header */}
        <header className={styles.header}>
          <div className={styles['header-content']}>
            <div className={styles['icon-wrapper']}>
              <RocketIcon size={24} />
            </div>
            <h2 id="start-sprint-title" className={styles.title}>
              Start Sprint
            </h2>
            <p className={styles.subtitle}>
              Ready to launch <span className={styles['sprint-highlight']}>{sprintName}</span>?
            </p>
          </div>
          <button
            type="button"
            className={styles['close-button']}
            onClick={onClose}
            aria-label="Close modal"
            disabled={isLoading}
          >
            <XIcon size={20} />
          </button>
        </header>

        {/* Progress indicator */}
        <div className={styles['progress-bar']} aria-hidden="true">
          <div className={styles['progress-fill']} style={{ width: '100%' }} />
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Permission Warning */}
          {!hasPermissionToStart && (
            <div className={styles['error-banner']} role="alert">
              <span className={styles['error-icon']}>
                <AlertTriangleIcon size={16} />
              </span>
              <div className={styles['error-content']}>
                <span className={styles['error-title']}>Permission Required</span>
                <span className={styles['error-text']}>
                  Only Product Owner or Scrum Master can start a sprint. Please contact your team
                  administrator if you need this permission.
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {friendlyError && (
            <div className={styles['error-banner']} role="alert">
              <span className={styles['error-icon']}>
                <AlertTriangleIcon size={16} />
              </span>
              <div className={styles['error-content']}>
                <span className={styles['error-title']}>{friendlyError.title}</span>
                <span className={styles['error-text']}>{friendlyError.message}</span>
              </div>
            </div>
          )}

          {/* Sprint Summary Card */}
          <div className={styles['summary-card']}>
            <div className={styles['summary-header']}>
              <h3 className={styles['summary-title']}>Sprint Summary</h3>
              <span className={styles['summary-badge']}>Ready to Start</span>
            </div>

            <div className={styles['summary-grid']}>
              <div className={styles['summary-item']}>
                <span className={styles['summary-icon']}>
                  <CalendarIcon size={16} />
                </span>
                <div className={styles['summary-content']}>
                  <span className={styles['summary-label']}>Duration</span>
                  <span className={styles['summary-value']}>{sprintDuration} days</span>
                </div>
              </div>

              <div className={styles['summary-item']}>
                <span className={styles['summary-icon']}>
                  <FileTextIcon size={16} />
                </span>
                <div className={styles['summary-content']}>
                  <span className={styles['summary-label']}>Backlog Items</span>
                  <span className={styles['summary-value']}>{stats.totalItems}</span>
                </div>
              </div>

              <div className={styles['summary-item']}>
                <span className={styles['summary-icon']}>
                  <TargetIcon size={16} />
                </span>
                <div className={styles['summary-content']}>
                  <span className={styles['summary-label']}>Story Points</span>
                  <span className={styles['summary-value']}>{stats.totalPoints}</span>
                </div>
              </div>

              <div className={styles['summary-item']}>
                <span className={styles['summary-icon']}>
                  <CheckIcon size={16} />
                </span>
                <div className={styles['summary-content']}>
                  <span className={styles['summary-label']}>Tasks</span>
                  <span className={styles['summary-value']}>{stats.totalTasks}</span>
                </div>
              </div>

              <div className={styles['summary-item']}>
                <span className={styles['summary-icon']}>
                  <ClockIcon size={16} />
                </span>
                <div className={styles['summary-content']}>
                  <span className={styles['summary-label']}>Est. Hours</span>
                  <span className={styles['summary-value']}>{stats.estimatedHours}h</span>
                </div>
              </div>

              <div className={styles['summary-item']}>
                <span className={styles['summary-icon']}>
                  <UsersIcon size={16} />
                </span>
                <div className={styles['summary-content']}>
                  <span className={styles['summary-label']}>Team Capacity</span>
                  <span className={styles['summary-value']}>{teamCapacity}h</span>
                </div>
              </div>
            </div>

            {/* Capacity Indicator */}
            <div className={styles['capacity-section']}>
              <div className={styles['capacity-header']}>
                <span className={styles['capacity-label']}>Capacity Utilization</span>
                <span
                  className={`${styles['capacity-value']} ${styles[`capacity-${capacityStatus}`]}`}
                >
                  {capacityPercentage}%
                </span>
              </div>
              <div className={styles['capacity-bar']}>
                <div
                  className={`${styles['capacity-fill']} ${styles[`capacity-fill-${capacityStatus}`]}`}
                  style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                />
              </div>
              {capacityStatus === 'danger' && (
                <p className={styles['capacity-warning-message']}>
                  <AlertTriangleIcon size={16} />
                  Sprint is over capacity. Consider removing some items.
                </p>
              )}
              {capacityStatus === 'warning' && (
                <p className={styles['capacity-warning-message']}>
                  <AlertTriangleIcon size={16} />
                  Sprint is near capacity. Monitor progress closely.
                </p>
              )}
            </div>

            {/* Sprint Goal */}
            {sprintGoal && (
              <div className={styles['goal-section']}>
                <div className={styles['goal-header']}>
                  <span className={styles['goal-icon']}>
                    <TargetIcon size={16} />
                  </span>
                  <h4 className={styles['goal-title']}>Sprint Goal</h4>
                </div>
                <p className={styles['goal-text']}>{sprintGoal}</p>
              </div>
            )}
          </div>

          {/* Confirmation Notice */}
          <div className={styles['notice-box']}>
            <span className={styles['notice-icon']}>
              <CheckIcon size={16} />
            </span>
            <p className={styles['notice-text']}>
              Starting this sprint will activate it and redirect you to the Sprint Board. Make sure
              all items are properly planned.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <button
            type="button"
            className={styles['button-secondary']}
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles['button-primary']}
            onClick={onConfirm}
            disabled={isLoading || capacityStatus === 'danger' || !hasPermissionToStart}
            aria-busy={isLoading}
            title={
              !hasPermissionToStart
                ? 'Only Product Owner or Scrum Master can start a sprint'
                : undefined
            }
          >
            {isLoading ? (
              <>
                <span className={styles['button-spinner']} />
                Starting...
              </>
            ) : (
              <>
                <span className={styles['button-icon']}>
                  <RocketIcon size={16} />
                </span>
                Start Sprint
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
