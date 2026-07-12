import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthStore, useToastStore } from '../../store';
import { validatePasswordChange, type ValidationErrors } from '../../utils/validation';
import {
  checkPasswordRequirements,
  calculatePasswordStrength,
  getPasswordStrengthColor,
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
  const { t } = useTranslation('common');
  const success = useToastStore((state) => state.success);

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

    const validationErrors = validatePasswordChange(
      {
        ...formData,
        [field]: value,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic validation key
      (key, options) => (t as any)(key, options) as string
    );
    setErrors(validationErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validatePasswordChange(
      formData,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic validation key
      (key, options) => (t as any)(key, options) as string
    );
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
      success(t('profile.passwordChanged'));
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
            {t('profile.changePasswordTitle')}
          </h2>
          <button
            onClick={onClose}
            className={styles['close-button']}
            aria-label={t('close')}
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
              {t('profile.currentPassword')}
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
                placeholder={t('profile.placeholder.currentPassword')}
              />
              <button
                type="button"
                className={styles['toggle-password']}
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={
                  showCurrentPassword ? t('profile.hidePassword') : t('profile.showPassword')
                }
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
              {t('profile.newPassword')}
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
                placeholder={t('profile.placeholder.newPassword')}
              />
              <button
                type="button"
                className={styles['toggle-password']}
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? t('profile.hidePassword') : t('profile.showPassword')}
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
                    {t(`profile.passwordStrength.strengthLabels.${passwordStrength}`)}
                  </span>
                </div>

                <div id="password-requirements" className={styles.requirements}>
                  <p className={styles['requirements-title']}>
                    {t('profile.passwordStrength.requirementsTitle')}
                  </p>
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
                      {t('profile.passwordStrength.minLength')}
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
                      {t('profile.passwordStrength.uppercase')}
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
                      {t('profile.passwordStrength.lowercase')}
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
                      {t('profile.passwordStrength.number')}
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
                      {t('profile.passwordStrength.special')}
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="confirmPassword" className={styles['form-label']}>
              {t('profile.confirmNewPassword')}
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
                placeholder={t('profile.placeholder.confirmPassword')}
              />
              <button
                type="button"
                className={styles['toggle-password']}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? t('profile.hidePassword') : t('profile.showPassword')
                }
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
              <span className={styles.success}>{t('profile.passwordsMatch')}</span>
            )}
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.button} ${styles['button-secondary']}`}
              disabled={isChangingPassword}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!isValid || isChangingPassword}
              className={`${styles.button} ${styles['button-primary']} ${isChangingPassword ? styles['button-loading'] : ''}`}
            >
              {!isChangingPassword && (
                <>
                  <SaveIcon size={16} />
                  {t('profile.changePasswordTitle')}
                </>
              )}
              {isChangingPassword && t('profile.changing')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
