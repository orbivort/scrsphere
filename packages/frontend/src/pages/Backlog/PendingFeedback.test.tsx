import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { PendingFeedback } from './PendingFeedback';
import { useTeamStore } from '../../store';
import { apiService } from '../../services';

vi.mock('../../store', () => ({
  useTeamStore: vi.fn(),
}));

vi.mock('../../services', () => ({
  apiService: {
    getPendingFeedback: vi.fn(),
    markFeedbackAddressed: vi.fn(),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderPendingFeedback = (props = {}) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PendingFeedback {...props} />
    </QueryClientProvider>
  );
};

describe('PendingFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useTeamStore as ReturnType<typeof vi.fn>).mockReturnValue({
      currentTeam: { id: 'team-1', name: 'Test Team' },
    });
  });

  describe('Empty State', () => {
    it('should not render when no feedback', () => {
      (apiService.getPendingFeedback as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
      });

      renderPendingFeedback();

      expect(screen.queryByText('Pending Feedback')).not.toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    beforeEach(() => {
      (apiService.getPendingFeedback as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            id: 'fb-1',
            category: 'positive',
            content: 'Great feature!',
            authorName: 'John Doe',
            createdAt: '2024-01-15T10:00:00Z',
            teamId: 'team-1',
            sprintId: 'sprint-1',
          },
        ],
      });
    });

    it('should render title with count', async () => {
      renderPendingFeedback();

      await waitFor(() => {
        expect(screen.getByText('Pending Feedback')).toBeInTheDocument();
      });
    });

    it('should render feedback cards', async () => {
      renderPendingFeedback();

      await waitFor(() => {
        expect(screen.getByText('Great feature!')).toBeInTheDocument();
      });
    });
  });

  describe('Expand/Collapse', () => {
    beforeEach(() => {
      (apiService.getPendingFeedback as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            id: 'fb-1',
            category: 'positive',
            content: 'Test',
            authorName: 'John',
            createdAt: '2024-01-15T10:00:00Z',
            teamId: 'team-1',
          },
        ],
      });
    });

    it('should be expanded by default', async () => {
      renderPendingFeedback();

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });

    it('should collapse when clicking header', async () => {
      renderPendingFeedback();

      await waitFor(() => {
        expect(screen.getByText('Pending Feedback')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Pending Feedback'));

      await waitFor(() => {
        expect(screen.queryByText('Test')).not.toBeInTheDocument();
      });
    });
  });
});
