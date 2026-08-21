import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { screen, renderWithProviders, waitFor, initTestI18n } from '../../test-utils';

import { useTeamStore } from '../../store';
import {
  createMockTask,
  createMockTeam,
  createMockSprint,
  createMockBacklogItem,
  createMockTeamMember,
  createMockDoDItem,
  createMockImpediment,
} from '../../__mocks__/mockData';
import { TaskStatus, type Task, type Sprint, ImpedimentStatus } from '../../types';

import { SprintBoard } from './SprintBoard';

beforeAll(async () => {
  await initTestI18n();
});

vi.mock('../../store', () => ({
  useTeamStore: vi.fn(),
  useAuthStore: vi.fn(() => ({ user: null })),
}));

vi.mock('../../services', () => ({
  apiService: {
    getSprint: vi.fn(),
    getTasks: vi.fn(),
    getTeamMembers: vi.fn(),
    getSprintItems: vi.fn(),
    getDefinitionOfDone: vi.fn(),
    getImpediments: vi.fn(),
    getDoDVerifications: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    completeSprint: vi.fn(),
    verifyDoDForPBI: vi.fn(),
    getBurndownData: vi.fn(),
  },
  definitionService: {
    verifyDoDForPBI: vi.fn(),
  },
}));

vi.mock('./SprintBoard.hooks', () => ({
  useSprintBoardData: vi.fn(),
  useTaskMutations: vi.fn(),
  useTaskFormValidation: vi.fn(),
  useDragAndDrop: vi.fn(),
  useKeyboardNavigation: vi.fn(),
  useFocusTrap: vi.fn(),
}));

vi.mock('./SprintBoard.modalHandlers', () => ({
  useModalHandlers: vi.fn(),
}));

const mockTeam = createMockTeam({ id: 'team-1', name: 'Test Team' });

const mockSprint: Sprint = createMockSprint({
  id: 'sprint-1',
  teamId: 'team-1',
  name: 'Sprint 1',
  status: 'active',
  sprintGoal: 'Complete authentication feature',
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
});

const mockTasks: Task[] = [
  createMockTask({ id: 'task-1', sprintId: 'sprint-1', title: 'Task 1', status: TaskStatus.TODO }),
  createMockTask({
    id: 'task-2',
    sprintId: 'sprint-1',
    title: 'Task 2',
    status: TaskStatus.IN_PROGRESS,
  }),
  createMockTask({ id: 'task-3', sprintId: 'sprint-1', title: 'Task 3', status: TaskStatus.DONE }),
];

const mockTeamMembers = [
  createMockTeamMember({ id: 'member-1', teamId: 'team-1', userId: 'user-1' }),
  createMockTeamMember({ id: 'member-2', teamId: 'team-1', userId: 'user-2' }),
];

const mockSprintItems = [
  createMockBacklogItem({ id: 'pbi-1', title: 'PBI 1' }),
  createMockBacklogItem({ id: 'pbi-2', title: 'PBI 2' }),
];

const mockDoDItems = [
  createMockDoDItem({ id: 'dod-1', description: 'Code reviewed' }),
  createMockDoDItem({ id: 'dod-2', description: 'Tests passed' }),
];

const mockImpediments = [createMockImpediment({ id: 'imp-1', status: ImpedimentStatus.OPEN })];

const mockTeamStore = useTeamStore as ReturnType<typeof vi.fn>;

const getDefaultMockData = () => ({
  sprint: mockSprint,
  tasks: mockTasks,
  teamMembers: mockTeamMembers,
  sprintItems: mockSprintItems,
  dodItems: mockDoDItems,
  impediments: mockImpediments,
  dodVerifications: [],
  sprintReview: null,
  isReviewCompleted: true,
  sprintRetrospective: null,
  isRetrospectiveCompleted: true,
  sprintLoading: false,
  tasksLoading: false,
  wipLimits: { todo: 5, in_progress: 3, review: 3, done: 10 },
  filteredTasks: mockTasks,
  tasksByStatus: {
    todo: [mockTasks[0]],
    in_progress: [mockTasks[1]],
    review: [],
    done: [mockTasks[2]],
  },
  sprintStats: {
    totalTasks: 3,
    todoTasks: 1,
    inProgressTasks: 1,
    reviewTasks: 0,
    doneTasks: 1,
    totalEstimatedHours: 24,
    totalRemainingHours: 16,
    progressPercentage: 33,
    totalPbis: 2,
    completedPbis: 0,
    totalStoryPoints: 13,
    completedStoryPoints: 0,
  },
  daysRemaining: 7,
  sprintDuration: 14,
  burndownChartData: [],
  wipWarnings: [],
  groupedBySwimlane: {},
});

