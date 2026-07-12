import React from 'react';
import { useTranslation } from 'react-i18next';

import { LoadingSpinner } from './LoadingSpinner';
import styles from './PageLoader.module.css';

interface PageLoaderProps {
  message?: string;
  size?: number;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message, size = 48 }) => {
  const { t } = useTranslation('common');
  const displayMessage = message ?? t('loading');

  return (
    <div className={styles['page-loader']} role="status" aria-live="polite">
      <LoadingSpinner size={size} label={displayMessage} />
      <p className={styles.message}>{displayMessage}</p>
    </div>
  );
};
