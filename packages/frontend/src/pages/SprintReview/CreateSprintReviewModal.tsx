import React from 'react';

import { useModalFocus } from '../../hooks/useModalFocus';
import { XIcon, AlertTriangleIcon, CheckIcon, FileTextIcon } from '../../components/common/Icons';

import styles from './CreateSprintReviewModal.module.css';

interface CreateSprintReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  createReviewData: {
    reviewDate: string | undefined;
    summary: string;
  };
  setCreateReviewData: React.Dispatch<
    React.SetStateAction<{
      reviewDate: string | undefined;
      summary: string;
    }>
  >;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  hasIncrement: boolean;
}

export const CreateSprintReviewModal: React.FC<CreateSprintReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  createReviewData,
  setCreateReviewData,
  formErrors,
  setFormErrors,
  isPending,
  isError,
  error,
  hasIncrement,
}) => {
  const modalFocus = useModalFocus({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      ref={modalFocus.modalRef}
      className={styles['modal-overlay']}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-review-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles['modal-header']}>
          <h3 id="create-review-title">
            <FileTextIcon size={20} />
            Create Sprint Review
          </h3>
          <button
            className={styles['close-button']}
            onClick={onClose}
            aria-label="Close dialog"
            type="button"
          >
            <XIcon size={24} />
          </button>
        </div>
        <div className={styles['modal-content']}>
          <div className={styles['form-group']}>
            <label htmlFor="review-date">Review Date *</label>
            <input
              id="review-date"
              type="date"
              value={createReviewData.reviewDate}
              onChange={(e) =>
                setCreateReviewData({ ...createReviewData, reviewDate: e.target.value })
              }
              className={formErrors.reviewDate ? styles.error : ''}
              aria-required="true"
              aria-invalid={!!formErrors.reviewDate}
              aria-describedby={formErrors.reviewDate ? 'review-date-error' : undefined}
            />
            {formErrors.reviewDate && (
              <span id="review-date-error" className={styles['error-message']} role="alert">
                {formErrors.reviewDate}
              </span>
            )}
          </div>
          <div className={styles['form-group']}>
            <label htmlFor="review-summary">Summary (Optional)</label>
            <textarea
              id="review-summary"
              value={createReviewData.summary}
              onChange={(e) =>
                setCreateReviewData({ ...createReviewData, summary: e.target.value })
              }
              placeholder="Enter a summary of the sprint review..."
              rows={4}
            />
          </div>
        </div>
        {formErrors.increment && (
          <div className={styles['modal-warning']}>
            <span className={styles['warning-icon']}>
              <AlertTriangleIcon size={24} />
            </span>
            <span>{formErrors.increment}</span>
          </div>
        )}
        <div className={styles['modal-actions']}>
          <button
            className={`${styles.button} ${styles['button-secondary']}`}
            onClick={() => {
              onClose();
              setFormErrors({});
            }}
          >
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles['button-primary']}`}
            onClick={onSubmit}
            disabled={isPending || !hasIncrement}
          >
            {isPending ? (
              'Creating...'
            ) : (
              <>
                <CheckIcon size={16} /> Create Review
              </>
            )}
          </button>
        </div>
        {isError && (
          <div className={styles['modal-error']}>
            {error instanceof Error
              ? error.message
              : 'Failed to create sprint review. Please try again.'}
          </div>
        )}
      </div>
    </div>
  );
};
