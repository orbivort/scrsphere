import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import styles from './LoginPage.module.css';

import { MailIcon, LoaderIcon, ScrumoothIcon, ArrowLeftIcon } from '@/components/common/Icons';
import { ErrorMessage } from '@/components/ErrorMessage';
import { apiService } from '@/services';
import { logger } from '@/utils/logger';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

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
          setError(response.error?.message ?? t('forgotPassword.failedToSend'));
        }
      } catch (err) {
        logger.error('Forgot password request failed', undefined, { error: err });
        setError(t('forgotPassword.unexpectedError'));
      } finally {
        setIsLoading(false);
      }
    },
    [email, t]
  );

  const clearError = () => {
    setError(null);
  };

  return (
    <div className={styles['auth-page']}>
      <div className={styles['auth-card']}>
        <div className={styles['auth-header']}>
          <div className={styles['auth-logo']} aria-hidden="true">
            <ScrumoothIcon size={100} className={styles['auth-logo-icon']} />
          </div>
          <h1 className={styles['auth-title']}>{t('forgotPassword.resetYourPassword')}</h1>
          <p className={styles['auth-subtitle']}>
            {success ? t('forgotPassword.successSubtitle') : t('forgotPassword.subtitle')}
          </p>
        </div>

        {error && (
          <div className={styles['error-message']}>
            <ErrorMessage
              message={error}
              title={t('forgotPassword.resetRequestFailed')}
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
            <p className={styles['success-text']}>{t('forgotPassword.sentTo', { email })}</p>
            <p className={styles['success-hint']}>
              {t('forgotPassword.didntReceive', { tryAgain: t('forgotPassword.tryAgain') })}
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={`${styles['submit-button']} ${styles['secondary-button']}`}
            >
              <ArrowLeftIcon size={16} />
              {t('forgotPassword.backToLogin')}
            </button>
          </div>
        ) : (
          <form className={styles['auth-form']} onSubmit={handleSubmit}>
            <div className={styles['form-group']}>
              <label className={styles['form-label']} htmlFor="email">
                {t('email')}
                <span className={styles['form-label-required']} aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="email"
                type="email"
                className={styles['input-field']}
                placeholder={t('placeholder.email')}
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
                  {t('forgotPassword.sending')}
                </span>
              ) : (
                t('forgotPassword.sendLink')
              )}
            </button>
          </form>
        )}

        {!success && (
          <div className={styles['auth-footer']}>
            <Link to="/login" className={styles['mode-toggle']}>
              <ArrowLeftIcon size={14} />
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
