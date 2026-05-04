import React from 'react';

import { TaskStatus as TaskStatusEnum, type Task, type TaskStatus } from '../../../types';
import type { TasksByStatus, WIPLimits } from '../SprintBoard.types';
import { useVirtualScroll, shouldEnableVirtualization } from '../../../hooks/useVirtualScroll';
import styles from '../SprintBoard.module.css';

import { TaskCard } from './TaskCard';

import {
  ClipboardListIcon,
  ZapIcon,
  CheckCircleIcon,
  MessageSquareIcon,
  RefreshCwIcon,
} from '@/components/common/Icons';

export interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  wipLimit: number;
  allTasksByStatus: TasksByStatus;
  wipLimits: WIPLimits;
  draggedTaskId: string | null;
  dropTargetColumn: TaskStatus | null;
  focusedTaskId: string | null;
  keyboardGrabState: 'idle' | 'grabbed';
  keyboardDropTargetStatus: TaskStatus | null;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  onDragOver: (e: React.DragEvent, status: TaskStatus) => void;
  onDragLeave: () => void;
  onTaskClick: (task: Task) => void;
  onKeyDown: (e: React.KeyboardEvent, task: Task) => void;
  onFocus: (taskId: string) => void;
  onBlur: () => void;
  onMoveStatus: (taskId: string, newStatus: TaskStatus) => void;
}

/**
 * Estimated height of each TaskCard in pixels
 */
const CARD_ESTIMATE_HEIGHT = 180;

/**
 * Number of items to render outside the visible area for smoother scrolling
 */
const OVERSCAN_COUNT = 3;

/**
 * Threshold for enabling virtual scrolling (items per column)
 */
const VIRTUALIZATION_THRESHOLD = 50;

const getColumnHeaderClass = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatusEnum.TODO:
      return styles.todo || '';
    case TaskStatusEnum.IN_PROGRESS:
      return styles['in-progress'] || '';
    case TaskStatusEnum.DONE:
      return styles.done || '';
    default:
      return '';
  }
};

const getColumnIcon = (status: TaskStatus): React.ReactNode => {
  switch (status) {
    case TaskStatusEnum.TODO:
      return <ClipboardListIcon size={14} aria-hidden="true" />;
    case TaskStatusEnum.IN_PROGRESS:
      return <ZapIcon size={14} aria-hidden="true" />;
    case TaskStatusEnum.DONE:
      return <CheckCircleIcon size={14} aria-hidden="true" />;
    default:
      return null;
  }
};

const getEmptyIcon = (status: TaskStatus): React.ReactNode => {
  switch (status) {
    case TaskStatusEnum.TODO:
      return <MessageSquareIcon size={24} aria-hidden="true" />;
    case TaskStatusEnum.IN_PROGRESS:
      return <RefreshCwIcon size={24} aria-hidden="true" />;
    case TaskStatusEnum.DONE:
      return <CheckCircleIcon size={24} aria-hidden="true" />;
    default:
      return null;
  }
};

const getEmptyMessage = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatusEnum.TODO:
      return 'No tasks to do';
    case TaskStatusEnum.IN_PROGRESS:
      return 'No tasks in progress';
    case TaskStatusEnum.DONE:
      return 'No completed tasks';
    default:
      return 'No tasks';
  }
};

/**
 * VirtualizedTaskList Component
 *
 * Renders a list of tasks with virtual scrolling support for large lists.
 */
interface VirtualizedTaskListProps {
  tasks: Task[];
  draggedTaskId: string | null;
  focusedTaskId: string | null;
  keyboardGrabState: 'idle' | 'grabbed';
  keyboardDropTargetStatus: TaskStatus | null;
  status: TaskStatus;
  wipLimits: WIPLimits;
  allTasksByStatus: TasksByStatus;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onTaskClick: (task: Task) => void;
  onKeyDown: (e: React.KeyboardEvent, task: Task) => void;
  onFocus: (taskId: string) => void;
  onBlur: () => void;
}

