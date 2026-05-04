import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  StatusHistorySection,
  type StatusHistorySectionProps,
  type StatusChangeHistoryItem,
} from './StatusHistorySection';
import { apiService } from '../../services';

vi.mock('../../services', () => ({
  apiService: {
    getStatusChangeHistory: vi.fn(),
  },
}));

vi.mock('./StatusHistorySection.module.css', () => ({
  default: {
    'status-history-section': 'status-history-section',
    'history-toggle': 'history-toggle',
    'history-toggle-left': 'history-toggle-left',
    'section-heading': 'section-heading',
    'toggle-chevron': 'toggle-chevron',
    expanded: 'expanded',
    'history-content': 'history-content',
    'history-loading': 'history-loading',
    'loading-spinner': 'loading-spinner',
    'spinner-ring': 'spinner-ring',
    'history-error': 'history-error',
    'error-header': 'error-header',
    'error-title': 'error-title',
    'error-details': 'error-details',
    'error-message': 'error-message',
    'error-attempts': 'error-attempts',
    'error-actions': 'error-actions',
    'retry-button': 'retry-button',
    'retry-spinner': 'retry-spinner',
    'dismiss-button': 'dismiss-button',
    'history-empty': 'history-empty',
    timeline: 'timeline',
    'timeline-item': 'timeline-item',
    'timeline-item-latest': 'timeline-item-latest',
    'timeline-connector': 'timeline-connector',
    'timeline-dot': 'timeline-dot',
    'timeline-line': 'timeline-line',
    'timeline-content': 'timeline-content',
    'timeline-header': 'timeline-header',
    'status-transition': 'status-transition',
    'status-badge-mini': 'status-badge-mini',
    'transition-arrow': 'transition-arrow',
    'timeline-time': 'timeline-time',
    'timeline-meta': 'timeline-meta',
    'timeline-user': 'timeline-user',
    'timeline-reason': 'timeline-reason',
    'timeline-notes': 'timeline-notes',
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

const mockHistoryItem: StatusChangeHistoryItem = {
  id: 'history-1',
  entityType: 'BacklogItem',
  entityId: 'item-1',
  toStateId: 'state-2',
  createdAt: new Date().toISOString(),
  fromState: {
    id: 'state-1',
    name: 'NEW',
    displayName: 'New',
  },
  toState: {
    id: 'state-2',
    name: 'IN_PROGRESS',
    displayName: 'In Progress',
  },
  changer: {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
  },
  changeReason: 'Starting work on this item',
  changeNotes: 'Assigned to development team',
};

const mockHistoryItem2: StatusChangeHistoryItem = {
  id: 'history-2',
  entityType: 'BacklogItem',
  entityId: 'item-1',
  toStateId: 'state-3',
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  fromState: {
    id: 'state-2',
    name: 'IN_PROGRESS',
    displayName: 'In Progress',
  },
  toState: {
    id: 'state-3',
    name: 'DONE',
    displayName: 'Done',
  },
  changer: {
    id: 'user-2',
    firstName: 'Jane',
    lastName: 'Smith',
  },
  changeReason: 'Work completed',
};

const mockHistoryItemWithoutFromState: StatusChangeHistoryItem = {
  id: 'history-3',
  entityType: 'BacklogItem',
  entityId: 'item-1',
  toStateId: 'state-1',
  createdAt: new Date(Date.now() - 172800000).toISOString(),
  toState: {
    id: 'state-1',
    name: 'NEW',
    displayName: 'New',
  },
  changer: null,
};

const defaultProps: StatusHistorySectionProps = {
  entityId: 'item-1',
  entityType: 'BacklogItem',
};

const renderWithQueryClient = (ui: React.ReactElement, queryClient?: QueryClient) => {
  const client = queryClient || createTestQueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe('StatusHistorySection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('renders collapsed by default', () => {
      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      expect(screen.getByText('Status History')).toBeInTheDocument();
      expect(screen.queryByText('Loading history...')).not.toBeInTheDocument();
    });

    it('renders toggle button', () => {
      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      expect(screen.getByRole('button', { name: /status history/i })).toBeInTheDocument();
    });

    it('renders section heading', () => {
      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /status history/i })).toBeInTheDocument();
    });

    it('renders custom title when provided', () => {
      renderWithQueryClient(<StatusHistorySection {...defaultProps} title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = renderWithQueryClient(
        <StatusHistorySection {...defaultProps} className="custom-class" />
      );

      expect(container.querySelector('.status-history-section')).toHaveClass('custom-class');
    });

    it('renders clock icon', () => {
      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const svg = container.querySelector('.history-toggle-left svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders chevron icon', () => {
      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const chevron = container.querySelector('.toggle-chevron');
      expect(chevron).toBeInTheDocument();
    });

    it('has aria-expanded attribute', () => {
      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Expand/Collapse Behavior Tests', () => {
    it('expands when toggle button is clicked', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [],
        pagination: { total: 0, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('collapses when toggle button is clicked again', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [],
        pagination: { total: 0, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');

      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('applies expanded class to chevron when expanded', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [],
        pagination: { total: 0, limit: 20, offset: 0 },
      });

      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(container.querySelector('.toggle-chevron.expanded')).toBeInTheDocument();
      });
    });

    it('renders history content when expanded', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [],
        pagination: { total: 0, limit: 20, offset: 0 },
      });

      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(container.querySelector('.history-content')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State Tests', () => {
    it('shows loading state when fetching data', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ data: [], pagination: { total: 0, limit: 20, offset: 0 } }),
              100
            )
          )
      );

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      expect(screen.getByText('Loading history...')).toBeInTheDocument();
    });

    it('renders loading spinner', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ data: [], pagination: { total: 0, limit: 20, offset: 0 } }),
              100
            )
          )
      );

      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    it('uses external loading state when provided', async () => {
      renderWithQueryClient(
        <StatusHistorySection {...defaultProps} isLoading={true} history={[]} />
      );

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      expect(screen.getByText('Loading history...')).toBeInTheDocument();
    });
  });

  describe('Error State Tests', () => {
    it('shows error state when API call fails', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockRejectedValue(new Error('404 Not Found'));

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Failed to load history')).toBeInTheDocument();
      });
    });

    it('displays error message', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockRejectedValue(new Error('404 Not found'));

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('404 Not found')).toBeInTheDocument();
      });
    });

    it('renders retry button', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockRejectedValue(new Error('404 Not Found'));

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('renders dismiss button', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockRejectedValue(new Error('404 Not Found'));

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Dismiss')).toBeInTheDocument();
      });
    });

    it('retries when retry button is clicked', async () => {
      vi.mocked(apiService.getStatusChangeHistory)
        .mockRejectedValueOnce(new Error('404 Not Found'))
        .mockResolvedValueOnce({
          data: [mockHistoryItem],
          pagination: { total: 1, limit: 20, offset: 0 },
        });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(apiService.getStatusChangeHistory).toHaveBeenCalledTimes(2);
      });
    });

    it('collapses when dismiss button is clicked', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockRejectedValue(new Error('404 Not Found'));

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Dismiss')).toBeInTheDocument();
      });

      const dismissButton = screen.getByText('Dismiss');
      await userEvent.click(dismissButton);

      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('uses external error state when provided', async () => {
      renderWithQueryClient(
        <StatusHistorySection {...defaultProps} error={new Error('External error')} history={[]} />
      );

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Failed to load history')).toBeInTheDocument();
      });
    });

    it('shows retry attempt count', async () => {
      const queryClient = createTestQueryClient();
      vi.mocked(apiService.getStatusChangeHistory).mockRejectedValue(new Error('500 Server Error'));

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />, queryClient);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(
        () => {
          expect(screen.getByText(/Attempt \d+ of 3 failed/)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });
  });

  describe('Empty State Tests', () => {
    it('shows empty state when no history items', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [],
        pagination: { total: 0, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('No status changes recorded yet')).toBeInTheDocument();
      });
    });

    it('renders empty state icon', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [],
        pagination: { total: 0, limit: 20, offset: 0 },
      });

      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(container.querySelector('.history-empty svg')).toBeInTheDocument();
      });
    });
  });

  describe('Timeline Rendering Tests', () => {
    it('renders timeline with history items', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(container.querySelector('.timeline')).toBeInTheDocument();
      });
    });

    it('renders all history items', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItem, mockHistoryItem2],
        pagination: { total: 2, limit: 20, offset: 0 },
      });

      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        const items = container.querySelectorAll('.timeline-item');
        expect(items).toHaveLength(2);
      });
    });

    it('renders status transition', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('New')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
      });
    });

    it('renders user name', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('renders change reason', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Starting work on this item')).toBeInTheDocument();
      });
    });

    it('renders change notes', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Assigned to development team')).toBeInTheDocument();
      });
    });

    it('renders timeline dot', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(container.querySelector('.timeline-dot')).toBeInTheDocument();
      });
    });

    it('renders timeline line between items', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItem, mockHistoryItem2],
        pagination: { total: 2, limit: 20, offset: 0 },
      });

      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        const lines = container.querySelectorAll('.timeline-line');
        expect(lines).toHaveLength(1);
      });
    });

    it('applies latest class to first item', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItem, mockHistoryItem2],
        pagination: { total: 2, limit: 20, offset: 0 },
      });

      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        const latestItem = container.querySelector('.timeline-item-latest');
        expect(latestItem).toBeInTheDocument();
      });
    });
  });

  describe('Date Formatting Tests', () => {
    it('formats recent time as "Just now"', async () => {
      const recentItem = {
        ...mockHistoryItem,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [recentItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Just now')).toBeInTheDocument();
      });
    });

    it('formats minutes ago correctly', async () => {
      const minutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
      const recentItem = {
        ...mockHistoryItem,
        createdAt: minutesAgo,
      };

      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [recentItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('5m ago')).toBeInTheDocument();
      });
    });

    it('formats hours ago correctly', async () => {
      const hoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
      const recentItem = {
        ...mockHistoryItem,
        createdAt: hoursAgo,
      };

      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [recentItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('3h ago')).toBeInTheDocument();
      });
    });

    it('formats days ago correctly', async () => {
      const daysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
      const recentItem = {
        ...mockHistoryItem,
        createdAt: daysAgo,
      };

      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [recentItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('3d ago')).toBeInTheDocument();
      });
    });

    it('formats older dates with date string', async () => {
      const oldDate = new Date(Date.now() - 10 * 86400000).toISOString();
      const oldItem = {
        ...mockHistoryItem,
        createdAt: oldDate,
      };

      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [oldItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        const timeElement = screen.getByText(/\w{3} \d{1,2}, \d{4}/);
        expect(timeElement).toBeInTheDocument();
      });
    });
  });

  describe('Status Color Tests', () => {
    it('applies custom status colors', async () => {
      const customColors = {
        'IN PROGRESS': { color: '#00ff00', bgColor: '#eeffee' },
      };

      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      const { container } = renderWithQueryClient(
        <StatusHistorySection {...defaultProps} statusColorMap={customColors} />
      );

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        const dot = container.querySelector('.timeline-dot');
        expect(dot).toBeInTheDocument();
      });
    });

    it('applies default colors when custom colors not provided', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        const dot = container.querySelector('.timeline-dot');
        expect(dot).toBeInTheDocument();
      });
    });

    it('handles case-insensitive status color mapping', async () => {
      const customColors = {
        new: { color: '#ff0000', bgColor: '#ffeeee' },
      };

      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      const { container } = renderWithQueryClient(
        <StatusHistorySection {...defaultProps} statusColorMap={customColors} />
      );

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        const dot = container.querySelector('.timeline-dot');
        expect(dot).toBeInTheDocument();
      });
    });
  });

  describe('External Data Tests', () => {
    it('uses external history data when provided', async () => {
      renderWithQueryClient(<StatusHistorySection {...defaultProps} history={[mockHistoryItem]} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('does not call API when external data is provided', async () => {
      renderWithQueryClient(<StatusHistorySection {...defaultProps} history={[mockHistoryItem]} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      expect(apiService.getStatusChangeHistory).not.toHaveBeenCalled();
    });

    it('handles external loading state', async () => {
      renderWithQueryClient(
        <StatusHistorySection {...defaultProps} isLoading={true} history={[]} />
      );

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      expect(screen.getByText('Loading history...')).toBeInTheDocument();
    });

    it('handles external error state', async () => {
      renderWithQueryClient(
        <StatusHistorySection {...defaultProps} error={new Error('External error')} history={[]} />
      );

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Failed to load history')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles history item without fromState', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItemWithoutFromState],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(container.querySelector('.timeline-dot')).toBeInTheDocument();
      });
    });

    it('handles history item without changer', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItemWithoutFromState],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Unknown User')).toBeInTheDocument();
      });
    });

    it('handles history item without change reason', async () => {
      const itemWithoutReason = { ...mockHistoryItem, changeReason: undefined };
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [itemWithoutReason],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(container.querySelector('.timeline-reason')).not.toBeInTheDocument();
      });
    });

    it('handles history item without change notes', async () => {
      const itemWithoutNotes = { ...mockHistoryItem, changeNotes: undefined };
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [itemWithoutNotes],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(container.querySelector('.timeline-notes')).not.toBeInTheDocument();
      });
    });

    it('handles state without displayName', async () => {
      const itemWithoutDisplayName = {
        ...mockHistoryItem,
        fromState: { id: 'state-1', name: 'NEW' },
        toState: { id: 'state-2', name: 'IN_PROGRESS' },
      };
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [itemWithoutDisplayName],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('NEW')).toBeInTheDocument();
        expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();
      });
    });

    it('handles very long change notes', async () => {
      const longNotes = 'A'.repeat(500);
      const itemWithLongNotes = { ...mockHistoryItem, changeNotes: longNotes };
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [itemWithLongNotes],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(longNotes)).toBeInTheDocument();
      });
    });

    it('handles special characters in change notes', async () => {
      const specialNotes = 'Notes with <script>alert("test")</script> & "quotes"';
      const itemWithSpecialNotes = { ...mockHistoryItem, changeNotes: specialNotes };
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [itemWithSpecialNotes],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(specialNotes)).toBeInTheDocument();
      });
    });

    it('handles many history items', async () => {
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        ...mockHistoryItem,
        id: `history-${i}`,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      }));

      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: manyItems,
        pagination: { total: 20, limit: 20, offset: 0 },
      });

      const { container } = renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        const items = container.querySelectorAll('.timeline-item');
        expect(items).toHaveLength(20);
      });
    });
  });

  describe('Accessibility Tests', () => {
    it('has accessible toggle button', () => {
      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      expect(button).toHaveAttribute('type', 'button');
    });

    it('updates aria-expanded on toggle', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [],
        pagination: { total: 0, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [],
        pagination: { total: 0, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      await user.tab();
      const button = screen.getByRole('button', { name: /status history/i });
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Integration Tests', () => {
    it('integrates with API service correctly', async () => {
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(apiService.getStatusChangeHistory).toHaveBeenCalledWith(
          'BacklogItem',
          'item-1',
          20,
          0
        );
      });
    });

    it('caches query results', async () => {
      const queryClient = createTestQueryClient();
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />, queryClient);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(apiService.getStatusChangeHistory).toHaveBeenCalledTimes(1);
    });

    it('refetches on window focus', async () => {
      const queryClient = createTestQueryClient();
      vi.mocked(apiService.getStatusChangeHistory).mockResolvedValue({
        data: [mockHistoryItem],
        pagination: { total: 1, limit: 20, offset: 0 },
      });

      renderWithQueryClient(<StatusHistorySection {...defaultProps} />, queryClient);

      const button = screen.getByRole('button', { name: /status history/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(apiService.getStatusChangeHistory).toHaveBeenCalledTimes(1);
      });

      vi.mocked(apiService.getStatusChangeHistory).mockClear();

      await waitFor(() => {
        expect(apiService.getStatusChangeHistory).toHaveBeenCalledTimes(0);
      });
    });
  });
});
