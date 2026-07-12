import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ItemStatus as ItemStatusEnum, type ItemStatus } from '../../../types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useBacklogContext } from '../context/BacklogContext';

import styles from './DeleteConfirmModal.module.css';

import {
  AlertTriangleIcon,
  XIcon,
  TrashIcon,
  AlertCircleIcon,
  FileTextIcon,
} from '@/components/common/Icons';

// Status label i18n key mapping
const STATUS_LABEL_KEYS: Record<ItemStatus, string> = {
  [ItemStatusEnum.NEW]: 'status.new',
  [ItemStatusEnum.REFINED]: 'status.refined',
  [ItemStatusEnum.READY]: 'status.ready',
  [ItemStatusEnum.IN_PROGRESS]: 'status.inProgress',
  [ItemStatusEnum.DONE]: 'status.done',
};

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('backlog');

  const { selectedItem, workflowError, setWorkflowError } = useBacklogContext();

  useFocusTrap(isOpen, modalRef);

  if (!isOpen || !selectedItem) return null;

  // Get status class for styling
  const statusClass = selectedItem.status.toLowerCase() || 'todo';

  return (
    <div className={styles['modal-overlay']}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        {/* Decorative gradient orb - danger theme */}
        <div className={styles['gradient-orb-danger']} aria-hidden="true" />

        {/* Modal Header */}
        <header className={styles['modal-header']}>
          <div className={styles['header-content']}>
            <div className={styles['icon-wrapper-danger']} aria-hidden="true">
              <AlertTriangleIcon size={24} />
            </div>
            <h2 id="delete-modal-title" className={styles['modal-title']}>
              {t('deleteItem.title') as string}
            </h2>
            <p className={styles['modal-subtitle']}>{t('deleteItem.subtitle') as string}</p>
          </div>
          <button
            className={styles['modal-close']}
            onClick={onClose}
            aria-label={t('deleteItem.closeModal') as string}
            type="button"
            data-modal-close
          >
            <XIcon size={18} />
          </button>
        </header>

        {/* Modal Body */}
        <div className={styles['modal-body']}>
          {/* Error Banner */}
          {workflowError && (
            <div className={styles['modal-error-banner']} role="alert">
              <div className={styles['modal-error-content']}>
                <span className={styles['modal-error-icon']}>
                  <AlertCircleIcon size={18} />
                </span>
                <span className={styles['modal-error-text']}>{workflowError}</span>
                <button
                  className={styles['modal-error-close']}
                  onClick={() => setWorkflowError(null)}
                  aria-label={t('deleteItem.closeError') as string}
                  type="button"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Warning Card */}
          <div className={styles['warning-card']}>
            <div className={styles['warning-header']}>
              <span className={styles['warning-icon-large']} aria-hidden="true">
                <AlertTriangleIcon size={24} />
              </span>
              <div className={styles['warning-title-group']}>
                <h3 className={styles['warning-title']}>
                  {t('deleteItem.actionWarning') as string}
                </h3>
                <p className={styles['warning-subtitle']}>
                  {t('deleteItem.itemLabel') as string}{' '}
                  <strong>
                    &ldquo;{selectedItem.title || (t('deleteItem.unknownItem') as string)}&rdquo;
                  </strong>
                </p>
              </div>
            </div>

            <div className={styles['warning-content']}>
              <p className={styles['delete-warning-text']}>
                {t('deleteItem.warningText') as string}
              </p>

              {/* Impact Alert */}
              <div className={styles['impact-alert']}>
                <span className={styles['impact-icon']} aria-hidden="true">
                  <FileTextIcon size={16} />
                </span>
                <span className={styles['impact-text']}>
                  {t('deleteItem.statusLabel') as string}{' '}
                  <strong className={`${styles['status-badge']} ${styles[statusClass]}`}>
                    {t(STATUS_LABEL_KEYS[selectedItem.status] as never)}
                  </strong>
                  {selectedItem.storyPoints !== undefined && (
                    <>
                      {' '}
                      &bull; {selectedItem.storyPoints}{' '}
                      {
                        t(
                          selectedItem.storyPoints !== 1
                            ? 'deleteItem.storyPoints'
                            : 'deleteItem.storyPoint'
                        ) as string
                      }
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={styles['modal-footer']}>
          <button
            type="button"
            className={`${styles.button} ${styles['button-secondary']}`}
            onClick={onClose}
            disabled={isDeleting}
          >
            {t('deleteItem.cancel') as string}
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles['button-danger']}`}
            onClick={onConfirm}
            disabled={isDeleting}
            aria-busy={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className={styles['button-spinner']} aria-hidden="true" />
                {t('deleteItem.deleting') as string}
              </>
            ) : (
              <>
                <TrashIcon size={16} />
                {t('deleteItem.deleteItem') as string}
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
