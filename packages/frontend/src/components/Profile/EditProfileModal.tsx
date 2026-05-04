import React, { useState, useEffect, useRef } from 'react';

import { useAuthStore, useToastStore } from '../../store';
import { validateProfileUpdate, type ValidationErrors } from '../../utils/validation';
import { useModalFocus } from '../../hooks/useModalFocus';
import { UserIcon, CloseIcon, SaveIcon, XCircleIcon } from '../common/Icons';

import styles from './EditProfileModal.module.css';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onDirtyChange,
}) => {
  const { user, updateProfile, isUpdatingProfile, profileUpdateError, clearProfileErrors } =
    useAuthStore();

  const [formData, setFormData] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
  });

  const [originalData, setOriginalData] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const success = useToastStore((state) => state.success);

  const firstNameInputRef = useRef<HTMLInputElement>(null);

  // Use modal focus hook for accessibility and background scroll lock
  const { modalRef } = useModalFocus({
    isOpen,
    onClose,
    initialFocusRef: firstNameInputRef,
  });

  useEffect(() => {
    if (isOpen) {
      const initialData = {
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setErrors({});
      clearProfileErrors();
    }
  }, [isOpen, user, clearProfileErrors]);

  // Track dirty state and notify parent
  useEffect(() => {
    const isDirty =
      formData.firstName !== originalData.firstName || formData.lastName !== originalData.lastName;
    onDirtyChange?.(isDirty);
  }, [formData, originalData, onDirtyChange]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    const validationErrors = validateProfileUpdate({
      ...formData,
      [field]: value,
    });
    setErrors(validationErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateProfileUpdate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const updateSuccess = await updateProfile(formData);

    if (updateSuccess) {
      success('Profile updated successfully');
      setOriginalData(formData);
      onDirtyChange?.(false);
      onClose();
    }
  };

  const isValid = Object.keys(errors).length === 0 && formData.firstName && formData.lastName;

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
      >
        <div className={styles.header}>
          <h2 id="edit-profile-title">
            <span className={styles['header-icon']}>
              <UserIcon size={24} />
            </span>
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className={styles['close-button']}
            aria-label="Close"
            type="button"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {profileUpdateError && (
            <div className={styles['form-error-banner']} role="alert">
              <span className={styles['form-error-banner-icon']}>
                <XCircleIcon size={20} />
              </span>
              <span className={styles['form-error-banner-text']}>{profileUpdateError}</span>
            </div>
          )}

          <div className={styles['form-group']}>
            <label htmlFor="firstName" className={styles['form-label']}>
              First Name
              <span className={styles.required}>*</span>
            </label>
            <div className={styles['input-wrapper']}>
              <input
                ref={firstNameInputRef}
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className={`${styles['form-input']} ${errors.firstName ? styles['input-error'] : ''}`}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                disabled={isUpdatingProfile}
                maxLength={100}
                placeholder="Enter your first name"
              />
              <span className={styles['char-counter']}>{formData.firstName.length} / 100</span>
            </div>
            {errors.firstName && (
              <span id="firstName-error" className={styles['form-error']} role="alert">
                {errors.firstName}
              </span>
            )}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="lastName" className={styles['form-label']}>
              Last Name
              <span className={styles.required}>*</span>
            </label>
            <div className={styles['input-wrapper']}>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className={`${styles['form-input']} ${errors.lastName ? styles['input-error'] : ''}`}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                disabled={isUpdatingProfile}
                maxLength={100}
                placeholder="Enter your last name"
              />
              <span className={styles['char-counter']}>{formData.lastName.length} / 100</span>
            </div>
            {errors.lastName && (
              <span id="lastName-error" className={styles['form-error']} role="alert">
                {errors.lastName}
              </span>
            )}
          </div>

          <div className={styles['form-group']}>
            <label className={styles['form-label']}>
              Email
              <span className={styles['optional-badge']}>Read-only</span>
            </label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className={styles['form-input']}
              aria-describedby="email-help"
            />
            <span id="email-help" className={styles['helper-text']}>
              Contact support to change your email address
            </span>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.button} ${styles['button-secondary']}`}
              disabled={isUpdatingProfile}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isUpdatingProfile}
              className={`${styles.button} ${styles['button-primary']} ${isUpdatingProfile ? styles['button-loading'] : ''}`}
            >
              {!isUpdatingProfile && (
                <>
                  <SaveIcon size={16} />
                  Save Changes
                </>
              )}
              {isUpdatingProfile && 'Saving...'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
