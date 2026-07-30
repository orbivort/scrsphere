import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './CreateActionItemModal.module.css';

import { UnsavedChangesModal } from '@/components/common/Form/UnsavedChangesModal';
import { AlertCircleIcon, PlusIcon, CheckIcon } from '@/components/common/Icons';
import { LocaleDateInput } from '@/components/common/Form/LocaleDateInput';

export interface TeamMember {
  id: string;
  name: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  role?: string;
}

export interface ActionItemFormData {
  title: string;
  description: string;
  ownerId: string;
  dueDate: string;
  status: 'PENDING';
}

export interface ActionFormErrors {
  title?: string;
  ownerId?: string;
  dueDate?: string;
}

export interface ActionFormTouched {
  title: boolean;
  ownerId: boolean;
  dueDate: boolean;
}

export interface CreateActionItemModalProps {
  isOpen: boolean;
  formData: ActionItemFormData;
  errors: ActionFormErrors;
  touched: ActionFormTouched;
  teamMembers: TeamMember[];
  isLoadingTeam: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFieldChange: (field: keyof ActionItemFormData, value: string) => void;
  onFieldBlur: (field: keyof ActionFormTouched) => void;
  validateField: (field: string, value: string) => string | undefined;
}

// Helper to check if form has unsaved changes
const hasUnsavedChanges = (current: ActionItemFormData, initial: ActionItemFormData): boolean => {
  return (
    current.title !== initial.title ||
    current.description !== initial.description ||
    current.ownerId !== initial.ownerId ||
    current.dueDate !== initial.dueDate
  );
};

// Initial empty form state for comparison
const INITIAL_FORM_STATE: ActionItemFormData = {
  title: '',
  description: '',
  ownerId: '',
  dueDate: '',
  status: 'PENDING',
};

