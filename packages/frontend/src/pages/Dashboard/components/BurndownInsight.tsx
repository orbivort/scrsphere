import React from 'react';

import { ArrowUpIcon, ArrowDownIcon } from '../../../components/common/Icons';

import styles from './BurndownInsight.module.css';

export type BurndownStatus = 'ahead' | 'on-track' | 'behind';
export type BurndownInsightSize = 'compact' | 'default' | 'prominent';

interface BurndownInsightProps {
  /** Status of the burndown (ahead, on-track, behind) */
  status: BurndownStatus;
  /** Percentage difference from ideal (positive = ahead, negative = behind) */
  percentage: number;
  /** Optional additional message */
  message?: string;
  /** Size variant of the insight */
  size?: BurndownInsightSize;
}

/**
 * BurndownInsight component displays the current burndown status
 * with a trend indicator showing percentage ahead or behind.
 */
export const BurndownInsight: React.FC<BurndownInsightProps> = ({
  status,
  percentage,
  message,
  size = 'default',
}) => {
  const isAhead = percentage > 0;
  const isOnTrack = percentage === 0;
  const absPercentage = Math.abs(percentage);

  const getStatusText = (): string => {
    switch (status) {
      case 'ahead':
        return 'Ahead of schedule';
      case 'on-track':
        return 'On track';
      case 'behind':
        return 'Behind schedule';
      default:
        return 'Unknown status';
    }
  };

  const getTrendText = (): string => {
    if (isOnTrack) return 'On target';
    return isAhead ? `${absPercentage}% ahead` : `${absPercentage}% behind`;
  };

  return (
    <div
      className={`${styles['insight-container']} ${styles[status]} ${styles[size]}`}
      role="status"
      aria-live="polite"
      aria-label={`Burndown status: ${getStatusText()}. ${getTrendText()}`}
      tabIndex={0}
    >
      <div className={styles['insight-content']}>
        <span className={styles['status-indicator']} aria-hidden="true">
          {isAhead || isOnTrack ? (
            <ArrowUpIcon size={16} className={styles['trend-icon']} />
          ) : (
            <ArrowDownIcon size={16} className={styles['trend-icon']} />
          )}
        </span>
        <span className={styles.statusText}>{getStatusText()}</span>
        <span className={styles.percentageText} aria-hidden="true">
          {isOnTrack ? '' : isAhead ? ` ${absPercentage}% ahead` : ` ${absPercentage}% behind`}
        </span>
      </div>
      {message && <p className={styles['insight-message']}>{message}</p>}
    </div>
  );
};

export default BurndownInsight;
