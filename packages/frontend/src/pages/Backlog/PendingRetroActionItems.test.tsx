import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

import { renderWithProviders, initTestI18n } from '../../test-utils';
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

describe('PendingRetroActionItems', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

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

      renderWithProviders(<PendingRetroActionItems />);

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
      renderWithProviders(<PendingRetroActionItems />);

      await waitFor(() => {
        expect(screen.getByText('Pending Action from Retrospective')).toBeInTheDocument();
      });
    });

    it('should render action item cards', async () => {
      renderWithProviders(<PendingRetroActionItems />);

      await waitFor(() => {
        expect(screen.getByText('Improve code review process')).toBeInTheDocument();
      });
    });
  });

  describe('Mark Added', () => {
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
      (apiService.updateActionItem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { id: 'action-1', status: 'COMPLETED', addedToSprintBacklog: true },
      });
    });

    it('should mark the action item as COMPLETED when clicking Mark Added', async () => {
      renderWithProviders(<PendingRetroActionItems />);

      await waitFor(() => {
        expect(screen.getByText('Test Action')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Mark Added'));

      await waitFor(() => {
        expect(apiService.updateActionItem).toHaveBeenCalledWith('retro-1', 'action-1', {
          addedToSprintBacklog: true,
          status: 'COMPLETED',
        });
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
      renderWithProviders(<PendingRetroActionItems />);

      await waitFor(() => {
        expect(screen.getByText('Test Action')).toBeInTheDocument();
      });
    });

    it('should collapse when clicking header', async () => {
      renderWithProviders(<PendingRetroActionItems />);

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
