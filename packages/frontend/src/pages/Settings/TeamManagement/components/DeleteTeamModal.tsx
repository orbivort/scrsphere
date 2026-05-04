import React, { useState, useRef, useCallback } from 'react';

import styles from './DeleteTeamModal.module.css';

import type { Team } from '@/types/teamManagement.types';
import { useModalFocus } from '@/hooks/useModalFocus';
import {
  AlertTriangleIcon,
  CloseIcon,
  XCircleIcon,
  UsersIcon,
  CheckIcon,
  AlertCircleIcon,
  TrashIcon,
} from '@/components/common/Icons';

// Paste prevention handler for delete confirmation input
// Enforces manual typing by blocking all paste operations
const usePastePrevention = () => {
  const [showPasteWarning, setShowPasteWarning] = useState(false);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPasteWarning(true);
    // Hide warning after 2 seconds
    setTimeout(() => setShowPasteWarning(false), 2000);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block Ctrl+V and Cmd+V keyboard shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      e.stopPropagation();
      setShowPasteWarning(true);
      setTimeout(() => setShowPasteWarning(false), 2000);
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    // Prevent right-click context menu to block paste option
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLInputElement>) => {
    // Prevent drag and drop operations
    e.preventDefault();
    e.stopPropagation();
    setShowPasteWarning(true);
    setTimeout(() => setShowPasteWarning(false), 2000);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLInputElement>) => {
    // Prevent drag over to indicate drop is not allowed
    e.preventDefault();
  }, []);

  return {
    showPasteWarning,
    handlers: {
      onPaste: handlePaste,
      onKeyDown: handleKeyDown,
      onContextMenu: handleContextMenu,
      onDrop: handleDrop,
      onDragOver: handleDragOver,
    },
  };
};

interface DeleteTeamModalProps {
  isOpen: boolean;
  team: Team | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isDeleting: boolean;
  hasProductGoals?: boolean;
  deleteError?: string;
}

