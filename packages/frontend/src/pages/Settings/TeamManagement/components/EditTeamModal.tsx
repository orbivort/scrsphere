import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './EditTeamModal.module.css';

import type { Team, UpdateTeamInput } from '@/types/teamManagement.types';
import { useModalFocus } from '@/hooks/useModalFocus';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { UnsavedChangesModal } from '@/components/common/Form/UnsavedChangesModal';
import { EditIcon, XIcon, SaveIcon, InfoIcon } from '@/components/common/Icons';

interface EditTeamModalProps {
  isOpen: boolean;
  team: Team | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateTeamInput) => void;
  isSubmitting: boolean;
}

export const EditTeamModal: React.FC<EditTeamModalProps> = ({
  isOpen,
  team,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation('settings');

  // Protect against accidental browser tab closure when form has unsaved changes
  // Note: isDirty is sufficient here as it's set when user modifies any field
  useBeforeUnload(isDirty, t('editTeamModal.beforeUnload'));

  const { modalRef } = useModalFocus({
    isOpen,
    onClose,
    initialFocusRef: nameInputRef,
  });

  // Store original values for comparison
  const [originalName, setOriginalName] = useState('');
  const [originalDescription, setOriginalDescription] = useState('');

  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description ?? '');
      setOriginalName(team.name);
      setOriginalDescription(team.description ?? '');
      setIsDirty(false);
      setErrors({});
    }
  }, [team]);

  // Calculate progress percentage based on form completion
  const progressPercentage = useMemo(() => {
    let progress = 0;
    if (name.trim()) progress += 50;
    if (description.trim()) progress += 50;
    return progress;
  }, [name, description]);

  // Check if any changes have been made
  const hasChanges = useMemo(() => {
    return name !== originalName || description !== originalDescription;
  }, [name, description, originalName, originalDescription]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setIsDirty(true);
    if (errors.name && value.trim()) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);
    setIsDirty(true);
    if (errors.description && value.length <= 1000) {
      setErrors((prev) => ({ ...prev, description: undefined }));
    }
  };

  const handleClose = useCallback(() => {
    if (isDirty && hasChanges) {
      setShowUnsavedChanges(true);
    } else {
      onClose();
    }
  }, [isDirty, hasChanges, onClose]);

  const handleConfirmDiscard = useCallback(() => {
    setShowUnsavedChanges(false);
    setIsDirty(false);
    onClose();
  }, [onClose]);

  const handleCancelDiscard = useCallback(() => {
    setShowUnsavedChanges(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { name?: string; description?: string } = {};

    if (!name.trim()) {
      newErrors.name = t('editTeamModal.validation.nameRequired');
    } else if (name.length > 100) {
      newErrors.name = t('editTeamModal.validation.nameMaxLength');
    }

    if (description && description.length > 1000) {
      newErrors.description = t('editTeamModal.validation.descriptionMaxLength');
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0 && team) {
      onSubmit(team.id, { name: name.trim(), description: description.trim() || undefined });
      setIsDirty(false);
    }
  };

  // Get character counter class based on length
  const getNameCounterClass = () => {
    if (name.length >= 100) return styles['char-counter-error'];
    if (name.length >= 80) return styles['char-counter-warning'];
    return '';
  };

  const getDescriptionCounterClass = () => {
    if (description.length >= 1000) return styles['char-counter-error'];
    if (description.length >= 800) return styles['char-counter-warning'];
    return '';
  };

  if (!isOpen || !team) return null;

  return (
    <>
      <div className={styles.overlay} onClick={handleClose}>
        <div
          ref={modalRef}
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-team-title"
        >
          {/* Modal Header */}
          <div className={styles.header}>
            <div className={styles['header-content']}>
              <div className={styles['icon-wrapper']}>
                <EditIcon size={24} />
              </div>
              <h2 id="edit-team-title" className={styles.title}>
                {t('editTeamModal.title')}
              </h2>
              <p className={styles.subtitle}>{t('editTeamModal.subtitle')}</p>
            </div>
            <button
              className={styles['close-button']}
              onClick={handleClose}
              aria-label={t('editTeamModal.closeModal')}
              type="button"
            >
              <XIcon size={18} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className={styles['progress-bar']} aria-hidden="true">
            <div className={styles['progress-fill']} style={{ width: `${progressPercentage}%` }} />
          </div>

          {/* Modal Body */}
          <form className={styles.body} onSubmit={handleSubmit} noValidate>
            <p className={styles['form-legend']} aria-label={t('editTeamModal.requiredFieldsAria')}>
              <span className={styles.required} aria-hidden="true">
                *
              </span>
              <span>{t('editTeamModal.requiredFields')}</span>
            </p>

            {/* Change Indicator - shows when changes are made */}
            {hasChanges && (
              <div className={styles['change-indicator']}>
                <InfoIcon size={16} />
                <span>{t('editTeamModal.unsavedChanges')}</span>
              </div>
            )}

            {/* Team Name Field */}
            <div className={styles['form-group']}>
              <label htmlFor="edit-team-name" className={styles['form-label']}>
                {t('editTeamModal.teamName')}
                <span className={styles.required}>*</span>
              </label>
              <div className={styles['input-wrapper']}>
                <input
                  ref={nameInputRef}
                  id="edit-team-name"
                  type="text"
                  className={styles['form-input']}
                  value={name}
                  onChange={handleNameChange}
                  placeholder={t('editTeamModal.teamNamePlaceholder')}
                  aria-invalid={!!errors.name}
                  aria-describedby={
                    errors.name
                      ? 'edit-team-name-error edit-team-name-counter'
                      : 'edit-team-name-counter'
                  }
                  disabled={isSubmitting}
                  autoComplete="off"
                  maxLength={100}
                />
                <span
                  id="edit-team-name-counter"
                  className={`${styles['char-counter']} ${getNameCounterClass()}`}
                  aria-live="polite"
                >
                  {name.length} / 100
                </span>
              </div>
              {errors.name && (
                <span id="edit-team-name-error" className={styles['form-error']} role="alert">
                  {errors.name}
                </span>
              )}
            </div>

            {/* Description Field */}
            <div className={styles['form-group']}>
              <label htmlFor="edit-team-description" className={styles['form-label']}>
                {t('editTeamModal.description')}
                <span className={styles['optional-badge']}>{t('editTeamModal.optionalBadge')}</span>
              </label>
              <div className={styles['input-wrapper']}>
                <textarea
                  id="edit-team-description"
                  className={styles['form-textarea']}
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder={t('editTeamModal.descriptionPlaceholder')}
                  rows={4}
                  maxLength={1000}
                  aria-invalid={!!errors.description}
                  aria-describedby={
                    errors.description
                      ? 'edit-team-description-error edit-team-description-counter'
                      : 'edit-team-description-counter'
                  }
                  disabled={isSubmitting}
                />
                <span
                  id="edit-team-description-counter"
                  className={`${styles['char-counter']} ${getDescriptionCounterClass()}`}
                  aria-live="polite"
                >
                  {description.length} / 1000
                </span>
              </div>
              {errors.description && (
                <span
                  id="edit-team-description-error"
                  className={styles['form-error']}
                  role="alert"
                >
                  {errors.description}
                </span>
              )}
            </div>

            {/* Modal Footer */}
            <div className={styles.footer}>
              <button
                type="button"
                className={`${styles.button} ${styles['button-secondary']}`}
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t('editTeamModal.cancel')}
              </button>
              <button
                type="submit"
                className={`${styles.button} ${styles['button-primary']} ${
                  isSubmitting ? styles['button-loading'] : ''
                }`}
                disabled={isSubmitting || !name.trim() || !hasChanges}
                aria-busy={isSubmitting}
              >
                {!isSubmitting && (
                  <>
                    <SaveIcon size={16} />
                    <span>{t('editTeamModal.saveChanges')}</span>
                  </>
                )}
                {isSubmitting && <span>{t('editTeamModal.saving')}</span>}
              </button>
            </div>
          </form>
        </div>
      </div>

      <UnsavedChangesModal
        isOpen={showUnsavedChanges}
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
      />
    </>
  );
};
