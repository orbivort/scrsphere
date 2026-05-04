import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PrivacyData } from './PrivacyData';
import { DataExportButton } from './components';
import { apiService } from '../../../services';
import { logger } from '../../../utils/logger';

vi.mock('./PrivacyData.module.css', () => ({
  default: {
    container: 'container',
    header: 'header',
    title: 'title',
    subtitle: 'subtitle',
    content: 'content',
    section: 'section',
    'section-header': 'section-header',
    'icon-wrapper': 'icon-wrapper',
    'section-title': 'section-title',
    'section-description': 'section-description',
    card: 'card',
    'info-box': 'info-box',
    'info-title': 'info-title',
    'info-text': 'info-text',
    'data-categories': 'data-categories',
    'categories-title': 'categories-title',
    'categories-list': 'categories-list',
    'category-item': 'category-item',
    'check-icon': 'check-icon',
    'category-desc': 'category-desc',
    'export-section': 'export-section',
    'export-info': 'export-info',
    'export-format': 'export-format',
    'export-retention': 'export-retention',
    'export-limit': 'export-limit',
    'export-action': 'export-action',
    'rights-grid': 'rights-grid',
    'right-item': 'right-item',
    'right-title': 'right-title',
    'right-description': 'right-description',
    'contact-section': 'contact-section',
    'contact-title': 'contact-title',
    'contact-text': 'contact-text',
    'contact-link': 'contact-link',
    'loading-text': 'loading-text',
    'error-text': 'error-text',
    'empty-text': 'empty-text',
    'sessions-list': 'sessions-list',
    'session-item': 'session-item',
    'current-session': 'current-session',
    'session-info': 'session-info',
    'session-header': 'session-header',
    'session-device': 'session-device',
    'current-badge': 'current-badge',
    'session-details': 'session-details',
    'session-ip': 'session-ip',
    'session-time': 'session-time',
    'revoke-button': 'revoke-button',
    'sessions-footer': 'sessions-footer',
    'revoke-all-button': 'revoke-all-button',
    'sessions-note': 'sessions-note',
  },
}));

vi.mock('./components', () => ({
  DataExportButton: vi.fn(({ onExportStart }) => (
    <button
      type="button"
      onClick={() => {
        onExportStart?.();
      }}
      data-testid="data-export-button"
    >
      Export My Data
    </button>
  )),
}));

vi.mock('../../../services', () => ({
  apiService: {
    getActiveSessions: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 'session-1',
          createdAt: '2024-01-01T00:00:00Z',
          lastActivityAt: '2024-01-15T12:00:00Z',
          expiresAt: '2024-02-01T00:00:00Z',
          userAgent: 'Chrome Browser',
          ipAddress: '192.168.1.1',
        },
      ],
    }),
    revokeSession: vi.fn().mockResolvedValue({ success: true }),
    logoutAllSessions: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
  setStoreProvider: vi.fn(),
}));