export const CreateActionItemModal: React.FC<CreateActionItemModalProps> = ({
  isOpen,
  formData,
  errors,
  touched,
  teamMembers,
  isLoadingTeam,
  isPending,
  onClose,
  onSubmit,
  onFieldChange,
  onFieldBlur,
  validateField,
}) => {
  // State for tracking initial form data (set when modal opens)
  const [initialFormData, setInitialFormData] = useState<ActionItemFormData>(INITIAL_FORM_STATE);
  const { t } = useTranslation('retrospective');

  // State for unsaved changes modal
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  // Refs for focus management
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Refs to track current form data for stable callback references
  const formDataRef = useRef(formData);
  const initialFormDataRef = useRef(initialFormData);
  const isPendingRef = useRef(isPending);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    initialFormDataRef.current = initialFormData;
  }, [initialFormData]);

  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  // Store initial form data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Save the current form data as the initial state
      setInitialFormData({ ...formData });
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the title input when modal opens
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 0);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
      // Restore focus when modal closes
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle close request - check for unsaved changes
  const handleCloseRequest = useCallback(() => {
    if (isPendingRef.current) return; // Don't allow closing while submitting

    if (hasUnsavedChanges(formDataRef.current, initialFormDataRef.current)) {
      setShowUnsavedChangesModal(true);
    } else {
      onClose();
    }
  }, [onClose]);

  // Handle keyboard events (Escape key and focus trap)
  useEffect(() => {
    if (!isOpen || showUnsavedChangesModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseRequest();
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
  }, [isOpen, showUnsavedChangesModal, handleCloseRequest]);

  // Handle discard changes
  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedChangesModal(false);
    onClose();
  }, [onClose]);

  // Handle cancel unsaved changes modal (go back to editing)
  const handleCancelUnsavedChanges = useCallback(() => {
    setShowUnsavedChangesModal(false);
  }, []);

  // Handle successful submit - reset initial form data
  const handleSubmit = useCallback(() => {
    onSubmit();
  }, [onSubmit]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange('title', e.target.value);
  };

  const handleTitleBlur = () => {
    onFieldBlur('title');
    const error = validateField('title', formData.title);
    if (error) {
      onFieldChange('title', formData.title);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onFieldChange('description', e.target.value);
  };

  const handleOwnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFieldChange('ownerId', e.target.value);
  };

  const handleOwnerBlur = () => {
    onFieldBlur('ownerId');
    const error = validateField('ownerId', formData.ownerId);
    if (error) {
      onFieldChange('ownerId', formData.ownerId);
    }
  };

  const handleDueDateChange = (value: string) => {
    onFieldChange('dueDate', value);
  };

  const handleDueDateBlur = (value: string) => {
    onFieldBlur('dueDate');
    const error = validateField('dueDate', value);
    if (error) {
      onFieldChange('dueDate', value);
    }
  };

  const isSubmitDisabled =
    !formData.title.trim() ||
    !formData.ownerId ||
    !formData.dueDate ||
    !!errors.title ||
    !!errors.ownerId ||
    !!errors.dueDate ||
    isPending;

  const hasTitleError = touched.title && errors.title;
  const hasOwnerError = touched.ownerId && errors.ownerId;
  const hasDueDateError = touched.dueDate && errors.dueDate;

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className={styles['modal-overlay']}
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-modal-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseRequest();
          }
        }}
      >
        <div
          ref={modalRef}
          className={styles['modal-content']}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles['modal-header']}>
            <div className={styles['modal-icon']}>
              <PlusIcon size={16} />
            </div>
            <div>
              <h2 id="action-modal-title" className={styles['modal-title']}>
                {t('createActionItemModal.title')}
              </h2>
              <p className={styles['modal-subtitle']}>{t('createActionItemModal.subtitle')}</p>
            </div>
          </div>

          {/* Body */}
          <div className={styles['modal-body']}>
            {/* Title Field */}
            <div className={`${styles['form-group']} ${hasTitleError ? styles['has-error'] : ''}`}>
              <label htmlFor="action-title" className={styles['form-label']}>
                {t('createActionItemModal.titleLabel')}
                <span className={styles['required-indicator']}>*</span>
              </label>
              <input
                ref={titleInputRef}
                id="action-title"
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                placeholder={t('createActionItemModal.titlePlaceholder')}
                className={styles['form-input']}
                aria-invalid={!!hasTitleError}
                aria-describedby={hasTitleError ? 'title-error' : undefined}
                disabled={isPending}
              />
              {hasTitleError && (
                <div id="title-error" className={styles['error-message']} role="alert">
                  <AlertCircleIcon size={16} className={styles['error-icon']} />
                  <span className={styles['error-text']}>{errors.title}</span>
                </div>
              )}
            </div>

            {/* Description Field */}
            <div className={styles['form-group']}>
              <label htmlFor="action-description" className={styles['form-label']}>
                {t('createActionItemModal.description')}
                <span className={styles['optional-badge']}>
                  {t('createActionItemModal.optionalBadge')}
                </span>
              </label>
              <textarea
                id="action-description"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder={t('createActionItemModal.descriptionPlaceholder')}
                rows={3}
                className={styles['form-textarea']}
                disabled={isPending}
              />
              <p className={styles['helper-text']}>
                {t('createActionItemModal.descriptionHelper')}
              </p>
            </div>

            {/* Owner Field */}
            <div className={`${styles['form-group']} ${hasOwnerError ? styles['has-error'] : ''}`}>
              <label htmlFor="action-owner" className={styles['form-label']}>
                {t('createActionItemModal.owner')}
                <span className={styles['required-indicator']}>*</span>
              </label>
              <select
                id="action-owner"
                value={formData.ownerId}
                onChange={handleOwnerChange}
                onBlur={handleOwnerBlur}
                disabled={isLoadingTeam || isPending}
                className={styles['form-select']}
                aria-invalid={!!hasOwnerError}
                aria-describedby={hasOwnerError ? 'owner-error' : undefined}
              >
                <option value="">{t('createActionItemModal.ownerPlaceholder')}</option>
                {teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {isLoadingTeam
                      ? t('createActionItemModal.loadingMembers')
                      : t('createActionItemModal.noMembers')}
                  </option>
                )}
              </select>
              {hasOwnerError && (
                <div id="owner-error" className={styles['error-message']} role="alert">
                  <AlertCircleIcon size={16} className={styles['error-icon']} />
                  <span className={styles['error-text']}>{errors.ownerId}</span>
                </div>
              )}
              {teamMembers.length === 0 && !isLoadingTeam && (
                <div className={styles['error-message']} role="alert">
                  <AlertCircleIcon size={16} className={styles['error-icon']} />
                  <span className={styles['error-text']}>
                    {t('createActionItemModal.unableToLoadMembers')}
                  </span>
                </div>
              )}
            </div>

            {/* Due Date Field */}
            <div
              className={`${styles['form-group']} ${hasDueDateError ? styles['has-error'] : ''}`}
            >
              <label htmlFor="action-due-date" className={styles['form-label']}>
                {t('createActionItemModal.dueDate')}
                <span className={styles['required-indicator']}>*</span>
              </label>
              <LocaleDateInput
                id="action-due-date"
                value={formData.dueDate}
                onChange={handleDueDateChange}
                onBlur={handleDueDateBlur}
                hasError={!!hasDueDateError}
                errorId="duedate-error"
                required
                disabled={isPending}
              />
              {hasDueDateError && (
                <div id="duedate-error" className={styles['error-message']} role="alert">
                  <AlertCircleIcon size={16} className={styles['error-icon']} />
                  <span className={styles['error-text']}>{errors.dueDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={styles['modal-footer']}>
            <button
              className={`${styles.btn} ${styles['btn-secondary']}`}
              onClick={handleCloseRequest}
              type="button"
              disabled={isPending}
            >
              {t('createActionItemModal.cancel')}
            </button>
            <button
              className={`${styles.btn} ${styles['btn-primary']} ${isPending ? styles['btn-loading'] : ''}`}
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              type="button"
            >
              {!isPending && <CheckIcon size={16} />}
              {isPending
                ? t('createActionItemModal.creating')
                : t('createActionItemModal.createActionItem')}
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        onConfirm={handleDiscardChanges}
        onCancel={handleCancelUnsavedChanges}
        title={t('createActionItemModal.unsavedTitle')}
        message={t('createActionItemModal.unsavedMessage')}
      />
    </>
  );
};
