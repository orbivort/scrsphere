import React from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('dashboard');

  const isAhead = percentage > 0;
  const isOnTrack = percentage === 0;
  const absPercentage = Math.abs(percentage);

  const getStatusText = (): string => {
    switch (status) {
      case 'ahead':
        return t('burndownInsight.ahead');
      case 'on-track':
        return t('burndownInsight.onTrack');
      case 'behind':
        return t('burndownInsight.behind');
      default:
        return t('burndownInsight.unknownStatus');
    }
  };

  const getTrendText = (): string => {
    if (isOnTrack) return t('burndownInsight.onTarget');
    return isAhead
      ? t('burndownInsight.percentAhead', { percentage: absPercentage })
      : t('burndownInsight.percentBehind', { percentage: absPercentage });
  };

  return (
    <div
      className={`${styles['insight-container']} ${styles[status]} ${styles[size]}`}
      role="status"
      aria-live="polite"
      aria-label={t('burndownInsight.ariaLabel', {
        status: getStatusText(),
        trend: getTrendText(),
      })}
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
