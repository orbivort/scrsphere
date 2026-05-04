import React, { useState, useEffect, useRef } from 'react';

import { useAuthStore, useToastStore } from '../../store';
import { validatePasswordChange, type ValidationErrors } from '../../utils/validation';
import {
  checkPasswordRequirements,
  calculatePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  type PasswordRequirements,
  type PasswordStrength,
} from '../../utils/passwordStrength';
import { useModalFocus } from '../../hooks/useModalFocus';
import {
  LockIcon,
  CloseIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  XCircleIcon,
  SaveIcon,
} from '../common/Icons';

import styles from './ChangePasswordModal.module.css';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onDirtyChange,
}) => {
  const { changePassword, isChangingPassword, passwordChangeError, clearProfileErrors } =
    useAuthStore();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak');
  const success = useToastStore((state) => state.success);

  const currentPasswordInputRef = useRef<HTMLInputElement>(null);

  // Use modal focus hook for accessibility and background scroll lock
  const { modalRef } = useModalFocus({
    isOpen,
    onClose,
    initialFocusRef: currentPasswordInputRef,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      clearProfileErrors();
    }
  }, [isOpen, clearProfileErrors]);

  // Track dirty state and notify parent
  useEffect(() => {
    const isDirty =
      formData.currentPassword !== '' ||
      formData.newPassword !== '' ||
      formData.confirmPassword !== '';
    onDirtyChange?.(isDirty);
  }, [formData, onDirtyChange]);

  const handlePasswordChange = (value: string) => {
    const requirements = checkPasswordRequirements(value);
    setPasswordRequirements(requirements);
    setPasswordStrength(calculatePasswordStrength(requirements));
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === 'newPassword') {
      handlePasswordChange(value);
    }

    const validationErrors = validatePasswordChange({
      ...formData,
      [field]: value,
    });
    setErrors(validationErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validatePasswordChange(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const changeSuccess = await changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });

    if (changeSuccess) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      onDirtyChange?.(false);
      success('Password changed successfully');
      onClose();
    }
  };

  const isValid =
    Object.keys(errors).length === 0 &&
    formData.currentPassword &&
    formData.newPassword &&
    formData.confirmPassword;

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
      >
        <div className={styles.header}>
          <h2 id="change-password-title">
            <span className={styles['header-icon']}>
              <LockIcon size={24} />
            </span>
            Change Password
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
          {passwordChangeError && (
            <div className={styles['form-error-banner']} role="alert">
              <span className={styles['form-error-banner-icon']}>
                <XCircleIcon size={20} />
              </span>
              <span className={styles['form-error-banner-text']}>{passwordChangeError}</span>
            </div>
          )}

          <div className={styles['form-group']}>
            <label htmlFor="currentPassword" className={styles['form-label']}>
              Current Password
              <span className={styles.required}>*</span>
            </label>
            <div className={styles['password-input-wrapper']}>
              <input
                ref={currentPasswordInputRef}
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleChange('currentPassword', e.target.value)}
                className={errors.currentPassword ? styles['input-error'] : ''}
                aria-describedby={errors.currentPassword ? 'currentPassword-error' : undefined}
                disabled={isChangingPassword}
                autoComplete="current-password"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                className={styles['toggle-password']}
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {errors.currentPassword && (
              <span id="currentPassword-error" className={styles.error} role="alert">
                {errors.currentPassword}
              </span>
            )}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="newPassword" className={styles['form-label']}>
              New Password
              <span className={styles.required}>*</span>
            </label>
            <div className={styles['password-input-wrapper']}>
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleChange('newPassword', e.target.value)}
                className={errors.newPassword ? styles['input-error'] : ''}
                aria-describedby={
                  errors.newPassword ? 'newPassword-error' : 'password-requirements'
                }
                disabled={isChangingPassword}
                autoComplete="new-password"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                className={styles['toggle-password']}
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <span id="newPassword-error" className={styles.error} role="alert">
                {errors.newPassword}
              </span>
            )}

            {formData.newPassword && (
              <div className={styles['strength-indicator']}>
                <div className={styles['strength-bar-container']}>
                  <div className={styles['strength-bar']}>
                    <div
                      className={styles['strength-fill']}
                      style={{
                        width: `${(Object.values(passwordRequirements).filter(Boolean).length / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor(passwordStrength),
                      }}
                    />
                  </div>
                  <span
                    className={styles['strength-label']}
                    style={{ color: getPasswordStrengthColor(passwordStrength) }}
                  >
                    {getPasswordStrengthLabel(passwordStrength)}
                  </span>
                </div>

                <div id="password-requirements" className={styles.requirements}>
                  <p className={styles['requirements-title']}>Password Requirements:</p>
                  <ul className={styles['requirements-list']}>
                    <li
                      className={`${styles['requirement-item']} ${passwordRequirements.minLength ? styles.met : styles.unmet}`}
                    >
                      <span className={styles['requirement-icon']}>
                        {passwordRequirements.minLength ? (
                          <CheckIcon size={14} strokeWidth={3} />
                        ) : (
                          <XCircleIcon size={14} />
                        )}
                      </span>
                      At least 12 characters
                    </li>
                    <li
                      className={`${styles['requirement-item']} ${passwordRequirements.hasUppercase ? styles.met : styles.unmet}`}
                    >
                      <span className={styles['requirement-icon']}>
                        {passwordRequirements.hasUppercase ? (
                          <CheckIcon size={14} strokeWidth={3} />
                        ) : (
                          <XCircleIcon size={14} />
                        )}
                      </span>
                      One uppercase letter (A-Z)
                    </li>
                    <li
                      className={`${styles['requirement-item']} ${passwordRequirements.hasLowercase ? styles.met : styles.unmet}`}
                    >
                      <span className={styles['requirement-icon']}>
                        {passwordRequirements.hasLowercase ? (
                          <CheckIcon size={14} strokeWidth={3} />
                        ) : (
                          <XCircleIcon size={14} />
                        )}
                      </span>
                      One lowercase letter (a-z)
                    </li>
                    <li
                      className={`${styles['requirement-item']} ${passwordRequirements.hasNumber ? styles.met : styles.unmet}`}
                    >
                      <span className={styles['requirement-icon']}>
                        {passwordRequirements.hasNumber ? (
                          <CheckIcon size={14} strokeWidth={3} />
                        ) : (
                          <XCircleIcon size={14} />
                        )}
                      </span>
                      One number (0-9)
                    </li>
                    <li
                      className={`${styles['requirement-item']} ${passwordRequirements.hasSpecial ? styles.met : styles.unmet}`}
                    >
                      <span className={styles['requirement-icon']}>
                        {passwordRequirements.hasSpecial ? (
                          <CheckIcon size={14} strokeWidth={3} />
                        ) : (
                          <XCircleIcon size={14} />
                        )}
                      </span>
                      One special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="confirmPassword" className={styles['form-label']}>
              Confirm New Password
              <span className={styles.required}>*</span>
            </label>
            <div className={styles['password-input-wrapper']}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className={errors.confirmPassword ? styles['input-error'] : ''}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                disabled={isChangingPassword}
                autoComplete="new-password"
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                className={styles['toggle-password']}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span id="confirmPassword-error" className={styles.error} role="alert">
                {errors.confirmPassword}
              </span>
            )}
            {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
              <span className={styles.success}>Passwords match</span>
            )}
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.button} ${styles['button-secondary']}`}
              disabled={isChangingPassword}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isChangingPassword}
              className={`${styles.button} ${styles['button-primary']} ${isChangingPassword ? styles['button-loading'] : ''}`}
            >
              {!isChangingPassword && (
                <>
                  <SaveIcon size={16} />
                  Change Password
                </>
              )}
              {isChangingPassword && 'Changing...'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
