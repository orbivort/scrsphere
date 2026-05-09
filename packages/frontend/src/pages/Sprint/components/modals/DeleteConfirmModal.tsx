import React from 'react';

import type { Task } from '../../../../types';
import {
  AlertTriangleIcon,
  CloseIcon,
  TrashIcon,
  FileCheckIcon,
} from '../../../../components/common/Icons';

import styles from './DeleteConfirmModal.module.css';

export interface DeleteConfirmModalProps {
  task: Task;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  modalRef: React.RefObject<HTMLDivElement | null>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  task,
  onClose,
  onConfirm,
  isDeleting,
  modalRef,
}) => {
  const statusClass = task.status.toLowerCase() || 'todo';

  return (
    <div
      className={styles['modal-overlay']}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-desc"
    >
      <div ref={modalRef} className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles['gradient-orb-danger']} aria-hidden="true" />

        <header className={styles['modal-header']}>
          <div className={styles['header-content']}>
            <div className={styles['icon-wrapper-danger']} aria-hidden="true">
              <AlertTriangleIcon size={24} />
            </div>
            <h2 id="delete-modal-title" className={styles['modal-title']}>
              Delete Task
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
            <CloseIcon size={18} />
          </button>
        </header>

        <div className={styles['modal-body']}>
          <div className={styles['warning-card']}>
            <div className={styles['warning-header']}>
              <span className={styles['warning-icon-large']} aria-hidden="true">
                <AlertTriangleIcon size={24} />
              </span>
              <div className={styles['warning-title-group']}>
                <h3 className={styles['warning-title']}>Action Warning</h3>
                <p className={styles['warning-subtitle']}>
                  Task: <strong>&ldquo;{task.title || 'Unknown Task'}&rdquo;</strong>
                </p>
              </div>
            </div>

            <div className={styles['warning-content']}>
              <p className={styles['delete-warning-text']}>
                You are about to permanently delete this task. This action{' '}
                <strong>cannot be undone</strong>. All associated data, including time tracking and
                history, will be permanently removed.
              </p>

              <div className={styles['impact-alert']}>
                <span className={styles['impact-icon']} aria-hidden="true">
                  <FileCheckIcon size={18} />
                </span>
                <span className={styles['impact-text']}>
                  Status:{' '}
                  <strong className={`${styles['status-badge']} ${styles[statusClass]}`}>
                    {task.status}
                  </strong>
                  {task.remainingHours !== undefined && task.remainingHours > 0 && (
                    <>
                      {' '}
                      • {task.remainingHours} hour{task.remainingHours !== 1 ? 's' : ''} remaining
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

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
                Delete Task
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
