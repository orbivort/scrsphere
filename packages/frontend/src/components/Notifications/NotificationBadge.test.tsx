import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { NotificationBadge } from './NotificationBadge';
import * as useNotificationsModule from '../../hooks/useNotifications';
import { createMockQueryResult } from '../../__mocks__/mockData';

vi.mock('./NotificationBadge.module.css', () => ({
  default: {
    'notification-badge-error': 'notification-badge-error',
    'badge-count': 'badge-count',
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
    },
  });

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('NotificationBadge Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('should return null when loading', () => {
      vi.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue(
        createMockQueryResult({ isLoading: true })
      );

      const { container } = renderWithQueryClient(<NotificationBadge />);

      expect(container.firstChild).toBeNull();
    });

    it('should return null when count is zero', () => {
      vi.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue(
        createMockQueryResult({ data: { count: 0, lastCheckedAt: '2024-01-01T00:00:00Z' } })
      );

      const { container } = renderWithQueryClient(<NotificationBadge />);

      expect(container.firstChild).toBeNull();
    });

    it('should display count when there are unread notifications', () => {
      vi.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue(
        createMockQueryResult({ data: { count: 5, lastCheckedAt: '2024-01-01T00:00:00Z' } })
      );

      renderWithQueryClient(<NotificationBadge />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should display error icon when there is an error', () => {
      vi.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue(
        createMockQueryResult({ error: new Error('Connection error') })
      );

      renderWithQueryClient(<NotificationBadge />);

      const errorContainer = screen.getByTitle('Connection error');
      expect(errorContainer).toBeInTheDocument();
      expect(errorContainer.querySelector('svg')).toBeInTheDocument();
    });

    it('should have title attribute on error icon', () => {
      vi.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue(
        createMockQueryResult({ error: new Error('Connection error') })
      );

      renderWithQueryClient(<NotificationBadge />);

      const errorElement = screen.getByTitle('Connection error');
      expect(errorElement).toHaveAttribute('title', 'Connection error');
    });
  });

  describe('Count Display Tests', () => {
    it('should display single digit count', () => {
      vi.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue(
        createMockQueryResult({ data: { count: 3, lastCheckedAt: '2024-01-01T00:00:00Z' } })
      );

      renderWithQueryClient(<NotificationBadge />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display double digit count', () => {
      vi.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue(
        createMockQueryResult({ data: { count: 42, lastCheckedAt: '2024-01-01T00:00:00Z' } })
      );

      renderWithQueryClient(<NotificationBadge />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should display 99+ for counts over 99', () => {
      vi.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue(
        createMockQueryResult({ data: { count: 100, lastCheckedAt: '2024-01-01T00:00:00Z' } })
      );

      renderWithQueryClient(<NotificationBadge />);

      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('should display 99+ for very large counts', () => {
      vi.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue(
        createMockQueryResult({ data: { count: 9999, lastCheckedAt: '2024-01-01T00:00:00Z' } })
      );

      renderWithQueryClient(<NotificationBadge />);

      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('should display 99 for exactly 99 notifications', () => {
      vi.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue(
        createMockQueryResult({ data: { count: 99, lastCheckedAt: '2024-01-01T00:00:00Z' } })
      );

      renderWithQueryClient(<NotificationBadge />);

      expect(screen.getByText('99')).toBeInTheDocument();
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle undefined data gracefully', () => {
      vi.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue(
        createMockQueryResult({ data: undefined })
      );

      const { container } = renderWithQueryClient(<NotificationBadge />);

      expect(container.firstChild).toBeNull();
    });

    it('should handle null data gracefully', () => {
      vi.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue(
        createMockQueryResult({ data: null as unknown as { count: number; lastCheckedAt: string } })
      );

      const { container } = renderWithQueryClient(<NotificationBadge />);

      expect(container.firstChild).toBeNull();
    });

    it('should handle missing count property', () => {
      vi.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue(
        createMockQueryResult({ data: {} as { count: number; lastCheckedAt: string } })
      );

      const { container } = renderWithQueryClient(<NotificationBadge />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('CSS Class Tests', () => {
    it('should apply correct class for badge count', () => {
      vi.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue(
        createMockQueryResult({ data: { count: 5, lastCheckedAt: '2024-01-01T00:00:00Z' } })
      );

      renderWithQueryClient(<NotificationBadge />);

      const badge = screen.getByText('5');
      expect(badge).toHaveClass('badge-count');
    });

    it('should apply correct class for error state', () => {
      vi.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue(
        createMockQueryResult({ error: new Error('Connection error') })
      );

      renderWithQueryClient(<NotificationBadge />);

      const errorElement = screen.getByTitle('Connection error');
      expect(errorElement).toHaveClass('notification-badge-error');
    });
  });
});
