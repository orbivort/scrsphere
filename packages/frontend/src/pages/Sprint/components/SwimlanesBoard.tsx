import React from 'react';

import {
  TaskStatus as TaskStatusEnum,
  type Task,
  type TaskStatus,
  type User,
  type TeamMember,
  type ProductBacklogItem,
} from '../../../types';
import {
  ChartIcon,
  ClipboardListIcon,
  ZapIcon,
  CheckCircleIcon,
  MessageSquareIcon,
} from '../../../components/common/Icons';
import { useVirtualScroll, shouldEnableVirtualization } from '../../../hooks/useVirtualScroll';

import styles from './SwimlanesBoard.module.css';
import { TaskCard } from './TaskCard';

export interface SwimlanesBoardProps {
  groupedBySwimlane: Record<string, Task[]> | null;
  swimlaneGroup: 'assignee' | 'pbi' | 'none';
  teamMembers: (TeamMember & { user?: User })[];
  sprintItems: ProductBacklogItem[];
  tasksByStatus: {
    todo: Task[];
    in_progress: Task[];
    done: Task[];
  };
  draggedTaskId: string | null;
  dropTargetColumn: TaskStatus | null;
  focusedTaskId: string | null;
  keyboardGrabState?: 'idle' | 'grabbed';
  keyboardDraggedTaskId?: string | null;
  keyboardDropTargetStatus?: TaskStatus | null;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  onDragOver: (e: React.DragEvent, status: TaskStatus) => void;
  onDragLeave: () => void;
  onTaskClick: (task: Task) => void;
  onKeyDown: (e: React.KeyboardEvent, task: Task) => void;
  onFocus: (taskId: string) => void;
  onBlur: () => void;
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
 * Threshold for enabling virtual scrolling (items per cell)
 */
const VIRTUALIZATION_THRESHOLD = 30;

/**
 * VirtualizedTaskCell Component
 *
 * Renders a cell with tasks using virtual scrolling for large lists.
 */
interface VirtualizedTaskCellProps {
  tasks: Task[];
  label: string;
  status: TaskStatus;
  draggedTaskId: string | null;
  focusedTaskId: string | null;
  keyboardGrabState: 'idle' | 'grabbed';
  keyboardDraggedTaskId: string | null;
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
}

/**
 * Format status for display (e.g., "TODO" -> "To Do")
 */
const formatStatus = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatusEnum.TODO:
      return 'To Do';
    case TaskStatusEnum.IN_PROGRESS:
      return 'In Progress';
    case TaskStatusEnum.DONE:
      return 'Done';
  }
};

const VirtualizedTaskCell: React.FC<VirtualizedTaskCellProps> = ({
  tasks,
  label,
  status,
  draggedTaskId,
  focusedTaskId,
  keyboardGrabState,
  keyboardDraggedTaskId,
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
  const enableVirtualization = shouldEnableVirtualization(tasks.length, VIRTUALIZATION_THRESHOLD);

  const { virtualItems, totalSize, containerRef } = useVirtualScroll(
    tasks,
    CARD_ESTIMATE_HEIGHT,
    OVERSCAN_COUNT,
    { enabled: enableVirtualization }
  );

  const getColumnClassName = (cellStatus: TaskStatus): string => {
    const classes = [styles['swimlane-cell']];
    if (status === cellStatus) {
      // This is handled by parent
    }
    return classes.join(' ');
  };

  const statusLabel = formatStatus(status);

  if (enableVirtualization) {
    return (
      <div
        className={getColumnClassName(status)}
        onDrop={(e) => onDrop(e, status)}
        onDragOver={(e) => onDragOver(e, status)}
        onDragLeave={onDragLeave}
        role="cell"
        aria-label={`${label} - ${statusLabel}: ${tasks.length} tasks`}
      >
        <div
          ref={containerRef}
          className={styles['virtualized-cell']}
          style={{ height: '400px', overflow: 'auto', position: 'relative' }}
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
                  paddingRight: 'var(--space-2)',
                }}
                data-index={key}
              >
                <TaskCard
                  task={task}
                  isDragging={draggedTaskId === task.id}
                  isFocused={focusedTaskId === task.id}
                  isGrabbed={keyboardGrabState === 'grabbed' && keyboardDraggedTaskId === task.id}
                  isDropTarget={
                    keyboardGrabState === 'grabbed' &&
                    keyboardDropTargetStatus === status &&
                    keyboardDraggedTaskId !== task.id
                  }
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onClick={() => onTaskClick(task)}
                  onKeyDown={onKeyDown}
                  onFocus={() => onFocus(task.id)}
                  onBlur={onBlur}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={getColumnClassName(status)}
      onDrop={(e) => onDrop(e, status)}
      onDragOver={(e) => onDragOver(e, status)}
      onDragLeave={onDragLeave}
      role="cell"
      aria-label={`${label} - ${statusLabel}: ${tasks.length} tasks`}
    >
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isDragging={draggedTaskId === task.id}
          isFocused={focusedTaskId === task.id}
          isGrabbed={keyboardGrabState === 'grabbed' && keyboardDraggedTaskId === task.id}
          isDropTarget={
            keyboardGrabState === 'grabbed' &&
            keyboardDropTargetStatus === status &&
            keyboardDraggedTaskId !== task.id
          }
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onClick={() => onTaskClick(task)}
          onKeyDown={onKeyDown}
          onFocus={() => onFocus(task.id)}
          onBlur={onBlur}
        />
      ))}
      {tasks.length === 0 && (
        <div className={styles['empty-cell']} aria-hidden="true">
          —
        </div>
      )}
    </div>
  );
};

