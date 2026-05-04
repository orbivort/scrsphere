import React, { useRef, useState, useCallback, useEffect } from 'react';

import { MoSCoWPriority } from '../../../types';
import { useBacklogContext } from '../context/BacklogContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { MOSCOW_CONFIG } from '../config/moscow.config';
import { handleMoscowKeyDown } from '../utils/formHandlers';
import { UnsavedChangesModal } from '../../../components/common/Form/UnsavedChangesModal';

import styles from './EditItemModal.module.css';

import {
  EditIcon,
  XIcon,
  AlertIcon,
  XCircleIcon,
  PathIcon,
  CheckIcon,
  SaveIcon,
} from '@/components/common/Icons';

export interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const {
    selectedItem,
    formData,
    formErrors,
    workflowError,
    setWorkflowError,
    labelTags,
    labelInputValue,
    hasUnsavedChanges,
    handleFormChange,
    handlePriorityChange,
    handleLabelInputChange,
    handleLabelKeyDown,
    removeLabelTag,
  } = useBacklogContext();

  useFocusTrap(isOpen, modalRef);

  // Define all callbacks before any early returns to follow React Hooks rules
  const handleCloseAttempt = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowUnsavedModal(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleUnsavedConfirm = useCallback(() => {
    setShowUnsavedModal(false);
    onClose();
  }, [onClose]);

  const handleUnsavedCancel = useCallback(() => {
    setShowUnsavedModal(false);
  }, []);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      // Only close if clicking the overlay itself, not the modal content
      if (e.target === e.currentTarget) {
        handleCloseAttempt();
      }
    },
    [handleCloseAttempt]
  );

  // Handle escape key for unsaved changes
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseAttempt();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCloseAttempt]);

  if (!isOpen || !selectedItem) return null;

  const handleMoscowKeyDownWrapper = (e: React.KeyboardEvent, currentIndex: number) => {
    handleMoscowKeyDown(e, currentIndex, handlePriorityChange);
  };

  return (
    <>
      <div className={styles['modal-overlay']} onClick={handleOverlayClick}>
        <div
          ref={modalRef}
          className={`${styles.modal} ${styles['modal-large']}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div className={styles['modal-header']}>
            <div className={styles['header-content']}>
              <div className={styles['icon-wrapper']} aria-hidden="true">
                <EditIcon width="28" height="28" />
              </div>
              <h2 id="edit-modal-title" className={styles['modal-title']}>
                Edit Backlog Item #{selectedItem.id.slice(-4)}
              </h2>
            </div>
            <button
              className={styles['close-button']}
              onClick={handleCloseAttempt}
              data-modal-close
              aria-label="Close modal"
            >
              <XIcon width="20" height="20" />
            </button>
          </div>
          <div className={styles['modal-body']}>
            {workflowError && (
              <div className={styles['error-banner']}>
                <div className={styles['error-content']}>
                  <span className={styles['error-icon']}>
                    <AlertIcon width="16" height="16" />
                  </span>
                  <span className={styles['error-text']}>{workflowError}</span>
                  <button
                    className={styles['error-close']}
                    onClick={() => setWorkflowError(null)}
                    aria-label="Close error message"
                  >
                    <XCircleIcon width="14" height="14" />
                  </button>
                </div>
              </div>
            )}
            <form className={styles['item-form']}>
              <div className={styles['form-legend']}>
                <span className={styles['required-indicator']}>*</span>
                <span className={styles['legend-text']}>
                  <strong>All fields are required</strong> - Please complete all sections before
                  saving
                </span>
              </div>

              <div className={styles['form-section']}>
                <h3 className={styles['section-title']}>Basic Information</h3>

                <div className={styles['form-group']}>
                  <label htmlFor="edit-item-title">
                    Title <span className={styles['required-indicator']}>*</span>
                  </label>
                  <input
                    id="edit-item-title"
                    type="text"
                    placeholder="Enter a clear, concise title for this backlog item (required)"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className={formErrors.title ? styles['input-error'] : ''}
                    aria-describedby="edit-title-help edit-title-error"
                    aria-required="true"
                    maxLength={200}
                  />
                  <span id="edit-title-help" className={styles['field-help']}>
                    <strong>Required:</strong> Provide a brief, descriptive title (5-200 characters)
                    that clearly summarizes what needs to be done.
                  </span>
                  {formErrors.title && (
                    <span id="edit-title-error" className={styles['error-message']} role="alert">
                      {formErrors.title}
                    </span>
                  )}
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="edit-item-description">
                    Description <span className={styles['required-indicator']}>*</span>
                  </label>
                  <textarea
                    id="edit-item-description"
                    rows={4}
                    placeholder="Describe the item in detail... (required)"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    className={formErrors.description ? styles['input-error'] : ''}
                    aria-describedby="edit-description-help edit-description-error"
                    aria-required="true"
                  />
                  <span id="edit-description-help" className={styles['field-help']}>
                    <strong>Required:</strong> Explain the context, purpose, implementation details,
                    and any background information necessary for understanding this item.
                  </span>
                  {formErrors.description && (
                    <span
                      id="edit-description-error"
                      className={styles['error-message']}
                      role="alert"
                    >
                      {formErrors.description}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles['form-section']}>
                <h3 className={styles['section-title']}>Priority & Value</h3>

                <div className={styles['form-group']}>
                  <label>
                    MoSCoW Priority <span className={styles['required-indicator']}>*</span>
                  </label>
                  <div
                    className={styles['moscow-selector']}
                    role="radiogroup"
                    aria-label="Select MoSCoW Priority"
                    aria-required="true"
                  >
                    {Object.values(MoSCoWPriority).map((priority, index) => {
                      const config = MOSCOW_CONFIG[priority];
                      const isSelected = formData.moscowPriority === priority;
                      return (
                        <button
                          key={priority}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={isSelected ? 0 : -1}
                          className={`${styles['moscow-option']} ${isSelected ? styles.selected : ''} ${styles[`priority-${priority.toLowerCase().replace('_', '-')}`]}`}
                          onClick={() => handlePriorityChange(priority)}
                          onKeyDown={(e) => handleMoscowKeyDownWrapper(e, index)}
                          style={
                            {
                              '--option-color': config.color,
                              '--option-bg': config.bgColor,
                              '--option-border': config.borderColor,
                            } as React.CSSProperties
                          }
                        >
                          <span className={styles['moscow-icon']} aria-hidden="true">
                            <PathIcon path={config.icon} size={20} />
                          </span>
                          <span className={styles['moscow-content']}>
                            <span className={styles['moscow-label']}>{config.label}</span>
                            <span className={styles['moscow-desc']}>{config.description}</span>
                          </span>
                          {isSelected && (
                            <span className={styles['moscow-check']} aria-hidden="true">
                              <CheckIcon width="16" height="16" strokeWidth="3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <span className={styles['field-help']}>
                    <strong>Required:</strong> Select one priority level. Must Have = Critical for
                    success | Should Have = Important but not vital | Could Have = Nice to have |
                    Won't Have = Future consideration
                  </span>
                  {formErrors.moscowPriority && (
                    <span className={styles['error-message']} role="alert">
                      {formErrors.moscowPriority}
                    </span>
                  )}
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="edit-business-value">
                    Business Value (Points) <span className={styles['required-indicator']}>*</span>
                  </label>
                  <select
                    id="edit-business-value"
                    value={formData.businessValue ?? ''}
                    onChange={(e) =>
                      handleFormChange(
                        'businessValue',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    className={formErrors.businessValue ? styles['input-error'] : ''}
                    aria-describedby="edit-business-value-help edit-business-value-error"
                    aria-required="true"
                  >
                    <option value="">Select value... (required)</option>
                    <option value={1}>1 - Minimal value</option>
                    <option value={2}>2 - Low value</option>
                    <option value={3}>3 - Moderate value</option>
                    <option value={5}>5 - High value</option>
                    <option value={8}>8 - Very high value</option>
                    <option value={13}>13 - Critical value</option>
                  </select>
                  <span id="edit-business-value-help" className={styles['field-help']}>
                    <strong>Required:</strong> Quantify the business impact. Higher numbers indicate
                    greater strategic importance and ROI potential.
                  </span>
                  {formErrors.businessValue && (
                    <span
                      id="edit-business-value-error"
                      className={styles['error-message']}
                      role="alert"
                    >
                      {formErrors.businessValue}
                    </span>
                  )}
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="edit-estimate">
                    Estimate (Story Points) <span className={styles['required-indicator']}>*</span>
                  </label>
                  <select
                    id="edit-estimate"
                    value={formData.estimate ?? ''}
                    onChange={(e) =>
                      handleFormChange(
                        'estimate',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    className={formErrors.estimate ? styles['input-error'] : ''}
                    aria-describedby="edit-estimate-help edit-estimate-error"
                    aria-required="true"
                  >
                    <option value="">Select estimate... (required)</option>
                    <option value={1}>1 - Trivial effort</option>
                    <option value={2}>2 - Very small effort</option>
                    <option value={3}>3 - Small effort</option>
                    <option value={5}>5 - Medium effort</option>
                    <option value={8}>8 - Large effort</option>
                    <option value={13}>13 - Very large effort</option>
                  </select>
                  <span id="edit-estimate-help" className={styles['field-help']}>
                    <strong>Required:</strong> Estimate the relative effort using Fibonacci
                    sequence. Consider complexity, uncertainty, and risk.
                  </span>
                  {formErrors.estimate && (
                    <span id="edit-estimate-error" className={styles['error-message']} role="alert">
                      {formErrors.estimate}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles['form-section']}>
                <h3 className={styles['section-title']}>More Information</h3>

                <div className={styles['form-group']}>
                  <label htmlFor="edit-item-labels">
                    Labels <span className={styles['required-indicator']}>*</span>
                  </label>
                  <div
                    className={`${styles['tag-input-container']} ${formErrors.labels ? styles['input-error'] : ''}`}
                    onClick={() => document.getElementById('edit-item-labels')?.focus()}
                  >
                    {labelTags.map((tag, index) => (
                      <span key={`${tag}-${index}`} className={styles['tag-item']}>
                        {tag}
                        <button
                          type="button"
                          className={styles['tag-remove']}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLabelTag(tag);
                          }}
                          aria-label={`Remove label ${tag}`}
                        >
                          <XIcon width="12" height="12" />
                        </button>
                      </span>
                    ))}
                    <input
                      id="edit-item-labels"
                      type="text"
                      placeholder={
                        labelTags.length === 0
                          ? 'Type and press Enter to add labels... (required)'
                          : 'Add more labels...'
                      }
                      value={labelInputValue}
                      onChange={(e) => handleLabelInputChange(e.target.value)}
                      onKeyDown={handleLabelKeyDown}
                      aria-describedby="edit-labels-help edit-labels-error"
                      disabled={labelTags.length >= 10}
                      className={styles['tag-input']}
                    />
                  </div>
                  {labelTags.length >= 10 && (
                    <span className={`${styles['field-help']} ${styles['field-help-warning']}`}>
                      Maximum 10 labels reached. Remove a label to add more.
                    </span>
                  )}
                  {formErrors.labels && (
                    <span id="edit-labels-error" className={styles['error-message']} role="alert">
                      {formErrors.labels}
                    </span>
                  )}
                  <span id="edit-labels-help" className={styles['field-help']}>
                    <strong>Required:</strong> Add at least one label. Press Enter to add. Use
                    letters, numbers, hyphens, and underscores only. Maximum 10 labels, 30
                    characters each.
                  </span>
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="edit-acceptance-criteria">
                    Acceptance Criteria <span className={styles['required-indicator']}>*</span>
                  </label>
                  <textarea
                    id="edit-acceptance-criteria"
                    rows={4}
                    placeholder="Define specific, testable conditions for completion... (required)"
                    value={formData.acceptanceCriteria}
                    onChange={(e) => handleFormChange('acceptanceCriteria', e.target.value)}
                    className={formErrors.acceptanceCriteria ? styles['input-error'] : ''}
                    aria-describedby="edit-criteria-help edit-criteria-error"
                    aria-required="true"
                  />
                  <span id="edit-criteria-help" className={styles['field-help']}>
                    <strong>Required:</strong> List clear, measurable conditions that must be met.
                    Use bullet points or numbered lists for multiple criteria.
                  </span>
                  {formErrors.acceptanceCriteria && (
                    <span id="edit-criteria-error" className={styles['error-message']} role="alert">
                      {formErrors.acceptanceCriteria}
                    </span>
                  )}
                </div>
              </div>
            </form>
          </div>
          <div className={styles['modal-footer']}>
            <button
              className={`${styles.button} ${styles['button-secondary']}`}
              onClick={handleCloseAttempt}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className={`${styles.button} ${styles['button-primary']}`}
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles['button-spinner']} />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon width="18" height="18" aria-hidden="true" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {isSubmitting && (
          <div className={styles['loading-overlay']}>
            <div className={styles['loading-content']}>
              <div className={styles['spinner-ring']} />
              <p>Saving changes...</p>
            </div>
          </div>
        )}
      </div>

      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onConfirm={handleUnsavedConfirm}
        onCancel={handleUnsavedCancel}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to discard them?"
      />
    </>
  );
};
