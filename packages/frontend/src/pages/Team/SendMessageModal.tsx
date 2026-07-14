import React, { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { notificationApi } from '../../services/notificationApi';
import { logger } from '../../utils/logger';
import { useModalFocus } from '../../hooks';
import { queryKeys } from '../../hooks/queryKeys';
import { UnsavedChangesModal } from '../../components/common/Form/UnsavedChangesModal';
import {
  CloseIcon,
  SendIcon,
  MailIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from '../../components/common/Icons';
import { MAX_MESSAGE_LENGTH } from '../../utils/constants';

import styles from './SendMessageModal.module.css';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
}

export const SendMessageModal: React.FC<SendMessageModalProps> = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientEmail,
}) => {
  const { t } = useTranslation('team');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const queryClient = useQueryClient();

  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const hasUnsavedChanges = message.trim().length > 0 && !success;

  const { modalRef } = useModalFocus({
    isOpen,
    onClose,
    initialFocusRef: messageInputRef,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { recipientId: string; message: string }) => {
      return notificationApi.sendDirectMessage(data);
    },
    onSuccess: () => {
      setSuccess(true);
      setMessage('');
      setError(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.message.all });
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    },
    onError: (err: Error) => {
      logger.error('Failed to send message', undefined, { error: err });
      const errorMessage = err.message.toLowerCase();

      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        setError(t('sendMessageModal.errors.recipientNotFound'));
      } else if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        setError(t('sendMessageModal.errors.noPermission'));
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        setError(t('sendMessageModal.errors.networkError'));
      } else {
        setError(t('sendMessageModal.errors.genericError'));
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!message.trim()) {
      setError(t('sendMessageModal.validation.emptyMessage'));
      return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      setError(t('sendMessageModal.validation.maxLength', { limit: MAX_MESSAGE_LENGTH }));
      return;
    }

    await sendMessageMutation.mutateAsync({
      recipientId,
      message: message.trim(),
    });
  };

  const resetAndClose = useCallback(() => {
    setMessage('');
    setError(null);
    setSuccess(false);
    setShowUnsavedWarning(false);
    onClose();
  }, [onClose]);

  const handleClose = useCallback(() => {
    if (sendMessageMutation.isPending || success) {
      return;
    }

    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      resetAndClose();
    }
  }, [sendMessageMutation.isPending, success, hasUnsavedChanges, resetAndClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  const handleUnsavedConfirm = useCallback(() => {
    setShowUnsavedWarning(false);
    resetAndClose();
  }, [resetAndClose]);

  const handleUnsavedCancel = useCallback(() => {
    setShowUnsavedWarning(false);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles['modal-overlay']} role="presentation" onClick={handleOverlayClick}>
        <div
          className={styles['modal']}
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="send-message-title"
        >
          <header className={styles['modal-header']}>
            <div className={styles['header-content']}>
              <div className={styles['icon-wrapper']} aria-hidden="true">
                <MailIcon />
              </div>
              <div className={styles['header-text']}>
                <h2 id="send-message-title" className={styles['modal-title']}>
                  {t('sendMessageModal.title')}
                </h2>
                <p className={styles['modal-subtitle']}>
                  {t('sendMessageModal.subtitle', { name: recipientName, email: recipientEmail })}
                </p>
              </div>
            </div>
            <button
              type="button"
              className={styles['close-button']}
              onClick={handleClose}
              disabled={sendMessageMutation.isPending}
              aria-label={t('aria.closeModal')}
            >
              <CloseIcon size={18} />
            </button>
          </header>

          <div className={styles['modal-body']}>
            {success && (
              <div className={styles['success-message']} role="status" aria-live="polite">
                <span className={styles['success-icon']} aria-hidden="true">
                  <CheckCircleIcon />
                </span>
                <span>{t('sendMessageModal.success')}</span>
              </div>
            )}

            {error && (
              <div className={styles['error-message']} role="alert" aria-live="assertive">
                <span className={styles['error-icon']} aria-hidden="true">
                  <AlertCircleIcon />
                </span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} id="send-message-form">
              <div className={styles['form-group']}>
                <label htmlFor="message-content" className={styles['form-label']}>
                  {t('sendMessageModal.messageLabel')}
                  <span className={styles['required-indicator']} aria-label="required">
                    *
                  </span>
                </label>
                <textarea
                  ref={messageInputRef}
                  id="message-content"
                  placeholder={t('sendMessageModal.messagePlaceholder')}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setError(null);
                  }}
                  required
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={6}
                  disabled={sendMessageMutation.isPending || success}
                  className={`${styles['form-textarea']} ${error && !message.trim() ? styles['input-error'] : ''}`}
                  aria-describedby="message-counter"
                />
                <div id="message-counter" className={styles['character-counter']}>
                  {message.length}/{MAX_MESSAGE_LENGTH}
                </div>
              </div>
            </form>
          </div>

          <footer className={styles['modal-footer']}>
            <button
              ref={cancelButtonRef}
              type="button"
              className={styles['button-secondary']}
              onClick={handleClose}
              disabled={sendMessageMutation.isPending || success}
            >
              {t('sendMessageModal.cancel')}
            </button>
            <button
              type="submit"
              form="send-message-form"
              className={styles['button-primary']}
              disabled={sendMessageMutation.isPending || success}
            >
              {sendMessageMutation.isPending ? (
                <>
                  <span className={styles['loading-spinner']} aria-hidden="true" />
                  {t('sendMessageModal.sending')}
                </>
              ) : (
                <>
                  <SendIcon />
                  {t('sendMessageModal.send')}
                </>
              )}
            </button>
          </footer>
        </div>
      </div>

      <UnsavedChangesModal
        isOpen={showUnsavedWarning}
        onConfirm={handleUnsavedConfirm}
        onCancel={handleUnsavedCancel}
        title={t('sendMessageModal.unsavedTitle')}
        message={t('sendMessageModal.unsavedMessage')}
      />
    </>
  );
};
