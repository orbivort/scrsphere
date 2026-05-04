import React from 'react';

import type { PendingDeletion } from '../../types/auth.types';

import styles from './GracePeriodProgress.module.css';

interface GracePeriodProgressProps {
  pendingDeletion: PendingDeletion;
}

export const GracePeriodProgress: React.FC<GracePeriodProgressProps> = ({ pendingDeletion }) => {
  const requestedDate = new Date(pendingDeletion.requestedAt);
  const scheduledDate = new Date(pendingDeletion.scheduledDeletionAt);
  const now = new Date();

  const totalMs = scheduledDate.getTime() - requestedDate.getTime();
  const elapsedMs = now.getTime() - requestedDate.getTime();
  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));

  const daysRemaining = Math.max(
    0,
    Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const formatDate = (date: Date): string =>
    date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div
      className={styles['grace-period-progress']}
      role="region"
      aria-labelledby="grace-period-title"
    >
      <h4 id="grace-period-title" className={styles['grace-period-title']}>
        Deletion Scheduled
      </h4>

      <div className={styles['grace-period-dates']}>
        <div className={styles['grace-period-date-item']}>
          <span className={styles['grace-period-date-label']}>Requested</span>
          <span className={styles['grace-period-date-value']}>{formatDate(requestedDate)}</span>
        </div>
        <div className={styles['grace-period-date-item']}>
          <span className={styles['grace-period-date-label']}>Deletion date</span>
          <span className={styles['grace-period-date-value']}>{formatDate(scheduledDate)}</span>
        </div>
        <div className={styles['grace-period-date-item']}>
          <span className={styles['grace-period-date-label']}>Days remaining</span>
          <span className={styles['grace-period-date-value']}>{daysRemaining}</span>
        </div>
      </div>

      <div className={styles['grace-period-bar-container']}>
        <div
          className={styles['grace-period-bar']}
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${Math.round(progressPercent)}% of grace period elapsed`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default GracePeriodProgress;
