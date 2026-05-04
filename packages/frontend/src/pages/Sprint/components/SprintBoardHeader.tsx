import React from 'react';

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
            • {daysRemaining} days remaining
          </span>
        </span>
      </div>
      <div className={styles['header-right']}>
        <button
          className={`${styles.button} ${styles['button-secondary']} ${styles['keyboard-help-button']}`}
          onClick={onKeyboardHelp}
          aria-label="Keyboard shortcuts help"
          title="Keyboard shortcuts (?)"
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
          <ChartIcon size={16} aria-hidden="true" /> Burndown
        </button>
        <button
          className={`${styles.button} ${styles['button-secondary']}`}
          onClick={onOpenBacklogManager}
          aria-label="Manage sprint backlog"
        >
          <ClipboardListIcon size={16} aria-hidden="true" /> Manage Backlog
        </button>
        <button
          className={`${styles.button} ${styles['button-primary']}`}
          onClick={onOpenCreateModal}
          aria-label="Add new task"
        >
          <PlusIcon size={16} aria-hidden="true" /> Add Task
        </button>
        <button
          className={`${styles.button} ${styles['button-complete-sprint']}`}
          onClick={onCompleteSprint}
          aria-label="Complete sprint"
        >
          <CheckIcon size={16} aria-hidden="true" /> Complete Sprint
        </button>
      </div>
    </header>
  );
};
