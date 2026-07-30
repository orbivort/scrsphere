/**
 * StatusHistorySection Component
 *
 * A shared, collapsible timeline component for displaying the history of status changes
 * for any entity (backlog item, goal, task, etc.).
 *
 * @module components/StatusHistorySection
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate, formatRelativeTime } from '@scrumooth/shared';

import { apiService } from '../../services';
import {
  ClockIcon,
  ChevronDownIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ArrowRightIcon,
  CircleIcon,
  UserIcon,
  MessageSquareIcon,
} from '../common/Icons';

import styles from './StatusHistorySection.module.css';

import { useI18nStore } from '@/i18n/useI18nStore';

/**
 * Color configuration for a status
 */
export interface StatusColorConfig {
  color: string;
  bgColor: string;
}

/**
 * Props for the StatusHistorySection component
 */
export interface StatusHistorySectionProps {
  /** The ID of the entity to fetch history for (required if history prop not provided) */
  entityId?: string;
  /** The type of entity (e.g., 'BacklogItem', 'Goal', 'Task') */
  entityType?: string;
  /** Optional custom title for the section */
  title?: string;
  /** Optional CSS class name for styling overrides */
  className?: string;
  /** Optional pre-fetched history data (if provided, API call is skipped) */
  history?: StatusChangeHistoryItem[];
  /** Optional loading state for pre-fetched data */
  isLoading?: boolean;
  /** Optional error state for pre-fetched data */
  error?: Error | null;
  /**
   * Optional custom color mapping for statuses.
   * Keys should be status names (case-insensitive).
   * If not provided, default colors are used.
   */
  statusColorMap?: Record<string, StatusColorConfig>;
  /**
   * Optional mapping for translating status names.
   * Keys should be status names from backend (e.g., 'NEW', 'ACTIVE').
   * Values should be translated display names.
   */
  statusNameMap?: Record<string, string>;
}

/**
 * Status change history item from API
 */
