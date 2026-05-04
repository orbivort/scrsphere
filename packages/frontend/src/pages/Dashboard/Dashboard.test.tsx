import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { useTeamStore, useAuthStore } from '../../store';
import { apiService } from '../../services';
import { SprintStatus, TaskStatus, ImpedimentStatus } from '../../types';

import { Dashboard } from './Dashboard';

vi.mock('../../store', () => ({
  useTeamStore: vi.fn(),
  useAuthStore: vi.fn(),
}));

vi.mock('../../services', () => ({
  apiService: {
    getActiveSprint: vi.fn(),
    getBurndownData: vi.fn(),
    getDailyUpdates: vi.fn(),
    getImpediments: vi.fn(),
    getProductGoals: vi.fn(),
  },
}));

vi.mock('../../hooks', () => ({
  useApiError: () => ({
    handleError: vi.fn((_error, fallback) => fallback || 'An error occurred'),
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

const mockSprint = {
  id: 'sprint-1',
  teamId: 'team-1',
  name: 'Sprint 1',
  startDate: '2026-02-01T00:00:00Z',
  endDate: '2026-02-14T23:59:59Z',
  sprintGoal: 'Complete authentication feature',
  status: SprintStatus.ACTIVE,
  tasks: [
    {
      id: 'task-1',
      sprintId: 'sprint-1',
      pbiId: 'pbi-1',
      title: 'Implement login',
      status: TaskStatus.DONE,
      assigneeId: 'user-1',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
    {
      id: 'task-2',
      sprintId: 'sprint-1',
      pbiId: 'pbi-1',
      title: 'Implement logout',
      status: TaskStatus.IN_PROGRESS,
      assigneeId: 'user-1',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
    {
      id: 'task-3',
      sprintId: 'sprint-1',
      pbiId: 'pbi-2',
      title: 'Write tests',
      status: TaskStatus.TODO,
      assigneeId: 'user-2',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
  ],
  createdAt: '2026-02-01T00:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
};

const mockBurndownData = {
  dates: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'],
  ideal: [30, 24, 18, 12, 6, 0],
  actual: [30, 28, 22, 18, 15, 10],
};

const mockDailyUpdates = [
  {
    id: 'update-1',
    sprintId: 'sprint-1',
    userId: 'user-1',
    updateDate: '2026-02-05',
    yesterdayWork: 'Completed login feature',
    todayWork: 'Working on logout',
    impediment: null,
    createdAt: '2026-02-05T09:00:00Z',
    user: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  },
  {
    id: 'update-2',
    sprintId: 'sprint-1',
    userId: 'user-2',
    updateDate: '2026-02-05',
    yesterdayWork: 'Code review',
    todayWork: 'Testing',
    impediment: 'Waiting for API response',
    createdAt: '2026-02-05T09:15:00Z',
    user: {
      id: 'user-2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  },
];

const mockImpediments = [
  {
    id: 'imp-1',
    teamId: 'team-1',
    title: 'API downtime',
    description: 'External API is experiencing intermittent downtime',
    reportedById: 'user-1',
    status: ImpedimentStatus.OPEN,
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-02-05T10:00:00Z',
  },
  {
    id: 'imp-2',
    teamId: 'team-1',
    title: 'Database performance issue',
    description: 'Slow query performance in production',
    reportedById: 'user-2',
    status: ImpedimentStatus.IN_PROGRESS,
    createdAt: '2026-02-04T14:00:00Z',
    updatedAt: '2026-02-05T09:00:00Z',
  },
  {
    id: 'imp-3',
    teamId: 'team-1',
    title: 'Resolved issue',
    description: 'This has been resolved',
    reportedById: 'user-1',
    status: ImpedimentStatus.RESOLVED,
    createdAt: '2026-02-03T10:00:00Z',
    updatedAt: '2026-02-04T15:00:00Z',
  },
];

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (useTeamStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentTeam: { id: 'team-1', name: 'Test Team' },
    });
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
      isAuthenticated: true,
    });

    (apiService.getProductGoals as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: [
        {
          id: 'goal-1',
          title: 'Test Goal',
          description: 'Test goal description',
          status: 'ACTIVE',
          teamId: 'team-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
  });

  describe('No Team Selected State', () => {
    it('should render empty state when no team is selected', () => {
      (useTeamStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        currentTeam: null,
      });

      renderWithProviders(<Dashboard />);

      expect(screen.getByText('No Team Selected')).toBeInTheDocument();
      expect(screen.getByText('Please select a team to continue.')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for empty state', () => {
      (useTeamStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        currentTeam: null,
      });

      renderWithProviders(<Dashboard />);

      const emptyState = screen.getByRole('status');
      expect(emptyState).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Loading State', () => {
    it('should render loading state while fetching sprint data', () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithProviders(<Dashboard />);

      // PageLoader renders message in both visually-hidden span and visible p tag
      expect(screen.getAllByText('Loading dashboard...').length).toBeGreaterThan(0);
    });

    it('should have proper ARIA attributes for loading state', () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithProviders(<Dashboard />);

      const loadingState = screen.getByRole('status');
      expect(loadingState).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Error State', () => {
    it('should render error state when sprint fetch fails', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network Error')
      );
      // Mock other APIs to prevent cascading errors
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });

      renderWithProviders(<Dashboard />);

      // Wait longer for retries to complete (query has retry: 2)
      await waitFor(
        () => {
          expect(
            screen.getByText((content) => content.includes('Failed to Load'))
          ).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });

    it('should have retry button in error state', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network Error')
      );
      // Mock other APIs to prevent cascading errors
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });

    it('should refetch when retry button is clicked', async () => {
      // Track API calls
      const mockGetActiveSprint = vi.fn();
      let callCount = 0;

      // Make ALL calls fail so the error state persists
      mockGetActiveSprint.mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error('Network Error'));
      });
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockImplementation(
        mockGetActiveSprint
      );

      // Mock other APIs
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });

      renderWithProviders(<Dashboard />);

      // Wait for error state to appear (after automatic retries)
      await waitFor(
        () => {
          const retryBtn = screen.queryByRole('button', { name: /Retry/i });
          expect(retryBtn).toBeTruthy();
        },
        { timeout: 20000, interval: 500 }
      );

      // Get initial call count
      const initialCallCount = callCount;
      expect(initialCallCount).toBeGreaterThanOrEqual(1);

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /Retry/i });
      fireEvent.click(retryButton);

      // Verify the API was called again after clicking retry
      await waitFor(
        () => {
          expect(callCount).toBeGreaterThan(initialCallCount);
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Sprint Summary', () => {
    beforeEach(() => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });
    });

    it('should render sprint summary card', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sprint 1')).toBeInTheDocument();
      });
    });

    it('should display sprint status badge', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('active')).toBeInTheDocument();
      });
    });

    it('should display sprint goal', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Complete authentication feature')).toBeInTheDocument();
      });
    });

    it('should display sprint statistics', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Days Remaining')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Tasks Done')).toBeInTheDocument();
      });
    });

    it('should calculate correct progress percentage', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // Look for percentage in the progress bar or stats
        const progressText = screen.getAllByText(/33%/i);
        expect(progressText.length).toBeGreaterThan(0);
      });
    });

    it('should have link to sprint board', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // Check for the link by aria-label since text includes an icon
        const sprintLink = screen.getByLabelText('View Sprint Board');
        expect(sprintLink).toBeInTheDocument();
        expect(sprintLink).toHaveAttribute('href', '/sprint');
      });
    });
  });

  describe('No Active Sprint State', () => {
    it('should render empty state when no active sprint', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: null,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('No Active Sprint')).toBeInTheDocument();
        expect(screen.getByText('Go to Sprint Planning')).toBeInTheDocument();
      });
    });
  });

  describe('My Tasks Section', () => {
    beforeEach(() => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });
    });

    it('should display tasks assigned to current user', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Implement login')).toBeInTheDocument();
        expect(screen.getByText('Implement logout')).toBeInTheDocument();
      });
    });

    it('should not display tasks assigned to other users', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Write tests')).not.toBeInTheDocument();
      });
    });

    it('should display task status badges', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // Use getAllByText since status may appear in multiple places
        const doneBadges = screen.getAllByText('DONE');
        const inProgressBadges = screen.getAllByText('IN PROGRESS');
        expect(doneBadges.length).toBeGreaterThan(0);
        expect(inProgressBadges.length).toBeGreaterThan(0);
      });
    });

    it('should display empty message when no tasks assigned', async () => {
      // Mock auth store with different user ID (no tasks assigned)
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-3', firstName: 'Jane', lastName: 'Smith' },
        isAuthenticated: true,
      });

      renderWithProviders(<Dashboard />);

      // Wait longer for component to load
      await waitFor(
        () => {
          expect(
            screen.getByText((content) => content.includes('No tasks assigned'))
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Team Updates Section', () => {
    it('should display daily updates when available', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Completed login feature')).toBeInTheDocument();
      });
    });

    it('should display impediment in daily update', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Waiting for API response')).toBeInTheDocument();
      });
    });

    it('should display loading state for team updates', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // LoadingState and SkeletonList both render aria-label
        expect(screen.getAllByLabelText('Loading team updates').length).toBeGreaterThan(0);
      });
    });

    it('should display error state when daily updates fetch fails', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Failed to load')
      );

      renderWithProviders(<Dashboard />);

      await waitFor(
        () => {
          expect(
            screen.getByText((content) => content.includes('Unable to load updates'))
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should display empty state when no daily updates exist', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: [],
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('No daily updates for today yet.')).toBeInTheDocument();
      });
    });

    it('should show submit button when no updates exist', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: [],
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        const submitButton = screen.getByLabelText('Submit your daily scrum update');
        expect(submitButton).toBeInTheDocument();
        expect(submitButton).toHaveAttribute('href', '/daily-scrum');
      });
    });
  });

  describe('Open Impediments Section', () => {
    it('should display open impediments when available', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('API downtime')).toBeInTheDocument();
        expect(screen.getByText('Database performance issue')).toBeInTheDocument();
      });
    });

    it('should not display resolved impediments', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Resolved issue')).not.toBeInTheDocument();
      });
    });

    it('should display impediment status badges', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // Use getAllByText since status may appear in multiple places
        const openBadges = screen.getAllByText('OPEN');
        const inProgressBadges = screen.getAllByText('IN PROGRESS');
        expect(openBadges.length).toBeGreaterThan(0);
        expect(inProgressBadges.length).toBeGreaterThan(0);
      });
    });

    it('should display loading state for impediments', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // LoadingState and SkeletonList both render aria-label
        expect(screen.getAllByLabelText('Loading impediments').length).toBeGreaterThan(0);
      });
    });

    it('should display error state when impediments fetch fails', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Failed to load')
      );

      renderWithProviders(<Dashboard />);

      await waitFor(
        () => {
          expect(
            screen.getByText((content) => content.includes('Unable to load impediments'))
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should display empty state when no open impediments exist', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: [],
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('No open impediments. Great job!')).toBeInTheDocument();
      });
    });

    it('should display empty state when all impediments are resolved', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: [mockImpediments[2]],
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('No open impediments. Great job!')).toBeInTheDocument();
      });
    });
  });

  describe('Burndown Chart', () => {
    it('should render burndown chart when data is available', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        const chart = screen.getByRole('img');
        expect(chart).toBeInTheDocument();
      });
    });

    it('should show error message when burndown data fails', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Failed to load')
      );

      renderWithProviders(<Dashboard />);

      await waitFor(
        () => {
          expect(
            screen.getByText((content) => content.includes('Unable to load burndown'))
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Quick Actions', () => {
    it('should render quick action buttons', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Submit Daily Scrum')).toBeInTheDocument();
        expect(screen.getByText('Create Backlog Item')).toBeInTheDocument();
        expect(screen.getByText('Report Impediment')).toBeInTheDocument();
      });
    });

    it('should have proper navigation links', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        const dailyScrumLink = screen.getByLabelText('Submit your daily scrum update');
        expect(dailyScrumLink).toHaveAttribute('href', '/daily-scrum');

        const backlogLink = screen.getByLabelText('Create a new backlog item');
        expect(backlogLink).toHaveAttribute('href', '/backlog');

        const impedimentLink = screen.getByLabelText('Report a new impediment');
        expect(impedimentLink).toHaveAttribute('href', '/impediments');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper landmark roles', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Dashboard');
      });
    });

    it('should have proper heading hierarchy', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toHaveTextContent('Dashboard');
      });
    });

    it('should have aria-labels for interactive elements', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByLabelText('Refresh dashboard data')).toBeInTheDocument();
        expect(screen.getByLabelText('View Sprint Board')).toBeInTheDocument();
      });
    });

    it('should have aria-live regions for dynamic content', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        const liveRegions = screen.getAllByRole('status');
        expect(liveRegions.length).toBeGreaterThan(0);
      });
    });

    it('should have proper link labels for navigation', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // Check specific navigation links have proper labels
        expect(screen.getByLabelText('View Sprint Board')).toBeInTheDocument();
        expect(screen.getByLabelText('View all my tasks')).toBeInTheDocument();
        expect(screen.getByLabelText('View all team updates')).toBeInTheDocument();
        expect(screen.getByLabelText('View all open impediments')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should have refresh button', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByLabelText('Refresh dashboard data')).toBeInTheDocument();
      });
    });

    it('should call refetch when refresh button is clicked', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockSprint,
      });
      (apiService.getBurndownData as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockBurndownData,
      });
      (apiService.getDailyUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDailyUpdates,
      });
      (apiService.getImpediments as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockImpediments,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByLabelText('Refresh dashboard data')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Refresh dashboard data'));

      await waitFor(() => {
        expect(apiService.getActiveSprint).toHaveBeenCalledTimes(2);
      });
    });
  });
});
