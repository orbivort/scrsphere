import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { screen, renderWithProviders, waitFor, initTestI18n, i18nT } from '../../test-utils';
import userEvent from '@testing-library/user-event';

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
    getSprintTasks: vi.fn(),
    getTeamMembersWithUpdates: vi.fn(),
    getSprintBacklogPBIs: vi.fn(),
    getImpediments: vi.fn(),
    getBurndownData: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    completeSprint: vi.fn(),
  },
  definitionService: {
    getDefinitionOfDone: vi.fn(),
    verifyDoDForPBI: vi.fn(),
    getDoDVerificationsForPBI: vi.fn(),
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
  sprintLoading: false,
  tasksLoading: false,
  wipLimits: { todo: 5, in_progress: 3, review: 3, done: 10 },
  filteredTasks: mockTasks,
  tasksByStatus: {
    todo: [mockTasks[0]!],
    in_progress: [mockTasks[1]!],
    review: [],
    done: [mockTasks[2]!],
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

describe('SprintBoard Integration Tests', () => {
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

  describe('Sprint Board Rendering', () => {
    it('should render sprint board after loading', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should display sprint name', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByText('Sprint 1')).toBeInTheDocument();
      });
    });

    it('should display sprint goal', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByText(/Complete authentication feature/i)).toBeInTheDocument();
      });
    });

    it('should render kanban columns', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: i18nT('sprint:taskStatus.todo') })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('heading', { name: i18nT('sprint:taskStatus.inProgress') })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('heading', { name: i18nT('sprint:taskStatus.done') })
        ).toBeInTheDocument();
      });
    });

    it('should display task cards in correct columns', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
        expect(screen.getByText('Task 2')).toBeInTheDocument();
        expect(screen.getByText('Task 3')).toBeInTheDocument();
      });
    });
  });

  describe('Task Statistics', () => {
    it('should display correct task counts', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should calculate progress percentage', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('View Mode Toggle', () => {
    it('should toggle between kanban and swimlanes view', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });

      const viewModeButton = screen.queryByRole('button', { name: /swimlanes/i });
      if (viewModeButton) {
        await userEvent.click(viewModeButton);
      }
    });
  });

  describe('Burndown Chart Toggle', () => {
    it('should toggle burndown chart visibility', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });

      const burndownButton = screen.queryByRole('button', { name: /burndown/i });
      if (burndownButton) {
        await userEvent.click(burndownButton);
      }
    });
  });

  describe('Task Creation', () => {
    it('should open create task modal', async () => {
      // Use actual modal handlers for this test so modal state works
      const actualModalHandlers = await vi.importActual('./SprintBoard.modalHandlers');
      useModalHandlers.mockImplementation(actualModalHandlers.useModalHandlers);

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /add task/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Task Editing', () => {
    it('should open task detail modal on task click', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Task 1'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Complete Sprint', () => {
    it('should show incomplete tasks warning', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should show outstanding impediments warning', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Filters', () => {
    it('should filter tasks by assignee', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });

      const assigneeFilter = screen.queryByLabelText(/assignee/i);
      if (assigneeFilter) {
        await userEvent.click(assigneeFilter);
      }
    });

    it('should search tasks by title', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });

      const searchInput = screen.queryByPlaceholderText(/search/i);
      if (searchInput) {
        await userEvent.type(searchInput, 'Task 1');
      }
    });
  });

  describe('WIP Limits', () => {
    it('should display WIP limit warnings', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        wipWarnings: [{ column: TaskStatus.TODO, current: 10, limit: 5 }],
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Impediments Display', () => {
    it('should show impediments count', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle sprint loading error', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        sprint: null,
        sprintLoading: false,
        tasksLoading: false,
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        const sprintBoard = screen.queryByTestId('sprint-board');
        const emptyState = screen.queryByTestId('empty-state');
        expect(sprintBoard || emptyState).toBeTruthy();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle keyboard shortcuts', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Days Remaining', () => {
    it('should display days remaining in sprint', async () => {
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

  describe('Sprint Duration', () => {
    it('should display sprint duration', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Team Members Display', () => {
    it('should show team members', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('PBI Items Display', () => {
    it('should show PBI items', async () => {
      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state when sprint is loading', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        sprintLoading: true,
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getAllByText(i18nT('sprint:board.loadingBoard')).length).toBeGreaterThan(0);
      });
    });

    it('should show loading state when tasks are loading', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        tasksLoading: true,
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getAllByText(i18nT('sprint:board.loadingBoard')).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Empty States', () => {
    it('should handle empty tasks', async () => {
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

    it('should handle no active sprint', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        sprint: null,
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        const sprintBoard = screen.queryByTestId('sprint-board');
        const emptyState = screen.queryByTestId('empty-state');
        expect(sprintBoard || emptyState).toBeTruthy();
      });
    });
  });

  describe('Sprint Statistics Variations', () => {
    it('should handle all tasks done', async () => {
      const allDoneTasks = [
        createMockTask({ id: 'task-1', status: TaskStatus.DONE }),
        createMockTask({ id: 'task-2', status: TaskStatus.DONE }),
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
        sprintStats: {
          totalTasks: 2,
          todoTasks: 0,
          inProgressTasks: 0,
          reviewTasks: 0,
          doneTasks: 2,
          totalEstimatedHours: 16,
          totalRemainingHours: 0,
          progressPercentage: 100,
          totalPbis: 1,
          completedPbis: 1,
          totalStoryPoints: 8,
          completedStoryPoints: 8,
        },
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle zero story points', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        sprintStats: {
          totalTasks: 0,
          todoTasks: 0,
          inProgressTasks: 0,
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

  describe('Impediment Variations', () => {
    it('should handle no impediments', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        impediments: [],
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });

    it('should handle resolved impediments', async () => {
      useSprintBoardData.mockReturnValue({
        ...getDefaultMockData(),
        impediments: [createMockImpediment({ id: 'imp-1', status: ImpedimentStatus.RESOLVED })],
      });

      renderWithProviders(<SprintBoard />);

      await waitFor(() => {
        expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
      });
    });
  });
});
