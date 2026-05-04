import React from 'react';

import styles from './BulkUploadModal.module.css';
import type { UploadResult } from './bulkUploadUtils';

import { CheckCircleIcon, AlertCircleIcon, XCircleIcon, EyeIcon } from '@/components/common/Icons';

interface UploadSummaryProps {
  result: UploadResult;
  onClose: () => void;
  onViewItems: () => void;
}

export const UploadSummary: React.FC<UploadSummaryProps> = ({ result, onClose, onViewItems }) => {
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
    if (allSuccess) return 'Import Complete!';
    if (partialSuccess) return 'Import Completed with Errors';
    return 'Import Failed';
  };

  const getSubtitle = (): string => {
    if (allSuccess)
      return `Successfully imported ${successful} backlog item${successful !== 1 ? 's' : ''}.`;
    if (partialSuccess)
      return `${successful} item${successful !== 1 ? 's' : ''} imported, ${failed} failed.`;
    return 'No items were imported due to errors.';
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
          <span className={styles['summary-stat-label']}>Total</span>
        </div>
        <div className={`${styles['summary-stat']} ${styles.success}`}>
          <span className={styles['summary-stat-value']}>{successful}</span>
          <span className={styles['summary-stat-label']}>Imported</span>
        </div>
        {hasErrors && (
          <div className={`${styles['summary-stat']} ${styles.failed}`}>
            <span className={styles['summary-stat-value']}>{failed}</span>
            <span className={styles['summary-stat-label']}>Failed</span>
          </div>
        )}
      </div>

      {hasErrors && errors.length > 0 && (
        <div className={styles['error-summary']}>
          <div className={styles['error-summary-title']}>
            <AlertCircleIcon size={16} />
            Errors ({errors.length})
          </div>
          <div className={styles['error-list-container']}>
            {errors.slice(0, 5).map((error, index) => (
              <div key={index} className={styles['error-item']}>
                <span className={styles['error-item-row']}>Row {error.row}:</span>
                <span className={styles['error-item-message']}>
                  {error.field} - {error.message}
                </span>
              </div>
            ))}
            {errors.length > 5 && (
              <div className={styles['error-item']} style={{ justifyContent: 'center' }}>
                <span className={styles['error-more-link']}>
                  ...and {errors.length - 5} more errors
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
            View Imported Items
          </button>
        )}
        <button
          type="button"
          className={`${styles.btn} ${styles['btn-secondary']}`}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};
