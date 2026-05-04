import React, { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { apiService } from '../../services';
import { useTeamStore } from '../../store';
import {
  SprintStatus,
  IncrementStatus,
  type Sprint,
  type SprintReview,
  type Increment,
} from '../../types';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/common/Loading';
import {
  CheckCircleIcon,
  PackageIcon,
  PlayIcon,
  FileTextIcon,
  PlusIcon,
  EyeIcon,
} from '../../components/common/Icons';

import styles from './SprintReviewList.module.css';

interface SprintWithReview extends Sprint {
  review?: SprintReview;
  increment?: Increment;
  hasDeliveredIncrement: boolean;
}

// Pure helper functions moved outside component
const normalizeStatus = (status: string): SprintStatus => {
  return status.toLowerCase() as SprintStatus;
};

const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}, ${end.getFullYear()}`;
};

const getStatusConfig = (status: string): { label: string; className: string } => {
  const normalizedStatus = normalizeStatus(status);
  switch (normalizedStatus) {
    case SprintStatus.ACTIVE:
      return {
        label: 'Active',
        className: styles['status-active'] ?? '',
      };
    case SprintStatus.COMPLETED:
      return {
        label: 'Completed',
        className: styles['status-completed'] ?? '',
      };
    case SprintStatus.PLANNED:
      return {
        label: 'Planned',
        className: styles['status-planned'] ?? '',
      };
    case SprintStatus.CANCELLED:
      return {
        label: 'Cancelled',
        className: styles['status-cancelled'] ?? '',
      };
    default:
      return {
        label: 'Planned',
        className: styles['status-planned'] ?? '',
      };
  }
};

const getReviewStatusConfig = (
  sprint: SprintWithReview
): {
  label: string;
  icon: React.ReactNode;
  className: string;
  canView: boolean;
} => {
  if (sprint.review) {
    if (sprint.review.status === 'completed') {
      return {
        label: 'Review Completed',
        icon: <CheckCircleIcon size={24} />,
        className: styles['review-completed'] ?? '',
        canView: true,
      };
    }
    return {
      label: 'Review In Progress',
      icon: <span style={{ color: 'var(--color-primary-600)' }}>●</span>,
      className: styles['review-in-progress'] ?? '',
      canView: true,
    };
  }

  if (!sprint.hasDeliveredIncrement) {
    return {
      label: 'Increment Required',
      icon: <PackageIcon size={24} />,
      className: styles['review-blocked'] ?? '',
      canView: false,
    };
  }

  return {
    label: 'Ready for Review',
    icon: <PlayIcon size={24} />,
    className: styles['review-ready'] ?? '',
    canView: true,
  };
};

export const SprintReviewList: React.FC = () => {
  const navigate = useNavigate();
  const { currentTeam } = useTeamStore();
  const teamId = currentTeam?.id;

  const { data: sprintsData, isLoading: isLoadingSprints } = useQuery({
    queryKey: ['sprints', teamId],
    queryFn: () => apiService.getSprints(teamId!),
    enabled: !!teamId,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['sprint-reviews', teamId],
    queryFn: () => apiService.getSprintReviews(teamId!),
    enabled: !!teamId,
  });

  const { data: incrementsData } = useQuery({
    queryKey: ['increments', teamId],
    queryFn: () => apiService.getIncrements(teamId!),
    enabled: !!teamId,
  });

  const sprints = useMemo(() => sprintsData?.data || [], [sprintsData]);
  const reviews = useMemo(() => reviewsData?.data || [], [reviewsData]);
  const increments = useMemo(() => incrementsData?.data || [], [incrementsData]);

  const completedSprints = useMemo((): SprintWithReview[] => {
    return sprints
      .filter((sprint) => normalizeStatus(sprint.status) === SprintStatus.COMPLETED)
      .map((sprint) => {
        const sprintReviews = reviews.filter((r) => r.sprintId === sprint.id);
        const review = sprintReviews[0];
        const sprintIncrements = increments.filter((inc) => inc.sprintId === sprint.id);
        const deliveredIncrement = sprintIncrements.find(
          (inc) =>
            inc.status === IncrementStatus.DELIVERED || inc.status === IncrementStatus.VERIFIED
        );

        return {
          ...sprint,
          review,
          increment: deliveredIncrement,
          hasDeliveredIncrement: !!deliveredIncrement,
        };
      })
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  }, [sprints, reviews, increments]);

  const handleViewReview = useCallback(
    (sprintId: string) => {
      navigate(`/sprint-review/${sprintId}`);
    },
    [navigate]
  );

  const handleCreateIncrement = useCallback(() => {
    navigate('/increments');
  }, [navigate]);

  if (!teamId) {
    return <EmptyState type="no-team" variant="full-page" />;
  }

  if (isLoadingSprints) {
    return (
      <div className={styles['page-container']}>
        <LoadingState variant="page" label="Loading sprint reviews..." />
      </div>
    );
  }

  return (
    <div className={styles['page-container']} data-testid="sprint-review-list">
      <header className={styles['page-header']}>
        <div className={styles['header-content']}>
          <h1 className={styles['page-title']}>
            <span className={styles['page-title-icon']}>
              <FileTextIcon size={24} />
            </span>
            Sprint Reviews
          </h1>
          <p className={styles['page-subtitle']}>
            Review completed sprints, inspect increments, and gather stakeholder feedback
          </p>
        </div>
        <div className={styles['header-stats']}>
          <div className={styles['stat-item']}>
            <span className={styles['stat-value']}>{completedSprints.length}</span>
            <span className={styles['stat-label']}>
              Completed Sprint{completedSprints.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className={styles['stat-item']}>
            <span className={styles['stat-value']}>
              {completedSprints.filter((s) => s.review?.status === 'completed').length}
            </span>
            <span className={styles['stat-label']}>Reviewed</span>
          </div>
        </div>
      </header>

      {completedSprints.length === 0 ? (
        <EmptyState type="no-completed-sprint" variant="default" />
      ) : (
        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles['section-title']}>
              <CheckCircleIcon size={24} className={styles['section-icon']} />
              Completed Sprints
            </h2>
            <div className={styles['sprint-grid']}>
              {completedSprints.map((sprint) => {
                const statusConfig = getStatusConfig(sprint.status);
                const reviewConfig = getReviewStatusConfig(sprint);

                return (
                  <article key={sprint.id} className={styles['sprint-card']}>
                    <div className={styles['card-header']}>
                      <div className={styles['sprint-name']}>{sprint.name}</div>
                      <span className={`${styles['status-badge']} ${statusConfig.className}`}>
                        <span className={styles['status-badge-icon']} />
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className={styles['card-date']}>
                      {formatDateRange(sprint.startDate, sprint.endDate)}
                    </div>

                    {sprint.sprintGoal && (
                      <div className={styles['sprint-goal']}>
                        <span className={styles['goal-label']}>Goal:</span>
                        <span className={styles['goal-text']}>{sprint.sprintGoal}</span>
                      </div>
                    )}

                    <div className={styles['card-footer']}>
                      <div className={`${styles['review-status']} ${reviewConfig.className}`}>
                        <span className={styles['review-icon']}>{reviewConfig.icon}</span>
                        <span>{reviewConfig.label}</span>
                      </div>

                      <div className={styles['card-actions']}>
                        {!sprint.hasDeliveredIncrement && !sprint.review && (
                          <button
                            className={styles['increment-button']}
                            onClick={handleCreateIncrement}
                          >
                            <PlusIcon size={16} />
                            Create Increment
                          </button>
                        )}
                        <button
                          className={styles['view-button']}
                          onClick={() => handleViewReview(sprint.id)}
                        >
                          <EyeIcon size={16} />
                          {sprint.review ? 'View Review' : 'View Details'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
