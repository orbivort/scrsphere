import React from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');

  const formatTime = (date: Date | null): string => {
    if (!date) return t('draftRestore.recently');

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('draftRestore.justNow');
    if (diffMins < 60) return t('draftRestore.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('draftRestore.hoursAgo', { count: diffHours });
    return t('draftRestore.daysAgo', { count: diffDays });
  };

  return (
    <div className={styles['draft-prompt']} role="alertdialog" aria-labelledby="draft-title">
      <div className={styles['draft-icon']}>📝</div>
      <div className={styles['draft-content']}>
        <h4 id="draft-title" className={styles['draft-title']}>
          {t('draftRestore.restorePrompt')}
        </h4>
        <p className={styles['draft-text']}>
          {t('draftRestore.draftFound', { time: formatTime(lastSavedAt) })}
        </p>
      </div>
      <div className={styles['draft-actions']}>
        <button type="button" className={styles['discard-btn']} onClick={onDiscard}>
          {t('draftRestore.startFresh')}
        </button>
        <button type="button" className={styles['restore-btn']} onClick={onRestore} autoFocus>
          {t('draftRestore.restoreDraft')}
        </button>
      </div>
    </div>
  );
};
