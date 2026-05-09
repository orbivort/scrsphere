import React, { useState, useCallback } from 'react';

import { type ApiResponse, type ProductBacklogItem, type TeamMember } from '../../types';
import { useModalFocus } from '../../hooks/useModalFocus';
import { UnsavedChangesModal } from '../../components/common/Form/UnsavedChangesModal';
import {
  XIcon,
  PlusIcon,
  ListIcon,
  EditIcon,
  TrashIcon,
  RefreshCwIcon,
  ScissorsIcon,
} from '../../components/common/Icons';

import styles from './AddBacklogAdjustmentModal.module.css';

type AdjustmentAction = 'add' | 'modify' | 'remove' | 'reorder' | 'split';

interface AdjustmentFormData {
  action: AdjustmentAction;
  description: string;
  reason: string;
  pbiId?: string;
  ownerId: string;
}

interface AddBacklogAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  teamMembers?: TeamMember[];
  sprintBacklogItems?: ApiResponse<ProductBacklogItem[]>;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  adjustmentForm: AdjustmentFormData;
  setAdjustmentForm: React.Dispatch<React.SetStateAction<AdjustmentFormData>>;
  isPending: boolean;
}

export const AddBacklogAdjustmentModal: React.FC<AddBacklogAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teamMembers,
  sprintBacklogItems,
  formErrors,
  setFormErrors,
  adjustmentForm,
  setAdjustmentForm,
  isPending,
}) => {
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  const hasUnsavedChanges = useCallback(() => {
    return (
      adjustmentForm.description.trim() !== '' ||
      adjustmentForm.reason.trim() !== '' ||
      adjustmentForm.pbiId !== undefined ||
      adjustmentForm.ownerId !== '' ||
      adjustmentForm.action !== 'add'
    );
  }, [adjustmentForm]);

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

  const getActionIcon = () => {
    switch (adjustmentForm.action) {
      case 'add':
        return <PlusIcon size={24} />;
      case 'modify':
        return <EditIcon size={24} />;
      case 'remove':
        return <TrashIcon size={24} />;
      case 'reorder':
        return <RefreshCwIcon size={24} />;
      case 'split':
        return <ScissorsIcon size={24} />;
      default:
        return <PlusIcon size={24} />;
    }
  };

  return (
    <>
      <div
        ref={modalFocus.modalRef}
        className={styles['adjustment-form-overlay']}
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjustment-form-title"
        onClick={handleCloseAttempt}
      >
        <div className={styles['adjustment-form']} onClick={(e) => e.stopPropagation()}>
          <header className={styles['adjustment-form-header']}>
            <div className={styles['adjustment-form-header-content']}>
              <div className={styles['adjustment-form-icon-wrapper']} aria-hidden="true">
                <ListIcon size={24} />
              </div>
              <h2 id="adjustment-form-title" className={styles['adjustment-form-title']}>
                Add Backlog Adjustment
              </h2>
              <p className={styles['adjustment-form-subtitle']}>
                Record changes to the Product Backlog based on Sprint Review feedback
              </p>
            </div>
            <button
              className={styles['adjustment-form-close']}
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

          <div className={styles['adjustment-form-body']}>
            <div className={styles['form-group']}>
              <label htmlFor="adjustment-action">Action Type</label>
              <div className={styles['action-type-wrapper']}>
                <span className={styles['action-type-icon']} aria-hidden="true">
                  {getActionIcon()}
                </span>
                <select
                  id="adjustment-action"
                  value={adjustmentForm.action}
                  onChange={(e) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      action: e.target.value as AdjustmentAction,
                    })
                  }
                  className={styles['action-type-select']}
                >
                  <option value="add">Add New Item</option>
                  <option value="modify">Modify Existing</option>
                  <option value="remove">Remove</option>
                  <option value="reorder">Reorder</option>
                  <option value="split">Split</option>
                </select>
              </div>
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="adjustment-description">
                Description <span className={styles['required-asterisk']}>*</span>
              </label>
              <div className={styles['input-with-counter']}>
                <textarea
                  id="adjustment-description"
                  value={adjustmentForm.description}
                  onChange={(e) =>
                    setAdjustmentForm({ ...adjustmentForm, description: e.target.value })
                  }
                  placeholder="Describe the adjustment..."
                  rows={3}
                  className={formErrors.description ? styles.error : ''}
                  aria-required="true"
                  aria-invalid={!!formErrors.description}
                  aria-describedby={
                    formErrors.description ? 'adjustment-description-error' : undefined
                  }
                  maxLength={500}
                />
                <span
                  className={`${styles['char-counter']} ${
                    adjustmentForm.description.length > 400 ? styles['char-counter-warning'] : ''
                  }`}
                >
                  {adjustmentForm.description.length}/500
                </span>
              </div>
              {formErrors.description && (
                <span
                  id="adjustment-description-error"
                  className={styles['error-message']}
                  role="alert"
                >
                  {formErrors.description}
                </span>
              )}
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="adjustment-reason">
                Reason <span className={styles['required-asterisk']}>*</span>
              </label>
              <div className={styles['input-with-counter']}>
                <textarea
                  id="adjustment-reason"
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  placeholder="Why is this adjustment needed?"
                  rows={2}
                  className={formErrors.reason ? styles.error : ''}
                  aria-required="true"
                  aria-invalid={!!formErrors.reason}
                  aria-describedby={formErrors.reason ? 'adjustment-reason-error' : undefined}
                  maxLength={300}
                />
                <span
                  className={`${styles['char-counter']} ${
                    adjustmentForm.reason.length > 240 ? styles['char-counter-warning'] : ''
                  }`}
                >
                  {adjustmentForm.reason.length}/300
                </span>
              </div>
              {formErrors.reason && (
                <span id="adjustment-reason-error" className={styles['error-message']} role="alert">
                  {formErrors.reason}
                </span>
              )}
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="adjustment-pbi">Related PBI (Optional)</label>
              <select
                id="adjustment-pbi"
                value={adjustmentForm.pbiId ?? ''}
                onChange={(e) =>
                  setAdjustmentForm({
                    ...adjustmentForm,
                    pbiId: e.target.value,
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
              <label htmlFor="adjustment-owner" className={styles['required-label']}>
                Owner <span className={styles['required-asterisk']}>*</span>
              </label>
              <select
                id="adjustment-owner"
                value={adjustmentForm.ownerId}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, ownerId: e.target.value })}
                className={formErrors.ownerId ? styles.error : ''}
                aria-required="true"
                aria-invalid={!!formErrors.ownerId}
                aria-describedby={formErrors.ownerId ? 'adjustment-owner-error' : undefined}
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
                <span id="adjustment-owner-error" className={styles['error-message']} role="alert">
                  {formErrors.ownerId}
                </span>
              )}
            </div>
          </div>

          <footer className={styles['adjustment-form-footer']}>
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
                  <PlusIcon size={24} /> Add Adjustment
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
        title="Unsaved Backlog Adjustment Changes"
        message="You have unsaved backlog adjustment. Are you sure you want to discard it?"
      />
    </>
  );
};
