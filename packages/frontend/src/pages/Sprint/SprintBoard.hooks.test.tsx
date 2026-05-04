import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import {
  useSprintBoardData,
  useFocusTrap,
  useKeyboardNavigation,
  useTaskMutations,
  useDragAndDrop,
  useTaskFormValidation,
} from './SprintBoard.hooks';
import { TaskStatus, type Task } from '../../types';
import { apiService } from '../../services';

vi.mock('../../services', () => ({
  apiService: {
    getActiveSprint: vi.fn(),
    getSprintTasks: vi.fn(),
    getTeam: vi.fn(),
    getBurndownData: vi.fn(),
    getDefinitionOfDone: vi.fn(),
    getImpediments: vi.fn(),
    getDoDComplianceReport: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    completeSprint: vi.fn(),
  },
}));

vi.mock('../../components/LiveAnnouncer', () => ({
  useAnnounce: () => vi.fn(),
}));

vi.mock('../../hooks/useMutationErrorHandler', () => ({
  useMutationErrorHandler: () => ({
    handleMutationError: vi.fn((error, options) => {
      if (options?.showToast) {
        options.showToast('Test error message');
      }
      return 'Test error message';
    }),
  }),
}));

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  sprintId: 'sprint-1',
  title: 'Test Task',
  description: 'Test description',
  status: TaskStatus.TODO,
  pbiId: 'pbi-1',
  assigneeId: 'user-1',
  estimatedHours: 8,
  remainingHours: 8,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe('useSprintBoardData Hook', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = createWrapper();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return default values when teamId is undefined', async () => {
    const { result } = renderHook(
      () =>
        useSprintBoardData({
          teamId: undefined,
          showBurndown: false,
          showDodVerification: false,
          filterAssignee: 'all',
          filterPbi: 'all',
          debouncedSearchQuery: '',
          swimlaneGroup: 'none',
        }),
      { wrapper }
    );

    expect(result.current.sprint).toBeNull();
    expect(result.current.tasks).toEqual([]);
  });

  it('should calculate WIP limits based on team size', async () => {
    const mockSprint = {
      id: 'sprint-1',
      teamId: 'team-1',
      name: 'Sprint 1',
      status: 'active',
      sprintGoal: 'Test goal',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      tasks: [],
      items: [],
    };

    vi.mocked(apiService.getActiveSprint).mockResolvedValue({
      data: mockSprint,
    } as never);

    vi.mocked(apiService.getSprintTasks).mockResolvedValue({
      data: [],
    } as never);

    vi.mocked(apiService.getTeam).mockResolvedValue({
      data: {
        id: 'team-1',
        name: 'Test Team',
        members: Array(5).fill({ id: 'member-1', userId: 'user-1' }),
      },
    } as never);

    vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
      data: { items: [] },
    } as never);

    vi.mocked(apiService.getImpediments).mockResolvedValue({
      data: [],
    } as never);

    const { result } = renderHook(
      () =>
        useSprintBoardData({
          teamId: 'team-1',
          showBurndown: false,
          showDodVerification: false,
          filterAssignee: 'all',
          filterPbi: 'all',
          debouncedSearchQuery: '',
          swimlaneGroup: 'none',
        }),
      { wrapper }
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.wipLimits).toBeDefined();
    expect(result.current.wipLimits.in_progress).toBeGreaterThan(0);
  });

  it('should filter tasks by assignee', async () => {
    const tasks = [
      createMockTask({ id: 'task-1', assigneeId: 'user-1' }),
      createMockTask({ id: 'task-2', assigneeId: 'user-2' }),
    ];

    const mockSprint = {
      id: 'sprint-1',
      teamId: 'team-1',
      name: 'Sprint 1',
      status: 'active',
      sprintGoal: 'Test goal',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      tasks,
      items: [],
    };

    vi.mocked(apiService.getActiveSprint).mockResolvedValue({
      data: mockSprint,
    } as never);

    vi.mocked(apiService.getSprintTasks).mockResolvedValue({
      data: tasks,
    } as never);

    vi.mocked(apiService.getTeam).mockResolvedValue({
      data: {
        id: 'team-1',
        name: 'Test Team',
        members: [],
      },
    } as never);

    vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
      data: { items: [] },
    } as never);

    vi.mocked(apiService.getImpediments).mockResolvedValue({
      data: [],
    } as never);

    const { result } = renderHook(
      () =>
        useSprintBoardData({
          teamId: 'team-1',
          showBurndown: false,
          showDodVerification: false,
          filterAssignee: 'user-1',
          filterPbi: 'all',
          debouncedSearchQuery: '',
          swimlaneGroup: 'none',
        }),
      { wrapper }
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0]?.assigneeId).toBe('user-1');
  });

  it('should filter tasks by search query', async () => {
    const tasks = [
      createMockTask({ id: 'task-1', title: 'Authentication feature' }),
      createMockTask({ id: 'task-2', title: 'Database migration' }),
    ];

    const mockSprint = {
      id: 'sprint-1',
      teamId: 'team-1',
      name: 'Sprint 1',
      status: 'active',
      sprintGoal: 'Test goal',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      tasks,
      items: [],
    };

    vi.mocked(apiService.getActiveSprint).mockResolvedValue({
      data: mockSprint,
    } as never);

    vi.mocked(apiService.getSprintTasks).mockResolvedValue({
      data: tasks,
    } as never);

    vi.mocked(apiService.getTeam).mockResolvedValue({
      data: {
        id: 'team-1',
        name: 'Test Team',
        members: [],
      },
    } as never);

    vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
      data: { items: [] },
    } as never);

    vi.mocked(apiService.getImpediments).mockResolvedValue({
      data: [],
    } as never);

    const { result } = renderHook(
      () =>
        useSprintBoardData({
          teamId: 'team-1',
          showBurndown: false,
          showDodVerification: false,
          filterAssignee: 'all',
          filterPbi: 'all',
          debouncedSearchQuery: 'authentication',
          swimlaneGroup: 'none',
        }),
      { wrapper }
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0]?.title).toBe('Authentication feature');
  });

  it('should group tasks by swimlane', async () => {
    const tasks = [
      createMockTask({ id: 'task-1', assigneeId: 'user-1', pbiId: 'pbi-1' }),
      createMockTask({ id: 'task-2', assigneeId: 'user-1', pbiId: 'pbi-2' }),
      createMockTask({ id: 'task-3', assigneeId: 'user-2', pbiId: 'pbi-1' }),
    ];

    const mockSprint = {
      id: 'sprint-1',
      teamId: 'team-1',
      name: 'Sprint 1',
      status: 'active',
      sprintGoal: 'Test goal',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      tasks,
      items: [],
    };

    vi.mocked(apiService.getActiveSprint).mockResolvedValue({
      data: mockSprint,
    } as never);

    vi.mocked(apiService.getSprintTasks).mockResolvedValue({
      data: tasks,
    } as never);

    vi.mocked(apiService.getTeam).mockResolvedValue({
      data: {
        id: 'team-1',
        name: 'Test Team',
        members: [],
      },
    } as never);

    vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
      data: { items: [] },
    } as never);

    vi.mocked(apiService.getImpediments).mockResolvedValue({
      data: [],
    } as never);

    const { result } = renderHook(
      () =>
        useSprintBoardData({
          teamId: 'team-1',
          showBurndown: false,
          showDodVerification: false,
          filterAssignee: 'all',
          filterPbi: 'all',
          debouncedSearchQuery: '',
          swimlaneGroup: 'assignee',
        }),
      { wrapper }
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.groupedBySwimlane).not.toBeNull();
    expect(Object.keys(result.current.groupedBySwimlane || {})).toContain('user-1');
    expect(Object.keys(result.current.groupedBySwimlane || {})).toContain('user-2');
  });

  it('should calculate sprint statistics correctly', async () => {
    const tasks = [
      createMockTask({
        id: 'task-1',
        status: TaskStatus.TODO,
        estimatedHours: 4,
        remainingHours: 4,
      }),
      createMockTask({
        id: 'task-2',
        status: TaskStatus.IN_PROGRESS,
        estimatedHours: 8,
        remainingHours: 6,
      }),
      createMockTask({
        id: 'task-3',
        status: TaskStatus.DONE,
        estimatedHours: 6,
        remainingHours: 0,
      }),
    ];

    const mockSprint = {
      id: 'sprint-1',
      teamId: 'team-1',
      name: 'Sprint 1',
      status: 'active',
      sprintGoal: 'Test goal',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      tasks,
      items: [{ id: 'pbi-1', storyPoints: 5 }],
    };

    vi.mocked(apiService.getActiveSprint).mockResolvedValue({
      data: mockSprint,
    } as never);

    vi.mocked(apiService.getSprintTasks).mockResolvedValue({
      data: tasks,
    } as never);

    vi.mocked(apiService.getTeam).mockResolvedValue({
      data: {
        id: 'team-1',
        name: 'Test Team',
        members: [],
      },
    } as never);

    vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
      data: { items: [] },
    } as never);

    vi.mocked(apiService.getImpediments).mockResolvedValue({
      data: [],
    } as never);

    const { result } = renderHook(
      () =>
        useSprintBoardData({
          teamId: 'team-1',
          showBurndown: false,
          showDodVerification: false,
          filterAssignee: 'all',
          filterPbi: 'all',
          debouncedSearchQuery: '',
          swimlaneGroup: 'none',
        }),
      { wrapper }
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.sprintStats.totalTasks).toBe(3);
    expect(result.current.sprintStats.todoTasks).toBe(1);
    expect(result.current.sprintStats.inProgressTasks).toBe(1);
    expect(result.current.sprintStats.doneTasks).toBe(1);
    expect(result.current.sprintStats.totalEstimatedHours).toBe(18);
    expect(result.current.sprintStats.totalRemainingHours).toBe(10);
  });

  it('should generate WIP warnings when limit exceeded', async () => {
    const tasks = Array(5)
      .fill(null)
      .map((_, i) => createMockTask({ id: `task-${i}`, status: TaskStatus.IN_PROGRESS }));

    const mockSprint = {
      id: 'sprint-1',
      teamId: 'team-1',
      name: 'Sprint 1',
      status: 'active',
      sprintGoal: 'Test goal',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      tasks,
      items: [],
    };

    vi.mocked(apiService.getActiveSprint).mockResolvedValue({
      data: mockSprint,
    } as never);

    vi.mocked(apiService.getSprintTasks).mockResolvedValue({
      data: tasks,
    } as never);

    vi.mocked(apiService.getTeam).mockResolvedValue({
      data: {
        id: 'team-1',
        name: 'Test Team',
        members: Array(2).fill({ id: 'member-1', userId: 'user-1' }),
      },
    } as never);

    vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
      data: { items: [] },
    } as never);

    vi.mocked(apiService.getImpediments).mockResolvedValue({
      data: [],
    } as never);

    const { result } = renderHook(
      () =>
        useSprintBoardData({
          teamId: 'team-1',
          showBurndown: false,
          showDodVerification: false,
          filterAssignee: 'all',
          filterPbi: 'all',
          debouncedSearchQuery: '',
          swimlaneGroup: 'none',
        }),
      { wrapper }
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.wipWarnings.length).toBeGreaterThan(0);
    expect(result.current.wipWarnings[0]?.column).toBe(TaskStatus.IN_PROGRESS);
  });
});

