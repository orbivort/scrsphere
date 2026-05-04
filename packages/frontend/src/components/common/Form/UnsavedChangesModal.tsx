import React, { useEffect, useRef } from 'react';

import { AlertTriangleIcon, CloseIcon, FileTextIcon, ArrowLeftIcon, TrashIcon } from '../Icons';

import styles from './UnsavedChangesModal.module.css';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Unsaved Changes',
  message = 'You have unsaved changes. Are you sure you want to discard them?',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Handle focus trap and initial focus
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the confirm button when modal opens
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 0);

      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
      // Restore focus when modal closes
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
      aria-describedby="unsaved-changes-message"
    >
      {/* Decorative gradient orb */}
      <div className={styles['gradient-orb']} />

      <div ref={modalRef} className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles['header-content']}>
            <div className={styles['icon-wrapper']}>
              <AlertTriangleIcon size={24} />
            </div>
            <h2 id="unsaved-changes-title" className={styles.title}>
              {title}
            </h2>
            <p className={styles.subtitle}>Please review before continuing</p>
          </div>
          <button
            type="button"
            className={styles['close-button']}
            onClick={onCancel}
            aria-label="Close modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Warning Card */}
          <div className={styles['warning-card']}>
            <div className={styles['warning-header']}>
              <span className={styles['warning-icon-large']}>
                <AlertTriangleIcon size={24} />
              </span>
              <div className={styles['warning-title-group']}>
                <h3 className={styles['warning-title']}>Attention Required</h3>
                <p className={styles['warning-subtitle']}>Unsaved modifications detected</p>
              </div>
            </div>

            <div className={styles['warning-content']}>
              <p id="unsaved-changes-message" className={styles['warning-text']}>
                {message}
              </p>

              <div className={styles['info-box']}>
                <span className={styles['info-icon']}>
                  <FileTextIcon size={20} />
                </span>
                <span className={styles['info-text']}>
                  Your changes will be permanently lost if you discard them. This action cannot be
                  undone.
                </span>
              </div>

              <div className={styles['options-list']}>
                <p className={styles['options-title']}>What would you like to do?</p>
                <ul className={styles['options-items']}>
                  <li>
                    <strong>Go Back</strong> - Continue editing and save your changes
                  </li>
                  <li>
                    <strong>Discard</strong> - Close without saving and lose all modifications
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.button} ${styles['button-secondary']}`}
            onClick={onCancel}
          >
            <ArrowLeftIcon size={16} />
            Go Back
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className={`${styles.button} ${styles['button-danger']}`}
            onClick={onConfirm}
          >
            <TrashIcon size={16} />
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
};
