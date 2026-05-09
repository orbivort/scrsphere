import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

import styles from './LoginPage.module.css';

import {
  EyeIcon,
  EyeOffIcon,
  LoaderIcon,
  ScrSphereIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@/components/common/Icons';
import { ErrorMessage } from '@/components/ErrorMessage';
import { apiService } from '@/services';
import { logger } from '@/utils/logger';

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'weak';
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 3) return 'fair';
  if (score <= 4) return 'good';
  return 'strong';
}

const STRENGTH_LABELS: Record<PasswordStrength, string> = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenEmail, setTokenEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setError('Invalid reset link. Please request a new password reset.');
        return;
      }

      try {
        const response = await apiService.validateResetToken(token);

        if (response.success && response.data?.valid) {
          setIsTokenValid(true);
          setTokenEmail(response.data.email ?? null);
        } else {
          setError('This password reset link is invalid or has expired. Please request a new one.');
        }
      } catch (err) {
        logger.error('Token validation failed', undefined, { error: err });
        setError('Failed to validate reset link. Please try again.');
      } finally {
        setIsValidating(false);
      }
    };

    void validateToken();
  }, [token]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      if (!token) {
        setError('Invalid reset token.');
        return;
      }

      setIsLoading(true);

      try {
        const response = await apiService.resetPassword(token, newPassword, confirmPassword);

        if (response.success) {
          setSuccess(true);
          logger.info('Password reset successful');
        } else {
          setError(response.error?.message ?? 'Failed to reset password. Please try again.');
        }
      } catch (err) {
        logger.error('Password reset failed', undefined, { error: err });
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [token, newPassword, confirmPassword]
  );

  const clearError = () => {
    setError(null);
  };

  if (isValidating) {
    return (
      <div className={styles['auth-page']}>
        <div className={styles['auth-card']}>
          <div className={styles['auth-header']}>
            <div className={styles['auth-logo']} aria-hidden="true">
              <ScrSphereIcon size={100} className={styles['auth-logo-icon']} />
            </div>
            <h1 className={styles['auth-title']}>Verifying reset link...</h1>
          </div>
          <div className={styles['loading-container']}>
            <LoaderIcon size={32} className={styles['spinner-icon']} />
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles['auth-page']}>
        <div className={styles['auth-card']}>
          <div className={styles['auth-header']}>
            <div className={styles['auth-logo']} aria-hidden="true">
              <ScrSphereIcon size={100} className={styles['auth-logo-icon']} />
            </div>
            <h1 className={styles['auth-title']}>Password reset successful</h1>
            <p className={styles['auth-subtitle']}>Your password has been changed successfully</p>
          </div>

          <div className={styles['success-container']}>
            <div className={styles['success-icon']}>
              <CheckCircleIcon size={48} />
            </div>
            <p className={styles['success-text']}>You can now log in with your new password</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={styles['submit-button']}
            >
              Continue to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className={styles['auth-page']}>
        <div className={styles['auth-card']}>
          <div className={styles['auth-header']}>
            <div className={styles['auth-logo']} aria-hidden="true">
              <ScrSphereIcon size={100} className={styles['auth-logo-icon']} />
            </div>
            <h1 className={styles['auth-title']}>Invalid reset link</h1>
            <p className={styles['auth-subtitle']}>
              This password reset link is invalid or has expired
            </p>
          </div>

          <div className={styles['success-container']}>
            <div className={`${styles['success-icon']} ${styles['error-icon']}`}>
              <XCircleIcon size={48} />
            </div>
            <p className={styles['success-text']}>Please request a new password reset link</p>
            <Link to="/forgot-password" className={styles['submit-button']}>
              Request new reset link
            </Link>
          </div>

          <div className={styles['auth-footer']}>
            <Link to="/login" className={styles['mode-toggle']}>
              <ArrowLeftIcon size={14} />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['auth-page']}>
      <div className={styles['auth-card']}>
        <div className={styles['auth-header']}>
          <div className={styles['auth-logo']} aria-hidden="true">
            <ScrSphereIcon size={100} className={styles['auth-logo-icon']} />
          </div>
          <h1 className={styles['auth-title']}>Create new password</h1>
          <p className={styles['auth-subtitle']}>
            {tokenEmail ? `Resetting password for ${tokenEmail}` : 'Enter your new password below'}
          </p>
        </div>

        {error && (
          <div className={styles['error-message']}>
            <ErrorMessage
              message={error}
              title="Reset Failed"
              type="error"
              onDismiss={clearError}
            />
          </div>
        )}

        <form className={styles['auth-form']} onSubmit={handleSubmit}>
          <div className={styles['form-group']}>
            <label className={styles['form-label']} htmlFor="newPassword">
              New Password
              <span className={styles['form-label-required']} aria-hidden="true">
                *
              </span>
            </label>
            <div className={styles['input-wrapper']}>
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                className={`${styles['input-field']} ${styles['input-field-has-trailing']}`}
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles['password-toggle']}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>

            {newPassword && (
              <div className={styles['password-strength']} aria-live="polite">
                <div className={styles['strength-bars']}>
                  {[0, 1, 2, 3].map((index) => {
                    const strengthClass =
                      passwordStrength === 'weak'
                        ? index === 0
                          ? styles['strength-bar-weak']
                          : ''
                        : passwordStrength === 'fair'
                          ? index <= 1
                            ? styles['strength-bar-fair']
                            : ''
                          : passwordStrength === 'good'
                            ? index <= 2
                              ? styles['strength-bar-good']
                              : ''
                            : styles['strength-bar-strong'];

                    return (
                      <div key={index} className={`${styles['strength-bar']} ${strengthClass}`} />
                    );
                  })}
                </div>
                <span
                  className={`${styles['strength-label']} ${
                    passwordStrength === 'weak'
                      ? styles['strength-label-weak']
                      : passwordStrength === 'fair'
                        ? styles['strength-label-fair']
                        : passwordStrength === 'good'
                          ? styles['strength-label-good']
                          : styles['strength-label-strong']
                  }`}
                >
                  {STRENGTH_LABELS[passwordStrength]}
                </span>
              </div>
            )}
          </div>

          <div className={styles['form-group']}>
            <label className={styles['form-label']} htmlFor="confirmPassword">
              Confirm Password
              <span className={styles['form-label-required']} aria-hidden="true">
                *
              </span>
            </label>
            <div className={styles['input-wrapper']}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`${styles['input-field']} ${styles['input-field-has-trailing']}`}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles['password-toggle']}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <span className={styles['error-text']}>Passwords do not match</span>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <span className={styles['success-text-inline']}>Passwords match</span>
            )}
          </div>

          <button
            type="submit"
            className={styles['submit-button']}
            disabled={
              isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword
            }
          >
            {isLoading ? (
              <span className={styles['button-loading']}>
                <LoaderIcon size={16} className={styles['spinner-icon']} />
                Resetting...
              </span>
            ) : (
              'Reset password'
            )}
          </button>
        </form>

        <div className={styles['auth-footer']}>
          <Link to="/login" className={styles['mode-toggle']}>
            <ArrowLeftIcon size={14} />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};
