import React from 'react';

import { CheckCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from '../Icons';

import styles from './ToastContainer.module.css';

import type { Toast as ToastType } from '@/hooks/useToast';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircleIcon size={18} />;
      case 'error':
        return <AlertTriangleIcon size={18} />;
      case 'warning':
        return <AlertTriangleIcon size={18} />;
      case 'info':
      default:
        return <InfoIcon size={18} />;
    }
  };

  return (
    <div
      className={`${styles.toast} ${styles[`toast-${toast.type}`]}`}
      role="alert"
      aria-live="polite"
    >
      <span className={styles['toast-icon']}>{getIcon()}</span>
      <span className={styles['toast-message']}>{toast.message}</span>
      <button
        className={styles['toast-close']}
        onClick={() => onClose(toast.id)}
        aria-label="Close notification"
      >
        <XIcon size={14} />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastType[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className={styles['toast-container']} role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};
