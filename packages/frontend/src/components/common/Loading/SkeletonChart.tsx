import React from 'react';

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
export const SkeletonChart: React.FC<SkeletonChartProps> = ({
  className = '',
  label = 'Loading chart',
}) => {
  return (
    <div
      className={`${styles['skeleton-chart']} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className={styles['skeleton-chart-area']} />
      <span className="visually-hidden">{label}</span>
    </div>
  );
};

export default SkeletonChart;