describe('PrivacyData Component', () => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Component Rendering', () => {
    it('should render the main container with correct structure', () => {
      render(<PrivacyData />);

      expect(screen.getByText('Privacy & Data')).toBeInTheDocument();
      expect(
        screen.getByText('Manage your personal data and privacy settings')
      ).toBeInTheDocument();
    });

    it('should render the Active Sessions section', () => {
      render(<PrivacyData />);

      expect(screen.getByText('Active Sessions')).toBeInTheDocument();
      expect(screen.getByText('Manage your active login sessions')).toBeInTheDocument();
    });

    it('should render the Export Your Data section', () => {
      render(<PrivacyData />);

      expect(screen.getByText('Export Your Data')).toBeInTheDocument();
      expect(screen.getByText('Download a copy of your personal data')).toBeInTheDocument();
    });

    it('should render Right to Data Portability information', () => {
      render(<PrivacyData />);

      expect(screen.getByText('Right to Data Portability')).toBeInTheDocument();
      expect(
        screen.getByText(
          /You have the right to receive your personal data in a structured, commonly used, and machine-readable format/
        )
      ).toBeInTheDocument();
    });

    it('should render data categories section', () => {
      render(<PrivacyData />);

      expect(screen.getByText('Data included in the export:')).toBeInTheDocument();
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      expect(screen.getByText('Team Memberships')).toBeInTheDocument();
      expect(screen.getByText('Session Information')).toBeInTheDocument();
    });

    it('should render export format information', () => {
      render(<PrivacyData />);

      const formatElements = screen.getAllByText(/Format:/);
      expect(formatElements.length).toBeGreaterThan(0);
    });

    it('should render DataExportButton component', () => {
      render(<PrivacyData />);

      expect(screen.getByTestId('data-export-button')).toBeInTheDocument();
    });

    it('should render Your Data Rights section', () => {
      render(<PrivacyData />);

      expect(screen.getByText('Your Data Rights')).toBeInTheDocument();
      expect(screen.getByText('Your rights regarding personal data')).toBeInTheDocument();
    });

    it('should render all four data rights', () => {
      render(<PrivacyData />);

      expect(screen.getByText('Right to Access')).toBeInTheDocument();
      expect(screen.getByText('Right to Rectification')).toBeInTheDocument();
      expect(screen.getByText('Right to Erasure')).toBeInTheDocument();
      expect(screen.getByText('Right to Portability')).toBeInTheDocument();
    });

    it('should render right descriptions', () => {
      render(<PrivacyData />);

      expect(
        screen.getByText(/You can request a copy of all personal data we hold about you/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You can correct inaccurate or incomplete personal data/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You can request deletion of your personal data/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You can receive your data in a structured, machine-readable format/)
      ).toBeInTheDocument();
    });

    it('should render contact section with DPO email', () => {
      render(<PrivacyData />);

      expect(screen.getByText('Questions about your data?')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Contact your HR Data Protection Team or the Corporate Data Protection Officer/
        )
      ).toBeInTheDocument();
    });

    it('should render check icon for data categories', () => {
      render(<PrivacyData />);

      const checkIcons = screen.getAllByText('✓');
      expect(checkIcons.length).toBe(3);
    });

    it('should render download, shield, and settings icons', () => {
      render(<PrivacyData />);

      const svgElements = document.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('User Interactions', () => {
    it('should call onExportStart when export button is clicked', async () => {
      const user = userEvent.setup();
      const { logger } = await import('../../../utils/logger');
      render(<PrivacyData />);

      const exportButton = screen.getByTestId('data-export-button');
      await user.click(exportButton);

      expect(logger.debug).toHaveBeenCalledWith('Export started');
    });

    it('should render export button with correct accessibility attributes', () => {
      render(<PrivacyData />);

      const exportButton = screen.getByTestId('data-export-button');
      expect(exportButton).toHaveAttribute('type', 'button');
    });
  });

  describe('State Management', () => {
    it('should render all sections in correct order', () => {
      const { container } = render(<PrivacyData />);

      const sections = container.querySelectorAll('section');
      expect(sections).toHaveLength(3);
    });

    it('should render header and content sections', () => {
      const { container } = render(<PrivacyData />);

      const header = container.querySelector('header');
      const sections = container.querySelectorAll('section');

      expect(header).toBeInTheDocument();
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should maintain proper heading hierarchy', () => {
      render(<PrivacyData />);

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h4s = screen.getAllByRole('heading', { level: 4 });

      expect(h1).toHaveTextContent('Privacy & Data');
      expect(h2s).toHaveLength(3);
      expect(h4s.length).toBeGreaterThan(0);
    });
  });

  describe('Prop Validation', () => {
    it('should render without crashing with default props', () => {
      render(<PrivacyData />);
      expect(screen.getByText('Privacy & Data')).toBeInTheDocument();
    });

    it('should render DataExportButton with callback props', () => {
      render(<PrivacyData />);

      const callArgs = DataExportButton.mock.calls[0][0];
      expect(callArgs.onExportStart).toBeDefined();
      expect(callArgs.onExportComplete).toBeDefined();
      expect(callArgs.onExportError).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid clicks on export button', async () => {
      const user = userEvent.setup();
      const { logger } = await import('../../../utils/logger');
      render(<PrivacyData />);

      const exportButton = screen.getByTestId('data-export-button');

      await user.click(exportButton);
      await user.click(exportButton);
      await user.click(exportButton);

      expect(logger.debug).toHaveBeenCalledTimes(3);
    });

    it('should render with empty category list gracefully', () => {
      const { container } = render(<PrivacyData />);

      const listItems = container.querySelectorAll('li');
      expect(listItems.length).toBeGreaterThan(0);
    });

    it('should render contact section', () => {
      render(<PrivacyData />);

      expect(screen.getByText('Questions about your data?')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Contact your HR Data Protection Team or the Corporate Data Protection Officer/
        )
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure for screen readers', () => {
      render(<PrivacyData />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Privacy & Data');
    });

    it('should have descriptive section headings', () => {
      render(<PrivacyData />);

      expect(screen.getByText('Export Your Data')).toBeInTheDocument();
      expect(screen.getByText('Your Data Rights')).toBeInTheDocument();
    });

    it('should have accessible contact section', () => {
      render(<PrivacyData />);

      expect(screen.getByText('Questions about your data?')).toBeInTheDocument();
    });

    it('should have button with accessible label', () => {
      render(<PrivacyData />);

      const exportButton = screen.getByTestId('data-export-button');
      expect(exportButton).toHaveAttribute('type', 'button');
    });

    it('should render list with proper semantic structure', () => {
      render(<PrivacyData />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('Contact Section', () => {
    it('should render contact section with help text', () => {
      render(<PrivacyData />);

      expect(screen.getByText('Questions about your data?')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Contact your HR Data Protection Team or the Corporate Data Protection Officer/
        )
      ).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('should display loading state initially', () => {
      (apiService.getActiveSessions as any).mockReturnValueOnce(
        new Promise((resolve) => setTimeout(() => resolve({ success: true, data: [] }), 1000))
      );

      render(<PrivacyData />);

      expect(screen.getByText('Loading sessions...')).toBeInTheDocument();
    });

    it('should display sessions when API returns successfully', async () => {
      render(<PrivacyData />);

      await waitFor(() => {
        expect(screen.getByText('Chrome Browser')).toBeInTheDocument();
      });

      expect(screen.getByText('IP: 192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('should display error message when API fails', async () => {
      (apiService.getActiveSessions as any).mockRejectedValueOnce(new Error('Network error'));

      render(<PrivacyData />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load sessions')).toBeInTheDocument();
      });
    });

    it('should display error message when API returns success: false', async () => {
      (apiService.getActiveSessions as any).mockResolvedValueOnce({
        success: false,
        data: null,
      });

      render(<PrivacyData />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load sessions')).toBeInTheDocument();
      });
    });

    it('should display empty state when no sessions exist', async () => {
      (apiService.getActiveSessions as any).mockResolvedValueOnce({
        success: true,
        data: [],
      });

      render(<PrivacyData />);

      await waitFor(() => {
        expect(screen.getByText('No active sessions found')).toBeInTheDocument();
      });
    });

    it('should show revoke button for non-current sessions', async () => {
      (apiService.getActiveSessions as any).mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'session-1',
            createdAt: '2024-01-01T00:00:00Z',
            lastActivityAt: '2024-01-15T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Chrome Browser',
            ipAddress: '192.168.1.1',
          },
          {
            id: 'session-2',
            createdAt: '2024-01-02T00:00:00Z',
            lastActivityAt: '2024-01-16T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Firefox Browser',
            ipAddress: '192.168.1.2',
          },
        ],
      });

      render(<PrivacyData />);

      await waitFor(() => {
        expect(screen.getByText('Chrome Browser')).toBeInTheDocument();
        expect(screen.getByText('Firefox Browser')).toBeInTheDocument();
      });

      const revokeButtons = screen.getAllByRole('button', { name: 'Revoke this session' });
      expect(revokeButtons).toHaveLength(1);
    });

    it('should not show revoke button for current session', async () => {
      render(<PrivacyData />);

      await waitFor(() => {
        expect(screen.getByText('Chrome Browser')).toBeInTheDocument();
      });

      const sessionItem = screen.getByText('Chrome Browser').closest('div');
      const revokeButton = sessionItem?.querySelector('button');
      expect(revokeButton).toBeNull();
    });

    it('should revoke session when revoke button is clicked', async () => {
      const user = userEvent.setup();
      (apiService.getActiveSessions as any).mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'session-1',
            createdAt: '2024-01-01T00:00:00Z',
            lastActivityAt: '2024-01-15T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Chrome Browser',
            ipAddress: '192.168.1.1',
          },
          {
            id: 'session-2',
            createdAt: '2024-01-02T00:00:00Z',
            lastActivityAt: '2024-01-16T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Firefox Browser',
            ipAddress: '192.168.1.2',
          },
        ],
      });
      (apiService.revokeSession as any).mockResolvedValueOnce({ success: true });

      render(<PrivacyData />);

      await waitFor(() => {
        expect(screen.getByText('Firefox Browser')).toBeInTheDocument();
      });

      const revokeButton = screen.getByRole('button', { name: 'Revoke this session' });
      await user.click(revokeButton);

      await waitFor(() => {
        expect(apiService.revokeSession).toHaveBeenCalledWith('session-2');
      });
    });

    it('should display error when session revocation fails', async () => {
      const user = userEvent.setup();
      (apiService.getActiveSessions as any).mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'session-1',
            createdAt: '2024-01-01T00:00:00Z',
            lastActivityAt: '2024-01-15T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Chrome Browser',
            ipAddress: '192.168.1.1',
          },
          {
            id: 'session-2',
            createdAt: '2024-01-02T00:00:00Z',
            lastActivityAt: '2024-01-16T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Firefox Browser',
            ipAddress: '192.168.1.2',
          },
        ],
      });
      (apiService.revokeSession as any).mockResolvedValueOnce({ success: false });

      render(<PrivacyData />);

      await waitFor(() => {
        expect(screen.getByText('Firefox Browser')).toBeInTheDocument();
      });

      const revokeButton = screen.getByRole('button', { name: 'Revoke this session' });
      await user.click(revokeButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to revoke session')).toBeInTheDocument();
      });
    });

    it('should show revoke all button when multiple sessions exist', async () => {
      (apiService.getActiveSessions as any).mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'session-1',
            createdAt: '2024-01-01T00:00:00Z',
            lastActivityAt: '2024-01-15T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Chrome Browser',
            ipAddress: '192.168.1.1',
          },
          {
            id: 'session-2',
            createdAt: '2024-01-02T00:00:00Z',
            lastActivityAt: '2024-01-16T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Firefox Browser',
            ipAddress: '192.168.1.2',
          },
        ],
      });

      render(<PrivacyData />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Sign out all other sessions/i })
        ).toBeInTheDocument();
      });
    });

    it('should not show revoke all button when only one session exists', async () => {
      render(<PrivacyData />);

      await waitFor(() => {
        expect(screen.getByText('Chrome Browser')).toBeInTheDocument();
      });

      expect(
        screen.queryByRole('button', { name: /Sign out all other sessions/i })
      ).not.toBeInTheDocument();
    });

    it('should revoke all other sessions when button is clicked', async () => {
      const user = userEvent.setup();
      (apiService.getActiveSessions as any)
        .mockResolvedValueOnce({
          success: true,
          data: [
            {
              id: 'session-1',
              createdAt: '2024-01-01T00:00:00Z',
              lastActivityAt: '2024-01-15T12:00:00Z',
              expiresAt: '2024-02-01T00:00:00Z',
              userAgent: 'Chrome Browser',
              ipAddress: '192.168.1.1',
            },
            {
              id: 'session-2',
              createdAt: '2024-01-02T00:00:00Z',
              lastActivityAt: '2024-01-16T12:00:00Z',
              expiresAt: '2024-02-01T00:00:00Z',
              userAgent: 'Firefox Browser',
              ipAddress: '192.168.1.2',
            },
          ],
        })
        .mockResolvedValueOnce({
          success: true,
          data: [
            {
              id: 'session-1',
              createdAt: '2024-01-01T00:00:00Z',
              lastActivityAt: '2024-01-15T12:00:00Z',
              expiresAt: '2024-02-01T00:00:00Z',
              userAgent: 'Chrome Browser',
              ipAddress: '192.168.1.1',
            },
          ],
        });
      (apiService.logoutAllSessions as any).mockResolvedValueOnce({ success: true });

      render(<PrivacyData />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Sign out all other sessions/i }));
      });

      const revokeAllButton = screen.getByRole('button', { name: /Sign out all other sessions/i });
      await user.click(revokeAllButton);

      await waitFor(() => {
        expect(apiService.logoutAllSessions).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle user agent parsing for different browsers', async () => {
      (apiService.getActiveSessions as any).mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'session-1',
            createdAt: '2024-01-01T00:00:00Z',
            lastActivityAt: '2024-01-15T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Mozilla/5.0 Chrome/91.0',
            ipAddress: '192.168.1.1',
          },
          {
            id: 'session-2',
            createdAt: '2024-01-02T00:00:00Z',
            lastActivityAt: '2024-01-16T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Mozilla/5.0 Firefox/89.0',
            ipAddress: '192.168.1.2',
          },
          {
            id: 'session-3',
            createdAt: '2024-01-03T00:00:00Z',
            lastActivityAt: '2024-01-17T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Mozilla/5.0 Safari/604.1',
            ipAddress: '192.168.1.3',
          },
          {
            id: 'session-4',
            createdAt: '2024-01-04T00:00:00Z',
            lastActivityAt: '2024-01-18T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Mozilla/5.0 Edge/91.0',
            ipAddress: '192.168.1.4',
          },
          {
            id: 'session-5',
            createdAt: '2024-01-05T00:00:00Z',
            lastActivityAt: '2024-01-19T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: null,
            ipAddress: '192.168.1.5',
          },
        ],
      });

      render(<PrivacyData />);

      await waitFor(() => {
        expect(screen.getByText('Chrome Browser')).toBeInTheDocument();
        expect(screen.getByText('Firefox Browser')).toBeInTheDocument();
        expect(screen.getByText('Safari Browser')).toBeInTheDocument();
        expect(screen.getByText('Edge Browser')).toBeInTheDocument();
        expect(screen.getAllByText('Unknown device')).toHaveLength(1);
      });
    });

    it('should truncate long user agent strings', async () => {
      (apiService.getActiveSessions as any).mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'session-1',
            createdAt: '2024-01-01T00:00:00Z',
            lastActivityAt: '2024-01-15T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'A'.repeat(60),
            ipAddress: '192.168.1.1',
          },
          {
            id: 'session-2',
            createdAt: '2024-01-02T00:00:00Z',
            lastActivityAt: '2024-01-16T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Firefox',
            ipAddress: '192.168.1.2',
          },
        ],
      });

      render(<PrivacyData />);

      await waitFor(() => {
        expect(screen.getByText(`${'A'.repeat(50)}...`)).toBeInTheDocument();
      });
    });

    it('should handle session revocation error gracefully', async () => {
      const user = userEvent.setup();
      (apiService.getActiveSessions as any).mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'session-1',
            createdAt: '2024-01-01T00:00:00Z',
            lastActivityAt: '2024-01-15T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Chrome Browser',
            ipAddress: '192.168.1.1',
          },
          {
            id: 'session-2',
            createdAt: '2024-01-02T00:00:00Z',
            lastActivityAt: '2024-01-16T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Firefox Browser',
            ipAddress: '192.168.1.2',
          },
        ],
      });
      (apiService.revokeSession as any).mockRejectedValueOnce(new Error('Network error'));

      render(<PrivacyData />);

      await waitFor(() => {
        expect(screen.getByText('Firefox Browser')).toBeInTheDocument();
      });

      const revokeButton = screen.getByRole('button', { name: 'Revoke this session' });
      await user.click(revokeButton);

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(
          'Failed to revoke session',
          undefined,
          expect.any(Object)
        );
        expect(screen.getByText('Failed to revoke session')).toBeInTheDocument();
      });
    });

    it('should handle logout all sessions error gracefully', async () => {
      const user = userEvent.setup();
      (apiService.getActiveSessions as any).mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'session-1',
            createdAt: '2024-01-01T00:00:00Z',
            lastActivityAt: '2024-01-15T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Chrome Browser',
            ipAddress: '192.168.1.1',
          },
          {
            id: 'session-2',
            createdAt: '2024-01-02T00:00:00Z',
            lastActivityAt: '2024-01-16T12:00:00Z',
            expiresAt: '2024-02-01T00:00:00Z',
            userAgent: 'Firefox Browser',
            ipAddress: '192.168.1.2',
          },
        ],
      });
      (apiService.logoutAllSessions as any).mockRejectedValueOnce(new Error('Network error'));

      render(<PrivacyData />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Sign out all other sessions/i }));
      });

      const revokeAllButton = screen.getByRole('button', { name: /Sign out all other sessions/i });
      await user.click(revokeAllButton);

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(
          'Failed to revoke all sessions',
          undefined,
          expect.any(Object)
        );
        expect(screen.getByText('Failed to sign out other sessions')).toBeInTheDocument();
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly in session details', async () => {
      render(<PrivacyData />);

      await waitFor(() => {
        expect(screen.getByText(/Last active:/)).toBeInTheDocument();
      });

      const timeElement = screen.getByText(/Last active:/);
      expect(timeElement.textContent).toContain('Last active:');
      expect(timeElement.textContent).toContain('2024');
    });
  });

  describe('Data Export Callbacks', () => {
    it('should pass onExportComplete callback to DataExportButton', () => {
      render(<PrivacyData />);

      const mockExportButton = DataExportButton as any;
      expect(mockExportButton).toHaveBeenCalled();

      const mockProps = mockExportButton.mock.calls[0][0];
      expect(mockProps.onExportComplete).toBeDefined();
      expect(typeof mockProps.onExportComplete).toBe('function');
    });

    it('should pass onExportError callback to DataExportButton', () => {
      render(<PrivacyData />);

      const mockExportButton = DataExportButton as any;
      const mockProps = mockExportButton.mock.calls[0][0];

      expect(mockProps.onExportError).toBeDefined();
      expect(typeof mockProps.onExportError).toBe('function');
    });

    it('should pass onExportStart callback to DataExportButton', () => {
      render(<PrivacyData />);

      const mockExportButton = DataExportButton as any;
      const mockProps = mockExportButton.mock.calls[0][0];

      expect(mockProps.onExportStart).toBeDefined();
      expect(typeof mockProps.onExportStart).toBe('function');
    });
  });
});
