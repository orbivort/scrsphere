import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  ZapIcon,
  KeyboardIcon,
  ChartIcon,
  ClipboardListIcon,
  PlusIcon,
  CheckIcon,
} from '../../../components/common/Icons';
import type { Sprint } from '../../../types';
import styles from '../SprintBoard.module.css';

export interface SprintBoardHeaderProps {
  sprint: Sprint;
  daysRemaining: number;
  onKeyboardHelp: () => void;
  onToggleBurndown: () => void;
  onOpenBacklogManager: () => void;
  onOpenCreateModal: () => void;
  onCompleteSprint: () => void;
  showBurndown: boolean;
}

export const SprintBoardHeader: React.FC<SprintBoardHeaderProps> = ({
  sprint,
  daysRemaining,
  onKeyboardHelp,
  onToggleBurndown,
  onOpenBacklogManager,
  onOpenCreateModal,
  onCompleteSprint,
  showBurndown,
}) => {
  const { t } = useTranslation('sprint');

  return (
    <header className={styles['sprint-board-header']}>
      <div className={styles['header-left']}>
        <h1 className={styles['page-title']}>
          <ZapIcon size={24} aria-hidden="true" /> {sprint.name}
        </h1>
        <span className={styles['sprint-dates']}>
          {new Date(sprint.startDate).toLocaleDateString()} -{' '}
          {new Date(sprint.endDate).toLocaleDateString()}
          <span
            className={`${styles['days-remaining']} ${daysRemaining <= 2 ? styles.warning : ''}`}
          >
            {' '}
            • {t('daysRemaining', { count: daysRemaining })}
          </span>
        </span>
      </div>
      <div className={styles['header-right']}>
        <button
          className={`${styles.button} ${styles['button-secondary']} ${styles['keyboard-help-button']}`}
          onClick={onKeyboardHelp}
          aria-label={t('boardHeader.keyboardShortcuts')}
          title={`${t('boardHeader.keyboardShortcuts')} (?)`}
        >
          <KeyboardIcon size={16} aria-hidden="true" />
          <span className={styles['keyboard-shortcut-hint']}>?</span>
        </button>
        <button
          className={`${styles.button} ${styles['button-secondary']}`}
          onClick={onToggleBurndown}
          aria-expanded={showBurndown}
          aria-controls="burndown-panel"
        >
          <ChartIcon size={16} aria-hidden="true" /> {t('boardHeader.burndown')}
        </button>
        <button
          className={`${styles.button} ${styles['button-secondary']}`}
          onClick={onOpenBacklogManager}
          aria-label={t('boardHeader.manageBacklog')}
        >
          <ClipboardListIcon size={16} aria-hidden="true" /> {t('boardHeader.manageBacklog')}
        </button>
        <button
          className={`${styles.button} ${styles['button-primary']}`}
          onClick={onOpenCreateModal}
          aria-label={t('boardHeader.addTask')}
        >
          <PlusIcon size={16} aria-hidden="true" /> {t('boardHeader.addTask')}
        </button>
        <button
          className={`${styles.button} ${styles['button-complete-sprint']}`}
          onClick={onCompleteSprint}
          aria-label={t('boardHeader.completeSprint')}
        >
          <CheckIcon size={16} aria-hidden="true" /> {t('boardHeader.completeSprint')}
        </button>
      </div>
    </header>
  );
};
