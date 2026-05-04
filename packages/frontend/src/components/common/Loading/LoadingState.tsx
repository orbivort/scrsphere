import React from 'react';

import { LoadingSpinner } from '../Page/LoadingSpinner';

import styles from './LoadingState.module.css';
import { SkeletonCard } from './SkeletonCard';
import { SkeletonChart } from './SkeletonChart';
import { SkeletonList } from './SkeletonList';
import { SkeletonText } from './SkeletonText';

/**
 * Loading variant types for different use cases
 */
export type LoadingVariant =
  | 'spinner'
  | 'skeleton-text'
  | 'skeleton-card'
  | 'skeleton-list'
  | 'skeleton-chart'
  | 'page';

/**
 * Size variants for loading components
 */
export type LoadingSize = 'sm' | 'md' | 'lg';

/**
 * Card variant types for skeleton-card variant
 */
export type SkeletonCardVariant = 'default' | 'list' | 'stats';

/**
 * Size mapping for spinner sizes in pixels
 */
const SPINNER_SIZE_MAP: Record<LoadingSize, number> = {
  sm: 24,
  md: 48,
  lg: 64,
};

/**
 * Props for the LoadingState component
 */
export interface LoadingStateProps {
  /** The type of loading indicator to display */
  variant: LoadingVariant;
  /** Size of the loading indicator (for 'spinner' and 'page' variants) */
  size?: LoadingSize;
  /** Accessible label for screen readers */
  label?: string;
  /** Additional CSS class name */
  className?: string;
  /** Number of skeleton lines to display (for 'skeleton-text' variant) */
  lines?: number;
  /** Width of the last line (for 'skeleton-text' variant, e.g., '60%', '200px') */
  lastLineWidth?: string;
  /** Number of items to display (for 'skeleton-list' and 'skeleton-card' variants) */
  itemCount?: number;
  /** Type of card content (for 'skeleton-card' variant) */
  cardVariant?: SkeletonCardVariant;
  /** Whether to display as full-screen overlay (for 'page' variant) */
  fullScreen?: boolean;
}

/**
 * Default values for LoadingState props
 */
const defaultProps = {
  size: 'md' as LoadingSize,
  label: 'Loading...',
  lines: 3,
  lastLineWidth: '100%',
  itemCount: 3,
  cardVariant: 'default' as SkeletonCardVariant,
  fullScreen: false,
};

/**
 * Unified loading state component that supports multiple loading variants.
 *
 * Variants:
 * - 'spinner': Animated spinner for general loading states
 * - 'skeleton-text': Skeleton placeholder for text content
 * - 'skeleton-card': Skeleton placeholder for card components
 * - 'skeleton-list': Skeleton placeholder for list items
 * - 'skeleton-chart': Skeleton placeholder for chart content
 * - 'page': Full-page loading indicator
 *
 * @example
 * // Spinner variant
 * <LoadingState variant="spinner" />
 *
 * @example
 * // Skeleton text with custom lines
 * <LoadingState variant="skeleton-text" lines={5} lastLineWidth="60%" />
 *
 * @example
 * // Skeleton card with stats variant
 * <LoadingState variant="skeleton-card" cardVariant="stats" itemCount={4} />
 *
 * @example
 * // Skeleton list
 * <LoadingState variant="skeleton-list" itemCount={5} />
 *
 * @example
 * // Skeleton chart
 * <LoadingState variant="skeleton-chart" label="Loading burndown chart" />
 *
 * @example
 * // Full-screen page loader
 * <LoadingState variant="page" fullScreen label="Loading dashboard..." />
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  variant,
  size = defaultProps.size,
  label = defaultProps.label,
  className = '',
  lines = defaultProps.lines,
  lastLineWidth = defaultProps.lastLineWidth,
  itemCount = defaultProps.itemCount,
  cardVariant = defaultProps.cardVariant,
  fullScreen = defaultProps.fullScreen,
}) => {
  // Page variant with optional full-screen overlay
  if (variant === 'page') {
    const pageLoaderClasses = [
      styles['page-loader'],
      fullScreen ? styles['full-screen'] : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        className={pageLoaderClasses}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
      >
        <LoadingSpinner size={SPINNER_SIZE_MAP[size]} label={label} />
        <p className={styles['page-loader-text']}>{label}</p>
      </div>
    );
  }

  // Spinner variant
  if (variant === 'spinner') {
    const containerClasses = [styles['loading-state'], styles['variant-spinner'], className]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        className={containerClasses}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
        data-variant={variant}
        data-size={size}
      >
        <LoadingSpinner size={SPINNER_SIZE_MAP[size]} label={label} />
      </div>
    );
  }

  // Skeleton-text variant
  if (variant === 'skeleton-text') {
    const containerClasses = [styles['loading-state'], styles['variant-skeleton-text'], className]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        className={containerClasses}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
        data-variant={variant}
        data-lines={lines}
      >
        <SkeletonText lines={lines} lastLineWidth={lastLineWidth} label={label} />
      </div>
    );
  }

  // Skeleton-card variant
  if (variant === 'skeleton-card') {
    const containerClasses = [styles['loading-state'], styles['variant-skeleton-card'], className]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        className={containerClasses}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
        data-variant={variant}
        data-item-count={itemCount}
        data-card-variant={cardVariant}
      >
        <SkeletonCard itemCount={itemCount} variant={cardVariant} label={label} />
      </div>
    );
  }

  // Skeleton-list variant
  if (variant === 'skeleton-list') {
    const containerClasses = [styles['loading-state'], styles['variant-skeleton-list'], className]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        className={containerClasses}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
        data-variant={variant}
        data-item-count={itemCount}
      >
        <SkeletonList itemCount={itemCount} label={label} />
      </div>
    );
  }

  // Skeleton-chart variant
  if (variant === 'skeleton-chart') {
    const containerClasses = [styles['loading-state'], styles['variant-skeleton-chart'], className]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        className={containerClasses}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
        data-variant={variant}
      >
        <SkeletonChart label={label} />
      </div>
    );
  }

  // Fallback for unknown variants (should never happen with TypeScript)
  return null;
};

export default LoadingState;
