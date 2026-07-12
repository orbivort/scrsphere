import React from 'react';
import { useTranslation } from 'react-i18next';

import styles from './BulkUploadModal.module.css';
import type { UploadResult } from './bulkUploadUtils';

import { CheckCircleIcon, AlertCircleIcon, XCircleIcon, EyeIcon } from '@/components/common/Icons';

interface UploadSummaryProps {
  result: UploadResult;
  onClose: () => void;
  onViewItems: () => void;
}

export const UploadSummary: React.FC<UploadSummaryProps> = ({ result, onClose, onViewItems }) => {
  const { t } = useTranslation('backlog');
  const { total, successful, failed, errors } = result;
  const hasErrors = failed > 0;
  const allSuccess = successful === total && total > 0;
  const partialSuccess = successful > 0 && failed > 0;

  const getIconType = (): 'success' | 'partial' | 'error' => {
    if (allSuccess) return 'success';
    if (partialSuccess) return 'partial';
    return 'error';
  };

  const getTitle = (): string => {
    if (allSuccess) return t('bulkUpload.summary.importComplete') as string;
    if (partialSuccess) return t('bulkUpload.summary.importCompletedWithErrors') as string;
    return t('bulkUpload.summary.importFailed') as string;
  };

  const getSubtitle = (): string => {
    if (allSuccess)
      return t('bulkUpload.summary.successfullyImported', {
        count: successful,
        plural: successful !== 1 ? 's' : '',
      }) as string;
    if (partialSuccess)
      return t('bulkUpload.summary.partialSuccess', {
        successful,
        failed,
        plural: successful !== 1 ? 's' : '',
      }) as string;
    return t('bulkUpload.summary.noItemsImported') as string;
  };

  return (
    <div className={styles['summary-container']}>
      <div className={`${styles['summary-icon']} ${styles[getIconType()]}`}>
        {allSuccess ? (
          <CheckCircleIcon size={48} />
        ) : partialSuccess ? (
          <AlertCircleIcon size={48} />
        ) : (
          <XCircleIcon size={48} />
        )}
      </div>

      <h3 className={styles['summary-title']}>{getTitle()}</h3>
      <p className={styles['summary-subtitle']}>{getSubtitle()}</p>

      <div className={styles['summary-stats']}>
        <div className={`${styles['summary-stat']} ${styles.total}`}>
          <span className={styles['summary-stat-value']}>{total}</span>
          <span className={styles['summary-stat-label']}>
            {t('bulkUpload.summary.total') as string}
          </span>
        </div>
        <div className={`${styles['summary-stat']} ${styles.success}`}>
          <span className={styles['summary-stat-value']}>{successful}</span>
          <span className={styles['summary-stat-label']}>
            {t('bulkUpload.summary.imported') as string}
          </span>
        </div>
        {hasErrors && (
          <div className={`${styles['summary-stat']} ${styles.failed}`}>
            <span className={styles['summary-stat-value']}>{failed}</span>
            <span className={styles['summary-stat-label']}>
              {t('bulkUpload.summary.failedLabel') as string}
            </span>
          </div>
        )}
      </div>

      {hasErrors && errors.length > 0 && (
        <div className={styles['error-summary']}>
          <div className={styles['error-summary-title']}>
            <AlertCircleIcon size={16} />
            {t('bulkUpload.summary.errors', { count: errors.length }) as string}
          </div>
          <div className={styles['error-list-container']}>
            {errors.slice(0, 5).map((error, index) => (
              <div key={index} className={styles['error-item']}>
                <span className={styles['error-item-row']}>
                  {t('bulkUpload.summary.row', { row: error.row }) as string}
                </span>
                <span className={styles['error-item-message']}>
                  {error.field} - {error.message}
                </span>
              </div>
            ))}
            {errors.length > 5 && (
              <div className={styles['error-item']} style={{ justifyContent: 'center' }}>
                <span className={styles['error-more-link']}>
                  {t('bulkUpload.summary.moreErrors', { count: errors.length - 5 }) as string}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles['summary-actions']}>
        {successful > 0 && (
          <button
            type="button"
            className={`${styles.btn} ${styles['btn-primary']}`}
            onClick={onViewItems}
          >
            <EyeIcon size={16} />
            {t('bulkUpload.summary.viewImportedItems') as string}
          </button>
        )}
        <button
          type="button"
          className={`${styles.btn} ${styles['btn-secondary']}`}
          onClick={onClose}
        >
          {t('bulkUpload.summary.close') as string}
        </button>
      </div>
    </div>
  );
};
