import React, { useEffect, useRef } from 'react';

import { Button } from '../common/Button/Button';
import { AlertTriangleIcon, TrashIcon } from '../common/Icons';

import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  name?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
  /**
   * Optional custom warning message to display before the main message.
   * This can be used to show additional context or warnings about the action.
   */
  warningMessage?: string;
  /**
   * Optional icon override. If not provided, defaults based on variant.
   */
  showTrashIcon?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  name,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'danger',
  warningMessage,
  showTrashIcon = true,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      confirmButtonRef.current?.focus();
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const getVariantIcon = () => {
    if (variant === 'danger') {
      return <AlertTriangleIcon className={styles['header-icon']} />;
    }
    return <AlertTriangleIcon className={styles['header-icon']} />;
  };

  const getButtonIcon = () => {
    if (variant === 'danger' && showTrashIcon) {
      return <TrashIcon className={styles['button-icon']} />;
    }
    return null;
  };

  return (
    <div
      className={styles['dialog-overlay']}
      ref={dialogRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div
        className={`${styles['dialog-content']} ${styles[variant]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles['dialog-header']}>
          {getVariantIcon()}
          <h3 id="confirm-dialog-title">{title}</h3>
        </div>
        <div id="confirm-dialog-message" className={styles['dialog-message']}>
          {warningMessage && <p className={styles['warning-text']}>{warningMessage}</p>}
          <p>
            {name ? (
              <>
                Are you sure you want to remove <strong>{name}</strong>?
              </>
            ) : (
              message
            )}
          </p>
        </div>
        <div className={styles['dialog-actions']}>
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmButtonRef}
            variant={variant === 'info' ? 'primary' : variant}
            onClick={onConfirm}
            loading={isLoading}
            disabled={isLoading}
          >
            {getButtonIcon()}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
