import React, { memo } from 'react';
import { Link } from 'react-router-dom';

import type { DailyUpdate } from '../../../types';
import buttonStyles from '../../../components/common/Button/Button.module.css';

import styles from './DailyUpdateList.module.css';

interface DailyUpdateListProps {
  updates: DailyUpdate[];
  emptyMessage: string;
  showSubmitButton?: boolean;
}

const DailyUpdateList: React.FC<DailyUpdateListProps> = memo(
  ({ updates, emptyMessage, showSubmitButton = false }) => {
    if (updates.length === 0) {
      return (
        <div className={styles['empty-list']} role="status">
          <p>{emptyMessage}</p>
          {showSubmitButton && (
            <Link
              to="/daily-scrum"
              className={`${buttonStyles.button} ${buttonStyles['button-secondary']}`}
              aria-label="Submit your daily scrum update"
            >
              Submit Daily Scrum
            </Link>
          )}
        </div>
      );
    }

    return (
      <ul className={styles['update-list']} role="list" aria-label="Daily updates list">
        {updates.map((update) => (
          <li key={update.id} className={styles['update-item']}>
            <div className={styles['update-header']}>
              <span className={styles['update-author']}>
                {update.user ? `${update.user.firstName} ${update.user.lastName}` : 'Unknown User'}
              </span>
              <span className={styles['update-date']}>
                {new Date(update.updateDate).toLocaleDateString()}
              </span>
            </div>
            {update.yesterdayWork && (
              <div className={styles['update-section']}>
                <span className={styles['update-label']}>Yesterday:</span>
                <span className={styles['update-content']}>{update.yesterdayWork}</span>
              </div>
            )}
            {update.todayWork && (
              <div className={styles['update-section']}>
                <span className={styles['update-label']}>Today:</span>
                <span className={styles['update-content']}>{update.todayWork}</span>
              </div>
            )}
            {update.impediment && (
              <div className={`${styles['update-section']} ${styles.impediment}`}>
                <span className={styles['update-label']}>🚧 Impediment:</span>
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
