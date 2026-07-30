import React from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('backlog');
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={styles['progress-container']}>
      <div className={styles['progress-icon']}>
        <RefreshCwIcon size={48} />
      </div>

      <h3 className={styles['progress-title']}>
        {isCancelling
          ? (t('bulkUpload.progress.cancelling') as string)
          : (t('bulkUpload.progress.importingBacklogItems') as string)}
      </h3>

      <p className={styles['progress-subtitle']}>
        {isCancelling
          ? (t('bulkUpload.progress.cancellingMessage') as string)
          : currentItem
            ? (t('bulkUpload.progress.creatingItem', { item: currentItem }) as string)
            : (t('bulkUpload.progress.processingFile') as string)}
      </p>

      <div className={styles['progress-bar-container']}>
        <div className={styles['progress-bar']}>
          <div className={styles['progress-bar-fill']} style={{ width: `${percentage}%` }} />
        </div>
      </div>

      <div className={styles['progress-stats']}>
        <div className={styles['progress-stat']}>
          <span className={styles['progress-stat-value']}>{current}</span>
          <span className={styles['progress-stat-label']}>
            {t('bulkUpload.progress.processed') as string}
          </span>
        </div>
        <div className={styles['progress-stat']}>
          <span className={styles['progress-stat-value']}>{total - current}</span>
          <span className={styles['progress-stat-label']}>
            {t('bulkUpload.progress.remaining') as string}
          </span>
        </div>
        <div className={styles['progress-stat']}>
          <span className={styles['progress-stat-value']}>{percentage}%</span>
          <span className={styles['progress-stat-label']}>
            {t('bulkUpload.progress.complete') as string}
          </span>
        </div>
      </div>

      {onCancel && !isCancelling && (
        <button
          type="button"
          className={`${styles.btn} ${styles['btn-secondary']} ${styles['cancel-button-wrapper']}`}
          onClick={onCancel}
        >
          <XCircleIcon size={16} />
          {t('bulkUpload.progress.cancelImport') as string}
        </button>
      )}
    </div>
  );
};
