import React from 'react';

import styles from './Skeleton.module.css';

/**
 * Props for the SkeletonText component.
 */
export interface SkeletonTextProps {
  /** Number of lines of text to display */
  lines?: number;
  /** Width of the last line (e.g., '60%', '200px') */
  lastLineWidth?: string;
  /** Additional CSS class name */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

/**
 * SkeletonText component displays a loading placeholder for text content.
 * Supports multiple lines with customizable last line width.
 *
 * @example
 * ```tsx
 * <SkeletonText lines={3} lastLineWidth="60%" label="Loading article content" />
 * ```
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 1,
  lastLineWidth = '100%',
  className = '',
  label = 'Loading content',
}) => {
  return (
    <div
      className={`${styles['skeleton-text']} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={styles['skeleton-line']}
          style={{
            width: index === lines - 1 && lines > 1 ? lastLineWidth : '100%',
          }}
        />
      ))}
      <span className="visually-hidden">{label}</span>
    </div>
  );
};

export default SkeletonText;
