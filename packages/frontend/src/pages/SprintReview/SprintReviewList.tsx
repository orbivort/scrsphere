import React, { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDateRange } from '@scrumooth/shared';

import {
  SprintStatus,
  IncrementStatus,
  type Sprint,
  type SprintReview,
  type Increment,
} from '../../types';
import { useTeamStore } from '../../store';
import { apiService } from '../../services';
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

import { useI18nStore } from '@/i18n/useI18nStore';

interface SprintWithReview extends Sprint {
  review?: SprintReview;
  increment?: Increment;
  hasDeliveredIncrement: boolean;
}

// Pure helper functions moved outside component
const normalizeStatus = (status: string): SprintStatus => {
  return status.toLowerCase() as SprintStatus;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TFunction signature varies by i18next version
const getStatusConfig = (status: string, t: any): { label: string; className: string } => {
  const normalizedStatus = normalizeStatus(status);
  switch (normalizedStatus) {
    case SprintStatus.ACTIVE:
      return {
        label: t('list.statusLabels.active'),
        className: styles['status-active'] ?? '',
      };
    case SprintStatus.COMPLETED:
      return {
        label: t('list.statusLabels.completed'),
        className: styles['status-completed'] ?? '',
      };
    case SprintStatus.PLANNED:
      return {
        label: t('list.statusLabels.planned'),
        className: styles['status-planned'] ?? '',
      };
    case SprintStatus.CANCELLED:
      return {
        label: t('list.statusLabels.cancelled'),
        className: styles['status-cancelled'] ?? '',
      };
    default:
      return {
        label: t('list.statusLabels.planned'),
        className: styles['status-planned'] ?? '',
      };
  }
};

const getReviewStatusConfig = (
  sprint: SprintWithReview,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TFunction signature varies by i18next version
  t: any
): {
  label: string;
  icon: React.ReactNode;
  className: string;
  canView: boolean;
} => {
  if (sprint.review) {
    if (sprint.review.status === 'completed') {
      return {
        label: t('list.reviewStatus.completed'),
        icon: <CheckCircleIcon size={24} />,
        className: styles['review-completed'] ?? '',
        canView: true,
      };
    }
    return {
      label: t('list.reviewStatus.inProgress'),
      icon: <span style={{ color: 'var(--color-primary-600)' }}>●</span>,
      className: styles['review-in-progress'] ?? '',
      canView: true,
    };
  }

  if (!sprint.hasDeliveredIncrement) {
    return {
      label: t('list.reviewStatus.incrementRequired'),
      icon: <PackageIcon size={24} />,
      className: styles['review-blocked'] ?? '',
      canView: false,
    };
  }

  return {
    label: t('list.reviewStatus.readyForReview'),
    icon: <PlayIcon size={24} />,
    className: styles['review-ready'] ?? '',
    canView: true,
  };
};

export const SprintReviewList: React.FC = () => {
  const { t } = useTranslation('sprint-review');
  const navigate = useNavigate();
  const { currentTeam } = useTeamStore();
  const { locale } = useI18nStore();
  const teamId = currentTeam?.id;

  const { data: sprintsData, isLoading: isLoadingSprints } = useQuery({
    queryKey: ['sprints', teamId],
    queryFn: () => apiService.getSprints(teamId ?? ''),
    enabled: !!teamId,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['sprint-reviews', teamId],
    queryFn: () => apiService.getSprintReviews(teamId ?? ''),
    enabled: !!teamId,
  });

  const { data: incrementsData } = useQuery({
    queryKey: ['increments', teamId],
    queryFn: () => apiService.getIncrements(teamId ?? ''),
    enabled: !!teamId,
  });

  const sprints = useMemo(() => sprintsData?.data ?? [], [sprintsData]);
  const reviews = useMemo(() => reviewsData?.data ?? [], [reviewsData]);
  const increments = useMemo(() => incrementsData?.data ?? [], [incrementsData]);

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
      void navigate(`/sprint-review/${sprintId}`);
    },
    [navigate]
  );

  const handleCreateIncrement = useCallback(() => {
    void navigate('/increments');
  }, [navigate]);

  if (!teamId) {
    return <EmptyState type="no-team" variant="full-page" />;
  }

  if (isLoadingSprints) {
    return (
      <div className={styles['page-container']}>
        <LoadingState variant="page" label={t('list.loading')} />
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
            {t('list.title')}
          </h1>
          <p className={styles['page-subtitle']}>{t('list.subtitle')}</p>
        </div>
        <div className={styles['header-stats']}>
          <div className={styles['stat-item']}>
            <span className={styles['stat-value']}>{completedSprints.length}</span>
            <span className={styles['stat-label']}>
              {completedSprints.length !== 1
                ? t('list.completedSprints')
                : t('list.completedSprint')}
            </span>
          </div>
          <div className={styles['stat-item']}>
            <span className={styles['stat-value']}>
              {completedSprints.filter((s) => s.review?.status === 'completed').length}
            </span>
            <span className={styles['stat-label']}>{t('list.reviewed')}</span>
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
              {t('list.completedSprints')}
            </h2>
            <div className={styles['sprint-grid']}>
              {completedSprints.map((sprint) => {
                const statusConfig = getStatusConfig(sprint.status, t);
                const reviewConfig = getReviewStatusConfig(sprint, t);

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
                      {formatDateRange(sprint.startDate, sprint.endDate, locale)}
                    </div>

                    {sprint.sprintGoal && (
                      <div className={styles['sprint-goal']}>
                        <span className={styles['goal-label']}>{t('list.goal')}</span>
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
                            {t('list.createIncrement')}
                          </button>
                        )}
                        <button
                          className={styles['view-button']}
                          onClick={() => handleViewReview(sprint.id)}
                        >
                          <EyeIcon size={16} />
                          {sprint.review ? t('list.viewReview') : t('list.viewDetails')}
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
