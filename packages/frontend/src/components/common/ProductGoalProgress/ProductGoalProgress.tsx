// ProductGoalProgress
// Displays a Product Goal with its success metrics and progress bars for
// completed backlog items and story points.
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ProgressBar } from '../Page/ProgressBar';

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

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h3 className={styles.title}>{goal.title}</h3>
        {goal.status && <span className={styles.status}>{goal.status}</span>}
      </header>

      {goal.description && <p className={styles.description}>{goal.description}</p>}

      {goal.successMetrics && (
        <div className={styles.metrics}>
          <span className={styles['metric-label']}>{t('productGoal.successMetrics')}</span>
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
            variant="primary"
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
