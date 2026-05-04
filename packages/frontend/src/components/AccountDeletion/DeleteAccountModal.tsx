import React, { useState, useEffect, useCallback, useRef } from 'react';

import type { TeamMembership } from '../../types/auth.types';
import { useModalFocus } from '../../hooks/useModalFocus';

import { GracePeriodProgress } from './GracePeriodProgress';
import { DeletionRightsNotice } from './DeletionRightsNotice';
import { ForceDeleteWarning } from './ForceDeleteWarning';
import styles from './DeleteAccountModal.module.css';

import {
  AlertTriangleIcon,
  CalendarIcon,
  CloseIcon,
  DatabaseIcon,
  ShieldIcon,
  TrashIcon,
  UsersIcon,
  XCircleIcon,
  XIcon,
} from '@/components/common/Icons';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName: string;
  teams: TeamMembership[];
  isBlocked: boolean;
  pendingDeletion: {
    requestedAt: string;
    scheduledDeletionAt: string;
    gracePeriodDays: number;
  } | null;
  onDelete: (confirmation: string) => Promise<void>;
  onScheduleDeletion: (confirmation: string) => Promise<void>;
  onCancelDeletion: () => Promise<void>;
  onForceDelete: (confirmation: string) => Promise<void>;
  isDeleting: boolean;
  error: string | null;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName,
  teams,
  isBlocked,
  pendingDeletion,
  onDelete,
  onScheduleDeletion,
  onCancelDeletion,
  onForceDelete,
  isDeleting,
  error,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [scheduleConfirmationText, setScheduleConfirmationText] = useState('');
  const [isScheduleConfirmed, setIsScheduleConfirmed] = useState(false);

  const confirmationInputRef = useRef<HTMLInputElement>(null);
  const scheduleConfirmationInputRef = useRef<HTMLInputElement>(null);
  const forceConfirmationInputRef = useRef<HTMLInputElement>(null);

  const CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';
  const SCHEDULE_DELETION_PHRASE = 'SCHEDULE DELETION';

  const isGracePeriodElapsed = pendingDeletion
    ? new Date() >= new Date(pendingDeletion.scheduledDeletionAt)
    : false;

  // Determine which input ref to use for initial focus based on the current view
  const getInitialFocusRef = () => {
    if (isBlocked && pendingDeletion && isGracePeriodElapsed) {
      return forceConfirmationInputRef;
    }
    if (isBlocked && !pendingDeletion) {
      return scheduleConfirmationInputRef;
    }
    return confirmationInputRef;
  };

  const { modalRef } = useModalFocus({
    isOpen,
    // Escape key is intentionally disabled for this destructive action modal
    // to prevent accidental closure. Users must explicitly click Cancel or the X button.
    onClose: () => {},
    initialFocusRef: getInitialFocusRef(),
  });

  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      setIsConfirmed(false);
      setScheduleConfirmationText('');
      setIsScheduleConfirmed(false);
    }
  }, [isOpen]);

  // Reset form state when pendingDeletion changes (e.g., after scheduling deletion)
  useEffect(() => {
    setScheduleConfirmationText('');
    setIsScheduleConfirmed(false);
    setConfirmationText('');
    setIsConfirmed(false);
  }, [pendingDeletion]);

  const handleConfirmationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setConfirmationText(value);
    setIsConfirmed(value === CONFIRMATION_PHRASE);
  };

  const handleScheduleConfirmationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setScheduleConfirmationText(value);
    setIsScheduleConfirmed(value === SCHEDULE_DELETION_PHRASE);
  };

  const handleDelete = useCallback(async () => {
    if (!isConfirmed || isBlocked) return;
    await onDelete(confirmationText);
  }, [isConfirmed, isBlocked, onDelete, confirmationText]);

  const handleScheduleDeletion = useCallback(async () => {
    if (!isScheduleConfirmed) return;
    await onScheduleDeletion(scheduleConfirmationText);
  }, [isScheduleConfirmed, onScheduleDeletion, scheduleConfirmationText]);

  const handleCancelDeletion = useCallback(async () => {
    if (isDeleting) return;
    await onCancelDeletion();
  }, [isDeleting, onCancelDeletion]);

  const handleForceDelete = useCallback(async () => {
    if (!isConfirmed || isDeleting) return;
    await onForceDelete(confirmationText);
  }, [isConfirmed, isDeleting, onForceDelete, confirmationText]);

  const handleClose = useCallback(() => {
    if (!isDeleting) {
      onClose();
    }
  }, [isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    // Note: No onClick on overlay - delete modal doesn't close on outside click
    <div className={styles['modal-overlay']}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
      >
        <div className={styles['modal-header']}>
          <h2 id="delete-account-title" className={styles['modal-title']}>
            <span className={styles['modal-title-icon']}>
              <AlertTriangleIcon size={24} />
            </span>
            Delete Account
          </h2>
          <button
            onClick={handleClose}
            className={styles['modal-close']}
            aria-label="Close"
            type="button"
            disabled={isDeleting}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className={styles['modal-body']}>
          <div className={styles['warning-banner']}>
            <span className={styles['warning-banner-icon']}>
              <AlertTriangleIcon size={24} />
            </span>
            <p id="delete-account-description" className={styles['warning-banner-text']}>
              This action is permanent and cannot be undone. All your data will be permanently
              deleted.
            </p>
          </div>

          <div className={styles['user-info-section']}>
            <p className={styles['user-info-section-label']}>Account to be deleted</p>
            <p className={styles['user-info-section-name']}>{userName}</p>
            <p className={styles['user-info-section-email']}>{userEmail}</p>
          </div>

          <div className={styles['data-section']}>
            <h3 className={styles['section-title']}>Data that will be deleted</h3>
            <ul className={styles['data-list']}>
              <li className={styles['data-list-item']}>
                <span className={styles['data-list-icon']}>
                  <ShieldIcon size={16} />
                </span>
                Your profile and account information
              </li>
              <li className={styles['data-list-item']}>
                <span className={styles['data-list-icon']}>
                  <UsersIcon size={16} />
                </span>
                Team memberships and roles
                {teams.length > 0 && (
                  <span className={styles['team-count']}>({teams.length} teams)</span>
                )}
              </li>
              <li className={styles['data-list-item']}>
                <span className={styles['data-list-icon']}>
                  <DatabaseIcon size={16} />
                </span>
                All associated data and activity history
              </li>
            </ul>
          </div>

          {!isBlocked && (
            <>
              <div className={styles['confirmation-section']}>
                <label htmlFor="confirmation-input" className={styles['confirmation-label']}>
                  Type <strong>{CONFIRMATION_PHRASE}</strong> to confirm
                </label>
                <input
                  ref={confirmationInputRef}
                  id="confirmation-input"
                  type="text"
                  value={confirmationText}
                  onChange={handleConfirmationChange}
                  className={`${styles['confirmation-input']} ${confirmationText && !isConfirmed ? styles['confirmation-input-error'] : ''}`}
                  placeholder={`Type ${CONFIRMATION_PHRASE}`}
                  disabled={isDeleting}
                  autoComplete="off"
                  aria-describedby="confirmation-help"
                />
                <span id="confirmation-help" className={styles['confirmation-help']}>
                  This helps prevent accidental deletion
                </span>
              </div>

              <div className={styles['checkbox-section']}>
                <label className={styles['checkbox-label']}>
                  <input
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    disabled={isDeleting}
                    className={styles['checkbox-input']}
                    aria-describedby="confirmation-checkbox-help"
                  />
                  <span id="confirmation-checkbox-help" className={styles['checkbox-text']}>
                    I understand that this action is permanent and cannot be undone. I want to
                    delete my account and all associated data.
                  </span>
                </label>
              </div>
            </>
          )}

          {isBlocked && !pendingDeletion && (
            <>
              <DeletionRightsNotice />

              <div className={styles['confirmation-section']}>
                <label
                  htmlFor="schedule-confirmation-input"
                  className={styles['confirmation-label']}
                >
                  Type <strong>{SCHEDULE_DELETION_PHRASE}</strong> to schedule deletion
                </label>
                <input
                  ref={scheduleConfirmationInputRef}
                  id="schedule-confirmation-input"
                  type="text"
                  value={scheduleConfirmationText}
                  onChange={handleScheduleConfirmationChange}
                  className={`${styles['confirmation-input']} ${scheduleConfirmationText && !isScheduleConfirmed ? styles['confirmation-input-error'] : ''}`}
                  placeholder={`Type ${SCHEDULE_DELETION_PHRASE}`}
                  disabled={isDeleting}
                  autoComplete="off"
                  aria-describedby="schedule-confirmation-help"
                />
                <span id="schedule-confirmation-help" className={styles['confirmation-help']}>
                  This starts a 14-day grace period
                </span>
              </div>

              <div className={styles['checkbox-section']}>
                <label className={styles['checkbox-label']}>
                  <input
                    type="checkbox"
                    checked={isScheduleConfirmed}
                    onChange={(e) => setIsScheduleConfirmed(e.target.checked)}
                    disabled={isDeleting}
                    className={styles['checkbox-input']}
                    aria-describedby="schedule-checkbox-help"
                  />
                  <span id="schedule-checkbox-help" className={styles['checkbox-text']}>
                    I understand that a 14-day grace period will begin, during which team members
                    will be notified. I can cancel at any time.
                  </span>
                </label>
              </div>
            </>
          )}

          {isBlocked && pendingDeletion && !isGracePeriodElapsed && (
            <>
              <GracePeriodProgress pendingDeletion={pendingDeletion} />

              <div className={styles['what-happens-next']}>
                <h4 className={styles['what-happens-next-title']}>What happens next</h4>
                <ul className={styles['what-happens-next-list']}>
                  <li>Team members have been notified</li>
                  <li>You can still assign a new Product Owner</li>
                  <li>After the deletion date, you can force-delete your account</li>
                  <li>You can cancel this request at any time</li>
                </ul>
              </div>
            </>
          )}

          {isBlocked && pendingDeletion && isGracePeriodElapsed && (
            <>
              <ForceDeleteWarning blockedTeams={teams.filter((t) => t.isLastPO)} />

              <div className={styles['confirmation-section']}>
                <label htmlFor="force-confirmation-input" className={styles['confirmation-label']}>
                  Type <strong>{CONFIRMATION_PHRASE}</strong> to confirm
                </label>
                <input
                  ref={forceConfirmationInputRef}
                  id="force-confirmation-input"
                  type="text"
                  value={confirmationText}
                  onChange={handleConfirmationChange}
                  className={`${styles['confirmation-input']} ${confirmationText && !isConfirmed ? styles['confirmation-input-error'] : ''}`}
                  placeholder={`Type ${CONFIRMATION_PHRASE}`}
                  disabled={isDeleting}
                  autoComplete="off"
                  aria-describedby="force-confirmation-help"
                />
                <span id="force-confirmation-help" className={styles['confirmation-help']}>
                  This action cannot be undone
                </span>
              </div>

              <div className={styles['checkbox-section']}>
                <label className={styles['checkbox-label']}>
                  <input
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    disabled={isDeleting}
                    className={styles['checkbox-input']}
                    aria-describedby="force-checkbox-help"
                  />
                  <span id="force-checkbox-help" className={styles['checkbox-text']}>
                    I understand that teams will lose their Product Owner and I want to permanently
                    delete my account anyway.
                  </span>
                </label>
              </div>
            </>
          )}

          {error && (
            <div className={styles['error-message']} role="alert">
              <span className={styles['error-message-icon']}>
                <XCircleIcon size={16} />
              </span>
              <span className={styles['error-message-text']}>{error}</span>
            </div>
          )}
        </div>

        <div className={styles['modal-footer']}>
          {isBlocked && pendingDeletion && !isGracePeriodElapsed && (
            <>
              <button
                onClick={handleCancelDeletion}
                disabled={isDeleting}
                className={`${styles.button} ${styles['button-danger-outline']}`}
                type="button"
              >
                <XIcon size={16} />
                Cancel Deletion
              </button>
              <button
                onClick={handleClose}
                className={`${styles.button} ${styles['button-secondary']}`}
                disabled={isDeleting}
                type="button"
              >
                Close
              </button>
            </>
          )}

          {isBlocked && pendingDeletion && isGracePeriodElapsed && (
            <>
              <button
                onClick={handleCancelDeletion}
                disabled={isDeleting}
                className={`${styles.button} ${styles['button-danger-outline']}`}
                type="button"
              >
                <XIcon size={16} />
                Cancel Deletion
              </button>
              <button
                onClick={handleClose}
                className={`${styles.button} ${styles['button-secondary']}`}
                disabled={isDeleting}
                type="button"
              >
                Close
              </button>
              <button
                onClick={handleForceDelete}
                disabled={!isConfirmed || isDeleting}
                className={`${styles.button} ${styles['button-danger']} ${isDeleting ? styles['button-loading'] : ''}`}
                type="button"
              >
                {!isDeleting && (
                  <>
                    <TrashIcon size={16} />
                    Delete Anyway
                  </>
                )}
                {isDeleting && 'Deleting...'}
              </button>
            </>
          )}

          {!isBlocked && !pendingDeletion && (
            <>
              <button
                onClick={handleClose}
                className={`${styles.button} ${styles['button-secondary']}`}
                disabled={isDeleting}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!isConfirmed || isDeleting}
                className={`${styles.button} ${styles['button-danger']} ${isDeleting ? styles['button-loading'] : ''}`}
                type="button"
              >
                {!isDeleting && (
                  <>
                    <TrashIcon size={16} />
                    Delete Account
                  </>
                )}
                {isDeleting && 'Deleting...'}
              </button>
            </>
          )}

          {isBlocked && !pendingDeletion && (
            <>
              <button
                onClick={handleClose}
                className={`${styles.button} ${styles['button-secondary']}`}
                disabled={isDeleting}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleDeletion}
                disabled={!isScheduleConfirmed || isDeleting}
                className={`${styles.button} ${styles['button-warning']} ${isDeleting ? styles['button-loading'] : ''}`}
                type="button"
              >
                {!isDeleting && (
                  <>
                    <CalendarIcon size={16} />
                    Schedule Deletion
                  </>
                )}
                {isDeleting && 'Scheduling...'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
