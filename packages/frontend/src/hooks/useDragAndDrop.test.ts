import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useDragAndDrop } from './useDragAndDrop';
import { TaskStatus, type Task } from '../types';

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Task 1',
    status: TaskStatus.TODO,
    pbiId: 'pbi-1',
    sprintId: 'sprint-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'task-2',
    title: 'Task 2',
    status: TaskStatus.IN_PROGRESS,
    sprintId: 'sprint-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'task-3',
    title: 'Task 3',
    status: TaskStatus.DONE,
    sprintId: 'sprint-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const mockSprintItems = [
  { id: 'pbi-1', status: 'DONE', storyPoints: 5 },
  { id: 'pbi-2', status: 'IN_PROGRESS', storyPoints: 3 },
];

describe('useDragAndDrop', () => {
  const mockOnStatusChange = vi.fn();
  const mockOnValidationError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    tasks: mockTasks,
    wipLimits: { todo: 10, in_progress: 3, done: 100 },
    sprintItems: mockSprintItems,
    onStatusChange: mockOnStatusChange,
    onValidationError: mockOnValidationError,
  };

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useDragAndDrop(defaultProps));

    expect(result.current.draggedTaskId).toBeNull();
    expect(result.current.dropTargetColumn).toBeNull();
    expect(result.current.isDragging).toBe(false);
  });

  describe('getAvailableTransitions', () => {
    it('should return correct transitions from TODO', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));
      const transitions = result.current.getAvailableTransitions(TaskStatus.TODO);
      expect(transitions).toEqual([TaskStatus.IN_PROGRESS]);
    });

    it('should return correct transitions from IN_PROGRESS', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));
      const transitions = result.current.getAvailableTransitions(TaskStatus.IN_PROGRESS);
      expect(transitions).toEqual([TaskStatus.TODO, TaskStatus.DONE]);
    });

    it('should return correct transitions from DONE', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));
      const transitions = result.current.getAvailableTransitions(TaskStatus.DONE);
      expect(transitions).toEqual([TaskStatus.IN_PROGRESS]);
    });
  });

  describe('validateTransition', () => {
    it('should allow valid transition from TODO to IN_PROGRESS', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));
      const task = mockTasks[0]; // TODO task

      const validation = result.current.validateTransition(task, TaskStatus.IN_PROGRESS);

      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('should reject invalid transition from TODO to DONE', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));
      const task = mockTasks[0]; // TODO task

      const validation = result.current.validateTransition(task, TaskStatus.DONE);

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Cannot move task');
    });

    it('should enforce WIP limits for IN_PROGRESS', () => {
      const { result } = renderHook(() =>
        useDragAndDrop({
          ...defaultProps,
          wipLimits: { todo: 10, in_progress: 1, done: 100 },
        })
      );
      const task = mockTasks[0]; // TODO task

      const validation = result.current.validateTransition(task, TaskStatus.IN_PROGRESS);

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('WIP limit reached');
    });

    it('should require parent PBI to be done for task completion', () => {
      const { result } = renderHook(() =>
        useDragAndDrop({
          ...defaultProps,
          sprintItems: [{ id: 'pbi-1', status: 'IN_PROGRESS', storyPoints: 5 }],
          tasks: [
            {
              ...mockTasks[1],
              pbiId: 'pbi-1', // IN_PROGRESS task with pbiId
            },
          ],
        })
      );
      const task = { ...mockTasks[1], pbiId: 'pbi-1' };

      const validation = result.current.validateTransition(task, TaskStatus.DONE);

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('parent PBI to be completed');
    });

    it('should provide updates when completing a task', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));
      const task = mockTasks[1]; // IN_PROGRESS task

      const validation = result.current.validateTransition(task, TaskStatus.DONE);

      expect(validation.valid).toBe(true);
      expect(validation.updates).toEqual({ remainingHours: 0 });
    });
  });

  describe('drag handlers', () => {
    it('should handle drag start', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
          setDragImage: vi.fn(),
        },
        currentTarget: {
          getBoundingClientRect: () => ({ width: 200 }),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(mockEvent, 'task-1');
      });

      expect(result.current.draggedTaskId).toBe('task-1');
      expect(result.current.isDragging).toBe(true);
    });

    it('should handle drag end', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      // First start drag
      const mockStartEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
          setDragImage: vi.fn(),
        },
        currentTarget: {
          getBoundingClientRect: () => ({ width: 200 }),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(mockStartEvent, 'task-1');
      });

      const mockEndEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragEnd(mockEndEvent);
      });

      expect(result.current.draggedTaskId).toBeNull();
      expect(result.current.isDragging).toBe(false);
    });

    it('should handle drag over', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragOver(mockEvent, TaskStatus.IN_PROGRESS);
      });

      expect(result.current.dropTargetColumn).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should handle drop with valid transition', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: () => 'task-1',
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDrop(mockEvent, TaskStatus.IN_PROGRESS);
      });

      expect(mockOnStatusChange).toHaveBeenCalledWith('task-1', TaskStatus.IN_PROGRESS, undefined);
      expect(result.current.draggedTaskId).toBeNull();
    });

    it('should handle drop with invalid transition', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: () => 'task-1',
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDrop(mockEvent, TaskStatus.DONE);
      });

      expect(mockOnValidationError).toHaveBeenCalled();
      expect(mockOnStatusChange).not.toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('should move task right with ArrowRight key', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      const mockEvent = {
        key: 'ArrowRight',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(mockEvent, mockTasks[0]);
      });

      expect(mockOnStatusChange).toHaveBeenCalledWith('task-1', TaskStatus.IN_PROGRESS, undefined);
    });

    it('should move task left with ArrowLeft key', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      const mockEvent = {
        key: 'ArrowLeft',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(mockEvent, mockTasks[1]);
      });

      expect(mockOnStatusChange).toHaveBeenCalledWith('task-2', TaskStatus.TODO, undefined);
    });

    it('should start drag mode with Space key', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      const mockEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(mockEvent, mockTasks[0]);
      });

      expect(result.current.draggedTaskId).toBe('task-1');
      expect(result.current.isDragging).toBe(true);
    });

    it('should cancel drag with Escape key', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      const spaceEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(spaceEvent, mockTasks[0]);
      });

      const escapeEvent = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(escapeEvent, mockTasks[0]);
      });

      expect(result.current.draggedTaskId).toBeNull();
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('clearDragState', () => {
    it('should reset all drag state', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      // First start drag with proper mock
      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
          setDragImage: vi.fn(),
        },
        currentTarget: {
          getBoundingClientRect: () => ({ width: 200 }),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(mockEvent, 'task-1');
      });

      act(() => {
        result.current.clearDragState();
      });

      expect(result.current.draggedTaskId).toBeNull();
      expect(result.current.dropTargetColumn).toBeNull();
      expect(result.current.isDragging).toBe(false);
    });
  });
});
