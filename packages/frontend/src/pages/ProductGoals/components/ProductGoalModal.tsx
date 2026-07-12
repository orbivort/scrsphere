import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('backlog');
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
                {isEditMode
                  ? (t('productGoals.editGoalTitle') as string)
                  : (t('productGoals.createNewGoal') as string)}
              </h2>
              <p className={styles['modal-subtitle']}>
                {isEditMode
                  ? (t('productGoals.editGoalSubtitle') as string)
                  : (t('productGoals.createGoalSubtitle') as string)}
              </p>
            </div>
            <button
              className={styles['modal-close']}
              onClick={handleClose}
              aria-label={t('productGoals.closeModal') as string}
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
              aria-label={
                t('productGoals.progressBarAriaLabel', {
                  percentage: formProgressPercentage,
                }) as string
              }
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
                    aria-label={t('productGoals.closeError') as string}
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
                aria-label={t('productGoals.formLegendAriaLabel') as string}
              >
                <span className={styles.required} aria-hidden="true">
                  *
                </span>
                <span>{t('productGoals.requiredFields') as string}</span>
              </p>

              {/* Title Field */}
              <div
                className={`${styles['form-group']} ${formErrors.title && touchedFields.title ? styles['has-error'] : ''}`}
              >
                <div className={styles['label-row']}>
                  <label htmlFor="goal-title">
                    {t('productGoals.titleLabel') as string}{' '}
                    <span className={styles['required']}>*</span>
                  </label>
                  <CharacterCounter
                    current={formData.title.length}
                    min={3}
                    max={100}
                    showMin={formData.title.length > 0 && formData.title.length < 3}
                  />
                </div>
                <HelpPanel
                  title={t('productGoals.titleHelpPanelTitle') as string}
                  tips={[
                    t('productGoals.titleHelpPanelTip1') as string,
                    t('productGoals.titleHelpPanelTip2') as string,
                    t('productGoals.titleHelpPanelTip3') as string,
                    t('productGoals.titleHelpPanelTip4') as string,
                  ]}
                  examples={{
                    good: {
                      label: t('productGoals.titleHelpPanelGoodLabel') as string,
                      text: t('productGoals.titleHelpPanelGoodText') as string,
                    },
                    avoid: {
                      label: t('productGoals.titleHelpPanelAvoidLabel') as string,
                      text: t('productGoals.titleHelpPanelAvoidText') as string,
                    },
                  }}
                />
                <input
                  ref={titleInputRef}
                  id="goal-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => onFieldChange('title', e.target.value)}
                  onBlur={(e) => onFieldBlur('title', e.target.value)}
                  placeholder={t('productGoals.titlePlaceholder') as string}
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
                    {t('productGoals.descriptionLabel') as string}{' '}
                    <span className={styles['required']}>*</span>
                  </label>
                  <CharacterCounter
                    current={formData.description.length}
                    min={10}
                    max={1000}
                    showMin={formData.description.length > 0 && formData.description.length < 10}
                  />
                </div>
                <HelpPanel
                  title={t('productGoals.descriptionHelpPanelTitle') as string}
                  tips={[
                    t('productGoals.descriptionHelpPanelTip1') as string,
                    t('productGoals.descriptionHelpPanelTip2') as string,
                    t('productGoals.descriptionHelpPanelTip3') as string,
                    t('productGoals.descriptionHelpPanelTip4') as string,
                  ]}
                  examples={{
                    good: {
                      label: t('productGoals.descriptionHelpPanelGoodLabel') as string,
                      text: t('productGoals.descriptionHelpPanelGoodText') as string,
                    },
                    avoid: {
                      label: t('productGoals.descriptionHelpPanelAvoidLabel') as string,
                      text: t('productGoals.descriptionHelpPanelAvoidText') as string,
                    },
                  }}
                />
                <textarea
                  id="goal-description"
                  rows={5}
                  value={formData.description}
                  onChange={(e) => onFieldChange('description', e.target.value)}
                  onBlur={(e) => onFieldBlur('description', e.target.value)}
                  placeholder={t('productGoals.descriptionPlaceholder') as string}
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
                <label htmlFor="strategic-alignment">
                  {t('productGoals.strategicAlignment') as string}
                </label>
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
                  {t('productGoals.strategicAlignmentHint') as string}
                </span>
              </div>

              {/* Target Date Field */}
              <div
                className={`${styles['form-group']} ${formErrors.targetDate && touchedFields.targetDate ? styles['has-error'] : ''}`}
              >
                <label htmlFor="target-date">
                  {t('productGoals.targetDateLabel') as string}{' '}
                  <span className={styles['required']}>*</span>
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
                    {t('productGoals.successMetricsLabel') as string}{' '}
                    <span className={styles['required']}>*</span>
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
                  title={t('productGoals.successMetricsHelpPanelTitle') as string}
                  tips={[
                    t('productGoals.successMetricsHelpPanelTip1') as string,
                    t('productGoals.successMetricsHelpPanelTip2') as string,
                    t('productGoals.successMetricsHelpPanelTip3') as string,
                    t('productGoals.successMetricsHelpPanelTip4') as string,
                  ]}
                  examples={{
                    good: {
                      label: t('productGoals.successMetricsHelpPanelGoodLabel') as string,
                      text: t('productGoals.successMetricsHelpPanelGoodText') as string,
                    },
                    avoid: {
                      label: t('productGoals.successMetricsHelpPanelAvoidLabel') as string,
                      text: t('productGoals.successMetricsHelpPanelAvoidText') as string,
                    },
                  }}
                />
                <textarea
                  id="success-metrics"
                  rows={4}
                  value={formData.successMetrics}
                  onChange={(e) => onFieldChange('successMetrics', e.target.value)}
                  onBlur={(e) => onFieldBlur('successMetrics', e.target.value)}
                  placeholder={t('productGoals.successMetricsPlaceholder') as string}
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
              {t('productGoals.cancel') as string}
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles['button-primary']} ${
                isSubmitting ? styles['button-loading'] : ''
              }`}
              onClick={onSubmit}
              disabled={!isFormValid || isSubmitting}
              title={!isFormValid ? (t('productGoals.fillAllRequired') as string) : ''}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <span>
                  {isEditMode
                    ? (t('productGoals.saving') as string)
                    : (t('productGoals.creating') as string)}
                </span>
              ) : isEditMode ? (
                <>
                  <SaveIcon size={16} />
                  <span>{t('productGoals.saveChanges') as string}</span>
                </>
              ) : (
                <>
                  <PlusIcon size={16} />
                  <span>{t('productGoals.createGoal') as string}</span>
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
