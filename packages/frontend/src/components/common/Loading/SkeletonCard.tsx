import React from 'react';

import styles from './Skeleton.module.css';

/**
 * Props for the SkeletonCard component.
 */
export interface SkeletonCardProps {
  /** Number of items to display in the card */
  itemCount?: number;
  /** Type of card content */
  variant?: 'default' | 'list' | 'stats';
  /** Additional CSS class name */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

/**
 * SkeletonCard component displays a loading placeholder for card content.
 * Supports multiple variants: default (list items), list, and stats.
 *
 * @example
 * ```tsx
 * <SkeletonCard variant="stats" itemCount={3} label="Loading statistics" />
 * ```
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  itemCount = 3,
  variant = 'default',
  className = '',
  label = 'Loading card content',
}) => {
  return (
    <div
      className={`${styles['skeleton-card']} ${styles[variant]} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className={styles['skeleton-card-header']}>
        <div className={styles['skeleton-title']} />
        <div className={styles['skeleton-badge']} />
      </div>

      <div className={styles['skeleton-card-body']}>
        {variant === 'stats' ? (
          <div className={styles['skeleton-stats']}>
            {Array.from({ length: itemCount }).map((_, index) => (
              <div key={index} className={styles['skeleton-stat-item']}>
                <div className={styles['skeleton-stat-icon']} />
                <div className={styles['skeleton-stat-content']}>
                  <div className={styles['skeleton-stat-value']} />
                  <div className={styles['skeleton-stat-label']} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          Array.from({ length: itemCount }).map((_, index) => (
            <div key={index} className={styles['skeleton-list-item']}>
              <div className={styles['skeleton-dot']} />
              <div className={styles['skeleton-line']} style={{ width: '70%' }} />
              <div className={styles['skeleton-badge']} />
            </div>
          ))
        )}
      </div>
      <span className="visually-hidden">{label}</span>
    </div>
  );
};

export default SkeletonCard;
