// ProductGoalProgress
// Displays a Product Goal with its success metrics and progress bars for
// completed backlog items and story points.
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ProgressBar } from '../Page/ProgressBar';
import { TargetIcon, TrendingUpIcon } from '../Icons';

import styles from './ProductGoalProgress.module.css';

export interface ProductGoalProgressData {
  id: string;
  title: string;
  description?: string | null;
  successMetrics?: string | null;
  status: string;
  completedPbiCount?: number;
  totalPbiCount?: number;
  completedStoryPoints?: number;
  totalStoryPoints?: number;
}

interface ProductGoalProgressProps {
  goal: ProductGoalProgressData;
}

// Maps goal status to a semantic tone used to color the badge and accents.
const getStatusTone = (status: string): string => {
  const normalized = status.toUpperCase();
  if (normalized === 'COMPLETED' || normalized === 'ACHIEVED') {
    return 'success';
  }
  if (normalized === 'BLOCKED' || normalized === 'AT_RISK' || normalized === 'STALLED') {
    return 'danger';
  }
  if (normalized === 'ACTIVE' || normalized === 'IN_PROGRESS' || normalized === 'ON_TRACK') {
    return 'primary';
  }
  return 'neutral';
};

export const ProductGoalProgress: React.FC<ProductGoalProgressProps> = ({ goal }) => {
  const { t } = useTranslation('backlog');

  const pbiPercent =
    goal.totalPbiCount && goal.totalPbiCount > 0
      ? Math.round(((goal.completedPbiCount ?? 0) / goal.totalPbiCount) * 100)
      : 0;

  const storyPercent =
    goal.totalStoryPoints && goal.totalStoryPoints > 0
      ? Math.round(((goal.completedStoryPoints ?? 0) / goal.totalStoryPoints) * 100)
      : 0;

  const statusTone = getStatusTone(goal.status);

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div className={styles['title-block']}>
          <span
            className={`${styles['goal-glyph']} ${styles[`goal-glyph-${statusTone}`]}`}
            aria-hidden="true"
          >
            <TargetIcon size={16} />
          </span>
          <h3 className={styles.title}>{goal.title}</h3>
        </div>
        {goal.status && (
          <span className={`${styles.status} ${styles[`status-${statusTone}`]}`}>
            {goal.status}
          </span>
        )}
      </header>

      {goal.description && <p className={styles.description}>{goal.description}</p>}

      {goal.successMetrics && (
        <div className={styles.metrics}>
          <span className={styles['metric-label']}>
            <TrendingUpIcon size={14} />
            {t('productGoal.successMetrics')}
          </span>
          <p className={styles['metrics-text']}>{goal.successMetrics}</p>
        </div>
      )}

      <div className={styles['progress-group']}>
        <div className={styles['progress-row']}>
          <span className={styles['progress-label']}>{t('productGoal.completedPbis')}</span>
          <ProgressBar
            value={pbiPercent}
            size="small"
            variant="success"
            label={t('productGoal.completedPbis')}
          />
          <span className={styles['progress-count']}>
            {goal.completedPbiCount ?? 0}/{goal.totalPbiCount ?? 0}
          </span>
        </div>

        <div className={styles['progress-row']}>
          <span className={styles['progress-label']}>{t('productGoal.completedStoryPoints')}</span>
          <ProgressBar
            value={storyPercent}
            size="small"
            variant="accent"
            label={t('productGoal.completedStoryPoints')}
          />
          <span className={styles['progress-count']}>
            {goal.completedStoryPoints ?? 0}/{goal.totalStoryPoints ?? 0}
          </span>
        </div>
      </div>
    </section>
  );
};

export default ProductGoalProgress;
