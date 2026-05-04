import React from 'react';

import styles from './BulkUploadModal.module.css';

import { RefreshCwIcon, XCircleIcon } from '@/components/common/Icons';

interface UploadProgressProps {
  current: number;
  total: number;
  currentItem?: string;
  isCancelling?: boolean;
  onCancel?: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  current,
  total,
  currentItem,
  isCancelling,
  onCancel,
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={styles['progress-container']}>
      <div className={styles['progress-icon']}>
        <RefreshCwIcon size={48} />
      </div>

      <h3 className={styles['progress-title']}>
        {isCancelling ? 'Cancelling...' : 'Importing Backlog Items'}
      </h3>

      <p className={styles['progress-subtitle']}>
        {isCancelling
          ? 'Please wait while we stop the import process...'
          : currentItem
            ? `Creating: "${currentItem}"`
            : 'Processing your file...'}
      </p>

      <div className={styles['progress-bar-container']}>
        <div className={styles['progress-bar']}>
          <div className={styles['progress-bar-fill']} style={{ width: `${percentage}%` }} />
        </div>
      </div>

      <div className={styles['progress-stats']}>
        <div className={styles['progress-stat']}>
          <span className={styles['progress-stat-value']}>{current}</span>
          <span className={styles['progress-stat-label']}>Processed</span>
        </div>
        <div className={styles['progress-stat']}>
          <span className={styles['progress-stat-value']}>{total - current}</span>
          <span className={styles['progress-stat-label']}>Remaining</span>
        </div>
        <div className={styles['progress-stat']}>
          <span className={styles['progress-stat-value']}>{percentage}%</span>
          <span className={styles['progress-stat-label']}>Complete</span>
        </div>
      </div>

      {onCancel && !isCancelling && (
        <button
          type="button"
          className={`${styles.btn} ${styles['btn-secondary']} ${styles['cancel-button-wrapper']}`}
          onClick={onCancel}
        >
          <XCircleIcon size={16} />
          Cancel Import
        </button>
      )}
    </div>
  );
};
