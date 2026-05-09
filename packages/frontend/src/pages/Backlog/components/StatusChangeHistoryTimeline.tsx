/**
 * StatusChangeHistoryTimeline Component
 *
 * A collapsible timeline component for displaying the history of status changes
 * for a backlog item or other entity.
 *
 * @module pages/Backlog/components/StatusChangeHistoryTimeline
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiService } from '../../../services';

import styles from './StatusChangeHistoryTimeline.module.css';

import {
  ClockIcon,
  ChevronDownIcon,
  InfoIcon,
  ArrowRightIcon,
  UserIcon,
  MessageCircleIcon,
} from '@/components/common/Icons';

/**
 * Props for the StatusChangeHistoryTimeline component
 */
export interface StatusChangeHistoryTimelineProps {
  /** The ID of the entity to fetch history for */
  entityId: string;
  /** The type of entity (e.g., 'BacklogItem', 'Task') */
  entityType: string;
}

/**
 * Status change history item from API
 */
interface StatusChangeHistoryItem {
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
 * StatusChangeHistoryTimeline Component
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
 *
 * @param props - Component props
 * @returns The rendered StatusChangeHistoryTimeline component
 *
 * @example
 * ```tsx
 * <StatusChangeHistoryTimeline
 *   entityId="item-123"
 *   entityType="BacklogItem"
 * />
 * ```
 */
export const StatusChangeHistoryTimeline: React.FC<StatusChangeHistoryTimelineProps> = ({
  entityId,
  entityType,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    data: historyData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['statusChangeHistory', entityType, entityId],
    queryFn: () => apiService.getStatusChangeHistory(entityType, entityId, 20, 0),
    enabled: isExpanded,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const history: StatusChangeHistoryItem[] = historyData?.data ?? [];

  /**
   * Formats a date string to relative time
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  /**
   * Gets the color for a status name
   */
  const getStatusColor = (statusName: string): string => {
    const colors: Record<string, string> = {
      NEW: 'var(--color-gray-500)',
      REFINED: 'var(--color-warning-500)',
      READY: 'var(--color-success-500)',
      IN_PROGRESS: 'var(--color-primary-500)',
      DONE: 'var(--color-success-600)',
    };
    return colors[statusName] ?? 'var(--color-gray-500)';
  };

  /**
   * Gets the background color for a status name
   */
  const getStatusBgColor = (statusName: string): string => {
    const colors: Record<string, string> = {
      NEW: 'var(--color-gray-100)',
      REFINED: 'var(--color-warning-100)',
      READY: 'var(--color-success-100)',
      IN_PROGRESS: 'var(--color-primary-100)',
      DONE: 'var(--color-success-100)',
    };
    return colors[statusName] ?? 'var(--color-gray-100)';
  };

  return (
    <div className={styles['detail-section']}>
      <button
        className={styles['history-toggle']}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        type="button"
      >
        <div className={styles['history-toggle-left']}>
          <ClockIcon size={16} />
          <h3 className={styles['section-heading']}>Status History</h3>
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
              <span>Loading history...</span>
            </div>
          )}

          {error && (
            <div className={styles['history-error']}>
              <InfoIcon size={16} />
              <span>Failed to load history</span>
            </div>
          )}

          {!isLoading && !error && history.length === 0 && (
            <div className={styles['history-empty']}>
              <ClockIcon size={32} />
              <span>No status changes recorded yet</span>
            </div>
          )}

          {!isLoading && !error && history.length > 0 && (
            <div className={styles['timeline']}>
              {history.map((item, index) => {
                const fromStateName = item.fromState?.displayName ?? item.fromState?.name ?? 'New';
                const toStateName = item.toState?.displayName ?? item.toState?.name ?? 'Unknown';
                const changerName = item.changer
                  ? `${item.changer.firstName} ${item.changer.lastName}`
                  : 'Unknown User';

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
                            <ArrowRightIcon size={14} className={styles['transition-arrow']} />
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
                            <MessageCircleIcon size={12} />
                            <span>{item.changeReason}</span>
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

export default StatusChangeHistoryTimeline;
