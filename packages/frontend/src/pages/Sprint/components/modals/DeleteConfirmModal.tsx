import React from 'react';
import { useTranslation } from 'react-i18next';

import { TaskStatus as TaskStatusEnum, type Task, type TaskStatus } from '../../../../types';
import {
  AlertTriangleIcon,
  CloseIcon,
  TrashIcon,
  FileCheckIcon,
} from '../../../../components/common/Icons';

import styles from './DeleteConfirmModal.module.css';

// Status label i18n key mapping
const STATUS_LABEL_KEYS: Record<TaskStatus, string> = {
  [TaskStatusEnum.TODO]: 'taskStatus.todo',
  [TaskStatusEnum.IN_PROGRESS]: 'taskStatus.inProgress',
  [TaskStatusEnum.DONE]: 'taskStatus.done',
};

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
  const { t } = useTranslation('sprint');
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
              {t('deleteConfirm.title')}
            </h2>
            <p className={styles['modal-subtitle']}>{t('deleteConfirm.subtitle')}</p>
          </div>
          <button
            className={styles['modal-close']}
            onClick={onClose}
            aria-label={t('deleteConfirm.closeModal')}
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
                <h3 className={styles['warning-title']}>{t('deleteConfirm.actionWarning')}</h3>
                <p className={styles['warning-subtitle']}>
                  {t('deleteConfirm.taskLabel')}{' '}
                  <strong>&ldquo;{task.title || t('deleteConfirm.unknownTask')}&rdquo;</strong>
                </p>
              </div>
            </div>

            <div className={styles['warning-content']}>
              <p className={styles['delete-warning-text']}>
                {t('deleteConfirm.deleteWarningText')}
              </p>

              <div className={styles['impact-alert']}>
                <span className={styles['impact-icon']} aria-hidden="true">
                  <FileCheckIcon size={18} />
                </span>
                <span className={styles['impact-text']}>
                  {t('deleteConfirm.statusLabel')}{' '}
                  <strong className={`${styles['status-badge']} ${styles[statusClass]}`}>
                    {t(STATUS_LABEL_KEYS[task.status] as never)}
                  </strong>
                  {task.remainingHours !== undefined && task.remainingHours > 0 && (
                    <> • {t('deleteConfirm.hoursRemaining', { count: task.remainingHours })}</>
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
            {t('deleteConfirm.cancel')}
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
                {t('deleteConfirm.deleting')}
              </>
            ) : (
              <>
                <TrashIcon size={16} />
                {t('deleteConfirm.deleteTask')}
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
