import React, { useRef } from 'react';

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
              Delete Backlog Item
            </h2>
            <p className={styles['modal-subtitle']}>
              This action is permanent and cannot be undone
            </p>
          </div>
          <button
            className={styles['modal-close']}
            onClick={onClose}
            aria-label="Close modal"
            type="button"
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
                  aria-label="Close error message"
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
                <h3 className={styles['warning-title']}>Action Warning</h3>
                <p className={styles['warning-subtitle']}>
                  Item: <strong>&ldquo;{selectedItem.title || 'Unknown Item'}&rdquo;</strong>
                </p>
              </div>
            </div>

            <div className={styles['warning-content']}>
              <p className={styles['delete-warning-text']}>
                You are about to permanently delete this backlog item. This action{' '}
                <strong>cannot be undone</strong>. All associated tasks, comments, and history will
                be permanently removed.
              </p>

              {/* Impact Alert */}
              <div className={styles['impact-alert']}>
                <span className={styles['impact-icon']} aria-hidden="true">
                  <FileTextIcon size={16} />
                </span>
                <span className={styles['impact-text']}>
                  Status:{' '}
                  <strong className={`${styles['status-badge']} ${styles[statusClass]}`}>
                    {selectedItem.status}
                  </strong>
                  {selectedItem.storyPoints !== undefined && (
                    <>
                      {' '}
                      • {selectedItem.storyPoints} story point
                      {selectedItem.storyPoints !== 1 ? 's' : ''}
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
            Cancel
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
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon size={16} />
                Delete Item
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
