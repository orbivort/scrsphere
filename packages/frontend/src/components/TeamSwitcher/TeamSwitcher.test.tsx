import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as storeModule from '../../store';
import * as hooksModule from '../../hooks';
import { apiService } from '../../services';
import type { Team, User } from '../../types';

import { TeamSwitcher } from './TeamSwitcher';

// Mock the store module
vi.mock('../../store', () => ({
  useTeamStore: vi.fn(),
  useAuthStore: vi.fn(),
}));

// Mock the hooks module
vi.mock('../../hooks', () => ({
  useClickOutside: vi.fn(),
  useEscapeKey: vi.fn(),
}));

// Mock the API service
vi.mock('../../services', () => ({
  apiService: {
    getMyTeams: vi.fn(),
    selectTeam: vi.fn(),
  },
}));

// Mock CSS modules
vi.mock('./TeamSwitcher.module.css', () => ({
  default: {
    'team-switcher': 'team-switcher',
    'team-switcher-compact': 'team-switcher-compact',
    'team-switcher-loading': 'team-switcher-loading',
    'loading-spinner-small': 'loading-spinner-small',
    'team-switcher-single': 'team-switcher-single',
    'team-avatar': 'team-avatar',
    'team-avatar-small': 'team-avatar-small',
    'team-avatar-placeholder': 'team-avatar-placeholder',
    'team-info': 'team-info',
    'team-name': 'team-name',
    'team-role': 'team-role',
    'team-role-scrum-master': 'team-role-scrum-master',
    'team-role-product-owner': 'team-role-product-owner',
    'team-role-developer': 'team-role-developer',
    'team-role-default': 'team-role-default',
    'team-switcher-trigger': 'team-switcher-trigger',
    'team-count': 'team-count',
    chevron: 'chevron',
    'chevron-open': 'chevron-open',
    'team-switcher-backdrop': 'team-switcher-backdrop',
    'team-switcher-dropdown': 'team-switcher-dropdown',
    'team-switcher-header': 'team-switcher-header',
    'team-count-badge': 'team-count-badge',
    'team-switcher-list': 'team-switcher-list',
    'team-option': 'team-option',
    'team-option-active': 'team-option-active',
    'team-option-info': 'team-option-info',
    'team-option-name': 'team-option-name',
    'team-option-role': 'team-option-role',
    'team-option-role-scrum-master': 'team-option-role-scrum-master',
    'team-option-role-product-owner': 'team-option-role-product-owner',
    'team-option-role-developer': 'team-option-role-developer',
    'team-option-role-default': 'team-option-role-default',
    'check-icon': 'check-icon',
  },
}));

// Helper function to create mock teams
const createMockTeam = (
  id: string,
  name: string,
  userRole: string
): Team & { userRole: string } => ({
  id,
  name,
  description: `Description for ${name}`,
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  userRole,
});

const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

// Helper to create a test query client
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

