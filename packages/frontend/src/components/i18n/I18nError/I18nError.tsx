import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './I18nError.module.css';

interface I18nErrorProps {
  onRetry: () => void;
  timeoutMs: number;
  /** Dev-only diagnostic details — only rendered in development */
  devDetails?: Record<string, unknown>;
}

const I18nError: FC<I18nErrorProps> = ({ onRetry, timeoutMs, devDetails }) => {
  const { t, i18n } = useTranslation('common');

  return (
    <div className={styles.container} role="alert" aria-live="assertive">
      <span className={styles.icon} aria-hidden="true">
        ⚠️
      </span>
      <h1 className={styles.title}>
        {t('i18nInitError.title', { defaultValue: 'Initialization Timeout' })}
      </h1>
      <p className={styles.message}>
        {t('i18nInitError.message', {
          defaultValue: 'The application could not load translations within {{timeout}}s.',
          timeout: Math.floor(timeoutMs / 1000),
        })}
      </p>
      <button type="button" className={styles['retry-button']} onClick={onRetry}>
        {t('i18nInitError.retry', { defaultValue: 'Retry' })}
      </button>
      {import.meta.env.DEV && devDetails && (
        <details className={styles['dev-details']}>
          <summary>{t('i18nInitError.debugInfo', { defaultValue: 'Debug Info' })}</summary>
          <pre>
            {JSON.stringify(
              { ...devDetails, language: i18n.language, isInitialized: i18n.isInitialized },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
};

export default I18nError;
