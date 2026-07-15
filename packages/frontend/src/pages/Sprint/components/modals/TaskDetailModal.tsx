import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '@scrumooth/shared';

import { TaskStatus as TaskStatusEnum, type Task, type TaskStatus } from '../../../../types';
import { StatusSelector, type StatusConfig } from '../../../../components/StatusSelector';
import { StatusHistorySection } from '../../../../components/StatusHistorySection';
import {
  FileCheckIcon,
  CloseIcon,
  AlertTriangleIcon,
  ShieldIcon,
  TrashIcon,
  EditIcon,
} from '../../../../components/common/Icons';

import baseStyles from './base/ModalBase.module.css';
import detailStyles from './TaskDetailModal.module.css';

import { useI18nStore } from '@/i18n/useI18nStore';

const styles = { ...baseStyles, ...detailStyles };

// Task status configuration for StatusSelector (label and description set dynamically via i18n)
const STATUS_CONFIG_BASE: Record<TaskStatus, Omit<StatusConfig, 'label' | 'description'>> = {
  [TaskStatusEnum.TODO]: {
    color: '#6b7280',
    bgColor: '#f3f4f6',
    borderColor: '#d1d5db',
    icon: 'M12 4v16m8-8H4',
  },
  [TaskStatusEnum.IN_PROGRESS]: {
    color: '#1e40af',
    bgColor: '#dbeafe',
    borderColor: '#93c5fd',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  },
  [TaskStatusEnum.DONE]: {
    color: '#065f46',
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
    icon: 'M5 13l4 4L19 7',
  },
};

// Status label i18n key mapping
const STATUS_LABEL_KEYS: Record<TaskStatus, string> = {
  [TaskStatusEnum.TODO]: 'taskStatus.todo',
  [TaskStatusEnum.IN_PROGRESS]: 'taskStatus.inProgress',
  [TaskStatusEnum.DONE]: 'taskStatus.done',
};

// Status description i18n key mapping
const STATUS_DESCRIPTION_KEYS: Record<TaskStatus, string> = {
  [TaskStatusEnum.TODO]: 'taskDetail.todoDescription',
  [TaskStatusEnum.IN_PROGRESS]: 'taskDetail.inProgressDescription',
  [TaskStatusEnum.DONE]: 'taskDetail.doneDescription',
};

// Task status color mapping for StatusHistorySection
const TASK_STATUS_COLOR_MAP = {
  TODO: { color: '#6b7280', bgColor: '#f3f4f6' },
  IN_PROGRESS: { color: '#3b82f6', bgColor: '#dbeafe' },
  DONE: { color: '#059669', bgColor: '#d1fae5' },
};

// All task statuses
const ALL_TASK_STATUSES: TaskStatus[] = [
  TaskStatusEnum.TODO,
  TaskStatusEnum.IN_PROGRESS,
  TaskStatusEnum.DONE,
];

