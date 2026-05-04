import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import styles from './LoginPage.module.css';

import { MailIcon, LoaderIcon, ScrSphereIcon, ArrowLeftIcon } from '@/components/common/Icons';
import { ErrorMessage } from '@/components/ErrorMessage';
import { apiService } from '@/services';
import { logger } from '@/utils/logger';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiService.forgotPassword(email);

        if (response.success) {
          setSuccess(true);
          logger.info('Password reset email sent', undefined, { email });
        } else {
          setError(response.error?.message || 'Failed to send reset email. Please try again.');
        }
      } catch (err) {
        logger.error('Forgot password request failed', undefined, { error: err });
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [email]
  );

  const clearError = () => {
    setError(null);
  };

  return (
    <div className={styles['auth-page']}>
      <div className={styles['auth-card']}>
        <div className={styles['auth-header']}>
          <div className={styles['auth-logo']} aria-hidden="true">
            <ScrSphereIcon size={100} className={styles['auth-logo-icon']} />
          </div>
          <h1 className={styles['auth-title']}>Reset your password</h1>
          <p className={styles['auth-subtitle']}>
            {success
              ? 'Check your email for a reset link'
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {error && (
          <div className={styles['error-message']}>
            <ErrorMessage
              message={error}
              title="Reset Request Failed"
              type="error"
              onDismiss={clearError}
            />
          </div>
        )}

        {success ? (
          <div className={styles['success-container']}>
            <div className={styles['success-icon']}>
              <MailIcon size={48} />
            </div>
            <p className={styles['success-text']}>
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </p>
            <p className={styles['success-hint']}>
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className={styles['link-button']}
              >
                try again
              </button>
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={`${styles['submit-button']} ${styles['secondary-button']}`}
            >
              <ArrowLeftIcon size={16} />
              Back to login
            </button>
          </div>
        ) : (
          <form className={styles['auth-form']} onSubmit={handleSubmit}>
            <div className={styles['form-group']}>
              <label className={styles['form-label']} htmlFor="email">
                Email
                <span className={styles['form-label-required']} aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="email"
                type="email"
                className={styles['input-field']}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className={styles['submit-button']}
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <span className={styles['button-loading']}>
                  <LoaderIcon size={16} className={styles['spinner-icon']} />
                  Sending...
                </span>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>
        )}

        {!success && (
          <div className={styles['auth-footer']}>
            <Link to="/login" className={styles['mode-toggle']}>
              <ArrowLeftIcon size={14} />
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
