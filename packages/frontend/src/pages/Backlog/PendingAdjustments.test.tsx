import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

import { renderWithProviders, initTestI18n } from '../../test-utils';
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

describe('PendingAdjustments', () => {
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
    it('should not render when no adjustments', () => {
      (apiService.getPendingAdjustments as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
      });

      renderWithProviders(<PendingAdjustments />);

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
      renderWithProviders(<PendingAdjustments />);

      await waitFor(() => {
        expect(screen.getByText('Pending Adjustments')).toBeInTheDocument();
      });
    });

    it('should render adjustment cards', async () => {
      renderWithProviders(<PendingAdjustments />);

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
      renderWithProviders(<PendingAdjustments />);

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });

    it('should collapse when clicking header', async () => {
      renderWithProviders(<PendingAdjustments />);

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