export interface StatusChangeHistoryItem {
  id: string;
  entityType: string;
  entityId: string;
  workflowId?: string;
  fromStateId?: string;
  toStateId: string;
  changedBy?: string;
  changeReason?: string;
  changeNotes?: string;
  transitionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  fromState?: {
    id: string;
    name: string;
    displayName?: string;
  };
  toState?: {
    id: string;
    name: string;
    displayName?: string;
  };
  changer?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * StatusHistorySection Component
 *
 * Renders a collapsible section that displays a timeline of status changes.
 * The timeline is loaded lazily when the user expands the section.
 *
 * Features:
 * - Lazy loading of history data
 * - Relative time formatting
 * - Color-coded status badges
 * - User attribution
 * - Change notes display
 * - Accessible toggle controls
 *
 * @param props - Component props
 * @returns The rendered StatusHistorySection component
 *
 * @example
 * ```tsx
 * <StatusHistorySection
 *   entityId="item-123"
 *   entityType="BacklogItem"
 *   title="Status History"
 * />
 * ```
 */
export const StatusHistorySection: React.FC<StatusHistorySectionProps> = ({
  entityId,
  entityType,
  title,
  className = '',
  history: externalHistory,
  isLoading: externalIsLoading,
  error: externalError,
  statusColorMap,
  statusNameMap,
}) => {
  const { t } = useTranslation('backlog');
  const { locale } = useI18nStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // Default title from translation if not provided
  const sectionTitle = title ?? t('statusHistory.title');

  /**
   * Translates a status name using the provided mapping or i18n keys
   */
  const getTranslatedStatusName = (statusName: string | undefined): string => {
    if (!statusName) return t('statusHistory.stateUnknown');
    // Use the statusNameMap if provided
    if (statusNameMap?.[statusName.toUpperCase()]) {
      return statusNameMap[statusName.toUpperCase()] ?? statusName;
    }
    // Map status names to i18n keys
    const statusKeyMap: Record<
      string,
      'status.new' | 'status.refined' | 'status.ready' | 'status.inProgress' | 'status.done'
    > = {
      NEW: 'status.new',
      REFINED: 'status.refined',
      READY: 'status.ready',
      IN_PROGRESS: 'status.inProgress',
      DONE: 'status.done',
      TODO: 'status.new', // TODO maps to New
    };
    const key = statusKeyMap[statusName.toUpperCase()];
    if (key) {
      return t(key);
    }
    // Fallback to the original name
    return statusName;
  };

  /**
   * Translates a change reason using i18n keys
   */
  const getTranslatedChangeReason = (reason: string | undefined): string => {
    if (!reason) return '';
    // Map change reason strings to i18n keys
    const reasonKeyMap: Record<
      string,
      | 'statusHistory.changeReasonInitialCreation'
      | 'statusHistory.changeReasonStatusUpdate'
      | 'statusHistory.changeReasonInitialCreationBulk'
      | 'statusHistory.changeReasonGoalInitialCreation'
      | 'statusHistory.changeReasonGoalStatusUpdate'
    > = {
      'Initial backlog item creation': 'statusHistory.changeReasonInitialCreation',
      'Backlog item status updated': 'statusHistory.changeReasonStatusUpdate',
      'Initial backlog item creation (bulk)': 'statusHistory.changeReasonInitialCreationBulk',
      'Initial goal creation': 'statusHistory.changeReasonGoalInitialCreation',
      'Goal status updated': 'statusHistory.changeReasonGoalStatusUpdate',
    };
    const key = reasonKeyMap[reason];
    if (key) {
      return t(key);
    }
    // Return original if no mapping found
    return reason;
  };

  // Use external data if provided, otherwise fetch from API
  const {
    data: historyData,
    isLoading: queryIsLoading,
    error: queryError,
    refetch,
    failureCount,
  } = useQuery({
    queryKey: ['statusChangeHistory', entityType, entityId],
    queryFn: () => apiService.getStatusChangeHistory(entityType ?? '', entityId ?? '', 20, 0),
    enabled: isExpanded && !externalHistory,
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Exponential backoff: retry up to 3 times with increasing delay
      if (failureCount >= 3) return false;
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const isLoading = externalIsLoading ?? queryIsLoading;
  const error = externalError ?? queryError;
  const history: StatusChangeHistoryItem[] = externalHistory ?? historyData?.data ?? [];

  /**
   * Formats a date string to locale-aware relative time for recent items,
   * or locale-aware absolute date for older items (7+ days)
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 7) {
      return formatRelativeTime(dateString, locale);
    }
    return formatLocaleDate(dateString, locale);
  };

  /**
   * Gets the color for a status name
   */
  const getStatusColor = (statusName: string): string => {
    // Check custom color map first
    if (statusColorMap) {
      const customColor =
        statusColorMap[statusName] ??
        statusColorMap[statusName.toUpperCase()] ??
        statusColorMap[statusName.toLowerCase()];
      if (customColor) return customColor.color;
    }
    // Fall back to default colors
    const colors: Record<string, string> = {
      NEW: 'var(--color-gray-500)',
      REFINED: 'var(--color-warning-500)',
      READY: 'var(--color-success-500)',
      IN_PROGRESS: 'var(--color-primary-500)',
      DONE: 'var(--color-success-600)',
      TODO: 'var(--color-gray-500)',
    };
    return colors[statusName] ?? 'var(--color-gray-500)';
  };

  /**
   * Gets the background color for a status name
   */
  const getStatusBgColor = (statusName: string): string => {
    // Check custom color map first
    if (statusColorMap) {
      const customColor =
        statusColorMap[statusName] ??
        statusColorMap[statusName.toUpperCase()] ??
        statusColorMap[statusName.toLowerCase()];
      if (customColor) return customColor.bgColor;
    }
    // Fall back to default colors
    const colors: Record<string, string> = {
      NEW: 'var(--color-gray-100)',
      REFINED: 'var(--color-warning-100)',
      READY: 'var(--color-success-100)',
      IN_PROGRESS: 'var(--color-primary-100)',
      DONE: 'var(--color-success-100)',
      TODO: 'var(--color-gray-100)',
    };
    return colors[statusName] ?? 'var(--color-gray-100)';
  };

  return (
    <div className={`${styles['status-history-section']} ${className}`}>
      <button
        className={styles['history-toggle']}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        type="button"
      >
        <div className={styles['history-toggle-left']}>
          <ClockIcon size={16} />
          <h3 className={styles['section-heading']}>{sectionTitle}</h3>
        </div>
        <ChevronDownIcon
          size={16}
          className={`${styles['toggle-chevron']} ${isExpanded ? styles.expanded : ''}`}
        />
      </button>

      {isExpanded && (
        <div className={styles['history-content']}>
          {isLoading && (
            <div className={styles['history-loading']}>
              <div className={styles['loading-spinner']}>
                <div className={styles['spinner-ring']} />
              </div>
              <span>{t('statusHistory.loadingHistory', 'Loading history...')}</span>
            </div>
          )}

          {error && !externalHistory && (
            <div className={styles['history-error']}>
              <div className={styles['error-header']}>
                <AlertCircleIcon size={20} />
                <span className={styles['error-title']}>
                  {t('statusHistory.failedToLoadHistory', 'Failed to load history')}
                </span>
              </div>
              <div className={styles['error-details']}>
                <p className={styles['error-message']}>
                  {error instanceof Error
                    ? error.message
                    : t('statusHistory.errorUnexpected', 'An unexpected error occurred')}
                </p>
                {failureCount > 0 && (
                  <p className={styles['error-attempts']}>
                    {t('statusHistory.errorAttempts', 'Attempt {{attempt}} of 3 failed', {
                      attempt: failureCount,
                    })}
                  </p>
                )}
              </div>
              <div className={styles['error-actions']}>
                <button
                  className={styles['retry-button']}
                  onClick={() => refetch()}
                  type="button"
                  disabled={queryIsLoading}
                >
                  {queryIsLoading ? (
                    <>
                      <span className={styles['retry-spinner']} />
                      {t('statusHistory.retrying', 'Retrying...')}
                    </>
                  ) : (
                    <>
                      <RefreshCwIcon size={14} />
                      {t('common:retry', 'Retry')}
                    </>
                  )}
                </button>
                <button
                  className={styles['dismiss-button']}
                  onClick={() => setIsExpanded(false)}
                  type="button"
                >
                  {t('statusHistory.dismiss', 'Dismiss')}
                </button>
              </div>
            </div>
          )}

          {error && externalHistory && (
            <div className={styles['history-error']}>
              <AlertCircleIcon size={16} />
              <span>{t('statusHistory.failedToLoadHistory', 'Failed to load history')}</span>
            </div>
          )}

          {!isLoading && !error && history.length === 0 && (
            <div className={styles['history-empty']}>
              <ClockIcon size={32} strokeWidth={1.5} />
              <span>{t('statusHistory.noStatusChangesYet', 'No status changes recorded yet')}</span>
            </div>
          )}

          {!isLoading && !error && history.length > 0 && (
            <div className={styles['timeline']}>
              {history.map((item, index) => {
                const fromStateName = getTranslatedStatusName(
                  item.fromState?.displayName ?? item.fromState?.name
                );
                const toStateName = getTranslatedStatusName(
                  item.toState?.displayName ?? item.toState?.name
                );
                const changerName = item.changer
                  ? `${item.changer.firstName} ${item.changer.lastName}`
                  : t('statusHistory.unknownUser', 'Unknown User');

                return (
                  <div
                    key={item.id}
                    className={`${styles['timeline-item']} ${index === 0 ? styles['timeline-item-latest'] : ''}`}
                  >
                    <div className={styles['timeline-connector']}>
                      <div
                        className={styles['timeline-dot']}
                        style={{
                          backgroundColor: getStatusColor(toStateName.toUpperCase()),
                          boxShadow: `0 0 0 3px ${getStatusBgColor(toStateName.toUpperCase())}`,
                        }}
                      />
                      {index < history.length - 1 && <div className={styles['timeline-line']} />}
                    </div>

                    <div className={styles['timeline-content']}>
                      <div className={styles['timeline-header']}>
                        <div className={styles['status-transition']}>
                          {item.fromState ? (
                            <>
                              <span
                                className={styles['status-badge-mini']}
                                style={{
                                  backgroundColor: getStatusBgColor(fromStateName.toUpperCase()),
                                  color: getStatusColor(fromStateName.toUpperCase()),
                                }}
                              >
                                {fromStateName}
                              </span>
                              <ArrowRightIcon size={14} className={styles['transition-arrow']} />
                            </>
                          ) : (
                            <CircleIcon size={14} className={styles['transition-arrow']} />
                          )}
                          <span
                            className={styles['status-badge-mini']}
                            style={{
                              backgroundColor: getStatusBgColor(toStateName.toUpperCase()),
                              color: getStatusColor(toStateName.toUpperCase()),
                            }}
                          >
                            {toStateName}
                          </span>
                        </div>
                        <span className={styles['timeline-time']}>
                          {formatDate(item.createdAt)}
                        </span>
                      </div>

                      <div className={styles['timeline-meta']}>
                        <div className={styles['timeline-user']}>
                          <UserIcon size={12} />
                          <span>{changerName}</span>
                        </div>
                        {item.changeReason && (
                          <div className={styles['timeline-reason']}>
                            <MessageSquareIcon size={12} />
                            <span>{getTranslatedChangeReason(item.changeReason)}</span>
                          </div>
                        )}
                      </div>

                      {item.changeNotes && (
                        <div className={styles['timeline-notes']}>{item.changeNotes}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusHistorySection;
