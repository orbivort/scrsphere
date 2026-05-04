import React, { useRef, useState, useCallback, useEffect } from 'react';

import { MoSCoWPriority } from '../../../types';
import { useBacklogContext } from '../context/BacklogContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { MOSCOW_CONFIG } from '../config/moscow.config';
import { handleMoscowKeyDown } from '../utils/formHandlers';
import { UnsavedChangesModal } from '../../../components/common/Form/UnsavedChangesModal';

import styles from './CreateItemModal.module.css';

import {
  PlusIcon,
  XIcon,
  AlertIcon,
  XCircleIcon,
  PathIcon,
  CheckIcon,
} from '@/components/common/Icons';

export interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const {
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

  if (!isOpen) return null;

  const handleMoscowKeyDownWrapper = (e: React.KeyboardEvent, currentIndex: number) => {
    handleMoscowKeyDown(e, currentIndex, handlePriorityChange);
  };

  return (
    <>
      <div className={styles['modal-overlay']} onClick={handleOverlayClick}>
        <div
          ref={modalRef}
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-modal-title"
        >
          <div className={styles['modal-header']}>
            <div className={styles['header-content']}>
              <div className={styles['icon-wrapper']} aria-hidden="true">
                <PlusIcon width="28" height="28" />
              </div>
              <h2 id="create-modal-title" className={styles['modal-title']}>
                Create New Backlog Item
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
              <div className={styles['modal-error-banner']}>
                <div className={styles['modal-error-content']}>
                  <span className={styles['modal-error-icon']}>
                    <AlertIcon width="16" height="16" />
                  </span>
                  <span className={styles['modal-error-text']}>{workflowError}</span>
                  <button
                    className={styles['modal-error-close']}
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
                <span className={styles['legend-text']}>Indicates required fields</span>
              </div>

              <div className={styles['form-section']}>
                <h3 className={styles['section-title']}>Basic Information</h3>

                <div className={styles['form-group']}>
                  <label htmlFor="item-title">
                    Title <span className={styles['required-indicator']}>*</span>
                  </label>
                  <input
                    id="item-title"
                    type="text"
                    placeholder="Enter a clear, concise title for this backlog item"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className={formErrors.title ? styles['input-error'] : ''}
                    aria-describedby="title-help title-error"
                    aria-required="true"
                    maxLength={200}
                  />
                  <span id="title-help" className={styles['field-help']}>
                    Provide a brief, descriptive title that summarizes what needs to be done.
                    Example: "Implement user authentication with JWT tokens"
                  </span>
                  {formErrors.title && (
                    <span id="title-error" className={styles['error-text']} role="alert">
                      {formErrors.title}
                    </span>
                  )}
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="item-description">Description</label>
                  <textarea
                    id="item-description"
                    rows={4}
                    placeholder="Describe the item in detail..."
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    aria-describedby="description-help"
                  />
                  <span id="description-help" className={styles['field-help']}>
                    Explain the context, purpose, and any background information. Include user
                    stories if applicable (e.g., "As a user, I want...")
                  </span>
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
                    Must Have = Critical for success | Should Have = Important but not vital | Could
                    Have = Nice to have | Won't Have = Future consideration
                  </span>
                  {formErrors.moscowPriority && (
                    <span className={styles['error-text']} role="alert">
                      {formErrors.moscowPriority}
                    </span>
                  )}
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="business-value">Business Value (Points)</label>
                  <select
                    id="business-value"
                    value={formData.businessValue ?? ''}
                    onChange={(e) =>
                      handleFormChange(
                        'businessValue',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    aria-describedby="business-value-help"
                  >
                    <option value="">Select value...</option>
                    <option value={1}>1 - Minimal value</option>
                    <option value={2}>2 - Low value</option>
                    <option value={3}>3 - Moderate value</option>
                    <option value={5}>5 - High value</option>
                    <option value={8}>8 - Very high value</option>
                    <option value={13}>13 - Critical value</option>
                  </select>
                  <span id="business-value-help" className={styles['field-help']}>
                    Quantify the business impact. Higher numbers indicate greater strategic
                    importance and ROI potential.
                  </span>
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="estimate">Estimate (Story Points)</label>
                  <select
                    id="estimate"
                    value={formData.estimate ?? ''}
                    onChange={(e) =>
                      handleFormChange(
                        'estimate',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    aria-describedby="estimate-help"
                  >
                    <option value="">Select estimate...</option>
                    <option value={1}>1 - Trivial effort</option>
                    <option value={2}>2 - Very small effort</option>
                    <option value={3}>3 - Small effort</option>
                    <option value={5}>5 - Medium effort</option>
                    <option value={8}>8 - Large effort</option>
                    <option value={13}>13 - Very large effort</option>
                  </select>
                  <span id="estimate-help" className={styles['field-help']}>
                    Estimate the relative effort using Fibonacci sequence. Consider complexity,
                    uncertainty, and risk. Leave empty if not ready to estimate.
                  </span>
                </div>
              </div>

              <div className={styles['form-section']}>
                <h3 className={styles['section-title']}>More Information</h3>

                <div className={styles['form-group']}>
                  <label htmlFor="item-labels">Labels</label>
                  <div
                    className={`${styles['tag-input-container']} ${formErrors.labels ? styles['input-error'] : ''}`}
                    onClick={() => document.getElementById('item-labels')?.focus()}
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
                      id="item-labels"
                      type="text"
                      placeholder={
                        labelTags.length === 0
                          ? 'Type and press Enter to add labels...'
                          : 'Add more labels...'
                      }
                      value={labelInputValue}
                      onChange={(e) => handleLabelInputChange(e.target.value)}
                      onKeyDown={handleLabelKeyDown}
                      aria-describedby="labels-help labels-error"
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
                    <span id="labels-error" className={styles['error-text']} role="alert">
                      {formErrors.labels}
                    </span>
                  )}
                  <span id="labels-help" className={styles['field-help']}>
                    Press Enter to add a label. Use letters, numbers, hyphens, and underscores only.
                    Maximum 10 labels, 30 characters each.
                  </span>
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="acceptance-criteria">Acceptance Criteria</label>
                  <textarea
                    id="acceptance-criteria"
                    rows={4}
                    placeholder="Define specific, testable conditions for completion..."
                    value={formData.acceptanceCriteria}
                    onChange={(e) => handleFormChange('acceptanceCriteria', e.target.value)}
                    aria-describedby="criteria-help"
                  />
                  <span id="criteria-help" className={styles['field-help']}>
                    List clear, measurable conditions that must be met. Use bullet points or
                    numbered lists. Example: "1. User can log in with valid credentials 2. Invalid
                    login shows error message 3. Session expires after 30 minutes"
                  </span>
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
                  Creating...
                </>
              ) : (
                <>
                  <PlusIcon width="18" height="18" />
                  Create Item
                </>
              )}
            </button>
          </div>
        </div>

        {isSubmitting && (
          <div className={styles['loading-overlay']}>
            <div className={styles['loading-content']}>
              <div className={styles['spinner-ring']} />
              <p>Creating backlog item...</p>
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
