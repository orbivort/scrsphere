import React, { useState, useCallback, useEffect, useRef } from 'react';

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

const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatusEnum.TODO]: 'To Do',
  [TaskStatusEnum.IN_PROGRESS]: 'In Progress',
  [TaskStatusEnum.DONE]: 'Done',
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
        const currentCount = tasksByStatus[statusKey]?.length ?? 0;

        // Don't count the current task if it's moving within the same column
        const adjustedCount = task.status === newStatus ? currentCount : currentCount + 1;

        if (limit !== Infinity && adjustedCount > limit) {
          return {
            valid: false,
            message: `Cannot move task. ${STATUS_LABELS[newStatus]} has reached WIP limit of ${limit}.`,
          };
        }

        return { valid: true };
      },
      [wipLimits, tasksByStatus, task.status]
    );

    // Get next/previous status
    const getNextStatus = useCallback((): TaskStatus | null => {
      const available = getAvailableTransitions(task.status);
      const nextIndex = currentStatusIndex + 1;
      if (nextIndex < STATUS_ORDER.length && available.includes(STATUS_ORDER[nextIndex]!)) {
        return STATUS_ORDER[nextIndex]!;
      }
      return null;
    }, [task.status, currentStatusIndex, getAvailableTransitions]);

    const getPreviousStatus = useCallback((): TaskStatus | null => {
      const available = getAvailableTransitions(task.status);
      const prevIndex = currentStatusIndex - 1;
      if (prevIndex >= 0 && available.includes(STATUS_ORDER[prevIndex]!)) {
        return STATUS_ORDER[prevIndex]!;
      }
      return null;
    }, [task.status, currentStatusIndex, getAvailableTransitions]);

    // Announce grab state
    const announceGrab = useCallback(() => {
      const statusLabel = STATUS_LABELS[task.status];
      const message = `Task ${task.title} grabbed. Current status: ${statusLabel}. Use ArrowLeft/Right to change status. Escape to cancel, Enter to drop.`;
      announce(message, 'assertive');
    }, [task.title, task.status, announce]);

    // Announce target status
    const announceTargetStatus = useCallback(
      (status: TaskStatus) => {
        const statusLabel = STATUS_LABELS[status];
        const statusKey =
          status === TaskStatusEnum.IN_PROGRESS
            ? 'in_progress'
            : (status.toLowerCase() as keyof typeof tasksByStatus);
        const count = tasksByStatus?.[statusKey]?.length ?? 0;
        const limit = wipLimits?.[statusKey];
        const limitText = limit && limit !== Infinity ? ` WIP limit: ${limit}.` : '';
        const message = `Target status: ${statusLabel}. ${count} tasks currently in this column.${limitText}`;
        announce(message, 'polite');
      },
      [tasksByStatus, wipLimits, announce]
    );

    // Announce drop
    const announceDrop = useCallback(
      (status: TaskStatus) => {
        const statusLabel = STATUS_LABELS[status];
        const message = `Task ${task.title} moved to ${statusLabel}.`;
        announce(message, 'assertive');
      },
      [task.title, announce]
    );

    // Announce cancel
    const announceCancel = useCallback(() => {
      const statusLabel = STATUS_LABELS[task.status];
      const message = `Drag cancelled. Task remains in ${statusLabel}.`;
      announce(message, 'assertive');
    }, [task.status, announce]);

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
          const newStatus = STATUS_ORDER[newIndex]!;
          const available = getAvailableTransitions(task.status);

          if (available.includes(newStatus)) {
            const validation = validateWIPLimit(newStatus);
            if (!validation.valid) {
              announceWIPError(validation.message!);
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
        announceWIPError(validation.message!);
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
                  announceWIPError(validation.message!);
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
                  announceWIPError(validation.message!);
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
      const statusLabel = STATUS_LABELS[task.status];
      const assigneeLabel = task.assignee
        ? `assigned to ${task.assignee.firstName} ${task.assignee.lastName}`
        : 'unassigned';
      const grabbedLabel = isGrabbed ? ', grabbed' : '';
      const targetLabel =
        targetStatus && targetStatus !== task.status
          ? `, moving to ${STATUS_LABELS[targetStatus]}`
          : '';

      return `${task.title}, ${statusLabel}, ${assigneeLabel}${grabbedLabel}${targetLabel}`;
    }, [task, isGrabbed, targetStatus]);

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
              aria-label={`Assigned to ${task.assignee.firstName} ${task.assignee.lastName}`}
            >
              {task.assignee.firstName.charAt(0)}
              {task.assignee.lastName.charAt(0)}
            </div>
          )}
        </div>

        <h4 className={styles['task-title']}>{task.title}</h4>

        {task.pbi && (
          <div className={styles['task-parent-pbi']} aria-label={`Part of: ${task.pbi.title}`}>
            <span className={styles['pbi-label']}>PBI:</span>
            <span className={styles['pbi-title']}>{task.pbi.title}</span>
            {task.pbi.storyPoints && (
              <span className={styles['pbi-points']}>{task.pbi.storyPoints} pts</span>
            )}
          </div>
        )}

        {task.description && <p className={styles['task-description']}>{task.description}</p>}

        <div className={styles['task-meta']}>
          <div className={styles['task-hours-group']}>
            {task.estimatedHours && (
              <span
                className={styles['task-hours']}
                aria-label={`${task.remainingHours ?? task.estimatedHours} hours remaining`}
              >
                <span aria-hidden="true">⏱️</span> {task.remainingHours ?? task.estimatedHours}h
                {task.remainingHours !== undefined &&
                  task.remainingHours !== task.estimatedHours && (
                    <span className={styles['hours-estimate']}> / {task.estimatedHours}h est.</span>
                  )}
              </span>
            )}
          </div>
          <div className={styles['task-assignee-field']}>
            {task.assignee ? (
              <span
                className={styles['task-assignee-name']}
                aria-label={`Assigned to ${task.assignee.firstName} ${task.assignee.lastName}`}
              >
                <span aria-hidden="true">👤</span> {task.assignee.firstName}{' '}
                {task.assignee.lastName}
              </span>
            ) : (
              <span className={styles['task-unassigned']} aria-label="Unassigned">
                <span aria-hidden="true">👤</span> Unassigned
              </span>
            )}
          </div>
          <span
            className={`${styles['task-status-badge']} ${styles[task.status.toLowerCase().replace('_', '-') as 'todo' | 'in-progress' | 'done']}`}
            aria-label={`Status: ${task.status.replace('_', ' ')}`}
          >
            {task.status.replace('_', ' ')}
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
                ? `Moving to ${STATUS_LABELS[targetStatus]}`
                : 'Use Arrow keys to move'}
            </span>
          </div>
        )}
      </div>
    );
  }
);

TaskCard.displayName = 'TaskCard';
