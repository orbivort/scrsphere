import React from 'react';

import styles from './DraftRestorePrompt.module.css';

interface DraftRestorePromptProps {
  lastSavedAt: Date | null;
  onRestore: () => void;
  onDiscard: () => void;
}

export const DraftRestorePrompt: React.FC<DraftRestorePromptProps> = ({
  lastSavedAt,
  onRestore,
  onDiscard,
}) => {
  const formatTime = (date: Date | null): string => {
    if (!date) return 'recently';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className={styles['draft-prompt']} role="alertdialog" aria-labelledby="draft-title">
      <div className={styles['draft-icon']}>📝</div>
      <div className={styles['draft-content']}>
        <h4 id="draft-title" className={styles['draft-title']}>
          Restore unsaved progress?
        </h4>
        <p className={styles['draft-text']}>
          We found a draft you were working on {formatTime(lastSavedAt)}.
        </p>
      </div>
      <div className={styles['draft-actions']}>
        <button type="button" className={styles['discard-btn']} onClick={onDiscard}>
          Start Fresh
        </button>
        <button type="button" className={styles['restore-btn']} onClick={onRestore} autoFocus>
          Restore Draft
        </button>
      </div>
    </div>
  );
};
