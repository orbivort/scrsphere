import React from 'react';

import { LoadingSpinner } from './LoadingSpinner';
import styles from './PageLoader.module.css';

interface PageLoaderProps {
  message?: string;
  size?: number;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading...', size = 48 }) => {
  return (
    <div className={styles['page-loader']} role="status" aria-live="polite">
      <LoadingSpinner size={size} label={message} />
      <p className={styles.message}>{message}</p>
    </div>
  );
};
