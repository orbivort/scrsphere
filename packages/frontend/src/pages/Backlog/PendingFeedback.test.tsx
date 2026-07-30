import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

import { renderWithProviders, initTestI18n } from '../../test-utils';
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

describe('PendingFeedback', () => {
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
    it('should not render when no feedback', () => {
      (apiService.getPendingFeedback as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
      });

      renderWithProviders(<PendingFeedback />);

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
      renderWithProviders(<PendingFeedback />);

      await waitFor(() => {
        expect(screen.getByText('Pending Feedback')).toBeInTheDocument();
      });
    });

    it('should render feedback cards', async () => {
      renderWithProviders(<PendingFeedback />);

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
      renderWithProviders(<PendingFeedback />);

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });

    it('should collapse when clicking header', async () => {
      renderWithProviders(<PendingFeedback />);

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
