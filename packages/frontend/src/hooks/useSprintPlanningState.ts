import { useState, useCallback } from 'react';

import { type TaskStatus, type ProductBacklogItem } from '../types';

interface SprintPlanningState {
  sprint: {
    selectedId: string | null;
    backlogItems: SprintBacklogItem[];
  };
  modals: {
    task: { isOpen: boolean; itemId: string | null };
    capacity: { isOpen: boolean };
    sprintGoal: { isOpen: boolean };
    startSprint: { isOpen: boolean };
  };
  drag: {
    draggedItemId: string | null;
    isDraggingOver: boolean;
  };
  filter: {
    backlogFilter: 'ready' | 'refined' | 'all';
    focusedItemIndex: number;
  };
  planning: {
    startTime: Date | null;
    elapsedTime: number;
    toasts: ToastMessage[];
  };
}

interface SprintBacklogItem extends ProductBacklogItem {
  tasks: SprintTask[];
  isReady?: boolean;
  readyChecklist?: ReadyChecklistItem[];
}

interface SprintTask {
  id: string;
  title: string;
  pbiId: string;
  assigneeId?: string;
  assigneeName?: string;
  status: TaskStatus;
  estimatedHours?: number;
  remainingHours?: number;
}

interface ReadyChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

const checkItemReadiness = (
  item: ProductBacklogItem
): { isReady: boolean; checklist: ReadyChecklistItem[] } => {
  const checklist: ReadyChecklistItem[] = [
    {
      id: '1',
      label: 'Has acceptance criteria',
      checked: !!item.acceptanceCriteria && item.acceptanceCriteria.length > 0,
    },
    {
      id: '2',
      label: 'Has story points',
      checked: item.storyPoints !== undefined && item.storyPoints > 0,
    },
    {
      id: '3',
      label: 'Has description',
      checked: !!item.description && item.description.length > 0,
    },
    { id: '4', label: 'Has priority', checked: !!item.priority },
  ];

  const isReady = checklist.every((c) => c.checked);
  return { isReady, checklist };
};

export const useSprintPlanningState = () => {
  const [state, setState] = useState<SprintPlanningState>({
    sprint: {
      selectedId: null,
      backlogItems: [],
    },
    modals: {
      task: { isOpen: false, itemId: null },
      capacity: { isOpen: false },
      sprintGoal: { isOpen: false },
      startSprint: { isOpen: false },
    },
    drag: {
      draggedItemId: null,
      isDraggingOver: false,
    },
    filter: {
      backlogFilter: 'ready',
      focusedItemIndex: -1,
    },
    planning: {
      startTime: null,
      elapsedTime: 0,
      toasts: [],
    },
  });

  const showToast = useCallback((type: ToastMessage['type'], message: string, duration = 5000) => {
    const id = `toast-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      planning: {
        ...prev.planning,
        toasts: [...(prev.planning.toasts || []), { id, type, message, duration }],
      },
    }));

    if (duration > 0) {
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          planning: {
            ...prev.planning,
            toasts: (prev.planning.toasts || []).filter((t: ToastMessage) => t.id !== id),
          },
        }));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      planning: {
        ...prev.planning,
        toasts: (prev.planning.toasts || []).filter((t: ToastMessage) => t.id !== id),
      },
    }));
  }, []);

  const selectSprint = useCallback((sprintId: string | null) => {
    setState((prev) => ({
      ...prev,
      sprint: { ...prev.sprint, selectedId: sprintId },
      planning: { ...prev.planning, startTime: prev.planning.startTime || new Date() },
    }));
  }, []);

  const addToSprintBacklog = useCallback(
    (item: ProductBacklogItem) => {
      if (!state.sprint.selectedId) {
        showToast('warning', 'Please select a sprint first');
        return;
      }

      if (state.sprint.backlogItems.some((sprintItem) => sprintItem.id === item.id)) {
        showToast('warning', `"${item.title}" is already in the sprint backlog`);
        return;
      }

      const { isReady, checklist } = checkItemReadiness(item);

      const sprintItem: SprintBacklogItem = {
        ...item,
        tasks: [],
        isReady,
        readyChecklist: checklist,
      };

      setState((prev) => ({
        ...prev,
        sprint: {
          ...prev.sprint,
          backlogItems: [...prev.sprint.backlogItems, sprintItem],
        },
      }));

      showToast('success', `"${item.title}" added to sprint backlog`);
    },
    [state.sprint.selectedId, state.sprint.backlogItems, showToast]
  );

  const removeFromSprintBacklog = useCallback(
    (itemId: string) => {
      const item = state.sprint.backlogItems.find((i) => i.id === itemId);
      if (!item) {
        showToast('error', 'Item not found in sprint backlog');
        return;
      }

      setState((prev) => ({
        ...prev,
        sprint: {
          ...prev.sprint,
          backlogItems: prev.sprint.backlogItems.filter((i) => i.id !== itemId),
        },
      }));

      showToast('info', `"${item.title}" removed from sprint backlog`);
    },
    [state.sprint.backlogItems, showToast]
  );

  const openTaskModal = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      modals: {
        ...prev.modals,
        task: { isOpen: true, itemId },
      },
    }));
  }, []);

  const closeTaskModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modals: {
        ...prev.modals,
        task: { isOpen: false, itemId: null },
      },
    }));
  }, []);

  const openCapacityModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modals: {
        ...prev.modals,
        capacity: { isOpen: true },
      },
    }));
  }, []);

  const closeCapacityModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modals: {
        ...prev.modals,
        capacity: { isOpen: false },
      },
    }));
  }, []);

  const openSprintGoalModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modals: {
        ...prev.modals,
        sprintGoal: { isOpen: true },
      },
    }));
  }, []);

  const closeSprintGoalModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modals: {
        ...prev.modals,
        sprintGoal: { isOpen: false },
      },
    }));
  }, []);

  const openStartSprintModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modals: {
        ...prev.modals,
        startSprint: { isOpen: true },
      },
    }));
  }, []);

  const closeStartSprintModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modals: {
        ...prev.modals,
        startSprint: { isOpen: false },
      },
    }));
  }, []);

  const setDraggedItem = useCallback((itemId: string | null) => {
    setState((prev) => ({
      ...prev,
      drag: {
        ...prev.drag,
        draggedItemId: itemId,
      },
    }));
  }, []);

  const setDraggingOver = useCallback((isDraggingOver: boolean) => {
    setState((prev) => ({
      ...prev,
      drag: {
        ...prev.drag,
        isDraggingOver,
      },
    }));
  }, []);

  const setFocusedItemIndex = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      filter: {
        ...prev.filter,
        focusedItemIndex: index,
      },
    }));
  }, []);

  const setBacklogFilter = useCallback((filter: 'ready' | 'refined' | 'all') => {
    setState((prev) => ({
      ...prev,
      filter: {
        ...prev.filter,
        backlogFilter: filter,
      },
    }));
  }, []);

  const updateElapsedTime = useCallback((time: number) => {
    setState((prev) => ({
      ...prev,
      planning: {
        ...prev.planning,
        elapsedTime: time,
      },
    }));
  }, []);

  return {
    state,
    actions: {
      showToast,
      removeToast,
      selectSprint,
      addToSprintBacklog,
      removeFromSprintBacklog,
      openTaskModal,
      closeTaskModal,
      openCapacityModal,
      closeCapacityModal,
      openSprintGoalModal,
      closeSprintGoalModal,
      openStartSprintModal,
      closeStartSprintModal,
      setDraggedItem,
      setDraggingOver,
      setFocusedItemIndex,
      setBacklogFilter,
      updateElapsedTime,
    },
  };
};
