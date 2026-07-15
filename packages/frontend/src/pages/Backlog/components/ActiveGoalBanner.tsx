import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '@scrumooth/shared';

import { MoSCoWPriority, type ProductGoal, type ProductBacklogItem } from '../../../types';

import styles from './ActiveGoalBanner.module.css';
import { GoalProgressBar } from './GoalProgressBar';

import { TargetIcon } from '@/components/common/Icons';
import { useI18nStore } from '@/i18n/useI18nStore';

export interface ActiveGoalBannerProps {
  goal: ProductGoal;
  backlogItems: ProductBacklogItem[];
  itemsByMoscow: Record<MoSCoWPriority, ProductBacklogItem[]>;
  doneCount: number;
  totalCount: number;
}

export const ActiveGoalBanner: React.FC<ActiveGoalBannerProps> = ({
  goal,
  backlogItems,
  itemsByMoscow,
  doneCount,
  totalCount,
}) => {
  const { t } = useTranslation('backlog');
  const { locale } = useI18nStore();

  return (
    <div className={styles['active-goal-banner']}>
      <div className={styles['goal-banner-content']}>
        <div className={styles['goal-banner-icon']}>
          <TargetIcon width="24" height="24" />
        </div>
        <div className={styles['goal-banner-info']}>
          <span className={styles['goal-banner-label']}>{t('activeGoal.label') as string}</span>
          <h2 className={styles['goal-banner-title']}>{goal.title}</h2>
          {goal.targetDate && (
            <span className={styles['goal-banner-deadline']}>
              {t('activeGoal.target') as string}: {formatLocaleDate(goal.targetDate, locale)}
            </span>
          )}
        </div>
        <div className={styles['goal-banner-progress']}>
          <GoalProgressBar goal={goal} backlogItems={backlogItems} />
        </div>
      </div>
      <div className={styles['goal-banner-stats']}>
        <div className={styles['stat-item']}>
          <span className={styles['stat-value']}>{totalCount}</span>
          <span className={styles['stat-label']}>{t('activeGoal.items') as string}</span>
        </div>
        <div className={`${styles['stat-item']} ${styles['must-stat']}`}>
          <span className={styles['stat-value']}>
            {itemsByMoscow[MoSCoWPriority.MUST_HAVE].length}
          </span>
          <span className={styles['stat-label']}>{t('activeGoal.mustHave') as string}</span>
        </div>
        <div className={styles['stat-item']}>
          <span className={styles['stat-value']}>{doneCount}</span>
          <span className={styles['stat-label']}>{t('activeGoal.done') as string}</span>
        </div>
      </div>
    </div>
  );
};
