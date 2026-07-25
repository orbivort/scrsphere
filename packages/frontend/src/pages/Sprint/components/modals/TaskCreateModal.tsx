import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { ProductBacklogItem, TeamMember, User } from '../../../../types';
import type { FormErrors, TaskFormData } from '../../SprintBoard.types';
import { UnsavedChangesModal } from '../../../../components/common/Form/UnsavedChangesModal';
import { hasUnsavedChangesForCreate } from '../../utils/formChangeDetection';
import { PlusIcon, CloseIcon, AlertTriangleIcon } from '../../../../components/common/Icons';

import styles from './base/ModalBase.module.css';

export interface TaskCreateModalProps {
  formData: TaskFormData;
  formErrors: FormErrors;
  workflowError: string | null;
  sprintItems: ProductBacklogItem[];
  teamMembers: (TeamMember & { user?: User })[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (data: Partial<TaskFormData>) => void;
  isCreating: boolean;
  modalRef: React.RefObject<HTMLDivElement | null>;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  formData,
  formErrors,
  workflowError,
  sprintItems,
  teamMembers,
  onClose,
  onSubmit,
  onFormDataChange,
  isCreating,
  modalRef,
}) => {
  const { t } = useTranslation('sprint');
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  const hasUnsavedChanges = useCallback((): boolean => {
    return hasUnsavedChangesForCreate(formData);
  }, [formData]);

  const handleCloseAttempt = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);
      setPendingClose(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleConfirmDiscard = useCallback(() => {
    setShowUnsavedChangesModal(false);
    if (pendingClose) {
      onClose();
    }
    setPendingClose(false);
  }, [pendingClose, onClose]);

  const handleCancelDiscard = useCallback(() => {
    setShowUnsavedChangesModal(false);
    setPendingClose(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isCreating && !showUnsavedChangesModal) {
        handleCloseAttempt();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCreating, showUnsavedChangesModal, handleCloseAttempt]);

  const handleSubmit = (e: React.FormEvent) => {
    onSubmit(e);
  };

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
        aria-labelledby="task-modal-title"
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
              <div className={styles['modal-icon-wrapper']} aria-hidden="true">
                <PlusIcon size={24} />
              </div>
              <div className={styles['modal-title-group']}>
                <h2 id="task-modal-title" className={styles['modal-title']}>
                  {t('taskCreate.title')}
                </h2>
                <p className={styles['modal-subtitle']}>{t('taskCreate.subtitle')}</p>
              </div>
            </div>
            <button
              className={styles['modal-close']}
              onClick={handleCloseAttempt}
              aria-label={t('taskCreate.closeModal')}
              data-modal-close
              type="button"
            >
              <CloseIcon size={14} aria-hidden="true" />
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
                      aria-label={t('taskCreate.closeErrorMessage')}
                      type="button"
                    >
                      <CloseIcon size={12} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              <div className={styles['form-legend']}>
                <span className={styles['required-indicator']}>*</span>
                <span>{t('taskCreate.requiredFields')}</span>
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="task-pbi">
                  {t('taskCreate.parentBacklogItem')}
                  <RequiredIndicator />
                </label>
                <select
                  id="task-pbi"
                  value={formData.pbiId}
                  onChange={(e) => onFormDataChange({ pbiId: e.target.value })}
                  className={formErrors.pbiId ? styles.error : ''}
                  aria-invalid={!!formErrors.pbiId}
                  aria-describedby={formErrors.pbiId ? 'task-pbi-error' : undefined}
                >
                  <option value="">{t('taskCreate.selectBacklogItem')}</option>
                  {sprintItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({item.storyPoints ?? 0} {t('pts' as never)})
                    </option>
                  ))}
                </select>
                {formErrors.pbiId && (
                  <span id="task-pbi-error" className={styles['form-error']} role="alert">
                    {formErrors.pbiId}
                  </span>
                )}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="task-title">
                  {t('taskCreate.titleLabel')}
                  <RequiredIndicator />
                </label>
                <input
                  id="task-title"
                  type="text"
                  placeholder={t('taskCreate.titlePlaceholder')}
                  value={formData.title}
                  onChange={(e) => onFormDataChange({ title: e.target.value })}
                  maxLength={100}
                  className={formErrors.title ? styles.error : ''}
                  aria-invalid={!!formErrors.title}
                  aria-describedby={formErrors.title ? 'task-title-error' : undefined}
                  autoFocus
                />
                {formErrors.title && (
                  <span id="task-title-error" className={styles['form-error']} role="alert">
                    {formErrors.title}
                  </span>
                )}
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="task-desc">
                  {t('taskCreate.descriptionLabel')}
                  <RequiredIndicator />
                </label>
                <textarea
                  id="task-desc"
                  rows={3}
                  placeholder={t('taskCreate.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => onFormDataChange({ description: e.target.value })}
                  className={formErrors.description ? styles.error : ''}
                  aria-invalid={!!formErrors.description}
                  aria-describedby={formErrors.description ? 'task-desc-error' : undefined}
                />
                {formErrors.description && (
                  <span id="task-desc-error" className={styles['form-error']} role="alert">
                    {formErrors.description}
                  </span>
                )}
              </div>

              <div className={styles['form-section-divider']} />
              <h3 className={styles['form-section-title']}>{t('taskCreate.assignment')}</h3>

              <div className={styles['form-group']}>
                <label htmlFor="task-assignee">
                  {t('taskCreate.assigneeLabel')}
                  <RequiredIndicator />
                </label>
                <select
                  id="task-assignee"
                  value={formData.assigneeId}
                  onChange={(e) => onFormDataChange({ assigneeId: e.target.value })}
                  className={formErrors.assigneeId ? styles.error : ''}
                  aria-invalid={!!formErrors.assigneeId}
                  aria-describedby={formErrors.assigneeId ? 'task-assignee-error' : undefined}
                >
                  <option value="">{t('taskCreate.unassigned')}</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.userId}>
                      {member.user?.firstName} {member.user?.lastName}
                    </option>
                  ))}
                </select>
                {formErrors.assigneeId && (
                  <span id="task-assignee-error" className={styles['form-error']} role="alert">
                    {formErrors.assigneeId}
                  </span>
                )}
              </div>

              <div className={styles['form-section-divider']} />
              <h3 className={styles['form-section-title']}>{t('taskCreate.timeTracking')}</h3>

              <div className={styles['form-row']}>
                <div className={styles['form-group']}>
                  <label htmlFor="task-estimated">
                    {t('taskCreate.estimatedHours')}
                    <RequiredIndicator />
                  </label>
                  <input
                    id="task-estimated"
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
                      formErrors.estimatedHours ? 'task-estimated-error' : 'task-estimated-hint'
                    }
                  />
                  {formErrors.estimatedHours ? (
                    <span id="task-estimated-error" className={styles['form-error']} role="alert">
                      {formErrors.estimatedHours}
                    </span>
                  ) : (
                    <span id="task-estimated-hint" className={styles['form-hint']}>
                      {t('taskCreate.remainingHoursHint')}
                    </span>
                  )}
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="task-remaining">
                    {t('taskCreate.remainingHours')}
                    <RequiredIndicator />
                  </label>
                  <input
                    id="task-remaining"
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
                      formErrors.remainingHours ? 'task-remaining-error' : 'task-remaining-hint'
                    }
                  />
                  {formErrors.remainingHours ? (
                    <span id="task-remaining-error" className={styles['form-error']} role="alert">
                      {formErrors.remainingHours}
                    </span>
                  ) : (
                    <span id="task-remaining-hint" className={styles['form-hint']}>
                      {t('taskCreate.remainingHoursDailyHint')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles['modal-footer-with-back']}>
              <div className={styles['footer-back-section']} />
              <div className={styles['footer-action-section']}>
                <button
                  type="button"
                  className={`${styles.button} ${styles['button-secondary']}`}
                  onClick={handleCloseAttempt}
                  disabled={isCreating}
                >
                  {t('taskCreate.cancel')}
                </button>
                <button
                  type="submit"
                  className={`${styles.button} ${styles['button-primary']} ${isCreating ? styles['button-loading'] : ''}`}
                  disabled={isCreating}
                  aria-busy={isCreating}
                >
                  {!isCreating && <PlusIcon size={16} />}
                  {isCreating ? t('taskCreate.creating') : t('taskCreate.createTask')}
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
        title={t('taskCreate.discardTitle')}
        message={t('taskCreate.discardMessage')}
      />
    </>
  );
};
