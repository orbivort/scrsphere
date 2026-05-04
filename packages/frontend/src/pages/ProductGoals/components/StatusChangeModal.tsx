/**
 * StatusChangeModal Component
 *
 * A modal dialog for changing the status of a product goal.
 * Now uses the shared StatusHistorySection component for history display.
 *
 * @module pages/ProductGoals/components/StatusChangeModal
 */

import React, { useState, useEffect } from 'react';

import styles from './StatusChangeModal.module.css';

import type { StatusConfig } from '@/components/StatusSelector';
import {
  StatusHistorySection,
  type StatusChangeHistoryItem,
} from '@/components/StatusHistorySection';
import {
  CloseIcon,
  RefreshCwIcon,
  SaveIcon,
  TargetIcon,
  FileTextIcon,
  AlertTriangleIcon,
  InfoIcon,
  CheckIcon,
} from '@/components/common/Icons';

export interface StatusChangeModalProps<T extends string> {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: T) => void | Promise<void>;
  entityTitle: string;
  entityType: 'goal' | 'backlog-item';
  currentStatus: T;
  statuses: T[];
  statusConfig: Record<T, StatusConfig>;
  statusHistory?: StatusChangeHistoryItem[];
  isLoading?: boolean;
  isHistoryLoading?: boolean;
  error?: string | null;
  validationMessage?: string | null;
  isViewOnly?: boolean;
}

export function StatusChangeModal<T extends string>({
  isOpen,
  onClose,
  onStatusChange,
  entityTitle,
  entityType,
  currentStatus,
  statuses,
  statusConfig,
  statusHistory = [],
  isLoading = false,
  isHistoryLoading = false,
  error = null,
  validationMessage = null,
  isViewOnly = false,
}: StatusChangeModalProps<T>) {
  const [selectedStatus, setSelectedStatus] = useState<T>(currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus);
    }
  }, [isOpen, currentStatus]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  const handleStatusSelect = (status: T) => {
    if (!isSubmitting && !isLoading) {
      setSelectedStatus(status);
    }
  };

  const handleConfirm = async () => {
    if (selectedStatus === currentStatus) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await onStatusChange(selectedStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const hasChanges = selectedStatus !== currentStatus;
  const entityTypeLabel = entityType === 'goal' ? 'Product Goal' : 'Backlog Item';
  const modalTitle = isViewOnly ? 'Status History' : 'Change Status';

  return (
    <div className={styles['modal-overlay']} onClick={handleOverlayClick}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-change-title"
      >
        {/* Decorative gradient orb */}
        <div className={styles['gradient-orb']} aria-hidden="true" />

        {/* Modal Header */}
        <header className={styles['modal-header']}>
          <div className={styles['header-content']}>
            <div className={styles['icon-wrapper']} aria-hidden="true">
              <RefreshCwIcon size={24} />
            </div>
            <h2 id="status-change-title" className={styles['modal-title']}>
              {modalTitle}
            </h2>
            <p className={styles['modal-subtitle']}>
              {isViewOnly
                ? `View status history for this ${entityTypeLabel.toLowerCase()}`
                : `Update the status of this ${entityTypeLabel.toLowerCase()}`}
            </p>
          </div>
          <button
            className={styles['modal-close']}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            type="button"
          >
            <CloseIcon size={18} />
          </button>
        </header>

        <div className={styles['modal-body']}>
          {/* Entity Preview */}
          <div className={styles['goal-preview']}>
            <div className={styles['goal-icon']}>
              {entityType === 'goal' ? <TargetIcon size={24} /> : <FileTextIcon size={24} />}
            </div>
            <div className={styles['goal-info']}>
              <div className={styles['goal-label']}>{entityTypeLabel}</div>
              <h3 className={styles['goal-title']}>{entityTitle}</h3>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className={styles['error-banner']} role="alert">
              <span className={styles['error-icon']} aria-hidden="true">
                <AlertTriangleIcon size={20} />
              </span>
              <span>{error}</span>
            </div>
          )}

          {/* Validation Message */}
          {validationMessage && (
            <div
              className={styles['error-banner']}
              role="alert"
              style={{ backgroundColor: '#fef3c7', borderColor: '#fcd34d', color: '#92400e' }}
            >
              <span className={styles['error-icon']} aria-hidden="true">
                <InfoIcon size={20} />
              </span>
              <span>{validationMessage}</span>
            </div>
          )}

          {/* Status Selection - Hidden in view-only mode */}
          {!isViewOnly && (
            <div className={styles['status-section']}>
              <h3 className={styles['status-section-title']}>Select New Status</h3>
              <div
                className={styles['status-options']}
                role="radiogroup"
                aria-label="Status options"
              >
                {statuses.map((status) => {
                  const config = statusConfig[status];
                  const isSelected = status === selectedStatus;
                  const isCurrent = status === currentStatus;
                  return (
                    <button
                      key={status}
                      type="button"
                      className={`${styles['status-option']} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleStatusSelect(status)}
                      disabled={isSubmitting || isLoading}
                      style={
                        {
                          '--option-color': config.color,
                          '--option-bg': config.bgColor,
                          '--option-border': config.borderColor,
                        } as React.CSSProperties
                      }
                      role="radio"
                      aria-checked={isSelected}
                    >
                      <span className={styles['status-option-icon']}>
                        {/* eslint-disable-next-line icon-rules/no-inline-svg -- Dynamic icon from config */}
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d={config.icon} />
                        </svg>
                      </span>
                      <span className={styles['status-option-content']}>
                        <span className={styles['status-option-label']}>
                          {config.label}
                          {isCurrent && ' (Current)'}
                        </span>
                        <span className={styles['status-option-desc']}>{config.description}</span>
                      </span>
                      {isSelected && (
                        <span className={styles['status-option-check']}>
                          <CheckIcon size={16} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status History - Using shared StatusHistorySection component */}
          <div className={styles['history-section-wrapper']}>
            <StatusHistorySection history={statusHistory} isLoading={isHistoryLoading} />
          </div>
        </div>

        {/* Modal Footer */}
        <footer className={styles['modal-footer']}>
          <button
            type="button"
            className={`${styles.button} ${styles['button-secondary']}`}
            onClick={onClose}
            disabled={isSubmitting}
          >
            {isViewOnly ? 'Close' : 'Cancel'}
          </button>
          {!isViewOnly && (
            <button
              type="button"
              className={`${styles.button} ${styles['button-primary']} ${
                isSubmitting ? styles['button-loading'] : ''
              }`}
              onClick={handleConfirm}
              disabled={isSubmitting || isLoading || !hasChanges}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <span>Updating...</span>
              ) : (
                <>
                  <SaveIcon size={16} />
                  <span>Confirm Change</span>
                </>
              )}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
