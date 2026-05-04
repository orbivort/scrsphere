import { renderHook, act } from '@testing-library/react';

import { useSprintPlanningState } from './useSprintPlanningState';
import { MoSCoWPriority, ItemStatus } from '../types';

describe('useSprintPlanningState Hook', () => {
  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      expect(result.current.state.sprint.selectedId).toBeNull();
      expect(result.current.state.sprint.backlogItems).toEqual([]);
      expect(result.current.state.modals.task.isOpen).toBe(false);
      expect(result.current.state.modals.capacity.isOpen).toBe(false);
      expect(result.current.state.modals.sprintGoal.isOpen).toBe(false);
      expect(result.current.state.modals.startSprint.isOpen).toBe(false);
      expect(result.current.state.drag.draggedItemId).toBeNull();
      expect(result.current.state.drag.isDraggingOver).toBe(false);
      expect(result.current.state.filter.backlogFilter).toBe('ready');
      expect(result.current.state.filter.focusedItemIndex).toBe(-1);
      expect(result.current.state.planning.startTime).toBeNull();
      expect(result.current.state.planning.elapsedTime).toBe(0);
      expect(result.current.state.planning.toasts).toEqual([]);
    });
  });

  describe('Sprint Selection', () => {
    it('should select a sprint', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.selectSprint('sprint-1');
      });

      expect(result.current.state.sprint.selectedId).toBe('sprint-1');
    });

    it('should set start time when selecting first sprint', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.selectSprint('sprint-1');
      });

      expect(result.current.state.planning.startTime).toBeInstanceOf(Date);
    });

    it('should not reset start time when selecting another sprint', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.selectSprint('sprint-1');
      });

      const firstStartTime = result.current.state.planning.startTime;

      act(() => {
        result.current.actions.selectSprint('sprint-2');
      });

      expect(result.current.state.planning.startTime).toBe(firstStartTime);
    });

    it('should deselect sprint when passed null', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.selectSprint('sprint-1');
      });

      expect(result.current.state.sprint.selectedId).toBe('sprint-1');

      act(() => {
        result.current.actions.selectSprint(null);
      });

      expect(result.current.state.sprint.selectedId).toBeNull();
    });
  });

  describe('Sprint Backlog Management', () => {
    const mockBacklogItem = {
      id: 'pbi-1',
      teamId: 'team-1',
      title: 'Test Feature',
      description: 'Test description',
      status: ItemStatus.READY,
      priority: MoSCoWPriority.MUST_HAVE,
      storyPoints: 5,
      businessValue: 10,
      labels: ['test'],
      acceptanceCriteria: 'Test criteria',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      createdBy: 'user-1',
    };

    it('should not add item without selected sprint', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.addToSprintBacklog(mockBacklogItem);
      });

      expect(result.current.state.sprint.backlogItems).toEqual([]);
      expect(result.current.state.planning.toasts).toHaveLength(1);
      expect(result.current.state.planning.toasts[0].type).toBe('warning');
    });

    it('should add item to sprint backlog', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.selectSprint('sprint-1');
      });

      act(() => {
        result.current.actions.addToSprintBacklog(mockBacklogItem);
      });

      expect(result.current.state.sprint.backlogItems).toHaveLength(1);
      expect(result.current.state.sprint.backlogItems[0].id).toBe('pbi-1');
      expect(result.current.state.sprint.backlogItems[0].isReady).toBe(true);
    });

    it('should not add duplicate items', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.selectSprint('sprint-1');
      });

      act(() => {
        result.current.actions.addToSprintBacklog(mockBacklogItem);
      });

      act(() => {
        result.current.actions.addToSprintBacklog(mockBacklogItem);
      });

      expect(result.current.state.sprint.backlogItems).toHaveLength(1);
      expect(result.current.state.planning.toasts.some((t) => t.type === 'warning')).toBe(true);
    });

    it('should remove item from sprint backlog', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.selectSprint('sprint-1');
      });

      act(() => {
        result.current.actions.addToSprintBacklog(mockBacklogItem);
      });

      expect(result.current.state.sprint.backlogItems).toHaveLength(1);

      act(() => {
        result.current.actions.removeFromSprintBacklog('pbi-1');
      });

      expect(result.current.state.sprint.backlogItems).toHaveLength(0);
    });

    it('should show error when removing non-existent item', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.removeFromSprintBacklog('non-existent');
      });

      expect(result.current.state.planning.toasts.some((t) => t.type === 'error')).toBe(true);
    });
  });

  describe('Item Readiness Check', () => {
    it('should mark item as ready when all criteria met', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      const completeItem = {
        id: 'pbi-1',
        teamId: 'team-1',
        title: 'Complete Feature',
        description: 'Has description',
        status: ItemStatus.READY,
        priority: MoSCoWPriority.MUST_HAVE,
        storyPoints: 5,
        businessValue: 10,
        labels: [],
        acceptanceCriteria: 'Has criteria',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user-1',
      };

      act(() => {
        result.current.actions.selectSprint('sprint-1');
      });

      act(() => {
        result.current.actions.addToSprintBacklog(completeItem);
      });

      expect(result.current.state.sprint.backlogItems[0].isReady).toBe(true);
      expect(result.current.state.sprint.backlogItems[0].readyChecklist).toHaveLength(4);
      expect(
        result.current.state.sprint.backlogItems[0].readyChecklist?.every((c) => c.checked)
      ).toBe(true);
    });

    it('should mark item as not ready when criteria missing', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      const incompleteItem = {
        id: 'pbi-1',
        teamId: 'team-1',
        title: 'Incomplete Feature',
        description: '',
        status: ItemStatus.NEW,
        priority: MoSCoWPriority.MUST_HAVE,
        storyPoints: 0,
        businessValue: 10,
        labels: [],
        acceptanceCriteria: '',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user-1',
      };

      act(() => {
        result.current.actions.selectSprint('sprint-1');
      });

      act(() => {
        result.current.actions.addToSprintBacklog(incompleteItem);
      });

      expect(result.current.state.sprint.backlogItems[0].isReady).toBe(false);
      expect(
        result.current.state.sprint.backlogItems[0].readyChecklist?.some((c) => !c.checked)
      ).toBe(true);
    });
  });

  describe('Modal Management', () => {
    it('should open and close task modal', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.openTaskModal('item-1');
      });

      expect(result.current.state.modals.task.isOpen).toBe(true);
      expect(result.current.state.modals.task.itemId).toBe('item-1');

      act(() => {
        result.current.actions.closeTaskModal();
      });

      expect(result.current.state.modals.task.isOpen).toBe(false);
      expect(result.current.state.modals.task.itemId).toBeNull();
    });

    it('should open and close capacity modal', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.openCapacityModal();
      });

      expect(result.current.state.modals.capacity.isOpen).toBe(true);

      act(() => {
        result.current.actions.closeCapacityModal();
      });

      expect(result.current.state.modals.capacity.isOpen).toBe(false);
    });

    it('should open and close sprint goal modal', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.openSprintGoalModal();
      });

      expect(result.current.state.modals.sprintGoal.isOpen).toBe(true);

      act(() => {
        result.current.actions.closeSprintGoalModal();
      });

      expect(result.current.state.modals.sprintGoal.isOpen).toBe(false);
    });

    it('should open and close start sprint modal', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.openStartSprintModal();
      });

      expect(result.current.state.modals.startSprint.isOpen).toBe(true);

      act(() => {
        result.current.actions.closeStartSprintModal();
      });

      expect(result.current.state.modals.startSprint.isOpen).toBe(false);
    });
  });

  describe('Drag and Drop State', () => {
    it('should set dragged item', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.setDraggedItem('item-1');
      });

      expect(result.current.state.drag.draggedItemId).toBe('item-1');
    });

    it('should clear dragged item', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.setDraggedItem('item-1');
      });

      expect(result.current.state.drag.draggedItemId).toBe('item-1');

      act(() => {
        result.current.actions.setDraggedItem(null);
      });

      expect(result.current.state.drag.draggedItemId).toBeNull();
    });

    it('should set dragging over state', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.setDraggingOver(true);
      });

      expect(result.current.state.drag.isDraggingOver).toBe(true);

      act(() => {
        result.current.actions.setDraggingOver(false);
      });

      expect(result.current.state.drag.isDraggingOver).toBe(false);
    });
  });

  describe('Filter State', () => {
    it('should set backlog filter', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.setBacklogFilter('refined');
      });

      expect(result.current.state.filter.backlogFilter).toBe('refined');

      act(() => {
        result.current.actions.setBacklogFilter('all');
      });

      expect(result.current.state.filter.backlogFilter).toBe('all');
    });

    it('should set focused item index', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.setFocusedItemIndex(2);
      });

      expect(result.current.state.filter.focusedItemIndex).toBe(2);
    });
  });

  describe('Toast Notifications', () => {
    it('should show toast notification', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.showToast('success', 'Test message');
      });

      expect(result.current.state.planning.toasts).toHaveLength(1);
      expect(result.current.state.planning.toasts[0].type).toBe('success');
      expect(result.current.state.planning.toasts[0].message).toBe('Test message');
    });

    it('should remove toast notification', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.showToast('success', 'Test message');
      });

      expect(result.current.state.planning.toasts).toHaveLength(1);

      const toastId = result.current.state.planning.toasts[0].id;

      act(() => {
        result.current.actions.removeToast(toastId);
      });

      expect(result.current.state.planning.toasts).toHaveLength(0);
    });

    it('should auto-remove toast after duration', () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.showToast('success', 'Test message', 1000);
      });

      expect(result.current.state.planning.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.state.planning.toasts).toHaveLength(0);

      vi.useRealTimers();
    });

    it('should support different toast types', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.showToast('success', 'Success message');
      });

      act(() => {
        result.current.actions.showToast('error', 'Error message');
      });

      act(() => {
        result.current.actions.showToast('warning', 'Warning message');
      });

      act(() => {
        result.current.actions.showToast('info', 'Info message');
      });

      expect(result.current.state.planning.toasts).toHaveLength(4);
      expect(result.current.state.planning.toasts.map((t) => t.type)).toEqual([
        'success',
        'error',
        'warning',
        'info',
      ]);
    });
  });

  describe('Planning Timer', () => {
    it('should update elapsed time', () => {
      const { result } = renderHook(() => useSprintPlanningState());

      act(() => {
        result.current.actions.updateElapsedTime(300);
      });

      expect(result.current.state.planning.elapsedTime).toBe(300);
    });
  });
});
