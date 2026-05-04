import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { PendingRetroActionItems } from './PendingRetroActionItems';
import { useTeamStore } from '../../store';
import { apiService } from '../../services';

vi.mock('../../store', () => ({
  useTeamStore: vi.fn(),
}));

vi.mock('../../services', () => ({
  apiService: {
    getPendingRetroActionItems: vi.fn(),
    updateActionItem: vi.fn(),
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

const renderPendingRetroActionItems = (props = {}) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PendingRetroActionItems {...props} />
    </QueryClientProvider>
  );
};

describe('PendingRetroActionItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useTeamStore as ReturnType<typeof vi.fn>).mockReturnValue({
      currentTeam: { id: 'team-1', name: 'Test Team' },
    });
  });

  describe('Empty State', () => {
    it('should not render when no action items', () => {
      (apiService.getPendingRetroActionItems as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
      });

      renderPendingRetroActionItems();

      expect(screen.queryByText('Pending Action from Retrospective')).not.toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    beforeEach(() => {
      (apiService.getPendingRetroActionItems as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            id: 'action-1',
            title: 'Improve code review process',
            description: 'Implement pair programming',
            status: 'PENDING',
            createdAt: '2024-01-15T10:00:00Z',
            retrospectiveId: 'retro-1',
            owner: {
              id: 'user-1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
            },
          },
        ],
      });
    });

    it('should render title with count', async () => {
      renderPendingRetroActionItems();

      await waitFor(() => {
        expect(screen.getByText('Pending Action from Retrospective')).toBeInTheDocument();
      });
    });

    it('should render action item cards', async () => {
      renderPendingRetroActionItems();

      await waitFor(() => {
        expect(screen.getByText('Improve code review process')).toBeInTheDocument();
      });
    });
  });

  describe('Expand/Collapse', () => {
    beforeEach(() => {
      (apiService.getPendingRetroActionItems as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            id: 'action-1',
            title: 'Test Action',
            status: 'PENDING',
            createdAt: '2024-01-15T10:00:00Z',
            retrospectiveId: 'retro-1',
          },
        ],
      });
    });

    it('should be expanded by default', async () => {
      renderPendingRetroActionItems();

      await waitFor(() => {
        expect(screen.getByText('Test Action')).toBeInTheDocument();
      });
    });

    it('should collapse when clicking header', async () => {
      renderPendingRetroActionItems();

      await waitFor(() => {
        expect(screen.getByText('Pending Action from Retrospective')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Pending Action from Retrospective'));

      await waitFor(() => {
        expect(screen.queryByText('Test Action')).not.toBeInTheDocument();
      });
    });
  });
});
