import React, { useEffect, useRef, useCallback } from 'react';

import { UnsavedChangesModal } from '../../../components/common/Form/UnsavedChangesModal';
import {
  UsersIcon,
  CloseIcon,
  ClockIcon,
  MinusIcon,
  PlusIcon,
  RefreshCwIcon,
  SaveIcon,
} from '../../../components/common/Icons';

import styles from './TeamCapacityModal.module.css';

export interface TeamMemberAvailability {
  memberId: string;
  userId: string;
  memberName: string;
  availableHours: number;
}

export interface TeamCapacityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (availability: TeamMemberAvailability[]) => void;
  teamAvailability: TeamMemberAvailability[];
}

export const TeamCapacityModal: React.FC<TeamCapacityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  teamAvailability,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [localAvailability, setLocalAvailability] = React.useState<TeamMemberAvailability[]>([]);
  const [originalAvailability, setOriginalAvailability] = React.useState<TeamMemberAvailability[]>(
    []
  );
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = React.useState(false);

  // Initialize local state when modal opens
  useEffect(() => {
    if (isOpen) {
      const cloned = teamAvailability.map((m) => ({ ...m }));
      setLocalAvailability(cloned);
      setOriginalAvailability(cloned);
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, teamAvailability]);

  const handleCancel = useCallback(() => {
    // Check for changes directly to avoid dependency on hasChanges
    const currentHasChanges =
      JSON.stringify(localAvailability) !== JSON.stringify(originalAvailability);
    if (currentHasChanges) {
      setShowUnsavedChangesModal(true);
    } else {
      onClose();
    }
  }, [localAvailability, originalAvailability, onClose]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
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
  }, [isOpen, handleCancel]);

  const handleUpdateHours = useCallback((index: number, hours: number) => {
    setLocalAvailability((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], availableHours: Math.max(0, Math.min(60, hours)) };
      }
      return updated;
    });
  }, []);

  const handleIncrement = useCallback((index: number) => {
    setLocalAvailability((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          availableHours: Math.min(60, updated[index].availableHours + 1),
        };
      }
      return updated;
    });
  }, []);

  const handleDecrement = useCallback((index: number) => {
    setLocalAvailability((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          availableHours: Math.max(0, updated[index].availableHours - 1),
        };
      }
      return updated;
    });
  }, []);

  const handleReset = useCallback(() => {
    setLocalAvailability(originalAvailability.map((m) => ({ ...m })));
  }, [originalAvailability]);

  const totalCapacity = localAvailability.reduce((sum, m) => sum + m.availableHours, 0);
  const hasChanges = JSON.stringify(localAvailability) !== JSON.stringify(originalAvailability);

  const handleSave = useCallback(() => {
    onSave(localAvailability);
    onClose();
  }, [localAvailability, onSave, onClose]);

  const handleDiscardChanges = useCallback(() => {
    setLocalAvailability(originalAvailability.map((m) => ({ ...m })));
    setShowUnsavedChangesModal(false);
    onClose();
  }, [originalAvailability, onClose]);

  const handleCancelUnsavedChanges = useCallback(() => {
    setShowUnsavedChangesModal(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="capacity-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient orb */}
        <div className={styles['gradient-orb']} aria-hidden="true" />

        {/* Header */}
        <header className={styles.header}>
          <div className={styles['header-content']}>
            <div className={styles['icon-wrapper']}>
              <UsersIcon size={24} />
            </div>
            <h2 id="capacity-modal-title" className={styles.title}>
              Team Capacity
            </h2>
            <p className={styles.subtitle}>Adjust available hours for each team member</p>
          </div>
          <button
            type="button"
            className={styles['close-button']}
            onClick={handleCancel}
            aria-label="Close modal"
          >
            <CloseIcon size={20} />
          </button>
        </header>

        {/* Progress indicator */}
        <div className={styles['progress-bar']} aria-hidden="true">
          <div className={styles['progress-fill']} style={{ width: '60%' }} />
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Total Capacity Card */}
          <div className={styles['total-card']}>
            <div className={styles['total-icon']}>
              <ClockIcon size={16} />
            </div>
            <div className={styles['total-content']}>
              <span className={styles['total-label']}>Total Team Capacity</span>
              <span className={styles['total-value']}>{totalCapacity} hours</span>
            </div>
            {hasChanges && (
              <button
                type="button"
                className={styles['reset-button']}
                onClick={handleReset}
                aria-label="Reset changes"
                title="Reset to original values"
              >
                <RefreshCwIcon size={16} />
                Reset
              </button>
            )}
          </div>

          {/* Member List */}
          <div className={styles['members-section']}>
            <h3 className={styles['section-title']}>Team Members</h3>
            <div className={styles['members-list']} role="list">
              {localAvailability.map((member, index) => (
                <div key={member.memberId} className={styles['member-row']} role="listitem">
                  <div className={styles['member-info']}>
                    <div className={styles['member-avatar']}>
                      {member.memberName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <span className={styles['member-name']}>{member.memberName}</span>
                  </div>

                  <div className={styles['hours-control']}>
                    <button
                      type="button"
                      className={styles['adjust-button']}
                      onClick={() => handleDecrement(index)}
                      aria-label={`Decrease hours for ${member.memberName}`}
                      disabled={member.availableHours <= 0}
                    >
                      <MinusIcon size={16} />
                    </button>

                    <div className={styles['hours-input-wrapper']}>
                      <input
                        type="number"
                        className={styles['hours-input']}
                        value={member.availableHours}
                        onChange={(e) => handleUpdateHours(index, parseInt(e.target.value) || 0)}
                        min="0"
                        max="60"
                        aria-label={`${member.memberName} available hours`}
                      />
                      <span className={styles['hours-suffix']}>h</span>
                    </div>

                    <button
                      type="button"
                      className={styles['adjust-button']}
                      onClick={() => handleIncrement(index)}
                      aria-label={`Increase hours for ${member.memberName}`}
                      disabled={member.availableHours >= 60}
                    >
                      <PlusIcon size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {localAvailability.length === 0 && (
                <div className={styles['empty-state']}>
                  <p>No team members found</p>
                  <p className={styles['empty-hint']}>
                    Team members will appear here once added to the team
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info Notice */}
          <div className={styles['notice-box']}>
            <p className={styles['notice-text']}>
              Capacity hours represent the total available time each team member can contribute to
              the sprint. The default is 40 hours (1 week) per person.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <button type="button" className={styles['button-secondary']} onClick={handleCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={styles['button-primary']}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <SaveIcon size={16} aria-hidden="true" />
            Save Changes
          </button>
        </footer>
      </div>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        onConfirm={handleDiscardChanges}
        onCancel={handleCancelUnsavedChanges}
        title="Unsaved Capacity Changes"
        message="You have unsaved changes to the team capacity. Are you sure you want to discard them?"
      />
    </div>
  );
};
