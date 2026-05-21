import React from 'react';

import { ClockIcon } from '../../../components/common/Icons';

import styles from './LoadMoreButton.module.css';

interface LoadMoreButtonProps {
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
  loadedCount: number;
  totalCount: number;
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  onLoadMore,
  isLoading,
  hasMore,
  loadedCount,
  totalCount,
}) => {
  if (!hasMore) return null;

  const remaining = totalCount - loadedCount;

  return (
    <div className={styles['load-more-container']}>
      <button
        type="button"
        className={styles['load-more-button']}
        onClick={onLoadMore}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <span className={styles['loading-spinner']} aria-hidden="true" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            <ClockIcon size={16} />
            <span>Load More</span>
            <span className={styles['remaining-count']}>({remaining} remaining)</span>
          </>
        )}
      </button>
      <p className={styles['progress-text']}>
        Showing {loadedCount} of {totalCount} items
      </p>
    </div>
  );
};
