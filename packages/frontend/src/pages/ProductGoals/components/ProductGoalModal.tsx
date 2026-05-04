import React, { useRef, useEffect, useState, useCallback } from 'react';

import { CharacterCounter } from '../../../components/common/Form/CharacterCounter';
import { HelpPanel } from '../../../components/common/Form/HelpPanel';
import { DraftRestorePrompt } from '../../../components/common/Form/DraftRestorePrompt';
import { UnsavedChangesModal } from '../../../components/common/Form/UnsavedChangesModal';
import type { ProductGoal } from '../../../types';
import { useModalFocus } from '../../../hooks/useModalFocus';

import styles from './ProductGoalModal.module.css';

import {
  TargetIcon,
  EditIcon,
  CloseIcon,
  PlusIcon,
  SaveIcon,
  AlertCircleIcon,
} from '@/components/common/Icons';

// Form field validation types
export interface FormErrors {
  title?: string;
  description?: string;
  targetDate?: string;
  successMetrics?: string;
}

export interface TouchedFields {
  title: boolean;
  description: boolean;
  targetDate: boolean;
  successMetrics: boolean;
}

export interface FormData extends Record<string, unknown> {
  title: string;
  description: string;
  targetDate: string;
  successMetrics: string;
  status: ProductGoal['status'];
  strategicAlignment?: string;
}

export interface StrategicOption {
  value: string;
  label: string;
}

export interface ProductGoalModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  formData: FormData;
  formErrors: FormErrors;
  touchedFields: TouchedFields;
  formProgressPercentage: number;
  isFormValid: boolean;
  modalErrorMessage: string | null;
  isSubmitting: boolean;
  hasDraft?: boolean;
  showRestorePrompt?: boolean;
  lastSavedAt?: Date | null;
  strategicOptions: StrategicOption[];
  hasUnsavedChanges: boolean;
  onClose: () => void;
  onFieldChange: (fieldName: keyof FormData, value: string) => void;
  onFieldBlur: (fieldName: keyof FormData, value: string) => void;
  onSubmit: () => void;
  onRestoreDraft: () => void;
  onDiscardDraft: () => void;
  onClearDraft?: () => void;
  onClearError?: () => void;
}