describe('useFocusTrap Hook', () => {
  it('should return a ref for previously focused element', () => {
    const { result } = renderHook(() => useFocusTrap(false, { current: null }));

    expect(result.current).toBeDefined();
  });
});

describe('useKeyboardNavigation Hook', () => {
  const mockOptions = {
    tasks: [
      createMockTask({ id: 'task-1', status: TaskStatus.TODO }),
      createMockTask({ id: 'task-2', status: TaskStatus.IN_PROGRESS }),
      createMockTask({ id: 'task-3', status: TaskStatus.DONE }),
    ],
    filteredTasks: [
      createMockTask({ id: 'task-1', status: TaskStatus.TODO }),
      createMockTask({ id: 'task-2', status: TaskStatus.IN_PROGRESS }),
      createMockTask({ id: 'task-3', status: TaskStatus.DONE }),
    ],
    tasksByStatus: {
      todo: [createMockTask({ id: 'task-1', status: TaskStatus.TODO })],
      in_progress: [createMockTask({ id: 'task-2', status: TaskStatus.IN_PROGRESS })],
      done: [createMockTask({ id: 'task-3', status: TaskStatus.DONE })],
    },
    wipLimits: { todo: 5, in_progress: 3, done: 10 },
    teamId: 'team-1',
    validateAndPrepareTransition: vi.fn(() => ({
      valid: true,
      updates: { status: TaskStatus.IN_PROGRESS },
    })),
    onMoveTask: vi.fn(),
    onOpenDetail: vi.fn(),
    onOpenKeyboardHelp: vi.fn(),
    onOpenCreateModal: vi.fn(),
    onToggleBurndown: vi.fn(),
    showToast: vi.fn(),
    isModalOpen: false,
  };

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useKeyboardNavigation(mockOptions));

    expect(result.current.focusedTaskId).toBeNull();
    expect(result.current.keyboardGrabState).toBe('idle');
    expect(result.current.keyboardDraggedTaskId).toBeNull();
    expect(result.current.keyboardDropTargetStatus).toBeNull();
  });

  it('should handle space key to start grab mode', () => {
    const { result } = renderHook(() => useKeyboardNavigation(mockOptions));

    const task = createMockTask({ id: 'task-1', status: TaskStatus.TODO });

    act(() => {
      result.current.handleKeyDown(
        {
          key: ' ',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent,
        task
      );
    });

    expect(result.current.keyboardGrabState).toBe('grabbed');
    expect(result.current.keyboardDraggedTaskId).toBe('task-1');
  });

  it('should handle enter key to open detail modal', () => {
    const { result } = renderHook(() => useKeyboardNavigation(mockOptions));

    const task = createMockTask({ id: 'task-1', status: TaskStatus.TODO });

    act(() => {
      result.current.handleKeyDown(
        {
          key: 'Enter',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent,
        task
      );
    });

    expect(mockOptions.onOpenDetail).toHaveBeenCalledWith(task);
  });

  it('should handle arrow keys for navigation', () => {
    const { result } = renderHook(() => useKeyboardNavigation(mockOptions));

    const task = createMockTask({ id: 'task-1', status: TaskStatus.TODO });

    act(() => {
      result.current.handleKeyDown(
        {
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent,
        task
      );
    });

    expect(result.current.focusedTaskId).toBe('task-2');
  });

  it('should handle escape key to cancel grab mode', () => {
    const { result } = renderHook(() => useKeyboardNavigation(mockOptions));

    const task = createMockTask({ id: 'task-1', status: TaskStatus.TODO });

    act(() => {
      result.current.handleKeyDown(
        {
          key: ' ',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent,
        task
      );
    });

    expect(result.current.keyboardGrabState).toBe('grabbed');

    act(() => {
      result.current.handleKeyDown(
        {
          key: 'Escape',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent,
        task
      );
    });

    expect(result.current.keyboardGrabState).toBe('idle');
    expect(result.current.keyboardDraggedTaskId).toBeNull();
  });
});

describe('useTaskMutations Hook', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = createWrapper();
  });

  const mockOptions = {
    sprintId: 'sprint-1',
    teamId: 'team-1',
    onCloseModal: vi.fn(),
    onCloseCompleteSprintModal: vi.fn(),
    onSetCompleteSprintError: vi.fn(),
    onNavigateToIncrement: vi.fn(),
    showToast: vi.fn(),
  };

  it('should create task mutation successfully', async () => {
    vi.mocked(apiService.createTask).mockResolvedValue({ data: { id: 'task-1' } } as never);

    const { result } = renderHook(() => useTaskMutations(mockOptions), { wrapper });

    await act(async () => {
      result.current.createTaskMutation.mutate({ title: 'New Task' });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(apiService.createTask).toHaveBeenCalled();
  });

  it('should update task mutation successfully', async () => {
    vi.mocked(apiService.updateTask).mockResolvedValue({ data: { id: 'task-1' } } as never);

    const { result } = renderHook(() => useTaskMutations(mockOptions), { wrapper });

    await act(async () => {
      result.current.updateTaskMutation.mutate({
        taskId: 'task-1',
        updates: { title: 'Updated Task' },
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(apiService.updateTask).toHaveBeenCalled();
  });

  it('should delete task mutation successfully', async () => {
    vi.mocked(apiService.deleteTask).mockResolvedValue({} as never);

    const { result } = renderHook(() => useTaskMutations(mockOptions), { wrapper });

    await act(async () => {
      result.current.deleteTaskMutation.mutate('task-1');
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(apiService.deleteTask).toHaveBeenCalledWith('sprint-1', 'task-1');
  });

  it('should complete sprint mutation successfully', async () => {
    vi.mocked(apiService.completeSprint).mockResolvedValue({} as never);

    const { result } = renderHook(() => useTaskMutations(mockOptions), { wrapper });

    await act(async () => {
      result.current.completeSprintMutation.mutate();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(apiService.completeSprint).toHaveBeenCalledWith('sprint-1');
  });
});

describe('useDragAndDrop Hook', () => {
  const mockOptions = {
    tasks: [
      createMockTask({ id: 'task-1', status: TaskStatus.TODO }),
      createMockTask({ id: 'task-2', status: TaskStatus.IN_PROGRESS }),
    ],
    wipLimits: { todo: 5, in_progress: 3, done: 10 },
    tasksByStatus: {
      todo: [createMockTask({ id: 'task-1', status: TaskStatus.TODO })],
      in_progress: [createMockTask({ id: 'task-2', status: TaskStatus.IN_PROGRESS })],
      done: [],
    },
    teamId: 'team-1',
    validateAndPrepareTransition: vi.fn(() => ({
      valid: true,
      updates: { status: TaskStatus.IN_PROGRESS },
    })),
    onMoveTask: vi.fn(),
    showToast: vi.fn(),
    onSetWorkflowError: vi.fn(),
  };

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDragAndDrop(mockOptions));

    expect(result.current.draggedTaskId).toBeNull();
    expect(result.current.dropTargetColumn).toBeNull();
  });

  it('should handle drag start', () => {
    const { result } = renderHook(() => useDragAndDrop(mockOptions));

    const mockEvent = {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: null,
      },
      target: { style: { opacity: '1' } },
    } as unknown as React.DragEvent;

    act(() => {
      result.current.handleDragStart(mockEvent, 'task-1');
    });

    expect(result.current.draggedTaskId).toBe('task-1');
    expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith('taskId', 'task-1');
  });

  it('should handle drag end', () => {
    const { result } = renderHook(() => useDragAndDrop(mockOptions));

    const mockEvent = {
      target: { style: { opacity: '1' } },
    } as unknown as React.DragEvent;

    act(() => {
      result.current.handleDragEnd(mockEvent);
    });

    expect(result.current.draggedTaskId).toBeNull();
    expect(result.current.dropTargetColumn).toBeNull();
  });

  it('should handle drag over', () => {
    const { result } = renderHook(() => useDragAndDrop(mockOptions));

    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        dropEffect: null,
      },
    } as unknown as React.DragEvent;

    act(() => {
      result.current.handleDragOver(mockEvent, TaskStatus.IN_PROGRESS);
    });

    expect(result.current.dropTargetColumn).toBe(TaskStatus.IN_PROGRESS);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should handle drag leave', () => {
    const { result } = renderHook(() => useDragAndDrop(mockOptions));

    act(() => {
      result.current.handleDragLeave();
    });

    expect(result.current.dropTargetColumn).toBeNull();
  });
});

describe('useTaskFormValidation Hook', () => {
  const mockOptions = {
    formData: {
      title: 'Test Task',
      description: 'Test description',
      pbiId: 'pbi-1',
      assigneeId: 'user-1',
      estimatedHours: 8,
      remainingHours: 8,
    },
    selectedTask: null,
    onSetFormErrors: vi.fn(),
  };

  it('should validate form successfully', () => {
    const { result } = renderHook(() => useTaskFormValidation(mockOptions));

    const isValid = result.current.validateForm();

    expect(isValid).toBe(true);
  });

  it('should fail validation for empty title', () => {
    const { result } = renderHook(() =>
      useTaskFormValidation({
        ...mockOptions,
        formData: {
          ...mockOptions.formData,
          title: '',
        },
      })
    );

    const isValid = result.current.validateForm();

    expect(isValid).toBe(false);
    expect(mockOptions.onSetFormErrors).toHaveBeenCalled();
  });

  it('should validate status transition correctly', () => {
    const { result } = renderHook(() => useTaskFormValidation(mockOptions));

    const transitionResult = result.current.validateTaskStatusTransition(
      TaskStatus.TODO,
      TaskStatus.IN_PROGRESS
    );

    expect(transitionResult.valid).toBe(true);
  });

  it('should reject invalid status transition', () => {
    const { result } = renderHook(() => useTaskFormValidation(mockOptions));

    const transitionResult = result.current.validateTaskStatusTransition(
      TaskStatus.TODO,
      TaskStatus.DONE
    );

    expect(transitionResult.valid).toBe(false);
    expect(transitionResult.message).toContain('not allowed');
  });

  it('should get available transitions for a status', () => {
    const { result } = renderHook(() => useTaskFormValidation(mockOptions));

    const transitions = result.current.getAvailableTransitions(TaskStatus.TODO);

    expect(transitions).toContain(TaskStatus.IN_PROGRESS);
  });

  it('should validate and prepare transition with WIP limits', () => {
    const { result } = renderHook(() => useTaskFormValidation(mockOptions));

    const task = createMockTask({ id: 'task-1', status: TaskStatus.TODO });
    const transitionResult = result.current.validateAndPrepareTransition(
      task,
      TaskStatus.IN_PROGRESS,
      {
        checkWipLimits: true,
        wipLimits: { todo: 5, in_progress: 3, done: 10 },
        tasksByStatus: {
          todo: [],
          in_progress: [],
          done: [],
        },
      }
    );

    expect(transitionResult.valid).toBe(true);
  });

  it('should fail transition when WIP limit exceeded', () => {
    const { result } = renderHook(() => useTaskFormValidation(mockOptions));

    const task = createMockTask({ id: 'task-1', status: TaskStatus.TODO });
    const transitionResult = result.current.validateAndPrepareTransition(
      task,
      TaskStatus.IN_PROGRESS,
      {
        checkWipLimits: true,
        wipLimits: { todo: 5, in_progress: 2, done: 10 },
        tasksByStatus: {
          todo: [],
          in_progress: [createMockTask(), createMockTask()],
          done: [],
        },
      }
    );

    expect(transitionResult.valid).toBe(false);
    expect(transitionResult.error).toContain('WIP limit');
  });

  it('should fail transition when required fields missing for IN_PROGRESS', () => {
    const { result } = renderHook(() => useTaskFormValidation(mockOptions));

    const task = createMockTask({
      id: 'task-1',
      status: TaskStatus.TODO,
      assigneeId: undefined,
      estimatedHours: undefined,
    });
    const transitionResult = result.current.validateAndPrepareTransition(
      task,
      TaskStatus.IN_PROGRESS,
      {
        checkRequiredFields: true,
      }
    );

    expect(transitionResult.valid).toBe(false);
    expect(transitionResult.error).toContain('Assignee');
    expect(transitionResult.error).toContain('Estimated Hours');
  });

  it('should set remaining hours to 0 when moving to DONE', () => {
    const { result } = renderHook(() => useTaskFormValidation(mockOptions));

    const task = createMockTask({ id: 'task-1', status: TaskStatus.IN_PROGRESS });
    const transitionResult = result.current.validateAndPrepareTransition(task, TaskStatus.DONE);

    expect(transitionResult.valid).toBe(true);
    expect(transitionResult.updates?.remainingHours).toBe(0);
  });
});