export const SwimlanesBoard = React.memo<SwimlanesBoardProps>(
  ({
    groupedBySwimlane,
    swimlaneGroup,
    teamMembers,
    sprintItems,
    tasksByStatus,
    draggedTaskId,
    dropTargetColumn,
    focusedTaskId,
    keyboardGrabState = 'idle',
    keyboardDraggedTaskId = null,
    keyboardDropTargetStatus = null,
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
    if (swimlaneGroup === 'none' || !groupedBySwimlane) {
      return (
        <div className={styles['swimlanes-empty']} role="status">
          <ChartIcon size={48} aria-hidden="true" />
          <h3 className={styles['swimlanes-empty-title']}>No Grouping Selected</h3>
          <p className={styles['swimlanes-empty-description']}>
            Select a grouping option from the dropdown above to view tasks in swimlanes.
          </p>
        </div>
      );
    }

    const getSwimlaneLabel = (key: string): { label: string; subtitle?: string } => {
      if (swimlaneGroup === 'assignee') {
        if (key === 'unassigned') {
          return { label: 'Unassigned', subtitle: 'Tasks without an assignee' };
        }
        const member = teamMembers.find((m) => m.userId === key);
        if (member?.user) {
          return {
            label: `${member.user.firstName} ${member.user.lastName}`,
            subtitle: member.role,
          };
        }
        return { label: 'Unknown User' };
      } else {
        const item = sprintItems.find((i) => i.id === key);
        if (item) {
          return {
            label: item.title,
            subtitle: `${item.storyPoints ?? 0} story points`,
          };
        }
        return { label: 'Unknown Item' };
      }
    };

    const getSwimlaneStats = (tasks: Task[]) => {
      const todo = tasks.filter((t) => t.status === TaskStatusEnum.TODO).length;
      const inProgress = tasks.filter((t) => t.status === TaskStatusEnum.IN_PROGRESS).length;
      const done = tasks.filter((t) => t.status === TaskStatusEnum.DONE).length;
      const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
      const remainingHours = tasks.reduce(
        (sum, t) => sum + (t.remainingHours ?? t.estimatedHours ?? 0),
        0
      );

      return { todo, inProgress, done, totalHours, remainingHours, total: tasks.length };
    };

    const sortedKeys = Object.keys(groupedBySwimlane).sort((a, b) => {
      if (swimlaneGroup === 'assignee') {
        if (a === 'unassigned') return 1;
        if (b === 'unassigned') return -1;
        const memberA = teamMembers.find((m) => m.userId === a);
        const memberB = teamMembers.find((m) => m.userId === b);
        const nameA = memberA?.user ? `${memberA.user.firstName} ${memberA.user.lastName}` : 'ZZZ';
        const nameB = memberB?.user ? `${memberB.user.firstName} ${memberB.user.lastName}` : 'ZZZ';
        return nameA.localeCompare(nameB);
      } else {
        const itemA = sprintItems.find((i) => i.id === a);
        const itemB = sprintItems.find((i) => i.id === b);
        const titleA = itemA?.title ?? 'ZZZ';
        const titleB = itemB?.title ?? 'ZZZ';
        return titleA.localeCompare(titleB);
      }
    });

    return (
      <div className={styles['swimlanes-container']} role="table" aria-label="Swimlanes view">
        <div className={styles['swimlanes-header']} role="row">
          <div className={styles['swimlane-label-header']} role="columnheader">
            {swimlaneGroup === 'assignee' ? 'Assignee' : 'Backlog Item'}
          </div>
          <div
            className={`${styles['swimlane-column-header']} ${styles.todo} ${dropTargetColumn === TaskStatusEnum.TODO ? styles['drop-target'] : ''} ${keyboardGrabState === 'grabbed' && keyboardDropTargetStatus === TaskStatusEnum.TODO ? styles['keyboard-drop-target'] : ''}`}
            role="columnheader"
            aria-dropeffect={keyboardGrabState === 'grabbed' ? 'move' : 'none'}
          >
            <ClipboardListIcon size={14} aria-hidden="true" /> TO DO
            <span className={styles['column-total']}>{tasksByStatus.todo.length}</span>
          </div>
          <div
            className={`${styles['swimlane-column-header']} ${styles['in-progress']} ${dropTargetColumn === TaskStatusEnum.IN_PROGRESS ? styles['drop-target'] : ''} ${keyboardGrabState === 'grabbed' && keyboardDropTargetStatus === TaskStatusEnum.IN_PROGRESS ? styles['keyboard-drop-target'] : ''}`}
            role="columnheader"
            aria-dropeffect={keyboardGrabState === 'grabbed' ? 'move' : 'none'}
          >
            <ZapIcon size={14} aria-hidden="true" /> IN PROGRESS
            <span className={styles['column-total']}>{tasksByStatus.in_progress.length}</span>
          </div>
          <div
            className={`${styles['swimlane-column-header']} ${styles.done} ${dropTargetColumn === TaskStatusEnum.DONE ? styles['drop-target'] : ''} ${keyboardGrabState === 'grabbed' && keyboardDropTargetStatus === TaskStatusEnum.DONE ? styles['keyboard-drop-target'] : ''}`}
            role="columnheader"
            aria-dropeffect={keyboardGrabState === 'grabbed' ? 'move' : 'none'}
          >
            <CheckCircleIcon size={14} aria-hidden="true" /> DONE
            <span className={styles['column-total']}>{tasksByStatus.done.length}</span>
          </div>
        </div>

        <div className={styles['swimlanes-body']} role="rowgroup">
          {sortedKeys.map((key) => {
            const tasks = groupedBySwimlane[key] ?? [];
            const { label, subtitle } = getSwimlaneLabel(key);
            const stats = getSwimlaneStats(tasks);

            const todoTasks = tasks.filter((t) => t.status === TaskStatusEnum.TODO);
            const inProgressTasks = tasks.filter((t) => t.status === TaskStatusEnum.IN_PROGRESS);
            const doneTasks = tasks.filter((t) => t.status === TaskStatusEnum.DONE);

            return (
              <div key={key} className={styles['swimlane-row']} role="row">
                <div className={styles['swimlane-label']} role="cell">
                  <div className={styles['swimlane-label-content']}>
                    <span className={styles['swimlane-name']}>{label}</span>
                    {subtitle && <span className={styles['swimlane-subtitle']}>{subtitle}</span>}
                  </div>
                  <div className={styles['swimlane-stats']}>
                    <span className={styles['stat-item']}>
                      <span className={`${styles['stat-dot']} ${styles.todo}`} />
                      {stats.todo}
                    </span>
                    <span className={styles['stat-item']}>
                      <span className={`${styles['stat-dot']} ${styles['in-progress']}`} />
                      {stats.inProgress}
                    </span>
                    <span className={styles['stat-item']}>
                      <span className={`${styles['stat-dot']} ${styles.done}`} />
                      {stats.done}
                    </span>
                    {stats.totalHours > 0 && (
                      <span className={styles['stat-hours']}>
                        {stats.remainingHours}h / {stats.totalHours}h
                      </span>
                    )}
                  </div>
                </div>

                <VirtualizedTaskCell
                  tasks={todoTasks}
                  label={label}
                  status={TaskStatusEnum.TODO}
                  draggedTaskId={draggedTaskId}
                  focusedTaskId={focusedTaskId}
                  keyboardGrabState={keyboardGrabState}
                  keyboardDraggedTaskId={keyboardDraggedTaskId}
                  keyboardDropTargetStatus={keyboardDropTargetStatus}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onTaskClick={onTaskClick}
                  onKeyDown={onKeyDown}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />

                <VirtualizedTaskCell
                  tasks={inProgressTasks}
                  label={label}
                  status={TaskStatusEnum.IN_PROGRESS}
                  draggedTaskId={draggedTaskId}
                  focusedTaskId={focusedTaskId}
                  keyboardGrabState={keyboardGrabState}
                  keyboardDraggedTaskId={keyboardDraggedTaskId}
                  keyboardDropTargetStatus={keyboardDropTargetStatus}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onTaskClick={onTaskClick}
                  onKeyDown={onKeyDown}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />

                <VirtualizedTaskCell
                  tasks={doneTasks}
                  label={label}
                  status={TaskStatusEnum.DONE}
                  draggedTaskId={draggedTaskId}
                  focusedTaskId={focusedTaskId}
                  keyboardGrabState={keyboardGrabState}
                  keyboardDraggedTaskId={keyboardDraggedTaskId}
                  keyboardDropTargetStatus={keyboardDropTargetStatus}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onTaskClick={onTaskClick}
                  onKeyDown={onKeyDown}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            );
          })}
        </div>

        {sortedKeys.length === 0 && (
          <div className={styles['swimlanes-empty']} role="status">
            <MessageSquareIcon size={48} aria-hidden="true" />
            <h3 className={styles['swimlanes-empty-title']}>No Tasks Found</h3>
            <p className={styles['swimlanes-empty-description']}>
              There are no tasks to display in swimlanes view.
            </p>
          </div>
        )}
      </div>
    );
  }
);

SwimlanesBoard.displayName = 'SwimlanesBoard';
