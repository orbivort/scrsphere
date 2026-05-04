import React, { useState, useEffect, useCallback } from 'react';

import type { Task, ProductBacklogItem, TeamMember, User } from '../../../../types';
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
}) => {
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'close' | 'back' | null>(null);

  const hasUnsavedChanges = useCallback((): boolean => {
    return hasUnsavedChangesForEdit(formData, {
      title: task.title || '',
      description: task.description || '',
      assigneeId: task.assigneeId || '',
      estimatedHours: task.estimatedHours || 0,
      remainingHours: task.remainingHours || 0,
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
                  Edit Task #{task.id.slice(-4)}
                </h2>
                <p className={styles['modal-subtitle']}>Make changes to your task</p>
              </div>
            </div>
            <button
              className={styles['modal-close']}
              onClick={handleCloseAttempt}
              aria-label="Close modal"
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
                      aria-label="Close error message"
                      type="button"
                    >
                      <XIcon size={12} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              <div className={styles['form-legend']}>
                <span className={styles['required-indicator']}>*</span>
                <span>Required fields</span>
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="edit-task-pbi">Parent Backlog Item</label>
                <select
                  id="edit-task-pbi"
                  value={formData.pbiId}
                  onChange={(e) => onFormDataChange({ pbiId: e.target.value })}
                  disabled
                  className={styles['disabled-select']}
                >
                  <option value="">Select a backlog item...</option>
                  {sprintItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({item.storyPoints || 0} pts)
                    </option>
                  ))}
                </select>
                <span className={styles['form-hint']}>Parent item cannot be changed</span>
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="edit-task-title">
                  Title
                  <RequiredIndicator />
                </label>
                <input
                  id="edit-task-title"
                  type="text"
                  placeholder="Enter task title"
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
                  Description
                  <RequiredIndicator />
                </label>
                <textarea
                  id="edit-task-desc"
                  rows={3}
                  placeholder="Enter task description"
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
              <h3 className={styles['form-section-title']}>Assignment</h3>

              <div className={styles['form-group']}>
                <label htmlFor="edit-task-assignee">
                  Assignee
                  <RequiredIndicator />
                </label>
                <select
                  id="edit-task-assignee"
                  value={formData.assigneeId}
                  onChange={(e) => onFormDataChange({ assigneeId: e.target.value })}
                  className={formErrors.assigneeId ? styles.error : ''}
                  aria-invalid={!!formErrors.assigneeId}
                  aria-describedby={formErrors.assigneeId ? 'edit-task-assignee-error' : undefined}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
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
              <h3 className={styles['form-section-title']}>Time Tracking</h3>

              <div className={styles['form-row']}>
                <div className={styles['form-group']}>
                  <label htmlFor="edit-task-estimated">
                    Estimated Hours
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
                      Remaining hours will default to estimated hours
                    </span>
                  )}
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="edit-task-remaining">
                    Remaining Hours
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
                      Update daily for accurate burndown
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
                  Back to Details
                </button>
              </div>
              <div className={styles['footer-action-section']}>
                <button
                  type="button"
                  className={`${styles.button} ${styles['button-secondary']}`}
                  onClick={handleCloseAttempt}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.button} ${styles['button-primary']} ${isUpdating ? styles['button-loading'] : ''}`}
                  disabled={isUpdating}
                  aria-busy={isUpdating}
                >
                  {!isUpdating && <SaveIcon size={16} />}
                  {isUpdating ? 'Saving...' : 'Save Changes'}
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
        title="Discard Changes?"
        message="You have unsaved changes to this task. Are you sure you want to discard them?"
      />
    </>
  );
};
