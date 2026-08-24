import React, { memo, useCallback, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { Task } from '../../../types';

import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  emptyMessage: string;
  currentUserId?: string;
  onTaskClick?: (taskId: string) => void;
}

const TaskList: React.FC<TaskListProps> = memo(
  ({ tasks, emptyMessage, currentUserId, onTaskClick }) => {
    const { t } = useTranslation('dashboard');
    const [focusedIndex, setFocusedIndex] = useState(0);
    const listRef = useRef<HTMLUListElement>(null);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent, taskId: string, index: number) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTaskClick?.(taskId);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = index < tasks.length - 1 ? index + 1 : 0;
          setFocusedIndex(nextIndex);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = index > 0 ? index - 1 : tasks.length - 1;
          setFocusedIndex(prevIndex);
        } else if (e.key === 'Home') {
          e.preventDefault();
          setFocusedIndex(0);
        } else if (e.key === 'End') {
          e.preventDefault();
          setFocusedIndex(tasks.length - 1);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          if (listRef.current) {
            listRef.current.blur();
          }
        }
      },
      [onTaskClick, tasks.length]
    );

    useEffect(() => {
      if (listRef.current && onTaskClick) {
        const items = listRef.current.querySelectorAll('[role="button"]');
        if (items[focusedIndex]) {
          (items[focusedIndex] as HTMLElement).focus({ preventScroll: true });
        }
      }
    }, [focusedIndex, onTaskClick, tasks]);

    if (tasks.length === 0) {
      return (
        <div className={styles['empty-list']} role="status">
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <ul
        ref={listRef}
        className={styles['task-list']}
        role="list"
        aria-label={t('taskList.ariaLabel')}
        aria-activedescendant={onTaskClick ? `task-item-${focusedIndex}` : undefined}
      >
        {tasks.map((task, index) => {
          const isOwn = currentUserId != null && task.assigneeId === currentUserId;
          const assigneeName = task.assignee
            ? `${task.assignee.firstName} ${task.assignee.lastName}`.trim()
            : undefined;

          return (
            <li
              key={task.id}
              id={`task-item-${index}`}
              className={`${styles['task-item']} ${styles[`status-${task.status.toLowerCase()}`]} ${isOwn ? styles.own : ''} ${onTaskClick ? styles.clickable : ''}`}
              tabIndex={onTaskClick && index === focusedIndex ? 0 : -1}
              role={onTaskClick ? 'button' : undefined}
              onClick={onTaskClick ? () => onTaskClick(task.id) : undefined}
              onKeyDown={onTaskClick ? (e) => handleKeyDown(e, task.id, index) : undefined}
              aria-label={
                onTaskClick
                  ? t('taskList.taskAriaLabel', {
                      title: task.title,
                      status: task.status.replace('_', ' '),
                    })
                  : undefined
              }
            >
              <span className={styles['task-status-dot']} aria-hidden="true" />
              <span className={styles['task-content']}>
                <span className={styles['task-title']}>{task.title}</span>
                {(isOwn || assigneeName) && (
                  <span className={styles['task-assignee']}>
                    {isOwn ? t('taskList.you') : assigneeName}
                  </span>
                )}
              </span>
              <span
                className={`${styles['task-status-badge']} ${styles[task.status.toLowerCase()]}`}
                aria-hidden={onTaskClick ? true : undefined}
              >
                {t(
                  `taskStatus.${task.status.toUpperCase()}` as
                    | 'taskStatus.TODO'
                    | 'taskStatus.IN_PROGRESS'
                    | 'taskStatus.REVIEW'
                    | 'taskStatus.DONE'
                )}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }
);

TaskList.displayName = 'TaskList';

export { TaskList };
export type { TaskListProps };
