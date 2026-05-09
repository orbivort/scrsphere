import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { LoadingState } from '../../components/common/Loading';
import { apiService } from '../../services';
import { useTeamStore } from '../../store';
import { queryKeys } from '../../hooks/queryKeys';
import type { StakeholderFeedback } from '../../types';
import {
  ThumbsUpIcon,
  ThumbsDownIcon,
  LightbulbIcon,
  HelpCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MessageCircleIcon,
} from '../../components/common/Icons';

import styles from './PendingFeedback.module.css';

interface StakeholderFeedbackWithSprint extends StakeholderFeedback {
  sprint?: {
    name: string;
  };
}

interface PendingFeedbackProps {
  onCreateWorkItem?: (feedback: StakeholderFeedback) => void;
}

export const PendingFeedback: React.FC<PendingFeedbackProps> = ({ onCreateWorkItem }) => {
  const { currentTeam } = useTeamStore();
  const teamId = currentTeam?.id;
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(true);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'suggestion' | 'question'>(
    'all'
  );

  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ['pending-feedback', teamId],
    queryFn: () => apiService.getPendingFeedback(teamId ?? ''),
    enabled: !!teamId,
  });

  const addressMutation = useMutation({
    mutationFn: (feedbackId: string) => apiService.markFeedbackAddressed(feedbackId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.pendingFeedback.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprintReview.all });
    },
  });

  const feedback = (feedbackData?.data ?? []) as StakeholderFeedbackWithSprint[];

  const filteredFeedback =
    filter === 'all'
      ? feedback
      : feedback.filter((f: StakeholderFeedbackWithSprint) => f.category === filter);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryConfig = (
    category: string
  ): { label: string; icon: React.ReactNode; className: string } => {
    const configs: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      positive: {
        label: 'Positive',
        icon: <ThumbsUpIcon size={12} />,
        className: styles['category-positive'] ?? '',
      },
      negative: {
        label: 'Negative',
        icon: <ThumbsDownIcon size={12} />,
        className: styles['category-negative'] ?? '',
      },
      suggestion: {
        label: 'Suggestion',
        icon: <LightbulbIcon size={12} />,
        className: styles['category-suggestion'] ?? '',
      },
      question: {
        label: 'Question',
        icon: <HelpCircleIcon size={12} />,
        className: styles['category-question'] ?? '',
      },
    };
    return (
      configs[category] ??
      (configs['suggestion'] as { label: string; icon: React.ReactNode; className: string })
    );
  };

  const handleCreateItem = (feedback: StakeholderFeedback) => {
    if (onCreateWorkItem) {
      onCreateWorkItem(feedback);
    }
  };

  const handleMarkAddressed = (feedbackId: string) => {
    addressMutation.mutate(feedbackId);
  };

  if (feedback.length === 0) {
    return null;
  }

  return (
    <div className={styles['container']}>
      <div className={styles['header']} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles['header-left']}>
          <span className={styles['icon']}>
            <MessageCircleIcon size={20} aria-hidden="true" />
          </span>
          <h3 className={styles['title']}>Pending Feedback</h3>
          <span className={styles['count']}>{feedback.length}</span>
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
              All ({feedback.length})
            </button>
            {['positive', 'negative', 'suggestion', 'question'].map((category) => {
              const count = feedback.filter(
                (f: StakeholderFeedback) => f.category === category
              ).length;
              if (count === 0) return null;
              const config = getCategoryConfig(category);
              return (
                <button
                  key={category}
                  className={`${styles['filter-button']} ${filter === category ? styles['active'] : ''}`}
                  onClick={() => setFilter(category as typeof filter)}
                >
                  {config.icon} {config.label} ({count})
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <LoadingState variant="skeleton-list" itemCount={5} label="Loading feedback" />
          ) : (
            <div className={styles['feedback-list']}>
              {filteredFeedback.map((item: StakeholderFeedbackWithSprint) => {
                const config = getCategoryConfig(item.category);
                return (
                  <div key={item.id} className={styles['feedback-card']}>
                    <div className={styles['card-header']}>
                      <span className={`${styles['category-badge']} ${config.className}`}>
                        {config.icon} {config.label}
                      </span>
                      <span className={styles['date']}>{formatDate(item.createdAt)}</span>
                    </div>

                    <p className={styles['feedback-content']}>{item.content}</p>

                    <div className={styles['author']}>
                      <strong>From:</strong> {item.authorName}
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
                        className={styles['mark-addressed-button']}
                        onClick={() => handleMarkAddressed(item.id)}
                        disabled={addressMutation.isPending}
                      >
                        {addressMutation.isPending ? 'Updating...' : 'Mark Addressed'}
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