export const DeleteTeamModal: React.FC<DeleteTeamModalProps> = ({
  isOpen,
  team,
  onClose,
  onConfirm,
  isDeleting,
  hasProductGoals = false,
  deleteError,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const confirmationInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const { modalRef } = useModalFocus({
    isOpen,
    onClose,
    initialFocusRef: confirmationInputRef,
  });

  // Initialize paste prevention for delete confirmation
  const { showPasteWarning, handlers: pastePreventionHandlers } = usePastePrevention();

  const handleConfirm = useCallback(() => {
    if (confirmationText === team?.name) {
      onConfirm(team.id);
    }
  }, [team, confirmationText, onConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // First check for paste prevention (Ctrl+V / Cmd+V)
      pastePreventionHandlers.onKeyDown(e);

      if (e.key === 'Enter' && confirmationText === team?.name && !hasProductGoals) {
        e.preventDefault();
        handleConfirm();
      }
    },
    [confirmationText, team?.name, hasProductGoals, handleConfirm, pastePreventionHandlers]
  );

  // Reset confirmation text and scroll to top when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      // Ensure the warning header is visible by scrolling body to top
      // Use a small delay to ensure the modal is fully rendered
      const scrollTimeout = setTimeout(() => {
        if (bodyRef.current) {
          bodyRef.current.scrollTop = 0;
        }
      }, 50);
      return () => clearTimeout(scrollTimeout);
    }
    return undefined;
  }, [isOpen]);

  if (!isOpen || !team) return null;

  const canDelete = confirmationText === team.name && !hasProductGoals;
  const confirmationProgress = confirmationText.length / team.name.length;
  const progressWidth = Math.min(confirmationProgress * 100, 100);

  return (
    <div className={styles.overlay} role="presentation">
      <div
        ref={modalRef}
        className={`${styles.modal} ${styles['modal-danger']}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-team-title"
        aria-describedby="delete-team-description"
      >
        {/* Decorative gradient orb - danger theme */}
        <div className={styles['gradient-orb']} aria-hidden="true" />

        {/* Header */}
        <header className={styles.header}>
          <div className={styles['header-content']}>
            <div className={styles['icon-wrapper']} aria-hidden="true">
              <AlertTriangleIcon size={24} />
            </div>
            <h2 id="delete-team-title" className={styles.title}>
              Delete Team
            </h2>
            <p id="delete-team-description" className={styles.subtitle}>
              {hasProductGoals
                ? 'This team cannot be deleted due to active product goals'
                : 'This action is permanent and cannot be undone'}
            </p>
          </div>
          <button
            className={styles['close-button']}
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <CloseIcon size={18} />
          </button>
        </header>

        {/* Body */}
        <div
          ref={bodyRef}
          className={styles.body}
          role="region"
          aria-label="Delete confirmation content"
        >
          {/* Delete Error Message */}
          {deleteError && !hasProductGoals && (
            <div className={styles['delete-error-message']} role="alert" aria-live="assertive">
              <div className={styles['delete-error-content']}>
                <span className={styles['delete-error-icon']} aria-hidden="true">
                  <XCircleIcon size={20} />
                </span>
                <p className={styles['delete-error-text']}>{deleteError}</p>
              </div>
            </div>
          )}

          {/* Warning Card */}
          <div className={styles['warning-card']}>
            <div className={styles['warning-header']}>
              <span className={styles['warning-icon-large']} aria-hidden="true">
                <AlertTriangleIcon size={32} />
              </span>
              <div className={styles['warning-title-group']}>
                <h3 className={styles['warning-title']}>Critical Action Warning</h3>
                <p className={styles['warning-subtitle']}>
                  Team: <strong>&ldquo;{team.name}&rdquo;</strong>
                </p>
              </div>
            </div>

            <div className={styles['warning-content']}>
              {hasProductGoals ? (
                <div className={styles['blocked-section']}>
                  <div className={styles['blocked-badge']}>
                    <XCircleIcon size={16} aria-hidden="true" />
                    Deletion Blocked
                  </div>
                  <p className={styles['warning-text']}>
                    This team has one or more <strong>product goals</strong> associated with it. To
                    delete this team, you must first remove all product goals linked to it.
                  </p>
                  <div className={styles['action-steps']}>
                    <p className={styles['steps-title']}>Required actions:</p>
                    <ol className={styles['steps-list']}>
                      <li>Navigate to the Product Goals section</li>
                      <li>Delete or reassign all goals for &ldquo;{team.name}&rdquo;</li>
                      <li>Return here to complete team deletion</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <>
                  <p className={styles['warning-text']}>
                    You are about to permanently delete this team. This action{' '}
                    <strong>cannot be undone</strong>.
                  </p>

                  {team.memberCount && team.memberCount > 0 && (
                    <div className={styles['impact-alert']}>
                      <span className={styles['impact-icon']} aria-hidden="true">
                        <UsersIcon size={18} />
                      </span>
                      <span className={styles['impact-text']}>
                        <strong>
                          {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                        </strong>{' '}
                        will be removed from this team
                      </span>
                    </div>
                  )}

                  <div className={styles['consequences-list']}>
                    <p className={styles['consequences-title']}>Consequences of deletion:</p>
                    <ul className={styles['consequences-items']}>
                      <li>All team data will be permanently removed</li>
                      <li>Team members will lose access to team resources</li>
                      <li>Associated settings and configurations will be deleted</li>
                      <li>This action is irreversible</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Confirmation Input - Only show if not blocked */}
          {!hasProductGoals && (
            <div className={styles['confirmation-section']}>
              <div className={styles['confirmation-header']}>
                <label htmlFor="delete-confirmation" className={styles['confirmation-label']}>
                  Type{' '}
                  <span className={styles['team-name-highlight']}>&ldquo;{team.name}&rdquo;</span>{' '}
                  to confirm
                </label>
                <span
                  className={`${styles['match-indicator']} ${canDelete ? styles['match-success'] : ''}`}
                  aria-live="polite"
                >
                  {canDelete ? (
                    <>
                      <CheckIcon size={14} strokeWidth={3} aria-hidden="true" />
                      Match confirmed
                    </>
                  ) : (
                    <>
                      <AlertCircleIcon size={14} aria-hidden="true" />
                      Awaiting confirmation
                    </>
                  )}
                </span>
              </div>

              {/* Progress Bar */}
              <div className={styles['progress-bar']} aria-hidden="true">
                <div
                  className={`${styles['progress-fill']} ${canDelete ? styles['progress-complete'] : ''}`}
                  style={{ width: `${progressWidth}%` }}
                />
              </div>

              <div className={styles['input-wrapper']}>
                <input
                  ref={confirmationInputRef}
                  id="delete-confirmation"
                  type="text"
                  className={`${styles['form-input']} ${showPasteWarning ? styles['form-input-warning'] : ''} ${canDelete ? styles['form-input-success'] : ''}`}
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={pastePreventionHandlers.onPaste}
                  onContextMenu={pastePreventionHandlers.onContextMenu}
                  onDrop={pastePreventionHandlers.onDrop}
                  onDragOver={pastePreventionHandlers.onDragOver}
                  placeholder={`Type "${team.name}" to confirm deletion`}
                  disabled={isDeleting}
                  autoComplete="off"
                  aria-describedby="delete-confirmation-hint paste-warning-text"
                  aria-invalid={!canDelete && confirmationText.length > 0}
                  aria-required="true"
                />
                {canDelete && (
                  <span className={styles['input-success-icon']} aria-hidden="true">
                    <CheckIcon size={20} strokeWidth={3} />
                  </span>
                )}
              </div>

              {/* Paste Warning */}
              {showPasteWarning && (
                <div
                  id="paste-warning-text"
                  className={styles['paste-warning']}
                  role="alert"
                  aria-live="polite"
                >
                  <span className={styles['paste-warning-icon']} aria-hidden="true">
                    <AlertTriangleIcon size={16} />
                  </span>
                  <span className={styles['paste-warning-text']}>
                    Manual typing required for security. Copy-paste is disabled.
                  </span>
                </div>
              )}

              <span id="delete-confirmation-hint" className={styles['sr-only']}>
                Type the team name exactly as shown to enable the delete button, then press Enter or
                click Delete Team
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <button
            type="button"
            className={`${styles.button} ${styles['button-secondary']}`}
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.button} ${hasProductGoals ? styles['button-disabled'] : styles['button-danger']}`}
            onClick={handleConfirm}
            disabled={isDeleting || !canDelete}
            aria-busy={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className={styles['button-spinner']} aria-hidden="true" />
                Deleting...
              </>
            ) : hasProductGoals ? (
              <>
                <XCircleIcon size={16} aria-hidden="true" />
                Cannot Delete
              </>
            ) : (
              <>
                <TrashIcon size={16} aria-hidden="true" />
                Delete Team
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
