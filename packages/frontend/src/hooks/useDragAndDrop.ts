import { useState, useCallback, useRef } from 'react';

import { TaskStatus, type Task } from '../types';

export interface DragAndDropState {
  draggedTaskId: string | null;
  dropTargetColumn: TaskStatus | null;
  isDragging: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  updates?: Partial<Task>;
}

export interface UseDragAndDropOptions {
  tasks: Task[];
  wipLimits: { todo: number; in_progress: number; done: number };
  sprintItems: Array<{ id: string; status: string; storyPoints?: number }>;
  onStatusChange: (taskId: string, status: TaskStatus, updates?: Partial<Task>) => void;
  onValidationError?: (error: string) => void;
}

export interface UseDragAndDropReturn extends DragAndDropState {
  // Actions
  handleDragStart: (e: React.DragEvent, taskId: string) => void;
  handleDragEnd: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent, status: TaskStatus) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, status: TaskStatus) => void;
  handleKeyDown: (e: React.KeyboardEvent, task: Task) => void;

  // Validation
  validateTransition: (task: Task, targetStatus: TaskStatus) => ValidationResult;

  // Utilities
  getAvailableTransitions: (currentStatus: TaskStatus) => TaskStatus[];
  clearDragState: () => void;
}

/**
 * useDragAndDrop Hook
 *
 * Manages drag and drop state and operations for the sprint board.
 * Handles validation, WIP limits, and keyboard navigation.
 */
export function useDragAndDrop({
  tasks,
  wipLimits,
  sprintItems,
  onStatusChange,
  onValidationError,
}: UseDragAndDropOptions): UseDragAndDropReturn {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetColumn, setDropTargetColumn] = useState<TaskStatus | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Use ref to track drag image cleanup
  const dragImageRef = useRef<HTMLDivElement | null>(null);

  /**
   * Get available status transitions based on current status
   */
  const getAvailableTransitions = useCallback((currentStatus: TaskStatus): TaskStatus[] => {
    switch (currentStatus) {
      case TaskStatus.TODO:
        return [TaskStatus.IN_PROGRESS];
      case TaskStatus.IN_PROGRESS:
        return [TaskStatus.TODO, TaskStatus.DONE];
      case TaskStatus.DONE:
        return [TaskStatus.IN_PROGRESS];
      default:
        return [];
    }
  }, []);

  /**
   * Validate a status transition
   */
  const validateTransition = useCallback(
    (task: Task, targetStatus: TaskStatus): ValidationResult => {
      // Check if transition is allowed
      const availableTransitions = getAvailableTransitions(task.status);
      if (!availableTransitions.includes(targetStatus)) {
        return {
          valid: false,
          error: `Cannot move task from ${task.status} to ${targetStatus}`,
        };
      }

      // Check WIP limits for IN_PROGRESS
      if (targetStatus === TaskStatus.IN_PROGRESS) {
        const inProgressCount = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
        if (inProgressCount >= wipLimits.in_progress) {
          return {
            valid: false,
            error: `WIP limit reached for In Progress column (max: ${wipLimits.in_progress})`,
          };
        }
      }

      // Check if task has required fields for DONE
      if (targetStatus === TaskStatus.DONE) {
        const missingFields: string[] = [];

        // Check if parent PBI is done
        if (task.pbiId) {
          const pbi = sprintItems.find((item) => item.id === task.pbiId);
          if (pbi && pbi.status !== 'DONE') {
            missingFields.push('parent PBI to be completed');
          }
        }

        if (missingFields.length > 0) {
          return {
            valid: false,
            error: `Task cannot be marked as Done. Missing: ${missingFields.join(', ')}`,
          };
        }

        // Return updates needed for completion
        return {
          valid: true,
          updates: {
            remainingHours: 0,
          },
        };
      }

      return { valid: true };
    },
    [tasks, wipLimits, sprintItems, getAvailableTransitions]
  );

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    setIsDragging(true);

    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);

    // Create custom drag image if needed
    const taskElement = e.currentTarget as HTMLElement;
    const rect = taskElement.getBoundingClientRect();
    e.dataTransfer.setDragImage(taskElement, rect.width / 2, 20);
  }, []);

  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggedTaskId(null);
    setDropTargetColumn(null);
    setIsDragging(false);

    // Clean up drag image
    if (dragImageRef.current) {
      dragImageRef.current.remove();
      dragImageRef.current = null;
    }
  }, []);

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetColumn(status);
  }, []);

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback(() => {
    setDropTargetColumn(null);
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent, status: TaskStatus) => {
      e.preventDefault();

      const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
      if (!taskId) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Validate transition
      const validation = validateTransition(task, status);

      if (!validation.valid) {
        onValidationError?.(validation.error ?? 'Invalid transition');
        setDraggedTaskId(null);
        setDropTargetColumn(null);
        setIsDragging(false);
        return;
      }

      // Execute status change
      onStatusChange(taskId, status, validation.updates);

      // Reset state
      setDraggedTaskId(null);
      setDropTargetColumn(null);
      setIsDragging(false);
    },
    [draggedTaskId, tasks, validateTransition, onStatusChange, onValidationError]
  );

  /**
   * Handle keyboard navigation for accessibility
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, task: Task) => {
      // Handle arrow keys for status change
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();

        const availableTransitions = getAvailableTransitions(task.status);
        if (availableTransitions.length === 0) return;

        let targetStatus: TaskStatus | null = null;

        if (e.key === 'ArrowRight') {
          // Move forward in workflow
          if (task.status === TaskStatus.TODO) targetStatus = TaskStatus.IN_PROGRESS;
          else if (task.status === TaskStatus.IN_PROGRESS) targetStatus = TaskStatus.DONE;
        } else {
          // Move backward in workflow
          if (task.status === TaskStatus.DONE) targetStatus = TaskStatus.IN_PROGRESS;
          else if (task.status === TaskStatus.IN_PROGRESS) targetStatus = TaskStatus.TODO;
        }

        if (targetStatus) {
          const validation = validateTransition(task, targetStatus);

          if (validation.valid) {
            onStatusChange(task.id, targetStatus, validation.updates);
          } else {
            onValidationError?.(validation.error ?? 'Cannot move task');
          }
        }
      }

      // Handle Space key to start "drag" mode
      if (e.key === ' ' && !isDragging) {
        e.preventDefault();
        setDraggedTaskId(task.id);
        setIsDragging(true);
      }

      // Handle Escape to cancel drag
      if (e.key === 'Escape' && isDragging) {
        e.preventDefault();
        setDraggedTaskId(null);
        setDropTargetColumn(null);
        setIsDragging(false);
      }
    },
    [getAvailableTransitions, validateTransition, onStatusChange, onValidationError, isDragging]
  );

  /**
   * Clear all drag state
   */
  const clearDragState = useCallback(() => {
    setDraggedTaskId(null);
    setDropTargetColumn(null);
    setIsDragging(false);
  }, []);

  return {
    draggedTaskId,
    dropTargetColumn,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleKeyDown,
    validateTransition,
    getAvailableTransitions,
    clearDragState,
  };
}
