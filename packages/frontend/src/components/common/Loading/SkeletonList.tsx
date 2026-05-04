import React from 'react';

import styles from './Skeleton.module.css';

/**
 * Props for the SkeletonList component.
 */
export interface SkeletonListProps {
  /** Number of items to display */
  itemCount?: number;
  /** Additional CSS class name */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

/**
 * SkeletonList component displays a loading placeholder for list content.
 * Each list item includes a dot, line, and badge placeholder.
 *
 * @example
 * ```tsx
 * <SkeletonList itemCount={5} label="Loading task list" />
 * ```
 */
export const SkeletonList: React.FC<SkeletonListProps> = ({
  itemCount = 3,
  className = '',
  label = 'Loading list items',
}) => {
  return (
    <div
      className={`${styles['skeleton-list']} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      {Array.from({ length: itemCount }).map((_, index) => (
        <div key={index} className={styles['skeleton-list-item']}>
          <div className={styles['skeleton-dot']} />
          <div className={styles['skeleton-line']} style={{ width: '70%' }} />
          <div className={styles['skeleton-badge']} />
        </div>
      ))}
      <span className="visually-hidden">{label}</span>
    </div>
  );
};

export default SkeletonList;
