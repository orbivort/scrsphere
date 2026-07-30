import React, { memo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '@scrumooth/shared';

import type { DailyUpdate } from '../../../types';
import buttonStyles from '../../../components/common/Button/Button.module.css';

import styles from './DailyUpdateList.module.css';

import { useI18nStore } from '@/i18n/useI18nStore';

interface DailyUpdateListProps {
  updates: DailyUpdate[];
  emptyMessage: string;
  showSubmitButton?: boolean;
}

const DailyUpdateList: React.FC<DailyUpdateListProps> = memo(
  ({ updates, emptyMessage, showSubmitButton = false }) => {
    const { t } = useTranslation('dashboard');
    const { locale } = useI18nStore();

    if (updates.length === 0) {
      return (
        <div className={styles['empty-list']} role="status">
          <p>{emptyMessage}</p>
          {showSubmitButton && (
            <Link
              to="/daily-scrum"
              className={`${buttonStyles.button} ${buttonStyles['button-secondary']}`}
              aria-label={t('dailyUpdate.submitDailyScrumAriaLabel')}
            >
              {t('dailyUpdate.submitDailyScrum')}
            </Link>
          )}
        </div>
      );
    }

    return (
      <ul
        className={styles['update-list']}
        role="list"
        aria-label={t('dailyUpdate.dailyUpdatesList')}
      >
        {updates.map((update) => (
          <li key={update.id} className={styles['update-item']}>
            <div className={styles['update-header']}>
              <span className={styles['update-author']}>
                {update.user
                  ? `${update.user.firstName} ${update.user.lastName}`
                  : t('dailyUpdate.unknownUser')}
              </span>
              <span className={styles['update-date']}>
                {formatLocaleDate(update.updateDate, locale)}
              </span>
            </div>
            {update.yesterdayWork && (
              <div className={styles['update-section']}>
                <span className={styles['update-label']}>{t('dailyUpdate.yesterday')}</span>
                <span className={styles['update-content']}>{update.yesterdayWork}</span>
              </div>
            )}
            {update.todayWork && (
              <div className={styles['update-section']}>
                <span className={styles['update-label']}>{t('dailyUpdate.today')}</span>
                <span className={styles['update-content']}>{update.todayWork}</span>
              </div>
            )}
            {update.impediment && (
              <div className={`${styles['update-section']} ${styles.impediment}`}>
                <span className={styles['update-label']}>{t('dailyUpdate.impediment')}</span>
                <span className={styles['update-content']}>{update.impediment}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }
);

DailyUpdateList.displayName = 'DailyUpdateList';

export { DailyUpdateList };
export type { DailyUpdateListProps };
