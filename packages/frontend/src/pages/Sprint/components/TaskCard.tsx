import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { type Task, type TaskStatus, TaskStatus as TaskStatusEnum } from '../../../types';
import { useAnnounce } from '../../../components/LiveAnnouncer';

import styles from './TaskCard.module.css';

/**
 * Status transition configuration
 */
const STATUS_ORDER: TaskStatus[] = [
  TaskStatusEnum.TODO,
  TaskStatusEnum.IN_PROGRESS,
  TaskStatusEnum.DONE,
];

const STATUS_LABEL_KEYS: Record<TaskStatus, string> = {
  [TaskStatusEnum.TODO]: 'taskStatus.todo',
  [TaskStatusEnum.IN_PROGRESS]: 'taskStatus.inProgress',
  [TaskStatusEnum.DONE]: 'taskStatus.done',
};

export interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  isFocused?: boolean;
  /** External grab state from parent (for backward compatibility) */
  isGrabbed?: boolean;
  /** External drop target state from parent (for backward compatibility) */
  isDropTarget?: boolean;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent, task: Task) => void;
  onFocus: () => void;
  onBlur: () => void;
  /** Callback when task status changes via keyboard */
  onMoveStatus?: (taskId: string, newStatus: TaskStatus) => void;
  /** WIP limits for validation */
  wipLimits?: {
    todo: number;
    in_progress: number;
    done: number;
  };
  /** Current task counts by status */
  tasksByStatus?: {
    todo: Task[];
    in_progress: Task[];
    done: Task[];
  };
}

/**
 * TaskCard Component
 *
 * A draggable task card with full keyboard accessibility support.
 * Supports both mouse drag-and-drop and keyboard-based drag operations.
 *
 * Keyboard Navigation:
 * - Space/Enter: Grab the task (enter grab mode)
 * - ArrowLeft/Right: Move between status columns (when grabbed)
 * - ArrowUp/Down: Navigate between tasks
 * - Escape: Cancel drag operation
 * - Enter (when grabbed): Complete drop
 * - Ctrl+ArrowRight/Left: Quick move to next/previous status
 */
