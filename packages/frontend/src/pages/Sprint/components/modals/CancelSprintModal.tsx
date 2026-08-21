import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import baseStyles from './base/ModalBase.module.css';
import styles from './CancelSprintModal.module.css';

import { AlertTriangleIcon, CloseIcon, XCircleIcon } from '@/components/common/Icons';

export interface CancelSprintModalProps {
  sprintName: string;
  isCancelling: boolean;
  cancelSprintError: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  modalRef: React.RefObject<HTMLDivElement | null>;
}

export const CancelSprintModal: React.FC<CancelSprintModalProps> = ({
  sprintName,
  isCancelling,
  cancelSprintError,
  onClose,
  onConfirm,
  modalRef,
}) => {
  const { t } = useTranslation('sprint');
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim());
  };

  return (
    <div
      className={baseStyles['modal-overlay']}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-sprint-title"
    >
      <div
        ref={modalRef}
        className={`${baseStyles.modal} ${styles['cancel-sprint-modal']}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={baseStyles['modal-header']}>
          <h2 id="cancel-sprint-title" className={baseStyles['modal-title']}>
            <XCircleIcon size={24} aria-hidden="true" className={styles['title-icon']} />{' '}
            {t('cancelSprint.title')}
          </h2>
          <button
            className={baseStyles['modal-close']}
            onClick={onClose}
            aria-label={t('cancelSprint.closeModal')}
            data-modal-close
          >
            <CloseIcon size={14} aria-hidden="true" />
          </button>
        </div>
        <div className={baseStyles['modal-body']}>
          {cancelSprintError && (
            <div className={styles['error-message']} role="alert">
              <AlertTriangleIcon size={18} aria-hidden="true" />
              <span>{cancelSprintError}</span>
            </div>
          )}
          <div className={styles['warning-box']} role="alert">
            <AlertTriangleIcon size={20} aria-hidden="true" className={styles['warning-icon']} />
            <p>{t('cancelSprint.warning', { sprintName })}</p>
          </div>
          <label htmlFor="cancel-sprint-reason" className={styles['reason-label']}>
            {t('cancelSprint.reasonLabel')}
          </label>
          <textarea
            id="cancel-sprint-reason"
            className={styles['reason-input']}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('cancelSprint.reasonPlaceholder')}
            maxLength={500}
            rows={4}
          />
          <p className={styles['reason-hint']}>{t('cancelSprint.reasonHint')}</p>
        </div>
        <div className={baseStyles['modal-footer']}>
          <button
            className={`${baseStyles.button} ${baseStyles['button-secondary']}`}
            onClick={onClose}
            disabled={isCancelling}
          >
            {t('cancelSprint.keepSprint')}
          </button>
          <button
            className={`${baseStyles.button} ${baseStyles['button-danger']} ${isCancelling ? baseStyles['button-loading'] : ''}`}
            onClick={handleConfirm}
            disabled={isCancelling || !reason.trim()}
            aria-busy={isCancelling}
          >
            {isCancelling ? (
              <>{t('cancelSprint.processing')}</>
            ) : (
              <>{t('cancelSprint.confirmCancel')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
