import React, { useMemo } from 'react';

import { CloseIcon, InfoIcon, WarningIcon, XCircleIcon } from '../common/Icons';

import styles from './ErrorMessage.module.css';

export interface ErrorMessageProps {
  message: string;
  title?: string;
  type?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
  className?: string;
  id?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title,
  type = 'error',
  onDismiss,
  className = '',
  id,
}) => {
  const errorId = useMemo(() => {
    if (id) return id;
    return `error-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }, [id]);

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <WarningIcon size={20} />;
      case 'info':
        return <InfoIcon size={20} />;
      case 'error':
      default:
        return <XCircleIcon size={20} />;
    }
  };

  const getAriaRole = () => {
    switch (type) {
      case 'warning':
        return 'alert';
      case 'info':
        return 'status';
      case 'error':
      default:
        return 'alert';
    }
  };

  return (
    <div
      id={errorId}
      className={`${styles['error-message']} ${styles[type]} ${className}`}
      role={getAriaRole()}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={styles['error-message-content']}>
        <span className={styles['error-message-icon']}>{getIcon()}</span>
        <div className={styles['error-message-text']}>
          {title && <strong className={styles['error-message-title']}>{title}</strong>}
          <span className={styles['error-message-description']}>{message}</span>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          className={styles['error-message-dismiss']}
          onClick={onDismiss}
          aria-label="Dismiss error message"
        >
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
