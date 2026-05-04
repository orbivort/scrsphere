import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { LoadingState } from '../../components/common/Loading';
import { apiService } from '../../services';
import { useTeamStore } from '../../store';
import { queryKeys } from '../../hooks/queryKeys';
import type { BacklogAdjustment } from '../../types';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  AddIcon,
  ModifyIcon,
  RemoveIcon,
  ReorderIcon,
  ScissorsIcon,
  BellRingIcon,
} from '../../components/common/Icons';

import styles from './PendingAdjustments.module.css';

interface PendingAdjustmentsProps {
  onImplementAdd?: (adjustment: BacklogAdjustment) => void;
}

export const PendingAdjustments: React.FC<PendingAdjustmentsProps> = ({ onImplementAdd }) => {
  const { currentTeam } = useTeamStore();
  const teamId = currentTeam?.id;
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(true);
  const [filter, setFilter] = useState<'all' | 'add' | 'modify' | 'remove' | 'reorder' | 'split'>(
    'all'
  );

  const { data: adjustmentsData, isLoading } = useQuery({
    queryKey: ['pending-adjustments', teamId],
    queryFn: () => apiService.getPendingAdjustments(teamId || ''),
    enabled: !!teamId,
  });

  const implementMutation = useMutation({
    mutationFn: (adjustmentId: string) => apiService.markAdjustmentImplemented(adjustmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingAdjustments.all });
    },
  });

  const adjustments: BacklogAdjustment[] = adjustmentsData?.data || [];

  const filteredAdjustments =
    filter === 'all'
      ? adjustments
      : adjustments.filter((a: BacklogAdjustment) => a.action === filter);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getActionConfig = (action: string) => {
    const configs: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      add: { label: 'Add', icon: <AddIcon size={12} />, className: styles['action-add']! },
      modify: {
        label: 'Modify',
        icon: <ModifyIcon size={12} />,
        className: styles['action-modify']!,
      },
      remove: {
        label: 'Remove',
        icon: <RemoveIcon size={12} />,
        className: styles['action-remove']!,
      },
      reorder: {
        label: 'Reorder',
        icon: <ReorderIcon size={12} />,
        className: styles['action-reorder']!,
      },
      split: {
        label: 'Split',
        icon: <ScissorsIcon size={12} />,
        className: styles['action-split']!,
      },
    };
    return configs[action] ?? configs.add!;
  };

  const handleImplement = (adjustment: BacklogAdjustment) => {
    if (adjustment.action === 'add' && onImplementAdd) {
      onImplementAdd(adjustment);
    } else {
      implementMutation.mutate(adjustment.id);
    }
  };

  const handleMarkImplemented = (adjustmentId: string) => {
    implementMutation.mutate(adjustmentId);
  };

  if (adjustments.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles['header-left']}>
          <span className={styles.icon}>
            <BellRingIcon size={20} aria-hidden="true" />
          </span>
          <h3 className={styles.title}>Pending Adjustments</h3>
          <span className={styles.count}>{adjustments.length}</span>
        </div>
        <button className={styles['toggle-button']}>
          {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.content}>
          <div className={styles.filters}>
            <button
              className={`${styles['filter-button']} ${filter === 'all' ? styles.active : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({adjustments.length})
            </button>
            {['add', 'modify', 'remove', 'reorder', 'split'].map((action) => {
              const count = adjustments.filter(
                (a: BacklogAdjustment) => a.action === action
              ).length;
              if (count === 0) return null;
              const config = getActionConfig(action);
              return (
                <button
                  key={action}
                  className={`${styles['filter-button']} ${filter === action ? styles.active : ''}`}
                  onClick={() => setFilter(action as typeof filter)}
                >
                  {config.icon} {config.label} ({count})
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <LoadingState variant="skeleton-list" itemCount={5} label="Loading adjustments" />
          ) : (
            <div className={styles['adjustments-list']}>
              {filteredAdjustments.map((adjustment: BacklogAdjustment) => {
                const config = getActionConfig(adjustment.action);
                return (
                  <div key={adjustment.id} className={styles['adjustment-card']}>
                    <div className={styles['card-header']}>
                      <span className={`${styles['action-badge']} ${config.className}`}>
                        {config.icon} {config.label}
                      </span>
                      <span className={styles.date}>{formatDate(adjustment.createdAt)}</span>
                    </div>

                    <p className={styles.description}>{adjustment.description}</p>

                    <div className={styles.reason}>
                      <strong>Reason:</strong> {adjustment.reason}
                    </div>

                    {(adjustment as any).sprint && (
                      <div className={styles['sprint-info']}>
                        <span className={styles['sprint-label']}>From Sprint:</span>
                        <span className={styles['sprint-name']}>
                          {(adjustment as any).sprint.name}
                        </span>
                      </div>
                    )}

                    <div className={styles['card-actions']}>
                      {adjustment.action === 'add' && onImplementAdd && (
                        <button
                          className={styles['implement-button']}
                          onClick={() => handleImplement(adjustment)}
                        >
                          Create Item
                        </button>
                      )}
                      <button
                        className={styles['mark-implemented-button']}
                        onClick={() => handleMarkImplemented(adjustment.id)}
                        disabled={implementMutation.isPending}
                      >
                        {implementMutation.isPending ? 'Updating...' : 'Mark Done'}
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
