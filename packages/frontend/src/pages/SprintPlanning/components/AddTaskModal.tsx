import React, { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { UnsavedChangesModal } from '../../../components/common/Form/UnsavedChangesModal';

import styles from './AddTaskModal.module.css';

import { CheckIcon, ClockIcon, SparklesIcon, UserIcon, XIcon } from '@/components/common/Icons';

export interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: { title: string; estimatedHours: number; assigneeId: string }) => void;
  teamMembers: Array<{
    memberId: string;
    userId: string;
    memberName: string;
  }>;
  itemTitle?: string;
}

// Icons imported from shared library

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teamMembers,
  itemTitle,
}) => {
  const { t } = useTranslation('sprint');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = React.useState('');
  const [estimatedHours, setEstimatedHours] = React.useState<number>(0);
  const [assigneeId, setAssigneeId] = React.useState<string>('');
  const [titleError, setTitleError] = React.useState<string>('');
  const [estimatedHoursError, setEstimatedHoursError] = React.useState<string>('');

  // Store original form values for unsaved changes detection
  const [originalForm, setOriginalForm] = React.useState({
    title: '',
    estimatedHours: 0,
    assigneeId: '',
  });
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = React.useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialForm = { title: '', estimatedHours: 0, assigneeId: '' };
      setTitle('');
      setEstimatedHours(0);
      setAssigneeId('');
      setTitleError('');
      setEstimatedHoursError('');
      setOriginalForm(initialForm);
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the title input when modal opens
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 0);

      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return (
      title.trim() !== originalForm.title.trim() ||
      estimatedHours !== originalForm.estimatedHours ||
      assigneeId !== originalForm.assigneeId
    );
  }, [title, estimatedHours, assigneeId, originalForm]);

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Handle discard changes
  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedChangesModal(false);
    onClose();
  }, [onClose]);

  // Handle cancel unsaved changes (go back to editing)
  const handleCancelUnsavedChanges = useCallback(() => {
    setShowUnsavedChangesModal(false);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      let hasError = false;

      if (!title.trim()) {
        setTitleError(t('sprintPlanning.addTaskModal.taskTitleRequired'));
        hasError = true;
      }

      if (estimatedHours <= 0) {
        setEstimatedHoursError(t('sprintPlanning.addTaskModal.hoursGreaterThanZero'));
        hasError = true;
      }

      if (hasError) {
        if (!title.trim()) {
          titleInputRef.current?.focus();
        }
        return;
      }

      onSubmit({
        title: title.trim(),
        estimatedHours,
        assigneeId,
      });
    },
    [title, estimatedHours, assigneeId, onSubmit, t]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (titleError) setTitleError('');
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className={styles.overlay}
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div
          ref={modalRef}
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-task-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative gradient orb */}
          <div className={styles['gradient-orb']} aria-hidden="true" />

          {/* Header */}
          <header className={styles.header}>
            <div className={styles['header-content']}>
              <div className={styles['icon-wrapper']}>
                <CheckIcon size={24} />
              </div>
              <h2 id="add-task-title" className={styles.title}>
                {t('sprintPlanning.addTaskModal.addNewTask')}
              </h2>
              {itemTitle && (
                <p className={styles.subtitle}>
                  {t('sprintPlanning.addTaskModal.addingTaskTo')}
                  <span className={styles['item-highlight']}>{itemTitle}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              className={styles['close-button']}
              onClick={handleClose}
              aria-label={t('sprintPlanning.addTaskModal.cancel')}
            >
              <XIcon size={20} />
            </button>
          </header>

          {/* Progress indicator */}
          <div className={styles['progress-bar']} aria-hidden="true">
            <div
              className={styles['progress-fill']}
              style={{ width: title.trim() ? '100%' : '33%' }}
            />
          </div>

          {/* Body */}
          <div className={styles.body}>
            <form id="add-task-form" className={styles.form} onSubmit={handleSubmit}>
              {/* Task Title Field */}
              <div className={styles['form-group']}>
                <label htmlFor="task-title" className={styles['form-label']}>
                  {t('sprintPlanning.addTaskModal.titleLabel')}
                  <span className={styles.required}>*</span>
                </label>
                <div className={styles['input-wrapper']}>
                  <input
                    ref={titleInputRef}
                    id="task-title"
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder={t('sprintPlanning.addTaskModal.titlePlaceholder')}
                    className={`${styles['form-input']} ${titleError ? styles['input-error'] : ''}`}
                    aria-required="true"
                    aria-invalid={!!titleError}
                    aria-describedby={titleError ? 'title-error' : undefined}
                  />
                  <span className={styles['input-icon']}>
                    <SparklesIcon size={16} />
                  </span>
                </div>
                {titleError && (
                  <div id="title-error" className={styles['error-message']} role="alert">
                    {titleError}
                  </div>
                )}
                <span className={styles['input-hint']}>
                  {t('sprintPlanning.addTaskModal.describeTaskHint')}
                </span>
              </div>

              {/* Form Row for Hours and Assignee */}
              <div className={styles['form-row']}>
                {/* Estimated Hours Field */}
                <div className={styles['form-group']}>
                  <label htmlFor="task-estimate" className={styles['form-label']}>
                    {t('sprintPlanning.addTaskModal.estimatedHoursLabel')}
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles['input-wrapper']}>
                    <input
                      id="task-estimate"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={estimatedHours || ''}
                      onChange={(e) => {
                        setEstimatedHours(parseFloat(e.target.value) || 0);
                        if (estimatedHoursError) setEstimatedHoursError('');
                      }}
                      placeholder="4"
                      className={`${styles['form-input']} ${styles['estimate-input']} ${estimatedHoursError ? styles['input-error'] : ''}`}
                      aria-required="true"
                      aria-invalid={!!estimatedHoursError}
                      aria-describedby={estimatedHoursError ? 'estimate-error' : undefined}
                    />
                    <span className={styles['input-icon']}>
                      <ClockIcon size={16} />
                    </span>
                  </div>
                  {estimatedHoursError && (
                    <div id="estimate-error" className={styles['error-message']} role="alert">
                      {estimatedHoursError}
                    </div>
                  )}
                  <span className={styles['input-hint']}>
                    {t('sprintPlanning.addTaskModal.hoursNeededHint')}
                  </span>
                </div>

                {/* Assignee Field */}
                <div className={styles['form-group']}>
                  <label htmlFor="task-assignee" className={styles['form-label']}>
                    {t('sprintPlanning.addTaskModal.assigneeLabel')}
                    <span className={styles.optional}>
                      {t('sprintPlanning.addTaskModal.optional')}
                    </span>
                  </label>
                  <div className={styles['select-wrapper']}>
                    <select
                      id="task-assignee"
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className={styles['form-select']}
                    >
                      <option value="">{t('sprintPlanning.addTaskModal.unassigned')}</option>
                      {/* Self-managed Developers-as-a-team assignment: any Developer on the team
                          may be selected for the new task. PO/SM cannot assign (enforced on the
                          backend and by disabling the controls for them). */}
                      {teamMembers.map((member) => (
                        <option key={member.memberId} value={member.userId}>
                          {member.memberName}
                        </option>
                      ))}
                    </select>
                    <span className={styles['select-icon']}>
                      <UserIcon size={16} />
                    </span>
                  </div>
                  <span className={styles['input-hint']}>
                    {t('sprintPlanning.addTaskModal.whoWillWorkHint')}
                  </span>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <footer className={styles.footer}>
            <button type="button" className={styles['button-secondary']} onClick={handleClose}>
              {t('sprintPlanning.addTaskModal.cancel')}
            </button>
            <button
              type="submit"
              form="add-task-form"
              className={styles['button-primary']}
              disabled={!title.trim() || estimatedHours <= 0}
            >
              <span className={styles['button-icon']}>
                <CheckIcon size={16} />
              </span>
              {t('sprintPlanning.addTaskModal.addTask')}
            </button>
          </footer>
        </div>
      </div>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        onConfirm={handleDiscardChanges}
        onCancel={handleCancelUnsavedChanges}
        title={t('sprintPlanning.addTaskModal.unsavedTaskTitle')}
        message={t('sprintPlanning.addTaskModal.unsavedTaskMessage')}
      />
    </>
  );
};