const VirtualizedTaskList: React.FC<VirtualizedTaskListProps> = ({
  tasks,
  draggedTaskId,
  focusedTaskId,
  keyboardGrabState,
  keyboardDropTargetStatus,
  status,
  wipLimits,
  allTasksByStatus,
  onDragStart,
  onDragEnd,
  onTaskClick,
  onKeyDown,
  onFocus,
  onBlur,
}) => {
  const enableVirtualization = shouldEnableVirtualization(tasks.length, VIRTUALIZATION_THRESHOLD);

  const { virtualItems, totalSize, containerRef } = useVirtualScroll(
    tasks,
    CARD_ESTIMATE_HEIGHT,
    OVERSCAN_COUNT,
    { enabled: enableVirtualization }
  );

  if (enableVirtualization) {
    return (
      <div
        ref={containerRef}
        className={`${styles['column-body']} ${styles['virtualized']}`}
        style={{ position: 'relative', height: '500px', overflow: 'auto' }}
      >
        <div style={{ height: totalSize, position: 'relative', width: '100%' }}>
          {virtualItems.map(({ item: task, key, start }) => (
            <div
              key={key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${start}px)`,
                paddingRight: 'var(--space-3)',
              }}
              data-index={key}
            >
              <TaskCard
                task={task}
                isDragging={draggedTaskId === task.id}
                isFocused={focusedTaskId === task.id}
                isGrabbed={keyboardGrabState === 'grabbed'}
                isDropTarget={
                  keyboardGrabState === 'grabbed' && keyboardDropTargetStatus === status
                }
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onClick={() => onTaskClick(task)}
                onKeyDown={onKeyDown}
                onFocus={() => onFocus(task.id)}
                onBlur={onBlur}
                wipLimits={wipLimits}
                tasksByStatus={allTasksByStatus}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles['column-body']}>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isDragging={draggedTaskId === task.id}
          isFocused={focusedTaskId === task.id}
          isGrabbed={keyboardGrabState === 'grabbed'}
          isDropTarget={keyboardGrabState === 'grabbed' && keyboardDropTargetStatus === status}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onClick={() => onTaskClick(task)}
          onKeyDown={onKeyDown}
          onFocus={() => onFocus(task.id)}
          onBlur={onBlur}
          wipLimits={wipLimits}
          tasksByStatus={allTasksByStatus}
        />
      ))}
    </div>
  );
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tasks,
  wipLimit,
  allTasksByStatus,
  wipLimits,
  draggedTaskId,
  dropTargetColumn,
  focusedTaskId,
  keyboardGrabState,
  keyboardDropTargetStatus,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  onDragLeave,
  onTaskClick,
  onKeyDown,
  onFocus,
  onBlur,
}) => {
  const headerClass = getColumnHeaderClass(status);
  const icon = getColumnIcon(status);
  const emptyIcon = getEmptyIcon(status);
  const emptyMessage = getEmptyMessage(status);
  const isDropTarget = dropTargetColumn === status;
  const isKeyboardDropTarget =
    keyboardGrabState === 'grabbed' && keyboardDropTargetStatus === status;
  const isWipExceeded = status === TaskStatusEnum.IN_PROGRESS && tasks.length > wipLimit;

  return (
    <div
      className={`${styles['kanban-column']} ${isDropTarget ? styles['drop-target'] : ''} ${isWipExceeded ? styles['wip-exceeded'] : ''} ${isKeyboardDropTarget ? styles['keyboard-drop-target'] : ''}`}
      onDrop={(e) => onDrop(e, status)}
      onDragOver={(e) => onDragOver(e, status)}
      onDragLeave={onDragLeave}
      role="listitem"
      aria-label={`${title} column, ${tasks.length} tasks${isWipExceeded ? ', WIP limit exceeded' : ''}`}
      aria-dropeffect={keyboardGrabState === 'grabbed' ? 'move' : 'none'}
    >
      <div className={`${styles['column-header']} ${headerClass}`}>
        <h3 className={styles['column-title']}>
          {icon} {title}
        </h3>
        <div className={styles['column-meta']}>
          <span className={`${styles['column-count']} ${isWipExceeded ? styles.warning : ''}`}>
            {tasks.length}
          </span>
          {wipLimit < Infinity && <span className={styles['wip-limit']}>/{wipLimit}</span>}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className={styles['column-body']}>
          <div className={styles['empty-column']} role="status">
            {emptyIcon}
            <p>{emptyMessage}</p>
          </div>
        </div>
      ) : (
        <VirtualizedTaskList
          tasks={tasks}
          draggedTaskId={draggedTaskId}
          focusedTaskId={focusedTaskId}
          keyboardGrabState={keyboardGrabState}
          keyboardDropTargetStatus={keyboardDropTargetStatus}
          status={status}
          wipLimits={wipLimits}
          allTasksByStatus={allTasksByStatus}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onTaskClick={onTaskClick}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      )}
    </div>
  );
};
