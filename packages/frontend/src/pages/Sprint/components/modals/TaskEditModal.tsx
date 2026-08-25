import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { Task, ProductBacklogItem, TeamMember, User } from '../../../../types';
import { UserRole } from '../../../../types';
import type { FormErrors, TaskFormData } from '../../SprintBoard.types';
import { UnsavedChangesModal } from '../../../../components/common/Form/UnsavedChangesModal';
import { hasUnsavedChangesForEdit } from '../../utils/formChangeDetection';

import styles from './base/ModalBase.module.css';

import {
  EditIcon,
  XIcon,
  AlertTriangleIcon,
  ArrowLeftIcon,
  SaveIcon,
} from '@/components/common/Icons';

export interface TaskEditModalProps {
  task: Task;
  formData: TaskFormData;
  formErrors: FormErrors;
  workflowError: string | null;
  sprintItems: ProductBacklogItem[];
  teamMembers: (TeamMember & { user?: User })[];
  onClose: () => void;
  onBackToDetails: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (data: Partial<TaskFormData>) => void;
  isUpdating: boolean;
  modalRef: React.RefObject<HTMLDivElement | null>;
  isDeveloper?: boolean;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  formData,
  formErrors,
  workflowError,
  sprintItems,
  teamMembers,
  onClose,
  onBackToDetails,
  onSubmit,
  onFormDataChange,
  isUpdating,
  modalRef,
  isDeveloper = false,
}) => {
  const { t } = useTranslation('sprint');
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'close' | 'back' | null>(null);

  const hasUnsavedChanges = useCallback((): boolean => {
    return hasUnsavedChangesForEdit(formData, {
      title: task.title || '',
      description: task.description ?? '',
      assigneeId: task.assigneeId ?? '',
      estimatedHours: task.estimatedHours ?? 0,
      remainingHours: task.remainingHours ?? 0,
    });
  }, [task, formData]);

  const handleCloseAttempt = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);
      setPendingAction('close');
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleBackAttempt = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);
      setPendingAction('back');
    } else {
      onBackToDetails();
    }
  }, [hasUnsavedChanges, onBackToDetails]);

  const handleConfirmDiscard = useCallback(() => {
    setShowUnsavedChangesModal(false);
    if (pendingAction === 'close') {
      onClose();
    } else if (pendingAction === 'back') {
      onBackToDetails();
    }
    setPendingAction(null);
  }, [pendingAction, onClose, onBackToDetails]);

  const handleCancelDiscard = useCallback(() => {
    setShowUnsavedChangesModal(false);
    setPendingAction(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isUpdating && !showUnsavedChangesModal) {
        handleCloseAttempt();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isUpdating, showUnsavedChangesModal, handleCloseAttempt]);

  const handleSubmit = (e: React.FormEvent) => {
    onSubmit(e);
  };

  // Only developers can be assigned tasks. The role may be uppercase (backend
  // enum) or lowercase (mock data), so compare case-insensitively.
  const developerMembers = teamMembers.filter(
    (member) => String(member.role).toLowerCase() === UserRole.DEVELOPERS
  );

  const RequiredIndicator = () => (
    <span className={styles['required-indicator']} aria-hidden="true">
      {' '}
      *
    </span>
  );

  return (
    <>
      <div
        className={styles['modal-overlay']}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-edit-title"
        onClick={handleCloseAttempt}
      >
        <div
          ref={modalRef}
          className={`${styles.modal} ${styles['task-modal']}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles['gradient-orb']} aria-hidden="true" />

          <div className={styles['modal-header-with-icon']}>
            <div className={styles['modal-header-content']}>
              <div
                className={`${styles['modal-icon-wrapper']} ${styles.warning}`}
                aria-hidden="true"
              >
                <EditIcon size={24} />
              </div>
              <div className={styles['modal-title-group']}>
                <h2 id="task-edit-title" className={styles['modal-title']}>
                  {t('taskEdit.title', { id: task.id.slice(-4) })}
                </h2>
                <p className={styles['modal-subtitle']}>{t('taskEdit.subtitle')}</p>
              </div>
            </div>
            <button
              className={styles['modal-close']}
              onClick={handleCloseAttempt}
              aria-label={t('taskEdit.closeModal')}
              data-modal-close
              type="button"
            >
              <XIcon size={14} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles['modal-body-scrollable']}>
              {workflowError && (
                <div className={styles['modal-error-banner']} role="alert">
                  <div className={styles['modal-error-content']}>
                    <span className={styles['modal-error-icon']}>
                      <AlertTriangleIcon size={16} aria-hidden="true" />
                    </span>
                    <span className={styles['modal-error-text']}>{workflowError}</span>
                    <button
                      className={styles['modal-error-close']}
                      onClick={() => {}}
                      aria-label={t('taskEdit.closeErrorMessage')}
                      type="button"
                    >
                      <XIcon size={12} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              <div className={styles['form-legend']}>
                <span className={styles['required-indicator']}>*</span>
                <span>{t('taskCreate.requiredFields')}</span>
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="edit-task-pbi">{t('taskCreate.parentBacklogItem')}</label>
                <select
                  id="edit-task-pbi"
                  value={formData.pbiId}
                  onChange={(e) => onFormDataChange({ pbiId: e.target.value })}
                  disabled
                  className={styles['disabled-select']}
                >
                  <option value="">{t('taskCreate.selectBacklogItem')}</option>
                  {sprintItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({item.storyPoints ?? 0} {t('pts' as never)})
                    </option>
                  ))}
                </select>
                <span className={styles['form-hint']}>
                  {t('taskEdit.parentItemCannotBeChanged')}
                </span>
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="edit-task-title">
                  {t('taskCreate.titleLabel')}
                  <RequiredIndicator />
                </label>
                <input
                  id="edit-task-title"
                  type="text"
                  placeholder={t('taskCreate.titlePlaceholder')}
                  value={formData.title}
                  onChange={(e) => onFormDataChange({ title: e.target.value })}
                  maxLength={100}
                  className={formErrors.title ? styles.error : ''}
                  aria-invalid={!!formErrors.title}
                  aria-describedby={formErrors.title ? 'edit-task-title-error' : undefined}
                  autoFocus
                />
                {formErrors.title && (
                  <span id="edit-task-title-error" className={styles['form-error']} role="alert">
                    {formErrors.title}
                  </span>
                )}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="edit-task-desc">
                  {t('taskCreate.descriptionLabel')}
                  <RequiredIndicator />
                </label>
                <textarea
                  id="edit-task-desc"
                  rows={3}
                  placeholder={t('taskCreate.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => onFormDataChange({ description: e.target.value })}
                  className={formErrors.description ? styles.error : ''}
                  aria-invalid={!!formErrors.description}
                  aria-describedby={formErrors.description ? 'edit-task-desc-error' : undefined}
                />
                {formErrors.description && (
                  <span id="edit-task-desc-error" className={styles['form-error']} role="alert">
                    {formErrors.description}
                  </span>
                )}
              </div>

              <div className={styles['form-section-divider']} />
              <h3 className={styles['form-section-title']}>{t('taskCreate.assignment')}</h3>

              <div className={styles['form-group']}>
                <label htmlFor="edit-task-assignee">
                  {t('taskCreate.assigneeLabel')}
                  <RequiredIndicator />
                </label>
                <select
                  id="edit-task-assignee"
                  value={formData.assigneeId}
                  onChange={(e) => onFormDataChange({ assigneeId: e.target.value })}
                  className={formErrors.assigneeId ? styles.error : ''}
                  aria-invalid={!!formErrors.assigneeId}
                  aria-describedby={formErrors.assigneeId ? 'edit-task-assignee-error' : undefined}
                  disabled={!isDeveloper}
                >
                  <option value="">{t('taskCreate.unassigned')}</option>
                  {/* Self-managed Developers-as-a-team assignment: any Developer on the team may
                      be selected, or the assignment cleared. PO/SM cannot assign (disabled below). */}
                  {isDeveloper &&
                    developerMembers.map((member) => (
                      <option key={member.id} value={member.userId}>
                        {member.user?.firstName} {member.user?.lastName}
                      </option>
                    ))}
                </select>
                {formErrors.assigneeId && (
                  <span id="edit-task-assignee-error" className={styles['form-error']} role="alert">
                    {formErrors.assigneeId}
                  </span>
                )}
              </div>

              <div className={styles['form-section-divider']} />
              <h3 className={styles['form-section-title']}>{t('taskCreate.timeTracking')}</h3>

              <div className={styles['form-row']}>
                <div className={styles['form-group']}>
                  <label htmlFor="edit-task-estimated">
                    {t('taskCreate.estimatedHours')}
                    <RequiredIndicator />
                  </label>
                  <input
                    id="edit-task-estimated"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.5"
                    value={formData.estimatedHours}
                    onChange={(e) => {
                      const newEstimated = parseFloat(e.target.value) || 0;
                      onFormDataChange({
                        estimatedHours: newEstimated,
                        remainingHours: newEstimated,
                      });
                    }}
                    className={formErrors.estimatedHours ? styles.error : ''}
                    aria-invalid={!!formErrors.estimatedHours}
                    aria-describedby={
                      formErrors.estimatedHours
                        ? 'edit-task-estimated-error'
                        : 'edit-task-estimated-hint'
                    }
                  />
                  {formErrors.estimatedHours ? (
                    <span
                      id="edit-task-estimated-error"
                      className={styles['form-error']}
                      role="alert"
                    >
                      {formErrors.estimatedHours}
                    </span>
                  ) : (
                    <span id="edit-task-estimated-hint" className={styles['form-hint']}>
                      {t('taskCreate.remainingHoursHint')}
                    </span>
                  )}
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="edit-task-remaining">
                    {t('taskCreate.remainingHours')}
                    <RequiredIndicator />
                  </label>
                  <input
                    id="edit-task-remaining"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.5"
                    value={formData.remainingHours}
                    onChange={(e) =>
                      onFormDataChange({ remainingHours: parseFloat(e.target.value) || 0 })
                    }
                    className={formErrors.remainingHours ? styles.error : ''}
                    aria-invalid={!!formErrors.remainingHours}
                    aria-describedby={
                      formErrors.remainingHours
                        ? 'edit-task-remaining-error'
                        : 'edit-task-remaining-hint'
                    }
                  />
                  {formErrors.remainingHours ? (
                    <span
                      id="edit-task-remaining-error"
                      className={styles['form-error']}
                      role="alert"
                    >
                      {formErrors.remainingHours}
                    </span>
                  ) : (
                    <span id="edit-task-remaining-hint" className={styles['form-hint']}>
                      {t('taskCreate.remainingHoursDailyHint')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles['modal-footer-with-back']}>
              <div className={styles['footer-back-section']}>
                <button
                  type="button"
                  className={`${styles.button} ${styles['button-secondary']}`}
                  onClick={handleBackAttempt}
                  disabled={isUpdating}
                >
                  <ArrowLeftIcon size={16} />
                  {t('taskEdit.backToDetails')}
                </button>
              </div>
              <div className={styles['footer-action-section']}>
                <button
                  type="button"
                  className={`${styles.button} ${styles['button-secondary']}`}
                  onClick={handleCloseAttempt}
                  disabled={isUpdating}
                >
                  {t('taskEdit.cancel')}
                </button>
                <button
                  type="submit"
                  className={`${styles.button} ${styles['button-primary']} ${isUpdating ? styles['button-loading'] : ''}`}
                  disabled={isUpdating}
                  aria-busy={isUpdating}
                >
                  {!isUpdating && <SaveIcon size={16} />}
                  {isUpdating ? t('taskEdit.saving') : t('taskEdit.saveChanges')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <UnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
        title={t('taskEdit.discardTitle')}
        message={t('taskEdit.discardMessage')}
      />
    </>
  );
};
