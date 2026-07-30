import React from 'react';
import { useTranslation } from 'react-i18next';

import styles from './Skeleton.module.css';

/**
 * Props for the SkeletonChart component.
 */
export interface SkeletonChartProps {
  /** Additional CSS class name */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

/**
 * SkeletonChart component displays a loading placeholder for chart content.
 * Shows a full-width placeholder area with shimmer animation.
 *
 * @example
 * ```tsx
 * <SkeletonChart label="Loading performance chart" />
 * ```
 */
export const SkeletonChart: React.FC<SkeletonChartProps> = ({ className = '', label }) => {
  const { t } = useTranslation('common');
  const displayLabel = label ?? t('loadingStates.loadingChart');

  return (
    <div
      className={`${styles['skeleton-chart']} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={displayLabel}
    >
      <div className={styles['skeleton-chart-area']} />
      <span className="visually-hidden">{displayLabel}</span>
    </div>
  );
};

export default SkeletonChart;
