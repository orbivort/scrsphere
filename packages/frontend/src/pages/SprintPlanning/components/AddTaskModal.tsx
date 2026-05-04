import React, { useEffect, useRef, useCallback } from 'react';

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
  }, [isOpen]);

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
        setTitleError('Task title is required');
        hasError = true;
      }

      if (estimatedHours <= 0) {
        setEstimatedHoursError('Estimated hours must be greater than 0');
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
    [title, estimatedHours, assigneeId, onSubmit]
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
                Add New Task
              </h2>
              {itemTitle && (
                <p className={styles.subtitle}>
                  Adding task to <span className={styles['item-highlight']}>{itemTitle}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              className={styles['close-button']}
              onClick={handleClose}
              aria-label="Close modal"
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
                  Task Title
                  <span className={styles.required}>*</span>
                </label>
                <div className={styles['input-wrapper']}>
                  <input
                    ref={titleInputRef}
                    id="task-title"
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="e.g., Implement user authentication"
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
                  Describe what needs to be done clearly and concisely
                </span>
              </div>

              {/* Form Row for Hours and Assignee */}
              <div className={styles['form-row']}>
                {/* Estimated Hours Field */}
                <div className={styles['form-group']}>
                  <label htmlFor="task-estimate" className={styles['form-label']}>
                    Estimated Hours
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
                      className={`${styles['form-input']} ${estimatedHoursError ? styles['input-error'] : ''}`}
                      aria-required="true"
                      aria-invalid={!!estimatedHoursError}
                      aria-describedby={estimatedHoursError ? 'estimate-error' : undefined}
                    />
                    <span className={styles['input-icon-left']}>
                      <ClockIcon size={16} />
                    </span>
                  </div>
                  {estimatedHoursError && (
                    <div id="estimate-error" className={styles['error-message']} role="alert">
                      {estimatedHoursError}
                    </div>
                  )}
                  <span className={styles['input-hint']}>Hours needed to complete</span>
                </div>

                {/* Assignee Field */}
                <div className={styles['form-group']}>
                  <label htmlFor="task-assignee" className={styles['form-label']}>
                    Assignee
                    <span className={styles.optional}>Optional</span>
                  </label>
                  <div className={styles['select-wrapper']}>
                    <select
                      id="task-assignee"
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className={styles['form-select']}
                    >
                      <option value="">Unassigned</option>
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
                  <span className={styles['input-hint']}>Who will work on this?</span>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <footer className={styles.footer}>
            <button type="button" className={styles['button-secondary']} onClick={handleClose}>
              Cancel
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
              Add Task
            </button>
          </footer>
        </div>
      </div>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        onConfirm={handleDiscardChanges}
        onCancel={handleCancelUnsavedChanges}
        title="Unsaved Task Changes"
        message="You have unsaved changes to the task. Are you sure you want to discard them?"
      />
    </>
  );
};