export const ProductGoalModal: React.FC<ProductGoalModalProps> = ({
  isOpen,
  mode,
  formData,
  formErrors,
  touchedFields,
  formProgressPercentage,
  isFormValid,
  modalErrorMessage,
  isSubmitting,
  hasDraft = false,
  showRestorePrompt = false,
  lastSavedAt = null,
  strategicOptions,
  hasUnsavedChanges,
  onClose,
  onFieldChange,
  onFieldBlur,
  onSubmit,
  onRestoreDraft,
  onDiscardDraft,
  onClearDraft,
  onClearError,
}) => {
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesModal(true);
      return;
    }
    onClose();
  }, [hasUnsavedChanges, onClose]);

  const { modalRef } = useModalFocus({
    isOpen,
    onClose: handleClose,
    initialFocusRef: titleInputRef,
  });

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle discard changes confirmation
  const handleDiscardChanges = useCallback(() => {
    onClearDraft?.();
    setShowUnsavedChangesModal(false);
    onClose();
  }, [onClearDraft, onClose]);

  // Handle cancel discard - close the modal and continue editing
  const handleCancelDiscard = useCallback(() => {
    setShowUnsavedChangesModal(false);
  }, []);

  if (!isOpen) {
    return null;
  }

  const isEditMode = mode === 'edit';

  return (
    <>
      <div className={styles['modal-overlay']} onClick={handleClose}>
        <div
          ref={modalRef}
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Modal Header */}
          <div className={styles['modal-header']}>
            <div className={styles['header-content']}>
              <div className={styles['icon-wrapper']}>
                {isEditMode ? <EditIcon size={24} /> : <TargetIcon size={24} />}
              </div>
              <h2 id="modal-title" className={styles['modal-title']}>
                {isEditMode ? 'Edit Goal' : 'Create New Goal'}
              </h2>
              <p className={styles['modal-subtitle']}>
                {isEditMode
                  ? 'Update your product goal details and settings'
                  : 'Define a clear objective to guide your product development'}
              </p>
            </div>
            <button
              className={styles['modal-close']}
              onClick={handleClose}
              aria-label="Close modal"
              type="button"
            >
              <CloseIcon size={18} />
            </button>
            {/* Progress Bar - Header Integrated */}
            <div
              className={styles['modal-progress-bar-header']}
              role="progressbar"
              aria-valuenow={formProgressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Form completion: ${formProgressPercentage}%`}
            >
              <div
                className={styles['modal-progress-fill-header']}
                style={{ width: `${formProgressPercentage}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
          <div className={styles['modal-body']}>
            {modalErrorMessage && (
              <div className={styles['modal-error-banner']} role="alert">
                <div className={styles['modal-error-content']}>
                  <span className={styles['modal-error-icon']}>
                    <AlertCircleIcon size={16} />
                  </span>
                  <span className={styles['modal-error-text']}>{modalErrorMessage}</span>
                  <button
                    className={styles['modal-error-close']}
                    onClick={onClearError}
                    aria-label="Close error message"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Draft Restore Prompt */}
            {!isEditMode && showRestorePrompt && hasDraft && (
              <DraftRestorePrompt
                lastSavedAt={lastSavedAt}
                onRestore={onRestoreDraft}
                onDiscard={onDiscardDraft}
              />
            )}

            <form
              className={styles['goal-form']}
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}
            >
              {/* Form Legend */}
              <p
                className={styles['form-legend']}
                aria-label="All fields marked with asterisk are required"
              >
                <span className={styles.required} aria-hidden="true">
                  *
                </span>
                <span>Required fields</span>
              </p>

              {/* Title Field */}
              <div
                className={`${styles['form-group']} ${formErrors.title && touchedFields.title ? styles['has-error'] : ''}`}
              >
                <div className={styles['label-row']}>
                  <label htmlFor="goal-title">
                    Title <span className={styles['required']}>*</span>
                  </label>
                  <CharacterCounter
                    current={formData.title.length}
                    min={3}
                    max={100}
                    showMin={formData.title.length > 0 && formData.title.length < 3}
                  />
                </div>
                <HelpPanel
                  title="writing goal titles"
                  tips={[
                    'Be specific about what you want to achieve',
                    'Start with a verb when possible (e.g., "Launch", "Improve", "Reduce")',
                    'Keep it concise for quick scanning and reference',
                    'Avoid vague terms like "better" or "more" - use specific outcomes',
                  ]}
                  examples={{
                    good: {
                      label: 'Good',
                      text: 'Launch mobile app v2.0 with offline sync capability',
                    },
                    avoid: { label: 'Avoid', text: 'App improvements' },
                  }}
                />
                <input
                  ref={titleInputRef}
                  id="goal-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => onFieldChange('title', e.target.value)}
                  onBlur={(e) => onFieldBlur('title', e.target.value)}
                  placeholder="e.g., Launch mobile app v2.0 with offline sync capability"
                  className={formErrors.title && touchedFields.title ? styles['input-error'] : ''}
                  aria-invalid={formErrors.title && touchedFields.title ? 'true' : 'false'}
                  aria-describedby={
                    formErrors.title && touchedFields.title ? 'title-error' : undefined
                  }
                />
                {formErrors.title && touchedFields.title && (
                  <span id="title-error" className={styles['field-error']} role="alert">
                    {formErrors.title}
                  </span>
                )}
              </div>

              {/* Description Field */}
              <div
                className={`${styles['form-group']} ${formErrors.description && touchedFields.description ? styles['has-error'] : ''}`}
              >
                <div className={styles['label-row']}>
                  <label htmlFor="goal-description">
                    Description <span className={styles['required']}>*</span>
                  </label>
                  <CharacterCounter
                    current={formData.description.length}
                    min={10}
                    max={1000}
                    showMin={formData.description.length > 0 && formData.description.length < 10}
                  />
                </div>
                <HelpPanel
                  title="writing descriptions"
                  tips={[
                    'Explain the problem you are solving or the opportunity you are addressing',
                    'Describe who benefits from this goal and how',
                    'Include context about why this goal matters now',
                    'Mention any dependencies or constraints',
                  ]}
                  examples={{
                    good: {
                      label: 'Good',
                      text: 'Our users struggle with accessing data when offline. This goal addresses that by implementing local storage sync, improving user productivity by 40% in low-connectivity environments.',
                    },
                    avoid: {
                      label: 'Avoid',
                      text: 'We need to make the app better.',
                    },
                  }}
                />
                <textarea
                  id="goal-description"
                  rows={5}
                  value={formData.description}
                  onChange={(e) => onFieldChange('description', e.target.value)}
                  onBlur={(e) => onFieldBlur('description', e.target.value)}
                  placeholder="Describe the problem you're solving, who benefits, and why it matters..."
                  className={
                    formErrors.description && touchedFields.description ? styles['input-error'] : ''
                  }
                  aria-invalid={
                    formErrors.description && touchedFields.description ? 'true' : 'false'
                  }
                  aria-describedby={
                    formErrors.description && touchedFields.description
                      ? 'description-error'
                      : undefined
                  }
                />
                {formErrors.description && touchedFields.description && (
                  <span id="description-error" className={styles['field-error']} role="alert">
                    {formErrors.description}
                  </span>
                )}
              </div>

              {/* Strategic Alignment */}
              <div className={styles['form-group']}>
                <label htmlFor="strategic-alignment">Strategic Alignment (Optional)</label>
                <select
                  id="strategic-alignment"
                  value={formData.strategicAlignment}
                  onChange={(e) => onFieldChange('strategicAlignment', e.target.value)}
                >
                  {strategicOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className={styles['field-hint']}>
                  Linking goals to strategic objectives helps with prioritization and reporting
                </span>
              </div>

              {/* Target Date Field */}
              <div
                className={`${styles['form-group']} ${formErrors.targetDate && touchedFields.targetDate ? styles['has-error'] : ''}`}
              >
                <label htmlFor="target-date">
                  Target Date <span className={styles['required']}>*</span>
                </label>
                <input
                  id="target-date"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => onFieldChange('targetDate', e.target.value)}
                  onBlur={(e) => onFieldBlur('targetDate', e.target.value)}
                  className={
                    formErrors.targetDate && touchedFields.targetDate ? styles['input-error'] : ''
                  }
                  aria-invalid={
                    formErrors.targetDate && touchedFields.targetDate ? 'true' : 'false'
                  }
                  aria-describedby={
                    formErrors.targetDate && touchedFields.targetDate
                      ? 'targetDate-error'
                      : undefined
                  }
                />
                {formErrors.targetDate && touchedFields.targetDate && (
                  <span id="targetDate-error" className={styles['field-error']} role="alert">
                    {formErrors.targetDate}
                  </span>
                )}
              </div>

              {/* Success Metrics Field */}
              <div
                className={`${styles['form-group']} ${formErrors.successMetrics && touchedFields.successMetrics ? styles['has-error'] : ''}`}
              >
                <div className={styles['label-row']}>
                  <label htmlFor="success-metrics">
                    Success Metrics <span className={styles['required']}>*</span>
                  </label>
                  <CharacterCounter
                    current={formData.successMetrics.length}
                    min={5}
                    max={500}
                    showMin={
                      formData.successMetrics.length > 0 && formData.successMetrics.length < 5
                    }
                  />
                </div>
                <HelpPanel
                  title="defining success metrics"
                  tips={[
                    'Use specific, measurable criteria (SMART goals)',
                    'Include both quantitative and qualitative measures when applicable',
                    'Define metrics that directly indicate goal achievement',
                    'Set realistic but challenging targets',
                  ]}
                  examples={{
                    good: {
                      label: 'Good',
                      text: 'Achieve 25% increase in mobile app daily active users; reduce offline data sync time to under 5 seconds; maintain 4.5+ star app store rating',
                    },
                    avoid: {
                      label: 'Avoid',
                      text: 'Make users happy and improve performance',
                    },
                  }}
                />
                <textarea
                  id="success-metrics"
                  rows={4}
                  value={formData.successMetrics}
                  onChange={(e) => onFieldChange('successMetrics', e.target.value)}
                  onBlur={(e) => onFieldBlur('successMetrics', e.target.value)}
                  placeholder="Define measurable success criteria... e.g., 25% increase in DAU, 4.5+ app rating, <5s sync time"
                  className={
                    formErrors.successMetrics && touchedFields.successMetrics
                      ? styles['input-error']
                      : ''
                  }
                  aria-invalid={
                    formErrors.successMetrics && touchedFields.successMetrics ? 'true' : 'false'
                  }
                  aria-describedby={
                    formErrors.successMetrics && touchedFields.successMetrics
                      ? 'successMetrics-error'
                      : undefined
                  }
                />
                {formErrors.successMetrics && touchedFields.successMetrics && (
                  <span id="successMetrics-error" className={styles['field-error']} role="alert">
                    {formErrors.successMetrics}
                  </span>
                )}
              </div>
            </form>
          </div>
          {/* Modal Footer */}
          <div className={styles['modal-footer']}>
            <button
              type="button"
              className={`${styles.button} ${styles['button-secondary']}`}
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles['button-primary']} ${
                isSubmitting ? styles['button-loading'] : ''
              }`}
              onClick={onSubmit}
              disabled={!isFormValid || isSubmitting}
              title={!isFormValid ? 'Please fill in all required fields' : ''}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <span>{isEditMode ? 'Saving...' : 'Creating...'}</span>
              ) : isEditMode ? (
                <>
                  <SaveIcon size={16} />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <PlusIcon size={16} />
                  <span>Create Goal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        onConfirm={handleDiscardChanges}
        onCancel={handleCancelDiscard}
      />
    </>
  );
};