export interface TaskDetailModalProps {
  task: Task;
  workflowError: string | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onClearWorkflowError?: () => void;
  getAvailableTransitions: (status: TaskStatus) => TaskStatus[];
  isUpdating: boolean;
  modalRef: React.RefObject<HTMLDivElement | null>;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  workflowError,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onClearWorkflowError,
  getAvailableTransitions,
  isUpdating,
  modalRef,
}) => {
  const { t } = useTranslation('sprint');
  const { locale } = useI18nStore();
  const isViewOnlyMode = task.status === TaskStatusEnum.DONE;

  // Build full TASK_STATUS_CONFIG with i18n labels
  const TASK_STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
    [TaskStatusEnum.TODO]: {
      ...STATUS_CONFIG_BASE[TaskStatusEnum.TODO],
      label: t(STATUS_LABEL_KEYS[TaskStatusEnum.TODO] as never),
      description: t(STATUS_DESCRIPTION_KEYS[TaskStatusEnum.TODO] as never),
    },
    [TaskStatusEnum.IN_PROGRESS]: {
      ...STATUS_CONFIG_BASE[TaskStatusEnum.IN_PROGRESS],
      label: t(STATUS_LABEL_KEYS[TaskStatusEnum.IN_PROGRESS] as never),
      description: t(STATUS_DESCRIPTION_KEYS[TaskStatusEnum.IN_PROGRESS] as never),
    },
    [TaskStatusEnum.DONE]: {
      ...STATUS_CONFIG_BASE[TaskStatusEnum.DONE],
      label: t(STATUS_LABEL_KEYS[TaskStatusEnum.DONE] as never),
      description: t(STATUS_DESCRIPTION_KEYS[TaskStatusEnum.DONE] as never),
    },
  };

  return (
    <div
      className={styles['modal-overlay']}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className={`${styles.modal} ${styles['detail-modal']}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient orb */}
        <div className={styles['gradient-orb']} aria-hidden="true" />

        {/* Header */}
        <div className={styles['modal-header-with-icon']}>
          <div className={styles['modal-header-content']}>
            <div
              className={`${styles['modal-icon-wrapper']} ${isViewOnlyMode ? styles.success : ''}`}
              aria-hidden="true"
            >
              <FileCheckIcon size={24} />
            </div>
            <div className={styles['modal-title-group']}>
              <div className={styles['detail-header-left']}>
                <span className={styles['detail-id']}>#{task.id.slice(-4)}</span>
                <h2 id="task-detail-title" className={styles['detail-title']}>
                  {task.title}
                </h2>
              </div>
            </div>
          </div>
          <button
            className={styles['modal-close']}
            onClick={onClose}
            aria-label={t('taskDetail.closeModal')}
            data-modal-close
            type="button"
          >
            <CloseIcon size={14} aria-hidden="true" />
          </button>
        </div>

        <div className={styles['modal-body-scrollable']}>
          {/* Workflow Error Banner */}
          {workflowError && (
            <div className={styles['modal-error-banner']} role="alert">
              <div className={styles['modal-error-content']}>
                <span className={styles['modal-error-icon']}>
                  <AlertTriangleIcon size={16} aria-hidden="true" />
                </span>
                <span className={styles['modal-error-text']}>{workflowError}</span>
                <button
                  className={styles['modal-error-close']}
                  onClick={onClearWorkflowError}
                  aria-label={t('taskDetail.closeErrorMessage')}
                  type="button"
                >
                  <CloseIcon size={12} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* View Only Notice */}
          {isViewOnlyMode && (
            <div className={styles['done-item-notice']}>
              <ShieldIcon size={16} aria-hidden="true" />
              <span>{t('taskDetail.completedTaskNotice')}</span>
            </div>
          )}

          {/* Task Information Section */}
          <div className={styles['detail-section-card']}>
            <h3 className={styles['section-heading']}>{t('taskDetail.taskInformation')}</h3>
            <div className={styles['detail-grid']}>
              {/* Status Row */}
              <div className={styles['detail-row-with-status']}>
                <span className={styles['detail-label']}>{t('taskDetail.status')}</span>
                <StatusSelector
                  currentStatus={task.status}
                  statuses={ALL_TASK_STATUSES}
                  statusConfig={TASK_STATUS_CONFIG}
                  onStatusChange={onStatusChange}
                  availableStatuses={isViewOnlyMode ? [] : getAvailableTransitions(task.status)}
                  isLoading={isUpdating}
                  disabled={isViewOnlyMode}
                />
              </div>

              {/* Assignee Row */}
              <div className={styles['detail-row']}>
                <span className={styles['detail-label']}>{t('taskDetail.assignee')}</span>
                <span className={styles['detail-value']}>
                  {task.assignee
                    ? `${task.assignee.firstName} ${task.assignee.lastName}`
                    : t('taskCreate.unassigned')}
                </span>
              </div>

              {/* Parent PBI Row */}
              <div className={styles['detail-row-full']}>
                <span className={styles['detail-label']}>{t('taskDetail.parentPbi')}</span>
                <span className={styles['detail-value']}>
                  {task.pbi?.title ?? t('taskDetail.unknown')}
                </span>
              </div>
            </div>
          </div>

          {/* Time Tracking Section */}
          <div className={styles['detail-section-card']}>
            <h3 className={styles['section-heading']}>{t('taskDetail.timeTracking')}</h3>
            <div className={styles['detail-hours-row']}>
              <div className={styles['detail-row-half']}>
                <span className={styles['detail-label']}>{t('taskDetail.estimatedHours')}</span>
                <span className={styles['detail-value-highlight']}>
                  {task.estimatedHours ? `${task.estimatedHours}h` : t('taskDetail.notEstimated')}
                </span>
              </div>
              <div className={styles['detail-row-half']}>
                <span className={styles['detail-label']}>{t('taskDetail.remainingHours')}</span>
                <span className={styles['detail-value-highlight']}>
                  {task.remainingHours !== undefined
                    ? `${task.remainingHours}h`
                    : t('taskDetail.notSet')}
                </span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          {task.description && (
            <div className={styles['detail-section-card']}>
              <h3 className={styles['section-heading']}>{t('taskDetail.description')}</h3>
              <p className={styles['detail-description']}>{task.description}</p>
            </div>
          )}

          {/* Metadata Section */}
          <div className={styles['detail-section-card']}>
            <h3 className={styles['section-heading']}>{t('taskDetail.metadata')}</h3>
            <div className={styles['detail-metadata-grid']}>
              <div className={styles['detail-metadata-item']}>
                <span className={styles['detail-metadata-label']}>{t('taskDetail.created')}</span>
                <span className={styles['detail-metadata-value']}>
                  {formatLocaleDate(task.createdAt, locale)}
                </span>
              </div>
              <div className={styles['detail-metadata-item']}>
                <span className={styles['detail-metadata-label']}>{t('taskDetail.updated')}</span>
                <span className={styles['detail-metadata-value']}>
                  {formatLocaleDate(task.updatedAt, locale)}
                </span>
              </div>
            </div>
          </div>

          {/* Status History Timeline */}
          <StatusHistorySection
            entityId={task.id}
            entityType="Task"
            title={t('taskDetail.statusHistory')}
            statusColorMap={TASK_STATUS_COLOR_MAP}
          />
        </div>

        {/* Footer */}
        <div className={styles['modal-footer-with-back']}>
          <div className={styles['footer-back-section']}>
            <button
              type="button"
              className={`${styles.button} ${styles['button-danger']}`}
              onClick={onDelete}
              disabled={isViewOnlyMode}
            >
              <TrashIcon size={16} aria-hidden="true" />
              {t('taskDetail.deleteTask')}
            </button>
          </div>
          <div className={styles['footer-action-section']}>
            <button
              type="button"
              className={`${styles.button} ${styles['button-secondary']}`}
              onClick={onClose}
            >
              {t('taskDetail.close')}
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles['button-primary']}`}
              onClick={onEdit}
              disabled={isViewOnlyMode}
            >
              {isViewOnlyMode ? (
                t('taskDetail.viewOnly')
              ) : (
                <>
                  <EditIcon size={16} aria-hidden="true" />
                  {t('taskDetail.editTask')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
