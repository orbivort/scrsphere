import React, { useState, useCallback } from 'react';

import { type ApiResponse, type ProductBacklogItem, type TeamMember } from '../../types';
import { useModalFocus } from '../../hooks/useModalFocus';
import { UnsavedChangesModal } from '../../components/common/Form/UnsavedChangesModal';
import {
  XIcon,
  PlusIcon,
  MessageSquareIcon,
  AlertTriangleIcon,
  InfoIcon,
} from '../../components/common/Icons';

import styles from './AddFeedbackModal.module.css';

type FeedbackCategory = 'positive' | 'negative' | 'suggestion' | 'question';

interface FeedbackFormData {
  authorName: string;
  content: string;
  category: FeedbackCategory;
  actionRequired: boolean;
  relatedPbiId?: string;
  ownerId?: string;
}

interface AddFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  teamMembers?: TeamMember[];
  sprintBacklogItems?: ApiResponse<ProductBacklogItem[]>;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  feedbackForm: FeedbackFormData;
  setFeedbackForm: React.Dispatch<React.SetStateAction<FeedbackFormData>>;
  isPending: boolean;
}

export const AddFeedbackModal: React.FC<AddFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teamMembers,
  sprintBacklogItems,
  formErrors,
  setFormErrors,
  feedbackForm,
  setFeedbackForm,
  isPending,
}) => {
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  const hasUnsavedChanges = useCallback(() => {
    return (
      feedbackForm.authorName.trim() !== '' ||
      feedbackForm.content.trim() !== '' ||
      (feedbackForm.relatedPbiId && feedbackForm.relatedPbiId.trim() !== '') ||
      feedbackForm.actionRequired ||
      (feedbackForm.ownerId && feedbackForm.ownerId.trim() !== '') ||
      feedbackForm.category !== 'positive'
    );
  }, [feedbackForm]);

  const handleCloseAttempt = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedChangesModal(false);
    onClose();
  }, [onClose]);

  const handleCancelDiscard = useCallback(() => {
    setShowUnsavedChangesModal(false);
  }, []);

  const modalFocus = useModalFocus({
    isOpen,
    onClose: handleCloseAttempt,
  });

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={modalFocus.modalRef}
        className={styles['feedback-form-overlay']}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-form-title"
        onClick={handleCloseAttempt}
      >
        <div className={styles['feedback-form']} onClick={(e) => e.stopPropagation()}>
          <header className={styles['feedback-form-header']}>
            <div className={styles['feedback-form-header-content']}>
              <div className={styles['feedback-form-icon-wrapper']} aria-hidden="true">
                <MessageSquareIcon size={24} />
              </div>
              <h2 id="feedback-form-title" className={styles['feedback-form-title']}>
                Add Stakeholder Feedback
              </h2>
              <p className={styles['feedback-form-subtitle']}>
                Capture valuable insights from stakeholders to improve your product
              </p>
            </div>
            <button
              className={styles['feedback-form-close']}
              onClick={() => {
                handleCloseAttempt();
                setFormErrors({});
              }}
              aria-label="Close dialog"
              type="button"
            >
              <XIcon size={24} />
            </button>
          </header>

          <div className={styles['feedback-form-body']}>
            <div className={styles['feedback-form-legend']}>
              <InfoIcon size={14} />
              <span>Required fields are marked with *</span>
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="feedback-author">
                Author Name <span className={styles['required-asterisk']}>*</span>
              </label>
              <div className={styles['input-with-counter']}>
                <input
                  id="feedback-author"
                  type="text"
                  value={feedbackForm.authorName}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, authorName: e.target.value })}
                  placeholder="Enter stakeholder name"
                  className={formErrors.authorName ? styles.error : ''}
                  aria-required="true"
                  aria-invalid={!!formErrors.authorName}
                  aria-describedby={formErrors.authorName ? 'feedback-author-error' : undefined}
                  maxLength={100}
                />
                <span
                  className={`${styles['char-counter']} ${
                    feedbackForm.authorName.length > 80 ? styles['char-counter-warning'] : ''
                  }`}
                >
                  {feedbackForm.authorName.length}/100
                </span>
              </div>
              {formErrors.authorName && (
                <span id="feedback-author-error" className={styles['error-message']} role="alert">
                  {formErrors.authorName}
                </span>
              )}
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="feedback-category">Category</label>
              <div className={styles['category-select-wrapper']}>
                <span
                  className={`${styles['category-indicator']} ${styles[feedbackForm.category]}`}
                  aria-hidden="true"
                />
                <select
                  id="feedback-category"
                  value={feedbackForm.category}
                  onChange={(e) =>
                    setFeedbackForm({
                      ...feedbackForm,
                      category: e.target.value as FeedbackCategory,
                    })
                  }
                  className={styles['category-select']}
                >
                  <option value="positive">Positive Feedback</option>
                  <option value="negative">Negative Feedback</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="question">Question</option>
                </select>
              </div>
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="feedback-content">
                Feedback <span className={styles['required-asterisk']}>*</span>
              </label>
              <div className={styles['input-with-counter']}>
                <textarea
                  id="feedback-content"
                  value={feedbackForm.content}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
                  placeholder="Enter stakeholder feedback..."
                  rows={4}
                  className={formErrors.content ? styles.error : ''}
                  aria-required="true"
                  aria-invalid={!!formErrors.content}
                  aria-describedby={formErrors.content ? 'feedback-content-error' : undefined}
                  maxLength={1000}
                />
                <span
                  className={`${styles['char-counter']} ${
                    feedbackForm.content.length > 800 ? styles['char-counter-warning'] : ''
                  } ${feedbackForm.content.length > 950 ? styles['char-counter-error'] : ''}`}
                >
                  {feedbackForm.content.length}/1000
                </span>
              </div>
              {formErrors.content && (
                <span id="feedback-content-error" className={styles['error-message']} role="alert">
                  {formErrors.content}
                </span>
              )}
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="feedback-pbi">Related PBI (Optional)</label>
              <select
                id="feedback-pbi"
                value={feedbackForm.relatedPbiId ?? ''}
                onChange={(e) =>
                  setFeedbackForm({
                    ...feedbackForm,
                    relatedPbiId: e.target.value ?? undefined,
                  })
                }
              >
                <option value="">None</option>
                {sprintBacklogItems?.data?.map((pbi: ProductBacklogItem) => (
                  <option key={pbi.id} value={pbi.id}>
                    {pbi.title}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles['form-group']}>
              <div
                className={`${styles['action-required-toggle']} ${
                  feedbackForm.actionRequired ? styles.active : ''
                }`}
                onClick={() =>
                  setFeedbackForm({
                    ...feedbackForm,
                    actionRequired: !feedbackForm.actionRequired,
                    ownerId: feedbackForm.actionRequired ? undefined : feedbackForm.ownerId,
                  })
                }
                role="checkbox"
                aria-checked={feedbackForm.actionRequired}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setFeedbackForm({
                      ...feedbackForm,
                      actionRequired: !feedbackForm.actionRequired,
                      ownerId: feedbackForm.actionRequired ? undefined : feedbackForm.ownerId,
                    });
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={feedbackForm.actionRequired}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, actionRequired: e.target.checked })
                  }
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <span className={styles['action-required-label']}>
                  <AlertTriangleIcon size={24} className={styles['action-required-icon']} />
                  Action Required
                </span>
              </div>
            </div>

            {feedbackForm.actionRequired && (
              <div className={styles['form-group']}>
                <label htmlFor="feedback-owner" className={styles['required-label']}>
                  Owner <span className={styles['required-asterisk']}>*</span>
                </label>
                <select
                  id="feedback-owner"
                  value={feedbackForm.ownerId ?? ''}
                  onChange={(e) =>
                    setFeedbackForm({
                      ...feedbackForm,
                      ownerId: e.target.value ?? undefined,
                    })
                  }
                  className={formErrors.ownerId ? styles.error : ''}
                  aria-required="true"
                  aria-invalid={!!formErrors.ownerId}
                  aria-describedby={formErrors.ownerId ? 'feedback-owner-error' : undefined}
                >
                  <option value="">Select owner...</option>
                  {teamMembers?.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.user
                        ? `${member.user.firstName} ${member.user.lastName}`
                        : member.userId}
                    </option>
                  ))}
                </select>
                {formErrors.ownerId && (
                  <span id="feedback-owner-error" className={styles['error-message']} role="alert">
                    {formErrors.ownerId}
                  </span>
                )}
              </div>
            )}
          </div>

          <footer className={styles['feedback-form-footer']}>
            <button
              className={`${styles.button} ${styles['button-secondary']}`}
              onClick={() => {
                handleCloseAttempt();
                setFormErrors({});
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className={`${styles.button} ${styles['button-primary']}`}
              onClick={onSubmit}
              disabled={isPending}
              type="button"
            >
              {isPending ? (
                'Adding...'
              ) : (
                <>
                  <PlusIcon size={24} /> Add Feedback
                </>
              )}
            </button>
          </footer>
        </div>
      </div>

      <UnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        onConfirm={handleDiscardChanges}
        onCancel={handleCancelDiscard}
        title="Unsaved Feedback Changes"
        message="You have unsaved feedback. Are you sure you want to discard it?"
      />
    </>
  );
};
