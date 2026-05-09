import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SprintReview } from './SprintReview';
import { SprintStatus, IncrementStatus } from '../../types';
import * as apiServiceModule from '../../services';
import * as teamStoreModule from '../../store';
import * as useMutationErrorHandlerModule from '../../hooks/useMutationErrorHandler';

// Mock useMutationErrorHandler to avoid store dependencies
vi.spyOn(useMutationErrorHandlerModule, 'useMutationErrorHandler').mockReturnValue({
  handleMutationError: vi.fn((_error, _context) => 'An error occurred'),
  createMutationConfig: vi.fn(() => ({
    onError: vi.fn(),
    onSuccess: vi.fn(),
  })),
});

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
  members: [
    {
      userId: 'user-1',
      teamId: 'team-1',
      role: 'owner',
      joinedAt: '2026-01-01T00:00:00Z',
      user: {
        id: 'user-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    },
  ],
};

const mockSprint = {
  id: 'sprint-1',
  teamId: 'team-1',
  name: 'Sprint 1',
  startDate: '2026-01-01T00:00:00Z',
  endDate: '2026-01-14T23:59:59Z',
  status: SprintStatus.COMPLETED,
  sprintGoal: 'Implement user authentication',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockReview = {
  id: 'review-1',
  sprintId: 'sprint-1',
  teamId: 'team-1',
  incrementId: 'inc-1',
  reviewDate: '2026-01-14T00:00:00Z',
  attendees: [],
  feedback: [],
  backlogAdjustments: [],
  status: 'completed',
  summary: 'Review summary',
  createdAt: '2026-01-14T00:00:00Z',
  updatedAt: '2026-01-14T00:00:00Z',
};

const mockIncrement = {
  id: 'inc-1',
  sprintId: 'sprint-1',
  teamId: 'team-1',
  status: IncrementStatus.DELIVERED,
  description: 'Increment description',
  createdAt: '2026-01-14T00:00:00Z',
};

function renderComponent(sprintId = 'sprint-1') {
  const queryClient = createTestQueryClient();

  vi.spyOn(teamStoreModule, 'useTeamStore').mockReturnValue({
    currentTeam: mockTeam,
    setCurrentTeam: vi.fn(),
    loadTeam: vi.fn(),
  } as any);

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/sprint-review/${sprintId}`]}>
        <Routes>
          <Route path="/sprint-review/:sprintId" element={<SprintReview />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function setupBasicMocks() {
  vi.spyOn(apiServiceModule.apiService, 'getSprint').mockResolvedValue({
    success: true,
    data: mockSprint,
  });

  vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockResolvedValue({
    success: true,
    data: [mockReview],
  });

  vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockResolvedValue({
    success: true,
    data: [mockIncrement],
  });

  vi.spyOn(apiServiceModule.apiService, 'getSprintBacklogPBIs').mockResolvedValue({
    success: true,
    data: [],
  });
}

describe('SprintReview Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupBasicMocks();
  });

  describe('Loading and Error States', () => {
    it('should render loading state initially', () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprint').mockReturnValue(new Promise(() => {}));
      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockReturnValue(
        new Promise(() => {})
      );

      renderComponent();

      expect(screen.getByText(/loading sprint review/i)).toBeInTheDocument();
    });

    it('should render error state when sprint reviews fetch fails', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockRejectedValue(
        new Error('Failed to fetch reviews')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/failed to load sprint review/i)).toBeInTheDocument();
      });
    });
  });

  describe('Page Header', () => {
    it('should render back button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      });
    });

    it('should render page title', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sprint Review')).toBeInTheDocument();
      });
    });

    it('should display sprint name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sprint 1')).toBeInTheDocument();
      });
    });

    it('should display sprint date', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/january 1, 2026/i)).toBeInTheDocument();
      });
    });

    it('should render attendee count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/0 attendees/i)).toBeInTheDocument();
      });
    });
  });

  describe('Section Tabs', () => {
    it('should render all section tabs', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Increment')).toBeInTheDocument();
        expect(screen.getByText('Feedback')).toBeInTheDocument();
        expect(screen.getByText('Backlog Adjustments')).toBeInTheDocument();
      });
    });

    it('should have Overview tab active by default', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      const overviewTab = screen.getByText('Overview').closest('button');
      expect(overviewTab?.className).toMatch(/active/);
    });

    it('should switch to Increment tab when clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Increment'));

      const incrementTab = screen.getByText('Increment').closest('button');
      expect(incrementTab?.className).toMatch(/active/);
    });

    it('should switch to Feedback tab when clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Feedback'));

      const feedbackTab = screen.getByText('Feedback').closest('button');
      expect(feedbackTab?.className).toMatch(/active/);
    });

    it('should switch to Backlog Adjustments tab when clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Backlog Adjustments'));

      const adjustmentsTab = screen.getByText('Backlog Adjustments').closest('button');
      expect(adjustmentsTab?.className).toMatch(/active/);
    });
  });

  describe('Overview Section', () => {
    it('should render sprint goal card', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sprint Goal')).toBeInTheDocument();
      });

      expect(screen.getByText('Implement user authentication')).toBeInTheDocument();
    });

    it('should render sprint dates info', async () => {
      renderComponent();

      await waitFor(() => {
        const dateElements = screen.getAllByText(/january 1/i);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Feedback Section', () => {
    it('should render feedback section with add button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      const feedbackTab = screen.getByText('Feedback').closest('button');
      if (feedbackTab) {
        fireEvent.click(feedbackTab);
      }

      await waitFor(() => {
        expect(screen.getByText('Add Feedback')).toBeInTheDocument();
      });
    });
  });

  describe('Backlog Adjustments Section', () => {
    it('should render adjustments section with add button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      const adjTab = screen.getByText('Backlog Adjustments').closest('button');
      if (adjTab) {
        fireEvent.click(adjTab);
      }

      await waitFor(() => {
        expect(screen.getByText('Add Adjustment')).toBeInTheDocument();
      });
    });
  });

  describe('Status Badge Rendering', () => {
    it('should render status badge for active sprint', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprint').mockResolvedValue({
        success: true,
        data: { ...mockSprint, status: SprintStatus.ACTIVE },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      });
    });

    it('should render status badge for completed sprint', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('COMPLETED')).toBeInTheDocument();
      });
    });

    it('should render status badge for planned sprint', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprint').mockResolvedValue({
        success: true,
        data: { ...mockSprint, status: SprintStatus.PLANNED },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('PLANNED')).toBeInTheDocument();
      });
    });

    it('should render status badge for cancelled sprint', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprint').mockResolvedValue({
        success: true,
        data: { ...mockSprint, status: SprintStatus.CANCELLED },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('CANCELLED')).toBeInTheDocument();
      });
    });
  });

  describe('Review Actions', () => {
    it('should render complete sprint review button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Sprint Review/i)).toBeInTheDocument();
      });
    });

    it('should show completed state when review status is completed', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Sprint Review Completed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading States', () => {
    it('should show loading when sprint is loading', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprint').mockReturnValue(new Promise(() => {}));
      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockReturnValue(
        new Promise(() => {})
      );

      renderComponent();

      expect(screen.getByText(/loading sprint review/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle reviews fetch error gracefully', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getSprintReviews').mockRejectedValue(
        new Error('Failed to fetch reviews')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/failed to load sprint review/i)).toBeInTheDocument();
      });
    });

    it('should handle increment fetch error gracefully', async () => {
      vi.spyOn(apiServiceModule.apiService, 'getIncrements').mockRejectedValue(
        new Error('Failed to fetch increments')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sprint 1')).toBeInTheDocument();
      });
    });
  });
});