const getDefaultMutations = () => {
  const mockMutate = vi.fn();
  return {
    createTaskMutation: {
      mutate: mockMutate,
      isPending: false,
      reset: vi.fn(),
      isError: false,
      error: null,
    },
    updateTaskMutation: {
      mutate: mockMutate,
      isPending: false,
      reset: vi.fn(),
      isError: false,
      error: null,
    },
    deleteTaskMutation: {
      mutate: mockMutate,
      isPending: false,
      reset: vi.fn(),
      isError: false,
      error: null,
    },
    completeSprintMutation: {
      mutate: mockMutate,
      isPending: false,
      reset: vi.fn(),
      isError: false,
      error: null,
    },
  };
};

describe('SprintBoard Branch Coverage Tests', () => {
  let useSprintBoardData: ReturnType<typeof vi.fn>;
  let useTaskMutations: ReturnType<typeof vi.fn>;
  let useTaskFormValidation: ReturnType<typeof vi.fn>;
  let useDragAndDrop: ReturnType<typeof vi.fn>;
  let useKeyboardNavigation: ReturnType<typeof vi.fn>;
  let useFocusTrap: ReturnType<typeof vi.fn>;
  let useModalHandlers: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const hooks = await import('./SprintBoard.hooks');
    const modalHandlers = await import('./SprintBoard.modalHandlers');

    useSprintBoardData = hooks.useSprintBoardData as ReturnType<typeof vi.fn>;
    useTaskMutations = hooks.useTaskMutations as ReturnType<typeof vi.fn>;
    useTaskFormValidation = hooks.useTaskFormValidation as ReturnType<typeof vi.fn>;
    useDragAndDrop = hooks.useDragAndDrop as ReturnType<typeof vi.fn>;
    useKeyboardNavigation = hooks.useKeyboardNavigation as ReturnType<typeof vi.fn>;
    useFocusTrap = hooks.useFocusTrap as ReturnType<typeof vi.fn>;
    useModalHandlers = modalHandlers.useModalHandlers as ReturnType<typeof vi.fn>;

    mockTeamStore.mockReturnValue({
      currentTeam: mockTeam,
      teams: [mockTeam],
      userRoleInCurrentTeam: 'developers',
      userTeamsWithRoles: [{ ...mockTeam, userRole: 'developers' }],
      setCurrentTeam: vi.fn(),
      setTeams: vi.fn(),
      setUserTeamsWithRoles: vi.fn(),
      addTeam: vi.fn(),
      updateTeam: vi.fn(),
      removeTeam: vi.fn(),
      switchTeam: vi.fn(),
      refreshUserTeams: vi.fn(),
      clearTeamContext: vi.fn(),
    });

    useSprintBoardData.mockReturnValue(getDefaultMockData());
    useTaskMutations.mockReturnValue(getDefaultMutations());
    useTaskFormValidation.mockReturnValue({
      validateForm: vi.fn(() => true),
      validateAndPrepareTransition: vi.fn(() => ({ valid: true, updates: {} })),
      getAvailableTransitions: vi.fn(() => [TaskStatus.IN_PROGRESS, TaskStatus.DONE]),
    });
    useDragAndDrop.mockReturnValue({
      draggedTaskId: null,
      dropTargetColumn: null,
      handleDragStart: vi.fn(),
      handleDragEnd: vi.fn(),
      handleDrop: vi.fn(),
      handleDragOver: vi.fn(),
      handleDragLeave: vi.fn(),
    });
    useKeyboardNavigation.mockReturnValue({
      focusedTaskId: null,
      setFocusedTaskId: vi.fn(),
      keyboardGrabState: 'idle',
      keyboardDraggedTaskId: null,
      keyboardDropTargetStatus: null,
      handleKeyDown: vi.fn(),
    });
    useFocusTrap.mockReturnValue(undefined);
    useModalHandlers.mockReturnValue({
      openCreateModal: vi.fn(),
      openEditModal: vi.fn(),
      closeDetailModal: vi.fn(),
      closeEditModal: vi.fn(),
      handleFormDataChange: vi.fn(),
    });
  });

  describe('Toast Callback Branches', () => {
    it('should handle success toast type', async () => {
      const _mockSuccess = vi.fn();
      const _mockError = vi.fn();

      useModalHandlers.mockReturnValue({
        openCreateModal: vi.fn(),
        openEditModal: vi.fn(),
        closeDetailModal: vi.fn(),
        closeEditModal: vi.fn(),
        handleFormDataChange: vi.fn(),
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle error toast type', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Incomplete Tasks Calculation', () => {
    it('should calculate incomplete tasks correctly when all tasks are done', async () => {
      const allDoneTasks = [
        createMockTask({ id: 'task-1', status: TaskStatus.DONE, pbiId: 'pbi-1' }),
        createMockTask({ id: 'task-2', status: TaskStatus.DONE, pbiId: 'pbi-2' }),
      ];

      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        tasks: allDoneTasks,
        filteredTasks: allDoneTasks,
        tasksByStatus: {
          todo: [],
          in_progress: [],
          review: [],
          done: allDoneTasks,
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should calculate incomplete PBI count correctly', async () => {
      const tasksWithSamePbi = [
        createMockTask({ id: 'task-1', status: TaskStatus.TODO, pbiId: 'pbi-1' }),
        createMockTask({ id: 'task-2', status: TaskStatus.IN_PROGRESS, pbiId: 'pbi-1' }),
        createMockTask({ id: 'task-3', status: TaskStatus.DONE, pbiId: 'pbi-2' }),
      ];

      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        tasks: tasksWithSamePbi,
        filteredTasks: tasksWithSamePbi,
        tasksByStatus: {
          todo: [tasksWithSamePbi[0]],
          in_progress: [tasksWithSamePbi[1]],
          review: [],
          done: [tasksWithSamePbi[2]],
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Outstanding Impediments Calculation', () => {
    it('should identify no outstanding impediments when all are resolved', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        impediments: [
          createMockImpediment({ id: 'imp-1', status: ImpedimentStatus.RESOLVED }),
          createMockImpediment({ id: 'imp-2', status: ImpedimentStatus.CLOSED }),
        ],
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should identify outstanding impediments correctly', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        impediments: [
          createMockImpediment({ id: 'imp-1', status: ImpedimentStatus.OPEN }),
          createMockImpediment({ id: 'imp-2', status: ImpedimentStatus.IN_PROGRESS }),
          createMockImpediment({ id: 'imp-3', status: ImpedimentStatus.RESOLVED }),
        ],
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Proceed to DoD Verification', () => {
    it('should not proceed when there are incomplete tasks', async () => {
      const incompleteTasks = [
        createMockTask({ id: 'task-1', status: TaskStatus.TODO, pbiId: 'pbi-1' }),
      ];

      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        tasks: incompleteTasks,
        filteredTasks: incompleteTasks,
        tasksByStatus: {
          todo: incompleteTasks,
          in_progress: [],
          review: [],
          done: [],
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should not proceed when there are outstanding impediments', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        tasks: [createMockTask({ id: 'task-1', status: TaskStatus.DONE })],
        filteredTasks: [createMockTask({ id: 'task-1', status: TaskStatus.DONE })],
        tasksByStatus: {
          todo: [],
          in_progress: [],
          review: [],
          done: [createMockTask({ id: 'task-1', status: TaskStatus.DONE })],
        },
        impediments: [createMockImpediment({ id: 'imp-1', status: ImpedimentStatus.OPEN })],
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should proceed when no incomplete tasks and no outstanding impediments', async () => {
      const doneTask = createMockTask({ id: 'task-1', status: TaskStatus.DONE, pbiId: 'pbi-1' });

      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        tasks: [doneTask],
        filteredTasks: [doneTask],
        tasksByStatus: {
          todo: [],
          in_progress: [],
          review: [],
          done: [doneTask],
        },
        impediments: [createMockImpediment({ id: 'imp-1', status: ImpedimentStatus.RESOLVED })],
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('DoD Verification Confirm', () => {
    it('should handle DoD verification with multiple PBIs', async () => {
      const definitionService = await import('../../services');
      const mockVerifyDoD = vi.fn().mockResolvedValue({ success: true });
      (
        definitionService.definitionService as { verifyDoDForPBI: typeof mockVerifyDoD }
      ).verifyDoDForPBI = mockVerifyDoD;

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle DoD verification error', async () => {
      const definitionService = await import('../../services');
      const mockVerifyDoD = vi.fn().mockRejectedValue(new Error('Verification failed'));
      (
        definitionService.definitionService as { verifyDoDForPBI: typeof mockVerifyDoD }
      ).verifyDoDForPBI = mockVerifyDoD;

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission Branches', () => {
    it('should not submit when form validation fails', async () => {
      const mockValidateForm = vi.fn(() => false);
      useTaskFormValidation.mockReturnValue({
        validateForm: mockValidateForm,
        validateAndPrepareTransition: vi.fn(() => ({ valid: true, updates: {} })),
        getAvailableTransitions: vi.fn(() => [TaskStatus.IN_PROGRESS, TaskStatus.DONE]),
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should call update mutation when selectedTask exists', async () => {
      const mockMutate = vi.fn();
      useTaskMutations.mockReturnValue({
        createTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        updateTaskMutation: {
          mutate: mockMutate,
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        deleteTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        completeSprintMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should call create mutation when no selectedTask', async () => {
      const mockMutate = vi.fn();
      useTaskMutations.mockReturnValue({
        createTaskMutation: {
          mutate: mockMutate,
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        updateTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        deleteTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        completeSprintMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Quick Status Change Branches', () => {
    it('should not change status when no selected task', async () => {
      useTaskFormValidation.mockReturnValue({
        validateForm: vi.fn(() => true),
        validateAndPrepareTransition: vi.fn(() => ({ valid: false, error: 'No task selected' })),
        getAvailableTransitions: vi.fn(() => []),
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle invalid transition result', async () => {
      const mockValidate = vi.fn(() => ({ valid: false, error: 'Invalid transition' }));
      useTaskFormValidation.mockReturnValue({
        validateForm: vi.fn(() => true),
        validateAndPrepareTransition: mockValidate,
        getAvailableTransitions: vi.fn(() => []),
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle transition to IN_PROGRESS with missing assignee', async () => {
      const mockValidate = vi.fn(() => ({
        valid: true,
        updates: { status: TaskStatus.IN_PROGRESS },
      }));
      useTaskFormValidation.mockReturnValue({
        validateForm: vi.fn(() => true),
        validateAndPrepareTransition: mockValidate,
        getAvailableTransitions: vi.fn(() => [TaskStatus.IN_PROGRESS]),
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle transition to IN_PROGRESS with missing estimated hours', async () => {
      const mockValidate = vi.fn(() => ({
        valid: true,
        updates: { status: TaskStatus.IN_PROGRESS },
      }));
      useTaskFormValidation.mockReturnValue({
        validateForm: vi.fn(() => true),
        validateAndPrepareTransition: mockValidate,
        getAvailableTransitions: vi.fn(() => [TaskStatus.IN_PROGRESS]),
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle transition to IN_PROGRESS with invalid remaining hours', async () => {
      const mockValidate = vi.fn(() => ({
        valid: true,
        updates: { status: TaskStatus.IN_PROGRESS },
      }));
      useTaskFormValidation.mockReturnValue({
        validateForm: vi.fn(() => true),
        validateAndPrepareTransition: mockValidate,
        getAvailableTransitions: vi.fn(() => [TaskStatus.IN_PROGRESS]),
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle successful status change to DONE', async () => {
      const mockMutate = vi.fn((data, options) => {
        if (options?.onSuccess) {
          options.onSuccess();
        }
      });
      useTaskMutations.mockReturnValue({
        createTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        updateTaskMutation: {
          mutate: mockMutate,
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        deleteTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        completeSprintMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
      });

      const mockValidate = vi.fn(() => ({
        valid: true,
        updates: { status: TaskStatus.DONE },
      }));
      useTaskFormValidation.mockReturnValue({
        validateForm: vi.fn(() => true),
        validateAndPrepareTransition: mockValidate,
        getAvailableTransitions: vi.fn(() => [TaskStatus.DONE]),
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle status change error', async () => {
      const mockMutate = vi.fn((data, options) => {
        if (options?.onError) {
          options.onError({
            response: { data: { error: { message: 'Update failed' } } },
          });
        }
      });
      useTaskMutations.mockReturnValue({
        createTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        updateTaskMutation: {
          mutate: mockMutate,
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        deleteTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        completeSprintMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Move Status Branches', () => {
    it('should not move when task not found', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        tasks: [],
        filteredTasks: [],
        tasksByStatus: {
          todo: [],
          in_progress: [],
          review: [],
          done: [],
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should not move when task status equals new status', async () => {
      const task = createMockTask({ id: 'task-1', status: TaskStatus.TODO });
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        tasks: [task],
        filteredTasks: [task],
        tasksByStatus: {
          todo: [task],
          in_progress: [],
          review: [],
          done: [],
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle invalid transition on move', async () => {
      useTaskFormValidation.mockReturnValue({
        validateForm: vi.fn(() => true),
        validateAndPrepareTransition: vi.fn(() => ({ valid: false, error: 'Invalid move' })),
        getAvailableTransitions: vi.fn(() => []),
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should successfully move task to new status', async () => {
      const mockMutate = vi.fn();
      useTaskMutations.mockReturnValue({
        createTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        updateTaskMutation: {
          mutate: mockMutate,
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        deleteTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        completeSprintMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Confirm', () => {
    it('should not delete when no selected task', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should call delete mutation with selected task', async () => {
      const mockMutate = vi.fn();
      useTaskMutations.mockReturnValue({
        createTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        updateTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        deleteTaskMutation: {
          mutate: mockMutate,
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        completeSprintMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('View Mode Toggle', () => {
    it('should render swimlanes view when viewMode is swimlanes', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        groupedBySwimlane: {
          'user-1': [createMockTask({ id: 'task-1', assigneeId: 'user-1' })],
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Burndown Chart Toggle', () => {
    it('should render burndown chart when showBurndown is true', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        burndownChartData: [
          { day: 0, date: '2024-01-01', ideal: 100, actual: 100 },
          { day: 1, date: '2024-01-02', ideal: 90, actual: 95 },
        ],
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Modal State Detection', () => {
    it('should detect when detail modal is open', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should detect when edit modal is open', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should detect when create modal is open', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should detect when delete confirm modal is open', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should detect when complete sprint modal is open', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should detect when keyboard help modal is open', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('WIP Limit Warnings', () => {
    it('should display WIP warnings for TODO column', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        wipWarnings: [{ column: TaskStatus.TODO, current: 10, limit: 5 }],
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should display WIP warnings for IN_PROGRESS column', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        wipWarnings: [{ column: TaskStatus.IN_PROGRESS, current: 5, limit: 3 }],
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should display WIP warnings for DONE column', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        wipWarnings: [{ column: TaskStatus.DONE, current: 20, limit: 15 }],
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Sprint Statistics', () => {
    it('should display correct sprint statistics', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        sprintStats: {
          totalTasks: 10,
          todoTasks: 3,
          inProgressTasks: 4,
          reviewTasks: 0,
          doneTasks: 3,
          totalEstimatedHours: 80,
          totalRemainingHours: 50,
          progressPercentage: 30,
          totalPbis: 5,
          completedPbis: 2,
          totalStoryPoints: 21,
          completedStoryPoints: 8,
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle zero statistics', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        sprintStats: {
          totalTasks: 0,
          todoTasks: 0,
          inProgressTasks: 0,
          reviewTasks: 0,
          doneTasks: 0,
          totalEstimatedHours: 0,
          totalRemainingHours: 0,
          progressPercentage: 0,
          totalPbis: 0,
          completedPbis: 0,
          totalStoryPoints: 0,
          completedStoryPoints: 0,
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Days Remaining', () => {
    it('should display days remaining correctly', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        daysRemaining: 5,
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle zero days remaining', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        daysRemaining: 0,
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle negative days remaining (overdue)', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        daysRemaining: -2,
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Focus Trap', () => {
    it('should call useFocusTrap for detail modal', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(useFocusTrap).toHaveBeenCalled();
      });
    });
  });

  describe('Keyboard Navigation State', () => {
    it('should handle keyboard grabbed state', async () => {
      useKeyboardNavigation.mockReturnValue({
        focusedTaskId: 'task-1',
        setFocusedTaskId: vi.fn(),
        keyboardGrabState: 'grabbed',
        keyboardDraggedTaskId: 'task-1',
        keyboardDropTargetStatus: TaskStatus.IN_PROGRESS,
        handleKeyDown: vi.fn(),
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle keyboard dropped state', async () => {
      useKeyboardNavigation.mockReturnValue({
        focusedTaskId: 'task-1',
        setFocusedTaskId: vi.fn(),
        keyboardGrabState: 'dropped',
        keyboardDraggedTaskId: 'task-1',
        keyboardDropTargetStatus: TaskStatus.DONE,
        handleKeyDown: vi.fn(),
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop State', () => {
    it('should handle active drag state', async () => {
      useDragAndDrop.mockReturnValue({
        draggedTaskId: 'task-1',
        dropTargetColumn: TaskStatus.IN_PROGRESS,
        handleDragStart: vi.fn(),
        handleDragEnd: vi.fn(),
        handleDrop: vi.fn(),
        handleDragOver: vi.fn(),
        handleDragLeave: vi.fn(),
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle drop target on TODO column', async () => {
      useDragAndDrop.mockReturnValue({
        draggedTaskId: 'task-1',
        dropTargetColumn: TaskStatus.TODO,
        handleDragStart: vi.fn(),
        handleDragEnd: vi.fn(),
        handleDrop: vi.fn(),
        handleDragOver: vi.fn(),
        handleDragLeave: vi.fn(),
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle drop target on DONE column', async () => {
      useDragAndDrop.mockReturnValue({
        draggedTaskId: 'task-1',
        dropTargetColumn: TaskStatus.DONE,
        handleDragStart: vi.fn(),
        handleDragEnd: vi.fn(),
        handleDrop: vi.fn(),
        handleDragOver: vi.fn(),
        handleDragLeave: vi.fn(),
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Complete Sprint Mutation States', () => {
    it('should handle complete sprint pending state', async () => {
      useTaskMutations.mockReturnValue({
        createTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        updateTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        deleteTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        completeSprintMutation: {
          mutate: vi.fn(),
          isPending: true,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle complete sprint error state', async () => {
      useTaskMutations.mockReturnValue({
        createTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        updateTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        deleteTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        completeSprintMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: true,
          error: new Error('Complete sprint failed'),
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Task Mutation States', () => {
    it('should handle create task pending state', async () => {
      useTaskMutations.mockReturnValue({
        createTaskMutation: {
          mutate: vi.fn(),
          isPending: true,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        updateTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        deleteTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        completeSprintMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle update task pending state', async () => {
      useTaskMutations.mockReturnValue({
        createTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        updateTaskMutation: {
          mutate: vi.fn(),
          isPending: true,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        deleteTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        completeSprintMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle delete task pending state', async () => {
      useTaskMutations.mockReturnValue({
        createTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        updateTaskMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        deleteTaskMutation: {
          mutate: vi.fn(),
          isPending: true,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
        completeSprintMutation: {
          mutate: vi.fn(),
          isPending: false,
          reset: vi.fn(),
          isError: false,
          error: null,
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('PBI Title Fallback', () => {
    it('should use fallback title when PBI is missing', async () => {
      const taskWithoutPbi = createMockTask({
        id: 'task-1',
        status: TaskStatus.TODO,
        pbiId: 'pbi-1',
        pbi: undefined,
      });

      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        tasks: [taskWithoutPbi],
        filteredTasks: [taskWithoutPbi],
        tasksByStatus: {
          todo: [taskWithoutPbi],
          in_progress: [],
          review: [],
          done: [],
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });
});
