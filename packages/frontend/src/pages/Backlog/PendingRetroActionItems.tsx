import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { LoadingState } from '../../components/common/Loading';
import { apiService } from '../../services';
import { useTeamStore } from '../../store';
import { queryKeys } from '../../hooks/queryKeys';
import type { RetroActionItem } from '../../types';
import {
  ClockIcon,
  RefreshIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileCheckIcon,
} from '../../components/common/Icons';

import styles from './PendingRetroActionItems.module.css';

interface RetroActionItemWithSprint extends RetroActionItem {
  sprint?: {
    name: string;
  };
}

interface PendingRetroActionItemsProps {
  onCreateWorkItem?: (actionItem: RetroActionItem) => void;
}

export const PendingRetroActionItems: React.FC<PendingRetroActionItemsProps> = ({
  onCreateWorkItem,
}) => {
  const { currentTeam } = useTeamStore();
  const teamId = currentTeam?.id;
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(true);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'IN_PROGRESS'>('all');

  const { data: actionItemsData, isLoading } = useQuery({
    queryKey: ['pending-retro-action-items', teamId],
    queryFn: () => apiService.getPendingRetroActionItems(teamId ?? ''),
    enabled: !!teamId,
  });

  const markAddedMutation = useMutation({
    mutationFn: ({ retroId, actionItemId }: { retroId: string; actionItemId: string }) =>
      apiService.updateActionItem(retroId, actionItemId, { addedToSprintBacklog: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.pendingRetroActionItems.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.retrospective.allList });
    },
  });

  const actionItems = (actionItemsData?.data ?? []) as RetroActionItemWithSprint[];

  const filteredActionItems =
    filter === 'all' ? actionItems : actionItems.filter((item) => item.status === filter);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusConfig = (
    status: string
  ): { label: string; icon: React.ReactNode; className: string } => {
    const configs: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      PENDING: {
        label: 'Pending',
        icon: <ClockIcon size={12} />,
        className: styles['status-pending'] ?? '',
      },
      IN_PROGRESS: {
        label: 'In Progress',
        icon: <RefreshIcon size={12} />,
        className: styles['status-in-progress'] ?? '',
      },
      COMPLETED: {
        label: 'Completed',
        icon: <CheckCircleIcon size={12} />,
        className: styles['status-completed'] ?? '',
      },
      CANCELLED: {
        label: 'Cancelled',
        icon: <XCircleIcon size={12} />,
        className: styles['status-cancelled'] ?? '',
      },
    };
    return (
      configs[status] ??
      (configs['PENDING'] as { label: string; icon: React.ReactNode; className: string })
    );
  };

  const handleCreateItem = (actionItem: RetroActionItem) => {
    if (onCreateWorkItem) {
      onCreateWorkItem(actionItem);
    }
  };

  const handleMarkAdded = (actionItem: RetroActionItem) => {
    markAddedMutation.mutate({
      retroId: actionItem.retrospectiveId,
      actionItemId: actionItem.id,
    });
  };

  if (actionItems.length === 0) {
    return null;
  }

  return (
    <div className={styles['container']}>
      <div className={styles['header']} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles['header-left']}>
          <span className={styles['icon']}>
            <FileCheckIcon size={20} aria-hidden="true" />
          </span>
          <h3 className={styles['title']}>Pending Action from Retrospective</h3>
          <span className={styles['count']}>{actionItems.length}</span>
        </div>
        <button className={styles['toggle-button']}>
          {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
        </button>
      </div>

      {isExpanded && (
        <div className={styles['content']}>
          <div className={styles['filters']}>
            <button
              className={`${styles['filter-button']} ${filter === 'all' ? styles['active'] : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({actionItems.length})
            </button>
            {['PENDING', 'IN_PROGRESS'].map((status) => {
              const count = actionItems.filter((item) => item.status === status).length;
              if (count === 0) return null;
              const config = getStatusConfig(status);
              return (
                <button
                  key={status}
                  className={`${styles['filter-button']} ${filter === status ? styles['active'] : ''}`}
                  onClick={() => setFilter(status as typeof filter)}
                >
                  {config.icon} {config.label} ({count})
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <LoadingState variant="skeleton-list" itemCount={5} label="Loading action items" />
          ) : (
            <div className={styles['action-items-list']}>
              {filteredActionItems.map((item) => {
                const config = getStatusConfig(item.status);
                return (
                  <div key={item.id} className={styles['action-item-card']}>
                    <div className={styles['card-header']}>
                      <span className={`${styles['status-badge']} ${config.className}`}>
                        {config.icon} {config.label}
                      </span>
                      <span className={styles['date']}>{formatDate(item.createdAt)}</span>
                    </div>

                    <h4 className={styles['action-item-title']}>{item.title}</h4>

                    {item.description && (
                      <p className={styles['action-item-description']}>{item.description}</p>
                    )}

                    <div className={styles['meta']}>
                      {item.owner && (
                        <div className={styles['owner']}>
                          <strong>Owner:</strong> {item.owner.firstName} {item.owner.lastName}
                        </div>
                      )}
                      {item.dueDate && (
                        <div className={styles['due-date']}>
                          <strong>Due:</strong> {formatDate(item.dueDate)}
                        </div>
                      )}
                    </div>

                    {item.sprint && (
                      <div className={styles['sprint-info']}>
                        <span className={styles['sprint-label']}>From Sprint:</span>
                        <span className={styles['sprint-name']}>{item.sprint.name}</span>
                      </div>
                    )}

                    <div className={styles['card-actions']}>
                      <button
                        className={styles['create-item-button']}
                        onClick={() => handleCreateItem(item)}
                      >
                        Create Item
                      </button>
                      <button
                        className={styles['mark-added-button']}
                        onClick={() => handleMarkAdded(item)}
                        disabled={markAddedMutation.isPending}
                      >
                        {markAddedMutation.isPending ? 'Updating...' : 'Mark Added'}
                      </button>
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
