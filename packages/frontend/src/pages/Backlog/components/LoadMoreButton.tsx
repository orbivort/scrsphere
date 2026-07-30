import React from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('backlog');

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
            <span>{t('loadMore.loading') as string}</span>
          </>
        ) : (
          <>
            <ClockIcon size={16} />
            <span>{t('loadMore.loadMore') as string}</span>
            <span className={styles['remaining-count']}>
              ({t('loadMore.remainingCount', { count: remaining }) as string})
            </span>
          </>
        )}
      </button>
      <p className={styles['progress-text']}>
        {t('loadMore.showingItems', { shown: loadedCount, total: totalCount }) as string}
      </p>
    </div>
  );
};