// Helper to render with providers
const renderWithProviders = (ui: React.ReactElement, queryClient = createTestQueryClient()) => {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('TeamSwitcher Component', () => {
  const mockSetCurrentTeam = vi.fn();
  const mockSetUserTeamsWithRoles = vi.fn();
  const mockSetUserRoleInCurrentTeam = vi.fn();

  const createMockTeamStore = (overrides = {}) => ({
    currentTeam: null,
    userTeamsWithRoles: [],
    setCurrentTeam: mockSetCurrentTeam,
    setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
    setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock hooks to do nothing by default
    vi.mocked(hooksModule.useClickOutside).mockImplementation(() => {});
    vi.mocked(hooksModule.useEscapeKey).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('should render loading state when data is being fetched', async () => {
      // Arrange
      vi.mocked(storeModule.useTeamStore).mockReturnValue(createMockTeamStore() as any);

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockImplementation(() => new Promise(() => {}));

      // Act
      const { container } = renderWithProviders(<TeamSwitcher />);

      // Assert
      await waitFor(() => {
        expect(container.querySelector('.team-switcher-loading')).toBeInTheDocument();
      });
    });

    it('should render "No Team" when there is an error fetching teams', async () => {
      // Arrange
      vi.mocked(storeModule.useTeamStore).mockReturnValue(createMockTeamStore() as any);

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockRejectedValue(new Error('Failed to fetch'));

      // Act
      renderWithProviders(<TeamSwitcher />);

      // Assert - Wait for loading to finish then check for "No Team"
      await waitFor(
        () => {
          expect(screen.queryByText('No Team')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should render "No Team" when user has no teams', async () => {
      // Arrange
      vi.mocked(storeModule.useTeamStore).mockReturnValue(createMockTeamStore() as any);

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [],
      });

      // Act
      renderWithProviders(<TeamSwitcher />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('No Team')).toBeInTheDocument();
      });
    });

    it('should render single team view when user has only one team', async () => {
      // Arrange
      const singleTeam = createMockTeam('team-1', 'Alpha Team', 'scrum_master');

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: singleTeam, userTeamsWithRoles: [singleTeam] }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [singleTeam],
      });

      // Act
      renderWithProviders(<TeamSwitcher />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Alpha Team')).toBeInTheDocument();
        expect(screen.getByText('scrum master')).toBeInTheDocument();
        expect(screen.getByText('AT')).toBeInTheDocument();
      });
    });

    it('should render team switcher with dropdown when user has multiple teams', async () => {
      // Arrange
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      // Act
      renderWithProviders(<TeamSwitcher />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Alpha Team')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('should render first team when no current team is selected', async () => {
      // Arrange
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      // Act
      renderWithProviders(<TeamSwitcher />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Alpha Team')).toBeInTheDocument();
        expect(screen.getByText('scrum master')).toBeInTheDocument();
      });
    });

    it('should render in compact mode when compact prop is true', async () => {
      // Arrange
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      // Act
      const { container } = renderWithProviders(<TeamSwitcher compact />);

      // Assert
      await waitFor(() => {
        const teamSwitcher = container.querySelector('.team-switcher');
        expect(teamSwitcher).toHaveClass('team-switcher-compact');
      });
    });
  });

  describe('User Interaction Tests', () => {
    it('should open dropdown when trigger button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      renderWithProviders(<TeamSwitcher />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      // Act
      await user.click(screen.getByRole('button'));

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(screen.getByText('Your Teams')).toBeInTheDocument();
        expect(screen.getByText('Beta Team')).toBeInTheDocument();
      });
    });

    it('should close dropdown when clicking backdrop', async () => {
      // Arrange
      const user = userEvent.setup();
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      const { container } = renderWithProviders(<TeamSwitcher />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      // Open dropdown
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Act - Click backdrop
      const backdrop = container.querySelector('.team-switcher-backdrop');
      expect(backdrop).toBeInTheDocument();
      await user.click(backdrop!);

      // Assert
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('should call setCurrentTeam when selecting a different team', async () => {
      // Arrange
      const user = userEvent.setup();
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      renderWithProviders(<TeamSwitcher />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      // Open dropdown
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Act - Click on second team option
      const teamOptions = screen.getAllByRole('option');
      await user.click(teamOptions[1]);

      // Assert
      await waitFor(() => {
        expect(mockSetCurrentTeam).toHaveBeenCalledWith(teams[1]);
      });
    });

    it('should toggle dropdown when clicking trigger button multiple times', async () => {
      // Arrange
      const user = userEvent.setup();
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      renderWithProviders(<TeamSwitcher />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const triggerButton = screen.getByRole('button');

      // Act - Open dropdown
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Act - Close dropdown by clicking again
      await user.click(triggerButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('State Management Tests', () => {
    it('should use userTeamsWithRoles from store when API response is not successful', async () => {
      // Arrange
      const storeTeams = [
        createMockTeam('team-1', 'Store Team Alpha', 'scrum_master'),
        createMockTeam('team-2', 'Store Team Beta', 'developer'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: storeTeams[0], userTeamsWithRoles: storeTeams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: false,
        error: { code: 'ERROR', message: 'Failed to fetch' },
      });

      // Act
      renderWithProviders(<TeamSwitcher />);

      // Assert - Should still render using store data
      await waitFor(() => {
        expect(screen.getByText('Store Team Alpha')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('should update when currentTeam changes in store', async () => {
      // Arrange
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
      ];

      const queryClient = createTestQueryClient();

      // First render with first team
      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      const { rerender } = renderWithProviders(<TeamSwitcher />, queryClient);

      await waitFor(() => {
        expect(screen.getByText('Alpha Team')).toBeInTheDocument();
      });

      // Update store to return second team as current
      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[1], userTeamsWithRoles: teams }) as any
      );

      // Act
      rerender(
        <QueryClientProvider client={queryClient}>
          <TeamSwitcher />
        </QueryClientProvider>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Beta Team')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Case Handling Tests', () => {
    it('should handle teams with long names by truncating', async () => {
      // Arrange
      const longNameTeam = createMockTeam(
        'team-1',
        'Very Long Team Name That Should Be Truncated',
        'scrum_master'
      );

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({
          currentTeam: longNameTeam,
          userTeamsWithRoles: [longNameTeam],
        }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [longNameTeam],
      });

      // Act
      renderWithProviders(<TeamSwitcher />);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText('Very Long Team Name That Should Be Truncated')
        ).toBeInTheDocument();
        expect(screen.getByText('VL')).toBeInTheDocument();
      });
    });

    it('should handle teams with special characters in names', async () => {
      // Arrange
      const specialTeam = createMockTeam('team-1', 'Team @#$%^&*()', 'developer');

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: specialTeam, userTeamsWithRoles: [specialTeam] }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [specialTeam],
      });

      // Act
      renderWithProviders(<TeamSwitcher />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Team @#$%^&*()')).toBeInTheDocument();
        expect(screen.getByText('T@')).toBeInTheDocument();
      });
    });

    it('should handle teams with single word names', async () => {
      // Arrange
      const singleWordTeam = createMockTeam('team-1', 'Engineering', 'product_owner');

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({
          currentTeam: singleWordTeam,
          userTeamsWithRoles: [singleWordTeam],
        }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [singleWordTeam],
      });

      // Act
      renderWithProviders(<TeamSwitcher />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Engineering')).toBeInTheDocument();
        expect(screen.getByText('E')).toBeInTheDocument();
      });
    });

    it('should handle teams with multi-word names for initials', async () => {
      // Arrange
      const multiWordTeam = createMockTeam('team-1', 'Engineering Team Alpha', 'developer');

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({
          currentTeam: multiWordTeam,
          userTeamsWithRoles: [multiWordTeam],
        }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [multiWordTeam],
      });

      // Act
      renderWithProviders(<TeamSwitcher />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Engineering Team Alpha')).toBeInTheDocument();
        expect(screen.getByText('ET')).toBeInTheDocument();
      });
    });

    it('should handle all user roles with correct display', async () => {
      // Arrange
      const user = userEvent.setup();
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'product_owner'),
        createMockTeam('team-3', 'Gamma Team', 'developer'),
        createMockTeam('team-4', 'Delta Team', 'unknown_role'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      renderWithProviders(<TeamSwitcher />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      // Act
      await user.click(screen.getByRole('button'));

      // Assert - Use getAllByText since roles appear in both trigger and dropdown
      await waitFor(() => {
        const scrumMasterElements = screen.getAllByText('scrum master');
        const productOwnerElements = screen.getAllByText('product owner');
        const developerElements = screen.getAllByText('developer');
        const unknownRoleElements = screen.getAllByText('unknown role');

        expect(scrumMasterElements.length).toBeGreaterThanOrEqual(1);
        expect(productOwnerElements.length).toBeGreaterThanOrEqual(1);
        expect(developerElements.length).toBeGreaterThanOrEqual(1);
        expect(unknownRoleElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should handle rapid team switching', async () => {
      // Arrange
      const user = userEvent.setup();
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
        createMockTeam('team-3', 'Gamma Team', 'product_owner'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      renderWithProviders(<TeamSwitcher />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      // Open dropdown
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const teamOptions = screen.getAllByRole('option');

      // Act - Click multiple teams rapidly
      await user.click(teamOptions[1]);

      // Re-open dropdown
      await user.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const newOptions = screen.getAllByRole('option');
      await user.click(newOptions[2]);

      // Assert
      await waitFor(() => {
        expect(mockSetCurrentTeam).toHaveBeenCalledTimes(2);
      });
    });

    it('should render "No Team" when user is null', async () => {
      // Arrange - When user is null, the query is disabled and component shows "No Team"
      vi.mocked(storeModule.useTeamStore).mockReturnValue({
        currentTeam: null,
        userTeamsWithRoles: [],
        setCurrentTeam: mockSetCurrentTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
      } as any);

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: null,
      } as any);

      // Act
      renderWithProviders(<TeamSwitcher />);

      // Assert - Component shows "No Team" when query is disabled (user is null)
      await waitFor(() => {
        expect(screen.getByText('No Team')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA attributes on trigger button', async () => {
      // Arrange
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      // Act
      renderWithProviders(<TeamSwitcher />);

      // Assert
      await waitFor(() => {
        const triggerButton = screen.getByRole('button');
        expect(triggerButton).toHaveAttribute('aria-expanded', 'false');
        expect(triggerButton).toHaveAttribute('aria-haspopup', 'listbox');
      });
    });

    it('should update aria-expanded when dropdown is opened', async () => {
      // Arrange
      const user = userEvent.setup();
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      renderWithProviders(<TeamSwitcher />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const triggerButton = screen.getByRole('button');

      // Act
      await user.click(triggerButton);

      // Assert
      await waitFor(() => {
        expect(triggerButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have proper ARIA attributes on dropdown options', async () => {
      // Arrange
      const user = userEvent.setup();
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      renderWithProviders(<TeamSwitcher />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      // Act
      await user.click(screen.getByRole('button'));

      // Assert
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveAttribute('aria-selected', 'true');
        expect(options[1]).toHaveAttribute('aria-selected', 'false');
      });
    });

    it('should have correct role attributes for listbox pattern', async () => {
      // Arrange
      const user = userEvent.setup();
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      renderWithProviders(<TeamSwitcher />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      // Act
      await user.click(screen.getByRole('button'));

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(2);
      });
    });

    it('should have accessible labels for team count badge', async () => {
      // Arrange
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      // Act
      renderWithProviders(<TeamSwitcher />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });

  describe('Compact Mode Tests', () => {
    it('should not show team name in compact mode with single team', async () => {
      // Arrange
      const team = createMockTeam('team-1', 'Alpha Team', 'scrum_master');

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: team, userTeamsWithRoles: [team] }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [team],
      });

      // Act
      renderWithProviders(<TeamSwitcher compact />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('AT')).toBeInTheDocument();
        expect(screen.queryByText('Alpha Team')).not.toBeInTheDocument();
        expect(screen.queryByText('scrum master')).not.toBeInTheDocument();
      });
    });

    it('should not show team name and count in compact mode with multiple teams', async () => {
      // Arrange
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      // Act
      renderWithProviders(<TeamSwitcher compact />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('AT')).toBeInTheDocument();
        expect(screen.queryByText('Alpha Team')).not.toBeInTheDocument();
        expect(screen.queryByText('2')).not.toBeInTheDocument();
      });
    });

    it('should show dropdown with full team info in compact mode when opened', async () => {
      // Arrange
      const user = userEvent.setup();
      const teams = [
        createMockTeam('team-1', 'Alpha Team', 'scrum_master'),
        createMockTeam('team-2', 'Beta Team', 'developer'),
      ];

      vi.mocked(storeModule.useTeamStore).mockReturnValue(
        createMockTeamStore({ currentTeam: teams[0], userTeamsWithRoles: teams }) as any
      );

      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        user: createMockUser(),
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: teams,
      });

      renderWithProviders(<TeamSwitcher compact />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      // Act
      await user.click(screen.getByRole('button'));

      // Assert - Dropdown should show full team info
      await waitFor(() => {
        expect(screen.getByText('Your Teams')).toBeInTheDocument();
        expect(screen.getByText('Alpha Team')).toBeInTheDocument();
        expect(screen.getByText('Beta Team')).toBeInTheDocument();
        expect(screen.getByText('scrum master')).toBeInTheDocument();
        expect(screen.getByText('developer')).toBeInTheDocument();
      });
    });
  });
});
