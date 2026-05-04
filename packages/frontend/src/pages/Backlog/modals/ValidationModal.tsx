import React, { useRef } from 'react';

import type { DefinitionItem } from '../hooks/useDefinitionOfReadyDone';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useBacklogContext } from '../context/BacklogContext';

import styles from './ValidationModal.module.css';

import {
  CheckCircleIcon,
  XIcon,
  AlertTriangleIcon,
  AlertIcon,
  CheckIcon,
} from '@/components/common/Icons';

export interface ValidationModalProps {
  isOpen: boolean;
  validationType: 'ready' | 'done' | null;
  dorItems: DefinitionItem[];
  dodItems: DefinitionItem[];
  validationChecks: Record<string, boolean>;
  onCheckChange: (checkId: string, checked: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isUpdating: boolean;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  validationType,
  dorItems,
  dodItems,
  validationChecks,
  onCheckChange,
  onConfirm,
  onCancel,
  isUpdating,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const { selectedItem, workflowError, setWorkflowError } = useBacklogContext();

  useFocusTrap(isOpen, modalRef);

  if (!isOpen || !validationType || !selectedItem) return null;

  const checks = validationType === 'ready' ? dorItems : dodItems;
  const checkedCount = checks.filter((c) => validationChecks[c.id]).length;
  const isComplete = checks.length > 0 && checks.every((check) => validationChecks[check.id]);

  return (
    <div className={styles['modal-overlay']}>
      <div
        ref={modalRef}
        className={`${styles.modal} ${styles['validation-modal']}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles['modal-header']}>
          <div className={styles['validation-header-content']}>
            <div className={styles['validation-icon']}>
              <CheckCircleIcon
                width="24"
                height="24"
                className={
                  styles[
                    validationType === 'ready' ? 'validation-icon-ready' : 'validation-icon-done'
                  ]
                }
              />
            </div>
            <div>
              <h2>Definition of {validationType === 'ready' ? 'Ready' : 'Done'}</h2>
              <p className={styles['validation-subtitle']}>
                Verify all criteria before marking as{' '}
                {validationType === 'ready' ? 'Ready' : 'Done'}
              </p>
            </div>
          </div>
          <button className={styles['modal-close']} onClick={onCancel}>
            <XIcon width="16" height="16" />
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
                  <XIcon width="14" height="14" />
                </button>
              </div>
            </div>
          )}
          <div className={styles['validation-item-preview']}>
            <span className={styles['preview-id']}>#{selectedItem.id.slice(-4)}</span>
            <span className={styles['preview-title']}>{selectedItem.title}</span>
          </div>

          <div className={styles['validation-checklist']}>
            {checks.map((check) => (
              <label
                key={check.id}
                className={`${styles['validation-check-item']} ${validationChecks[check.id] ? styles.checked : ''}`}
              >
                <div className={styles['check-checkbox']}>
                  <input
                    type="checkbox"
                    checked={validationChecks[check.id] || false}
                    onChange={(e) => onCheckChange(check.id, e.target.checked)}
                  />
                  <span className={styles['check-custom']}>
                    {validationChecks[check.id] && (
                      <CheckIcon width="12" height="12" strokeWidth="3" />
                    )}
                  </span>
                </div>
                <div className={styles['check-content']}>
                  <span className={styles['check-label']}>{check.label}</span>
                  <span className={styles['check-desc']}>{check.description}</span>
                </div>
              </label>
            ))}
          </div>

          <div className={styles['validation-progress']}>
            <div className={styles['progress-bar']}>
              <div
                className={styles['progress-fill']}
                style={{
                  width: `${(checkedCount / checks.length) * 100}%`,
                }}
              />
            </div>
            <span className={styles['progress-text']}>
              {checkedCount} of {checks.length} criteria met
            </span>
          </div>

          {!isComplete && (
            <div className={styles['validation-warning']}>
              <AlertTriangleIcon width="16" height="16" />
              <span>All criteria must be verified before proceeding</span>
            </div>
          )}
        </div>
        <div className={styles['modal-footer']}>
          <button className={`${styles.button} ${styles['button-secondary']}`} onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles['button-primary']}`}
            onClick={onConfirm}
            disabled={isUpdating || !isComplete}
          >
            {isUpdating ? (
              'Updating...'
            ) : (
              <>
                <CheckIcon width="16" height="16" />
                Confirm Status Change
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
