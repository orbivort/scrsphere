import React, { useState, useEffect, useCallback, useRef } from 'react';

import { useModalFocus } from '../../hooks/useModalFocus';
import { logger } from '../../utils/logger';

import styles from './SessionWarningModal.module.css';

import { AlertTriangleIcon, ClockIcon, LogOutIcon, RefreshIcon } from '@/components/common/Icons';

interface SessionWarningModalProps {
  isOpen: boolean;
  timeRemaining: number;
  onExtendSession: () => void | Promise<void>;
  onLogout: () => void;
}

export const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
  isOpen,
  timeRemaining,
  onExtendSession,
  onLogout,
}) => {
  const [countdown, setCountdown] = useState(timeRemaining);
  const [isExtending, setIsExtending] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const extendButtonRef = useRef<HTMLButtonElement>(null);

  const { modalRef } = useModalFocus({
    isOpen,
    onClose: () => {},
    initialFocusRef: extendButtonRef,
  });

  useEffect(() => {
    //console.log('[SessionWarningModal] isOpen:', isOpen, 'timeRemaining:', timeRemaining / 1000 + ' seconds');
    if (isOpen) {
      // Small delay to trigger animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, timeRemaining]);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(timeRemaining);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        const newValue = Math.max(0, prev - 1000);
        if (newValue === 0) {
          onLogout();
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onLogout, timeRemaining]);

  useEffect(() => {
    if (isOpen) {
      setCountdown(timeRemaining);
    }
  }, [isOpen, timeRemaining]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = useCallback(async () => {
    logger.debug('[SessionWarningModal] handleExtendSession called');
    setIsExtending(true);
    try {
      logger.debug('[SessionWarningModal] Calling onExtendSession...');
      await onExtendSession();
      logger.debug('[SessionWarningModal] onExtendSession completed');
    } catch (error) {
      logger.error('[SessionWarningModal] Error extending session', undefined, { error });
    } finally {
      setIsExtending(false);
      logger.debug('[SessionWarningModal] setIsExtending(false)');
    }
  }, [onExtendSession]);

  if (!isOpen) return null;

  const isUrgent = countdown < 30000; // Less than 30 seconds

  return (
    <div
      ref={modalRef}
      className={`${styles.overlay} ${isVisible ? styles['overlay-visible'] : ''}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
      aria-describedby="session-warning-message"
    >
      {/* Animated background pulse */}
      <div className={styles['background-pulse']} />

      {/* Backdrop blur */}
      <div className={styles.backdrop} />

      {/* Modal container */}
      <div
        className={`${styles.modal} ${isVisible ? styles['modal-visible'] : ''} ${isUrgent ? styles.urgent : ''}`}
      >
        {/* Glowing border effect */}
        <div className={styles['glow-border']} />

        {/* Modal content */}
        <div className={styles['modal-content']}>
          {/* Header with animated icon */}
          <div className={styles.header}>
            <div className={`${styles['icon-container']} ${isUrgent ? styles['icon-urgent'] : ''}`}>
              <AlertTriangleIcon className={styles.icon} />
              <div className={styles['icon-ring']} />
            </div>
            <h3 id="session-warning-title" className={styles.title}>
              Session Timeout Warning
            </h3>
          </div>

          {/* Message */}
          <p id="session-warning-message" className={styles.message}>
            Your session will expire soon due to inactivity. You will be automatically logged out
            in:
          </p>

          {/* Countdown timer */}
          <div className={`${styles['timer-container']} ${isUrgent ? styles['timer-urgent'] : ''}`}>
            <ClockIcon className={styles['timer-icon']} />
            <span className={styles['timer-value']}>{formatTime(countdown)}</span>
            {isUrgent && <div className={styles['timer-pulse']} />}
          </div>

          {/* Action buttons */}
          <div className={styles['button-container']}>
            <button
              ref={extendButtonRef}
              onClick={handleExtendSession}
              disabled={isExtending}
              className={styles['primary-button']}
            >
              <RefreshIcon
                className={`${styles['button-icon']} ${isExtending ? styles.spinning : ''}`}
              />
              {isExtending ? 'Extending...' : 'Stay Logged In'}
            </button>

            <button onClick={onLogout} className={styles['secondary-button']}>
              <LogOutIcon className={styles['button-icon']} />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningModal;