export const TaskCard = React.memo<TaskCardProps>(
  ({
    task,
    isDragging,
    isFocused,
    isGrabbed: externalIsGrabbed,
    isDropTarget: externalIsDropTarget,
    onDragStart,
    onDragEnd,
    onClick,
    onKeyDown,
    onFocus,
    onBlur,
    onMoveStatus,
    wipLimits,
    tasksByStatus,
  }) => {
    const { t } = useTranslation('sprint');
    const announce = useAnnounce();
    // Internal grab state (used when onMoveStatus is provided)
    const [internalIsGrabbed, setInternalIsGrabbed] = useState(false);
    const [targetStatus, setTargetStatus] = useState<TaskStatus | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    // Use internal state if onMoveStatus is provided, otherwise use external props
    const isGrabbed = onMoveStatus ? internalIsGrabbed : externalIsGrabbed;
    const isDropTarget = onMoveStatus
      ? targetStatus !== null && targetStatus !== task.status
      : externalIsDropTarget;

    // Get current status index
    const currentStatusIndex = STATUS_ORDER.indexOf(task.status);

    // Get available transitions
    const getAvailableTransitions = useCallback((status: TaskStatus): TaskStatus[] => {
      switch (status) {
        case TaskStatusEnum.TODO:
          return [TaskStatusEnum.IN_PROGRESS];
        case TaskStatusEnum.IN_PROGRESS:
          return [TaskStatusEnum.TODO, TaskStatusEnum.DONE];
        case TaskStatusEnum.DONE:
          return [TaskStatusEnum.IN_PROGRESS];
        default:
          return [];
      }
    }, []);

    // Validate WIP limit
    const validateWIPLimit = useCallback(
      (newStatus: TaskStatus): { valid: boolean; message?: string } => {
        if (!wipLimits || !tasksByStatus) {
          return { valid: true };
        }

        const statusKey =
          newStatus === TaskStatusEnum.IN_PROGRESS
            ? 'in_progress'
            : (newStatus.toLowerCase() as keyof typeof wipLimits);
        const limit = wipLimits[statusKey];
        const currentCount = tasksByStatus[statusKey].length;

        // Don't count the current task if it's moving within the same column
        const adjustedCount = task.status === newStatus ? currentCount : currentCount + 1;

        if (limit !== Infinity && adjustedCount > limit) {
          return {
            valid: false,
            message: t('board.cannotMoveTaskWip', {
              status: t(STATUS_LABEL_KEYS[newStatus] as never),
              limit,
            }),
          };
        }

        return { valid: true };
      },
      [wipLimits, tasksByStatus, task.status, t]
    );

    // Get next/previous status
    const getNextStatus = useCallback((): TaskStatus | null => {
      const available = getAvailableTransitions(task.status);
      const nextIndex = currentStatusIndex + 1;
      const nextStatus = STATUS_ORDER[nextIndex];
      if (nextIndex < STATUS_ORDER.length && nextStatus && available.includes(nextStatus)) {
        return nextStatus;
      }
      return null;
    }, [task.status, currentStatusIndex, getAvailableTransitions]);

    const getPreviousStatus = useCallback((): TaskStatus | null => {
      const available = getAvailableTransitions(task.status);
      const prevIndex = currentStatusIndex - 1;
      const prevStatus = STATUS_ORDER[prevIndex];
      if (prevIndex >= 0 && prevStatus && available.includes(prevStatus)) {
        return prevStatus;
      }
      return null;
    }, [task.status, currentStatusIndex, getAvailableTransitions]);

    // Announce grab state
    const announceGrab = useCallback(() => {
      const message = t('board.taskGrabbed', {
        title: task.title,
        status: t(STATUS_LABEL_KEYS[task.status] as never),
      });
      announce(message, 'assertive');
    }, [task.title, task.status, announce, t]);

    // Announce target status
    const announceTargetStatus = useCallback(
      (status: TaskStatus) => {
        const statusKey =
          status === TaskStatusEnum.IN_PROGRESS
            ? 'in_progress'
            : (status.toLowerCase() as keyof typeof tasksByStatus);
        const count = tasksByStatus?.[statusKey].length ?? 0;
        const limit = wipLimits?.[statusKey];
        const limitText = limit && limit !== Infinity ? t('board.wipLimit', { limit }) : '';
        const message = t('board.targetStatus', {
          status: t(STATUS_LABEL_KEYS[status] as never),
          count,
          limitText,
        });
        announce(message, 'polite');
      },
      [tasksByStatus, wipLimits, announce, t]
    );

    // Announce drop
    const announceDrop = useCallback(
      (status: TaskStatus) => {
        const message = t('board.taskMovedTo', {
          title: task.title,
          status: t(STATUS_LABEL_KEYS[status] as never),
        });
        announce(message, 'assertive');
      },
      [task.title, announce, t]
    );

    // Announce cancel
    const announceCancel = useCallback(() => {
      const message = t('board.dragCancelled', {
        status: t(STATUS_LABEL_KEYS[task.status] as never),
      });
      announce(message, 'assertive');
    }, [task.status, announce, t]);

    // Announce WIP limit error
    const announceWIPError = useCallback(
      (message: string) => {
        announce(message, 'assertive');
      },
      [announce]
    );

    // Handle grab mode (only when onMoveStatus is provided)
    const handleGrab = useCallback(() => {
      if (!onMoveStatus) return;
      setInternalIsGrabbed(true);
      setTargetStatus(task.status);
      announceGrab();
    }, [onMoveStatus, task.status, announceGrab]);

    // Handle status change during grab
    const handleStatusChange = useCallback(
      (direction: 'left' | 'right') => {
        if (!internalIsGrabbed || !onMoveStatus) return;

        const currentIndex = STATUS_ORDER.indexOf(targetStatus ?? task.status);
        const newIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;

        if (newIndex >= 0 && newIndex < STATUS_ORDER.length) {
          const newStatus = STATUS_ORDER[newIndex];
          if (!newStatus) return;
          const available = getAvailableTransitions(task.status);

          if (available.includes(newStatus)) {
            const validation = validateWIPLimit(newStatus);
            if (!validation.valid) {
              announceWIPError(validation.message ?? t('board.transitionValidationFailed'));
              return;
            }
            setTargetStatus(newStatus);
            announceTargetStatus(newStatus);
          }
        }
      },
      [
        internalIsGrabbed,
        onMoveStatus,
        targetStatus,
        task.status,
        getAvailableTransitions,
        validateWIPLimit,
        announceTargetStatus,
        announceWIPError,
        t,
      ]
    );

    // Handle drop
    const handleDrop = useCallback(() => {
      if (!internalIsGrabbed || !onMoveStatus) {
        setInternalIsGrabbed(false);
        setTargetStatus(null);
        return;
      }

      if (!targetStatus || targetStatus === task.status) {
        setInternalIsGrabbed(false);
        setTargetStatus(null);
        return;
      }

      const validation = validateWIPLimit(targetStatus);
      if (!validation.valid) {
        announceWIPError(validation.message ?? t('board.transitionValidationFailed'));
        return;
      }

      onMoveStatus(task.id, targetStatus);
      announceDrop(targetStatus);
      setInternalIsGrabbed(false);
      setTargetStatus(null);
    }, [
      internalIsGrabbed,
      onMoveStatus,
      targetStatus,
      task.id,
      task.status,
      validateWIPLimit,
      announceDrop,
      announceWIPError,
      t,
    ]);

    // Handle cancel
    const handleCancel = useCallback(() => {
      if (internalIsGrabbed) {
        announceCancel();
      }
      setInternalIsGrabbed(false);
      setTargetStatus(null);
    }, [internalIsGrabbed, announceCancel]);

    // Handle keyboard events
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        // Handle grab mode keyboard events (only when onMoveStatus is provided)
        if (internalIsGrabbed && onMoveStatus) {
          switch (e.key) {
            case 'ArrowRight':
              e.preventDefault();
              e.stopPropagation();
              handleStatusChange('right');
              return;
            case 'ArrowLeft':
              e.preventDefault();
              e.stopPropagation();
              handleStatusChange('left');
              return;
            case 'Enter':
              e.preventDefault();
              e.stopPropagation();
              handleDrop();
              return;
            case 'Escape':
              e.preventDefault();
              e.stopPropagation();
              handleCancel();
              return;
            default:
              break;
          }
        }

        // Handle quick-action shortcuts (Ctrl+Arrow) when onMoveStatus is provided
        if ((e.ctrlKey || e.metaKey) && onMoveStatus) {
          switch (e.key) {
            case 'ArrowRight': {
              e.preventDefault();
              const nextStatus = getNextStatus();
              if (nextStatus) {
                const validation = validateWIPLimit(nextStatus);
                if (!validation.valid) {
                  announceWIPError(validation.message ?? t('board.transitionValidationFailed'));
                  return;
                }
                onMoveStatus(task.id, nextStatus);
                announceDrop(nextStatus);
              }
              return;
            }
            case 'ArrowLeft': {
              e.preventDefault();
              const prevStatus = getPreviousStatus();
              if (prevStatus) {
                const validation = validateWIPLimit(prevStatus);
                if (!validation.valid) {
                  announceWIPError(validation.message ?? t('board.transitionValidationFailed'));
                  return;
                }
                onMoveStatus(task.id, prevStatus);
                announceDrop(prevStatus);
              }
              return;
            }
            default:
              break;
          }
        }

        // Handle grab mode activation (only when onMoveStatus is provided)
        if ((e.key === ' ' || e.key === 'Enter') && onMoveStatus && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handleGrab();
          return;
        }

        // Pass other keys to parent handler
        onKeyDown(e, task);
      },
      [
        internalIsGrabbed,
        onMoveStatus,
        handleStatusChange,
        handleDrop,
        handleCancel,
        handleGrab,
        onKeyDown,
        task,
        getNextStatus,
        getPreviousStatus,
        validateWIPLimit,
        announceDrop,
        announceWIPError,
        t,
      ]
    );

    // Focus management for grab mode
    useEffect(() => {
      if (internalIsGrabbed && cardRef.current) {
        cardRef.current.focus();
      }
    }, [internalIsGrabbed]);

    // Build ARIA label
    const buildAriaLabel = useCallback(() => {
      const statusLabel = t(STATUS_LABEL_KEYS[task.status] as never);
      const assigneeLabel = task.assignee
        ? t('board.assignedToLabel', {
            name: `${task.assignee.firstName} ${task.assignee.lastName}`,
          })
        : t('board.unassignedLabel');
      const grabbedLabel = isGrabbed ? t('board.grabbedLabel') : '';
      const targetLabel =
        targetStatus && targetStatus !== task.status
          ? t('board.movingToLabel', { status: t(STATUS_LABEL_KEYS[targetStatus] as never) })
          : '';

      return t('board.ariaLabel', {
        title: task.title,
        status: statusLabel,
        assigneeLabel,
        grabbedLabel,
        targetLabel,
      });
    }, [task, isGrabbed, targetStatus, t]);

    // Build class names
    const classNames = [
      styles['task-card'],
      isDragging && styles.dragging,
      isFocused && styles.focused,
      isGrabbed && styles.grabbed,
      isDropTarget && styles['drop-target'],
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={cardRef}
        className={classNames}
        draggable
        onDragStart={(e) => onDragStart(e, task.id)}
        onDragEnd={onDragEnd}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        role="listitem"
        tabIndex={0}
        aria-grabbed={isGrabbed ? 'true' : 'false'}
        aria-roledescription="draggable task"
        aria-label={buildAriaLabel()}
        data-status={task.status}
        data-target-status={targetStatus}
        data-grabbed={isGrabbed}
      >
        <div className={styles['task-card-header']}>
          <span className={styles['task-id']}>#{task.id.slice(-4)}</span>
          {task.assignee && (
            <div
              className={styles['task-assignee']}
              title={`${task.assignee.firstName} ${task.assignee.lastName}`}
              aria-label={t('board.assignedTo', {
                name: `${task.assignee.firstName} ${task.assignee.lastName}`,
              })}
            >
              {task.assignee.firstName.charAt(0)}
              {task.assignee.lastName.charAt(0)}
            </div>
          )}
        </div>

        <h4 className={styles['task-title']}>{task.title}</h4>

        {task.pbi && (
          <div
            className={styles['task-parent-pbi']}
            aria-label={t('board.partOf', { title: task.pbi.title })}
          >
            <span className={styles['pbi-label']}>{t('board.pbiLabel')}</span>
            <span className={styles['pbi-title']}>{task.pbi.title}</span>
            {task.pbi.storyPoints && (
              <span className={styles['pbi-points']}>
                {task.pbi.storyPoints} {t('taskCard.pts')}
              </span>
            )}
          </div>
        )}

        {task.description && <p className={styles['task-description']}>{task.description}</p>}

        <div className={styles['task-meta']}>
          <div className={styles['task-hours-group']}>
            {task.estimatedHours && (
              <span
                className={styles['task-hours']}
                aria-label={t('board.hoursRemaining', {
                  hours: task.remainingHours ?? task.estimatedHours,
                })}
              >
                <span aria-hidden="true">⏱️</span> {task.remainingHours ?? task.estimatedHours}h
                {task.remainingHours !== undefined &&
                  task.remainingHours !== task.estimatedHours && (
                    <span className={styles['hours-estimate']}>
                      {t('board.hoursEstimate', { hours: task.estimatedHours })}
                    </span>
                  )}
              </span>
            )}
          </div>
          <div className={styles['task-assignee-field']}>
            {task.assignee ? (
              <span
                className={styles['task-assignee-name']}
                aria-label={t('board.assignedTo', {
                  name: `${task.assignee.firstName} ${task.assignee.lastName}`,
                })}
              >
                <span aria-hidden="true">👤</span> {task.assignee.firstName}{' '}
                {task.assignee.lastName}
              </span>
            ) : (
              <span className={styles['task-unassigned']} aria-label={t('taskCard.unassigned')}>
                <span aria-hidden="true">👤</span> {t('taskCard.unassigned')}
              </span>
            )}
          </div>
          <span
            className={`${styles['task-status-badge']} ${styles[task.status.toLowerCase().replace('_', '-') as 'todo' | 'in-progress' | 'done']}`}
            aria-label={t('board.statusBadge', {
              status: t(STATUS_LABEL_KEYS[task.status] as never),
            })}
          >
            {t(STATUS_LABEL_KEYS[task.status] as never)}
          </span>
        </div>

        <div className={styles['task-card-actions']} aria-hidden="true">
          <span className={styles['drag-handle']}>⋮⋮</span>
        </div>

        {/* Visual indicator for grab mode */}
        {isGrabbed && (
          <div className={styles['grab-indicator']} aria-hidden="true">
            <span className={styles['grab-icon']}>✋</span>
            <span className={styles['grab-text']}>
              {targetStatus && targetStatus !== task.status
                ? t('board.movingTo', {
                    status: t(STATUS_LABEL_KEYS[targetStatus] as never),
                  })
                : t('board.useArrowKeys')}
            </span>
          </div>
        )}
      </div>
    );
  }
);

TaskCard.displayName = 'TaskCard';
