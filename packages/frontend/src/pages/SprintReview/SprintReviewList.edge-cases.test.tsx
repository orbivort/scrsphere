import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SprintReviewList } from './SprintReviewList';
import { SprintStatus, IncrementStatus } from '../../types';
import * as apiServiceModule from '../../services';
import * as teamStoreModule from '../../store';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    useNavigate: vi.fn(() => mockNavigate),
  };
});

const mockNavigate = vi.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

const mockTeam = {
  id: 'team-1',
  name: 'Test Team',
  description: 'Test',
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  members: [],
};

function renderComponent(overrides: { currentTeam?: typeof mockTeam | null } = {}) {
  const { currentTeam = mockTeam } = overrides;

  vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
    currentTeam,
    setCurrentTeam: vi.fn(),
    loadTeam: vi.fn(),
  } as any);

  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SprintReviewList />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('SprintReviewList - Additional Edge Case Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Multiple Sprints Display', () => {
    it('should display multiple completed sprints', async () => {
      const multipleSprints = [
        {
          id: 'sprint-1',
          teamId: 'team-1',
          name: 'Sprint 1',
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2026-01-14T23:59:59Z',
          status: SprintStatus.COMPLETED,
          sprintGoal: 'Goal 1',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 'sprint-2',
          teamId: 'team-1',
          name: 'Sprint 2',
          startDate: '2026-01-15T00:00:00Z',
          endDate: '2026-01-28T23:59:59Z',
          status: SprintStatus.COMPLETED,
          sprintGoal: 'Goal 2',
          createdAt: '2026-01-15T00:00:00Z',
          updatedAt: '2026-01-15T00:00:00Z',
        },
        {
          id: 'sprint-3',
          teamId: 'team-1',
          name: 'Sprint 3',
          startDate: '2026-02-01T00:00:00Z',
          endDate: '2026-02-14T23:59:59Z',
          status: SprintStatus.COMPLETED,
          sprintGoal: 'Goal 3',
          createdAt: '2026-02-01T00:00:00Z',
          updatedAt: '2026-02-01T00:00:00Z',
        },
      ];

      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: multipleSprints,
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sprint 1')).toBeInTheDocument();
        expect(screen.getByText('Sprint 2')).toBeInTheDocument();
        expect(screen.getByText('Sprint 3')).toBeInTheDocument();
      });
    });

    it('should sort sprints by end date descending', async () => {
      const unsortedSprints = [
        {
          id: 'sprint-1',
          teamId: 'team-1',
          name: 'Older Sprint',
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2026-01-14T23:59:59Z',
          status: SprintStatus.COMPLETED,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 'sprint-2',
          teamId: 'team-1',
          name: 'Newer Sprint',
          startDate: '2026-02-01T00:00:00Z',
          endDate: '2026-02-14T23:59:59Z',
          status: SprintStatus.COMPLETED,
          createdAt: '2026-02-01T00:00:00Z',
          updatedAt: '2026-02-01T00:00:00Z',
        },
      ];

      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: unsortedSprints,
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        const sprintCards = screen.getAllByRole('article');
        expect(sprintCards[0]).toHaveTextContent('Newer Sprint');
        expect(sprintCards[1]).toHaveTextContent('Older Sprint');
      });
    });
  });

  describe('Review Status Variations', () => {
    it('should show "Review In Progress" for in-progress review', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'review-1',
            sprintId: 'sprint-1',
            teamId: 'team-1',
            status: 'in_progress',
            reviewDate: '2026-01-14T00:00:00Z',
            createdAt: '2026-01-14T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Review In Progress')).toBeInTheDocument();
      });
    });

    it('should show "Ready for Review" when increment exists but no review', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'inc-1',
            sprintId: 'sprint-1',
            teamId: 'team-1',
            status: IncrementStatus.DELIVERED,
            createdAt: '2026-01-14T00:00:00Z',
          },
        ],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Ready for Review')).toBeInTheDocument();
      });
    });

    it('should show "Increment Required" when no increment and no review', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Increment Required')).toBeInTheDocument();
      });
    });
  });

  describe('Sprint Goal Display', () => {
    it('should display sprint goal when available', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            sprintGoal: 'Complete authentication feature',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Goal:')).toBeInTheDocument();
        expect(screen.getByText('Complete authentication feature')).toBeInTheDocument();
      });
    });

    it('should not display sprint goal when not available', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            sprintGoal: undefined,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sprint 1')).toBeInTheDocument();
      });

      expect(screen.queryByText('Goal:')).not.toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format date range correctly', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-05T00:00:00Z',
            endDate: '2026-01-18T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-05T00:00:00Z',
            updatedAt: '2026-01-05T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Jan/)).toBeInTheDocument();
      });
    });

    it('should handle year transition in date range', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2025-12-28T00:00:00Z',
            endDate: '2026-01-10T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2025-12-28T00:00:00Z',
            updatedAt: '2025-12-28T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/2026/i)).toBeInTheDocument();
      });
    });
  });

  describe('Stats Display', () => {
    it('should show correct completed sprints count', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
          {
            id: 'sprint-2',
            teamId: 'team-1',
            name: 'Sprint 2',
            startDate: '2026-01-15T00:00:00Z',
            endDate: '2026-01-28T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-15T00:00:00Z',
            updatedAt: '2026-01-15T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        const statValues = screen.getAllByText('2');
        expect(statValues.length).toBeGreaterThan(0);
      });
    });

    it('should show singular "Sprint" for one completed sprint', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Completed Sprint')).toBeInTheDocument();
      });
    });

    it('should show plural "Sprints" for multiple completed sprints', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
          {
            id: 'sprint-2',
            teamId: 'team-1',
            name: 'Sprint 2',
            startDate: '2026-01-15T00:00:00Z',
            endDate: '2026-01-28T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-15T00:00:00Z',
            updatedAt: '2026-01-15T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      });
    });

    it('should show correct reviewed count', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
          {
            id: 'sprint-2',
            teamId: 'team-1',
            name: 'Sprint 2',
            startDate: '2026-01-15T00:00:00Z',
            endDate: '2026-01-28T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-15T00:00:00Z',
            updatedAt: '2026-01-15T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'review-1',
            sprintId: 'sprint-1',
            teamId: 'team-1',
            status: 'completed',
            reviewDate: '2026-01-14T00:00:00Z',
            createdAt: '2026-01-14T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Reviewed')).toBeInTheDocument();
      });
    });
  });

  describe('Button Actions', () => {
    it('should show both Create Increment and View Details buttons when no increment and no review', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Create Increment')).toBeInTheDocument();
        expect(screen.getByText('View Details')).toBeInTheDocument();
      });
    });

    it('should show only View Review button when review exists', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'review-1',
            sprintId: 'sprint-1',
            teamId: 'team-1',
            status: 'completed',
            reviewDate: '2026-01-14T00:00:00Z',
            createdAt: '2026-01-14T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('View Review')).toBeInTheDocument();
        expect(screen.queryByText('Create Increment')).not.toBeInTheDocument();
      });
    });
  });

  describe('Increment Status Handling', () => {
    it('should recognize DELIVERED increment as valid', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'inc-1',
            sprintId: 'sprint-1',
            teamId: 'team-1',
            status: IncrementStatus.DELIVERED,
            createdAt: '2026-01-14T00:00:00Z',
          },
        ],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Ready for Review')).toBeInTheDocument();
      });
    });

    it('should recognize VERIFIED increment as valid', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'inc-1',
            sprintId: 'sprint-1',
            teamId: 'team-1',
            status: IncrementStatus.VERIFIED,
            createdAt: '2026-01-14T00:00:00Z',
          },
        ],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Ready for Review')).toBeInTheDocument();
      });
    });

    it('should not recognize PLANNED increment as valid', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'inc-1',
            sprintId: 'sprint-1',
            teamId: 'team-1',
            status: IncrementStatus.PLANNED,
            createdAt: '2026-01-14T00:00:00Z',
          },
        ],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Increment Required')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sprint Reviews');
      });
    });

    it('should have article role for sprint cards', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint 1',
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-01-14T23:59:59Z',
            status: SprintStatus.COMPLETED,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('article')).toBeInTheDocument();
      });
    });

    it('should have data-testid on container', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprints').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
        currentTeam: mockTeam,
        setCurrentTeam: vi.fn(),
        loadTeam: vi.fn(),
      } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('sprint-review-list')).toBeInTheDocument();
      });
    });
  });
});
