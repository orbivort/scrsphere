// Data Export Modal Component

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import type { ExportStatus } from '../../../../types/dataExport.types';

import styles from './DataExport.module.css';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  status: ExportStatus | null;
  progress: number;
  error: string | null;
  canDownload: boolean;
  onDownload: () => void;
  isPolling: boolean;
}

/**
 * Modal component for displaying data export progress and status
 */
export const DataExportModal: React.FC<DataExportModalProps> = ({
  isOpen,
  onClose,
  jobId,
  status,
  progress,
  error,
  canDownload,
  onDownload,
  isPolling,
}) => {
  const { t } = useTranslation('settings');
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create or get the portal container
    let container = document.getElementById('data-export-modal-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'data-export-modal-portal';
      document.body.appendChild(container);
    }
    setPortalContainer(container);

    // Cleanup function
    return () => {
      if (container.parentNode && container.childNodes.length === 0) {
        document.body.removeChild(container);
      }
    };
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    return undefined;
  }, [isOpen]);

  if (!isOpen || !portalContainer) return null;

  const getStatusMessage = (): string => {
    switch (status) {
      case 'pending':
        return t('privacyData.dataExportModal.statusMessages.pending');
      case 'processing':
        return t('privacyData.dataExportModal.statusMessages.processing');
      case 'completed':
        return t('privacyData.dataExportModal.statusMessages.completed');
      case 'failed':
        return t('privacyData.dataExportModal.statusMessages.failed');
      case 'expired':
        return t('privacyData.dataExportModal.statusMessages.expired');
      default:
        return t('privacyData.dataExportModal.statusMessages.initializing');
    }
  };

  const getStatusIcon = (): string => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'failed':
      case 'expired':
        return '✕';
      default:
        return '⟳';
    }
  };

  const modalContent = (
    <div
      className={styles['modal-overlay']}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      aria-describedby="export-modal-description"
    >
      <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
        <div className={styles['modal-header']}>
          <h2 id="export-modal-title" className={styles['modal-title']}>
            {t('privacyData.dataExportModal.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={styles['close-button']}
            aria-label={t('privacyData.dataExportModal.closeModal')}
          >
            ×
          </button>
        </div>

        <div className={styles['modal-body']}>
          {/* Status Icon */}
          <div
            className={`${styles['status-icon']} ${styles[`status-${status}`]}`}
            aria-hidden="true"
          >
            {getStatusIcon()}
          </div>

          {/* Status Message */}
          <p id="export-modal-description" className={styles['status-message']}>
            {getStatusMessage()}
          </p>

          {/* Progress Bar */}
          {(status === 'pending' || status === 'processing' || isPolling) && (
            <div className={styles['progress-container']}>
              <div
                className={styles['progress-bar']}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('privacyData.dataExportModal.exportProgress')}
              >
                <div className={styles['progress-fill']} style={{ width: `${progress}%` }} />
              </div>
              <span className={styles['progress-text']}>{progress}%</span>
            </div>
          )}

          {/* Job ID */}
          {jobId && (
            <div className={styles['job-id-container']}>
              <span className={styles['job-id-label']}>
                {t('privacyData.dataExportModal.jobId')}
              </span>
              <code className={styles['job-id']}>{jobId.slice(0, 8)}...</code>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={styles['error-container']} role="alert">
              <span className={styles['error-icon']} aria-hidden="true">
                ⚠
              </span>
              <p className={styles['error-message']}>{error}</p>
            </div>
          )}

          {/* Info Text */}
          <div className={styles['info-container']}>
            <p className={styles['info-text']}>{t('privacyData.dataExportModal.infoText')}</p>
            {/* {status === 'completed' && (
              <p className={styles['info-text']}>
                The export file will be available for download for 7 days.
              </p>
            )} */}
          </div>
        </div>

        <div className={styles['modal-footer']}>
          {/* Download Button */}
          {canDownload && (
            <button
              type="button"
              onClick={onDownload}
              className={`${styles.button} ${styles['button-primary']}`}
            >
              <span aria-hidden="true">↓</span>
              {t('privacyData.dataExportModal.downloadJson')}
            </button>
          )}

          {/* Cancel/Close Button */}
          <button
            type="button"
            onClick={onClose}
            className={`${styles.button} ${styles['button-secondary']}`}
          >
            {status === 'pending' || status === 'processing' || isPolling
              ? t('privacyData.dataExportModal.cancelExport')
              : t('privacyData.dataExportModal.close')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalContainer);
};

export default DataExportModal;
