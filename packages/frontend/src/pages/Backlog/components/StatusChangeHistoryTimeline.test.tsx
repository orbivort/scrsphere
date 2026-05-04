/**
 * StatusChangeHistoryTimeline Component Tests
 *
 * Unit tests for the StatusChangeHistoryTimeline component using React Testing Library.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { apiService } from '../../../services';
import { StatusChangeHistoryTimeline } from './StatusChangeHistoryTimeline';

// Mock the apiService
vi.mock('../../../services', () => ({
  apiService: {
    getStatusChangeHistory: vi.fn(),
  },
}));

/**
 * Creates a query client for testing
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

/**
 * Wrapper component for tests that need QueryClient
 */
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
);

describe('StatusChangeHistoryTimeline', () => {
  const mockHistoryData = {
    data: [
      {
        id: 'history-1',
        entityType: 'BacklogItem',
        entityId: 'item-1',
        fromState: { id: 'state-1', name: 'NEW', displayName: 'New' },
        toState: { id: 'state-2', name: 'IN_PROGRESS', displayName: 'In Progress' },
        changer: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
        changeReason: 'Starting work',
        changeNotes: 'Picked up from backlog',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'history-2',
        entityType: 'BacklogItem',
        entityId: 'item-1',
        fromState: { id: 'state-2', name: 'IN_PROGRESS', displayName: 'In Progress' },
        toState: { id: 'state-3', name: 'DONE', displayName: 'Done' },
        changer: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
        changeReason: 'Completed',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render collapsed by default', () => {
    render(
      <TestWrapper>
        <StatusChangeHistoryTimeline entityId="item-1" entityType="BacklogItem" />
      </TestWrapper>
    );

    expect(screen.getByText('Status History')).toBeInTheDocument();
    expect(screen.queryByText('Loading history...')).not.toBeInTheDocument();
  });

  it('should expand when clicked', async () => {
    vi.mocked(apiService.getStatusChangeHistory).mockResolvedValueOnce(mockHistoryData);

    render(
      <TestWrapper>
        <StatusChangeHistoryTimeline entityId="item-1" entityType="BacklogItem" />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /status history/i });
    fireEvent.click(toggleButton);

    expect(screen.getByText('Loading history...')).toBeInTheDocument();
  });

  it('should fetch history data when expanded', async () => {
    vi.mocked(apiService.getStatusChangeHistory).mockResolvedValueOnce(mockHistoryData);

    render(
      <TestWrapper>
        <StatusChangeHistoryTimeline entityId="item-1" entityType="BacklogItem" />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /status history/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(apiService.getStatusChangeHistory).toHaveBeenCalledWith(
        'BacklogItem',
        'item-1',
        20,
        0
      );
    });
  });

  it('should display history items after loading', async () => {
    vi.mocked(apiService.getStatusChangeHistory).mockResolvedValueOnce(mockHistoryData);

    render(
      <TestWrapper>
        <StatusChangeHistoryTimeline entityId="item-1" entityType="BacklogItem" />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /status history/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Starting work')).toBeInTheDocument();
  });

  it('should display status transitions', async () => {
    vi.mocked(apiService.getStatusChangeHistory).mockResolvedValueOnce(mockHistoryData);

    render(
      <TestWrapper>
        <StatusChangeHistoryTimeline entityId="item-1" entityType="BacklogItem" />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /status history/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getAllByText('New').length).toBeGreaterThan(0);
      expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0);
    });
  });

  it('should display change notes when present', async () => {
    vi.mocked(apiService.getStatusChangeHistory).mockResolvedValueOnce(mockHistoryData);

    render(
      <TestWrapper>
        <StatusChangeHistoryTimeline entityId="item-1" entityType="BacklogItem" />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /status history/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Picked up from backlog')).toBeInTheDocument();
    });
  });

  it('should show empty state when no history', async () => {
    vi.mocked(apiService.getStatusChangeHistory).mockResolvedValueOnce({ data: [] });

    render(
      <TestWrapper>
        <StatusChangeHistoryTimeline entityId="item-1" entityType="BacklogItem" />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /status history/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('No status changes recorded yet')).toBeInTheDocument();
    });
  });

  it('should show error state when fetch fails', async () => {
    vi.mocked(apiService.getStatusChangeHistory).mockRejectedValueOnce(new Error('Failed'));

    render(
      <TestWrapper>
        <StatusChangeHistoryTimeline entityId="item-1" entityType="BacklogItem" />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /status history/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to load history')).toBeInTheDocument();
    });
  });

  it('should collapse when clicked again', async () => {
    vi.mocked(apiService.getStatusChangeHistory).mockResolvedValueOnce(mockHistoryData);

    render(
      <TestWrapper>
        <StatusChangeHistoryTimeline entityId="item-1" entityType="BacklogItem" />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /status history/i });

    // Expand
    fireEvent.click(toggleButton);
    await waitFor(
      () => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    // Collapse
    fireEvent.click(toggleButton);

    // The content should still be visible but the button should show collapsed state
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('should display relative time for recent changes', async () => {
    const recentHistory = {
      data: [
        {
          id: 'history-1',
          entityType: 'BacklogItem',
          entityId: 'item-1',
          toState: { id: 'state-1', name: 'NEW', displayName: 'New' },
          changer: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
          createdAt: new Date().toISOString(), // Just now
        },
      ],
    };

    vi.mocked(apiService.getStatusChangeHistory).mockResolvedValueOnce(recentHistory);

    render(
      <TestWrapper>
        <StatusChangeHistoryTimeline entityId="item-1" entityType="BacklogItem" />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /status history/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Just now')).toBeInTheDocument();
    });
  });

  it('should handle history item without changer', async () => {
    const historyWithoutChanger = {
      data: [
        {
          id: 'history-1',
          entityType: 'BacklogItem',
          entityId: 'item-1',
          toState: { id: 'state-1', name: 'NEW', displayName: 'New' },
          createdAt: new Date().toISOString(),
        },
      ],
    };

    vi.mocked(apiService.getStatusChangeHistory).mockResolvedValueOnce(historyWithoutChanger);

    render(
      <TestWrapper>
        <StatusChangeHistoryTimeline entityId="item-1" entityType="BacklogItem" />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /status history/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Unknown User')).toBeInTheDocument();
    });
  });

  it('should handle initial state (no fromState)', async () => {
    const initialHistory = {
      data: [
        {
          id: 'history-1',
          entityType: 'BacklogItem',
          entityId: 'item-1',
          toState: { id: 'state-1', name: 'NEW', displayName: 'New' },
          changer: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
          createdAt: new Date().toISOString(),
        },
      ],
    };

    vi.mocked(apiService.getStatusChangeHistory).mockResolvedValueOnce(initialHistory);

    render(
      <TestWrapper>
        <StatusChangeHistoryTimeline entityId="item-1" entityType="BacklogItem" />
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /status history/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('New')).toBeInTheDocument();
    });
  });
});
