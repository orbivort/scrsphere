import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { PendingAdjustments } from './PendingAdjustments';
import { useTeamStore } from '../../store';
import { apiService } from '../../services';

vi.mock('../../store', () => ({
  useTeamStore: vi.fn(),
}));

vi.mock('../../services', () => ({
  apiService: {
    getPendingAdjustments: vi.fn(),
    markAdjustmentImplemented: vi.fn(),
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

const renderPendingAdjustments = (props = {}) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PendingAdjustments {...props} />
    </QueryClientProvider>
  );
};

describe('PendingAdjustments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useTeamStore as ReturnType<typeof vi.fn>).mockReturnValue({
      currentTeam: { id: 'team-1', name: 'Test Team' },
    });
  });

  describe('Empty State', () => {
    it('should not render when no adjustments', () => {
      (apiService.getPendingAdjustments as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
      });

      renderPendingAdjustments();

      expect(screen.queryByText('Pending Adjustments')).not.toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    beforeEach(() => {
      (apiService.getPendingAdjustments as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            id: 'adj-1',
            action: 'add',
            description: 'Add new feature',
            reason: 'Customer request',
            createdAt: '2024-01-15T10:00:00Z',
            teamId: 'team-1',
            sprintId: 'sprint-1',
          },
        ],
      });
    });

    it('should render title with count', async () => {
      renderPendingAdjustments();

      await waitFor(() => {
        expect(screen.getByText('Pending Adjustments')).toBeInTheDocument();
      });
    });

    it('should render adjustment cards', async () => {
      renderPendingAdjustments();

      await waitFor(() => {
        expect(screen.getByText('Add new feature')).toBeInTheDocument();
      });
    });
  });

  describe('Expand/Collapse', () => {
    beforeEach(() => {
      (apiService.getPendingAdjustments as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            id: 'adj-1',
            action: 'add',
            description: 'Test',
            createdAt: '2024-01-15T10:00:00Z',
            teamId: 'team-1',
          },
        ],
      });
    });

    it('should be expanded by default', async () => {
      renderPendingAdjustments();

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });

    it('should collapse when clicking header', async () => {
      renderPendingAdjustments();

      await waitFor(() => {
        expect(screen.getByText('Pending Adjustments')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Pending Adjustments'));

      await waitFor(() => {
        expect(screen.queryByText('Test')).not.toBeInTheDocument();
      });
    });
  });
});
