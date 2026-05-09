import React, { useEffect, useRef, useCallback } from 'react';

import { UnsavedChangesModal } from '../../../components/common/Form/UnsavedChangesModal';

import styles from './EditSprintGoalModal.module.css';

import {
  CheckIcon,
  LightbulbIcon,
  SparklesIcon,
  TargetIcon,
  XIcon,
} from '@/components/common/Icons';

export interface EditSprintGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: string) => void;
  initialGoal: string;
  sprintName?: string;
  isSaving?: boolean;
}

// Icons imported from shared library

export const EditSprintGoalModal: React.FC<EditSprintGoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGoal,
  sprintName,
  isSaving = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [goal, setGoal] = React.useState('');
  const [originalGoal, setOriginalGoal] = React.useState('');
  const [goalError, setGoalError] = React.useState<string>('');
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = React.useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setGoal(initialGoal || '');
      setOriginalGoal(initialGoal || '');
      setGoalError('');
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the textarea when modal opens
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);

      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, initialGoal]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return (goal || '').trim() !== (originalGoal || '').trim();
  }, [goal, originalGoal]);

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

      if (isSaving) return;

      if (!(goal || '').trim()) {
        setGoalError('Sprint goal is required');
        textareaRef.current?.focus();
        return;
      }

      onSave((goal || '').trim());
    },
    [goal, onSave, isSaving]
  );

  const handleGoalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGoal(e.target.value);
    if (goalError) setGoalError('');
  };

  // Calculate character count
  const charCount = (goal || '').length;
  const maxChars = 500;

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
          aria-labelledby="edit-goal-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative gradient orb */}
          <div className={styles['gradient-orb']} aria-hidden="true" />

          {/* Header */}
          <header className={styles.header}>
            <div className={styles['header-content']}>
              <div className={styles['icon-wrapper']}>
                <TargetIcon size={24} />
              </div>
              <h2 id="edit-goal-title" className={styles.title}>
                Edit Sprint Goal
              </h2>
              {sprintName && (
                <p className={styles.subtitle}>
                  Sprint: <span className={styles['sprint-highlight']}>{sprintName}</span>
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
              style={{ width: goal.trim() ? '100%' : '50%' }}
            />
          </div>

          {/* Body */}
          <div className={styles.body}>
            <form id="edit-goal-form" className={styles.form} onSubmit={handleSubmit}>
              {/* Sprint Goal Field */}
              <div className={styles['form-group']}>
                <label htmlFor="sprint-goal" className={styles['form-label']}>
                  Sprint Goal
                  <span className={styles.required}>*</span>
                </label>
                <div className={styles['textarea-wrapper']}>
                  <textarea
                    ref={textareaRef}
                    id="sprint-goal"
                    value={goal}
                    onChange={handleGoalChange}
                    placeholder="Define a clear, achievable goal for this sprint..."
                    rows={4}
                    className={`${styles['form-textarea']} ${goalError ? styles['input-error'] : ''}`}
                    aria-required="true"
                    aria-invalid={!!goalError}
                    aria-describedby={goalError ? 'goal-error' : undefined}
                    maxLength={maxChars}
                  />
                  <span className={styles['textarea-icon']}>
                    <SparklesIcon size={16} />
                  </span>
                  <span
                    className={`${styles['char-counter']} ${
                      charCount > maxChars * 0.9 ? styles['char-counter-warning'] : ''
                    }`}
                  >
                    {charCount}/{maxChars}
                  </span>
                </div>
                {goalError && (
                  <div id="goal-error" className={styles['error-message']} role="alert">
                    {goalError}
                  </div>
                )}
                <span className={styles['input-hint']}>
                  A good sprint goal focuses on value delivery and aligns with the product vision
                </span>
              </div>

              {/* Tips Card */}
              <div className={styles['tips-card']}>
                <div className={styles['tips-header']}>
                  <span className={styles['tips-icon']}>
                    <LightbulbIcon size={16} />
                  </span>
                  <h3 className={styles['tips-title']}>Tips for a good Sprint Goal</h3>
                </div>
                <ul className={styles['tips-list']}>
                  <li className={styles['tip-item']}>
                    <span className={styles['tip-check']}>
                      <CheckIcon size={16} />
                    </span>
                    Focus on value delivery, not just completing tasks
                  </li>
                  <li className={styles['tip-item']}>
                    <span className={styles['tip-check']}>
                      <CheckIcon size={16} />
                    </span>
                    Be specific and measurable
                  </li>
                  <li className={styles['tip-item']}>
                    <span className={styles['tip-check']}>
                      <CheckIcon size={16} />
                    </span>
                    Align with the Product Goal
                  </li>
                  <li className={styles['tip-item']}>
                    <span className={styles['tip-check']}>
                      <CheckIcon size={16} />
                    </span>
                    Keep it achievable within the sprint
                  </li>
                </ul>
              </div>
            </form>
          </div>

          {/* Footer */}
          <footer className={styles.footer}>
            <button
              type="button"
              className={styles['button-secondary']}
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-goal-form"
              className={styles['button-primary']}
              disabled={!goal.trim() || isSaving}
              aria-busy={isSaving}
            >
              {isSaving ? (
                <>
                  <span className={styles['button-spinner']} />
                  Saving...
                </>
              ) : (
                <>
                  <span className={styles['button-icon']}>
                    <CheckIcon size={16} />
                  </span>
                  Save Goal
                </>
              )}
            </button>
          </footer>
        </div>
      </div>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        onConfirm={handleDiscardChanges}
        onCancel={handleCancelUnsavedChanges}
        title="Unsaved Sprint Goal Change"
        message="You have unsaved change to the sprint goal. Are you sure you want to discard it?"
      />
    </>
  );
};
