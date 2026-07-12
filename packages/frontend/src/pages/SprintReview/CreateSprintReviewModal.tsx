import React from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('sprint-review');
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
            {t('createModal.title')}
          </h3>
          <button
            className={styles['close-button']}
            onClick={onClose}
            aria-label={t('createModal.cancel')}
            type="button"
          >
            <XIcon size={24} />
          </button>
        </div>
        <div className={styles['modal-content']}>
          <div className={styles['form-group']}>
            <label htmlFor="review-date">{t('createModal.reviewDate')}</label>
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
            <label htmlFor="review-summary">{t('createModal.summary')}</label>
            <textarea
              id="review-summary"
              value={createReviewData.summary}
              onChange={(e) =>
                setCreateReviewData({ ...createReviewData, summary: e.target.value })
              }
              placeholder={t('createModal.summaryPlaceholder')}
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
            {t('createModal.cancel')}
          </button>
          <button
            className={`${styles.button} ${styles['button-primary']}`}
            onClick={onSubmit}
            disabled={isPending || !hasIncrement}
          >
            {isPending ? (
              t('createModal.creating')
            ) : (
              <>
                <CheckIcon size={16} /> {t('createModal.createReview')}
              </>
            )}
          </button>
        </div>
        {isError && (
          <div className={styles['modal-error']}>
            {error instanceof Error ? error.message : t('createModal.failed')}
          </div>
        )}
      </div>
    </div>
  );
};
