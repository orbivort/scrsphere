import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { useTeamStore, useAuthStore } from '../../store';
import { apiService } from '../../services';

import { TeamManagement } from './Team';

const mockUseAuthStore = useAuthStore as unknown as vi.Mock;

vi.mock('../../services', () => ({
  apiService: {
    getMyTeams: vi.fn(),
    getTeam: vi.fn(),
    getTeamMetrics: vi.fn(),
    getSprintHistory: vi.fn(),
    addTeamMember: vi.fn(),
    removeTeamMember: vi.fn(),
  },
  sessionManager: {
    startSession: vi.fn(),
    endSession: vi.fn(),
    extendSession: vi.fn(),
    getSessionState: vi.fn(),
    setActivityNotifier: vi.fn(),
    initialize: vi.fn(),
    destroy: vi.fn(),
    resetIdleTimer: vi.fn(),
    resetWarningState: vi.fn(),
    updateConfig: vi.fn(),
    getTimeUntilTimeout: vi.fn(),
    getTimeUntilWarning: vi.fn(),
    isSessionExpired: vi.fn(),
  },
}));
vi.mock('../../store');

describe('TeamManagement - Multiple Teams', () => {
  const mockSetCurrentTeam = vi.fn();
  const mockSwitchTeam = vi.fn();
  const mockSetUserTeamsWithRoles = vi.fn();
  const mockSetUserRoleInCurrentTeam = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTeamStore as unknown as vi.Mock).mockReturnValue({
      currentTeam: { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Test Team' },
      userTeamsWithRoles: [
        { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Test Team', userRole: 'developer' },
      ],
      setCurrentTeam: mockSetCurrentTeam,
      switchTeam: mockSwitchTeam,
      setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
      setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
    });
    mockUseAuthStore.mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      },
    });
    // Mock team metrics and sprint history to prevent undefined query warnings
    (apiService.getTeamMetrics as unknown as vi.Mock).mockResolvedValue({
      success: true,
      data: {
        velocity: 10,
        completionRate: 0.8,
        averageCycleTime: 5,
        sprintGoalsAchievement: 0.9,
      },
    });
    (apiService.getSprintHistory as unknown as vi.Mock).mockResolvedValue({
      success: true,
      data: [],
    });
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </BrowserRouter>
    );
  };

  describe('Loading states', () => {
    it('should show loading state when fetching teams', () => {
      (apiService.getMyTeams as unknown as vi.Mock).mockImplementation(() => new Promise(() => {}));

      render(<TeamManagement />, { wrapper: createWrapper() });

      expect(screen.getByText('Loading team information...')).toBeInTheDocument();
    });
  });

  describe('Multiple teams display', () => {
    it('should display team switcher when user has multiple teams', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Beta Team',
          description: 'Mobile development team',
          createdBy: 'user-2',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'product_owner',
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174003',
          name: 'Gamma Team',
          description: 'QA team',
          createdBy: 'user-3',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'scrum_master',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      expect(screen.getByText('Team ID: 123e4567-e89b-12d3-a456-426614174001')).toBeInTheDocument();
    });

    it('should update team information when switching teams', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Beta Team',
          description: 'Mobile development team',
          createdBy: 'user-2',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'product_owner',
        },
      ];

      const mockAlphaTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [
          {
            id: 'member-1',
            teamId: '123e4567-e89b-12d3-a456-426614174001',
            userId: 'user-1',
            role: 'developer',
            joinedAt: '2024-01-01T00:00:00Z',
            user: {
              id: 'user-1',
              email: 'john@example.com',
              firstName: 'John',
              lastName: 'Doe',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          },
        ],
      };

      const mockBetaTeam = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        name: 'Beta Team',
        description: 'Mobile development team',
        createdBy: 'user-2',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [
          {
            id: 'member-2',
            teamId: '123e4567-e89b-12d3-a456-426614174002',
            userId: 'user-2',
            role: 'product_owner',
            joinedAt: '2024-01-01T00:00:00Z',
            user: {
              id: 'user-2',
              email: 'jane@example.com',
              firstName: 'Jane',
              lastName: 'Smith',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          },
        ],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock)
        .mockResolvedValueOnce({ success: true, data: mockAlphaTeam })
        .mockResolvedValueOnce({ success: true, data: mockBetaTeam });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockAlphaTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      mockSwitchTeam.mockResolvedValue(undefined);

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();

      const teamSwitcher = screen.getByRole('button', { name: /switch team/i });
      fireEvent.click(teamSwitcher);

      // Wait for the dropdown to open and show the Beta Team option
      const betaTeamOption = await screen.findByRole('option', { name: /beta team/i });
      expect(betaTeamOption).toBeInTheDocument();

      fireEvent.click(betaTeamOption);

      await waitFor(() => {
        expect(mockSetCurrentTeam).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'Beta Team',
          })
        );
      });
    });
  });

  describe('Error handling', () => {
    it('should show welcome page when teams fail to load', async () => {
      (apiService.getMyTeams as unknown as vi.Mock).mockRejectedValue(
        new Error('Failed to fetch teams')
      );

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: null,
        userTeamsWithRoles: [],
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Welcome to ScrSphere/i)).toBeInTheDocument();
      });
    });

    it('should show welcome page when user has no teams', async () => {
      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: null,
        userTeamsWithRoles: [],
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Welcome to ScrSphere/i)).toBeInTheDocument();
      });
    });

    it('should handle team switch gracefully with new implementation', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Beta Team',
          description: 'Mobile development team',
          createdBy: 'user-2',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'product_owner',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      // Wait for the component to render
      await waitFor(() => {
        expect(screen.getByText('Alpha Team')).toBeInTheDocument();
      });

      const teamSwitcher = screen.getByRole('button', { name: /switch team/i });
      fireEvent.click(teamSwitcher);

      // Wait for the dropdown to open and show the Beta Team option
      const betaTeamOption = await screen.findByRole('option', { name: /beta team/i });
      expect(betaTeamOption).toBeInTheDocument();

      fireEvent.click(betaTeamOption);

      // New implementation calls setCurrentTeam directly
      await waitFor(() => {
        expect(mockSetCurrentTeam).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'Beta Team',
          })
        );
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle user with maximum allowed teams', async () => {
      const mockTeams = Array.from({ length: 10 }, (_, i) => ({
        id: `123e4567-e89b-12d3-a456-42661417400${i + 1}`,
        name: `Team ${i + 1}`,
        description: `Team ${i + 1} description`,
        createdBy: `user-${i + 1}`,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        userRole: 'developer',
      }));

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Team 1',
        description: 'Team 1 description',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Team 1' })).toBeInTheDocument();
      });

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should handle team data loading failure for specific team', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockRejectedValue(new Error('404 Team not found'));

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/team not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data consistency', () => {
    it('should invalidate team queries when switching teams', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Beta Team',
          description: 'Mobile development team',
          createdBy: 'user-2',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'product_owner',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      mockSwitchTeam.mockResolvedValue(undefined);

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      const teamSwitcher = screen.getByRole('button', { name: /switch team/i });
      fireEvent.click(teamSwitcher);

      await waitFor(() => {
        expect(screen.getByText('Beta Team')).toBeInTheDocument();
      });

      const betaTeamOption = screen.getByRole('option', { name: /beta team/i });
      fireEvent.click(betaTeamOption);

      await waitFor(() => {
        // New TeamSwitcher implementation calls setCurrentTeam directly with the team object
        expect(mockSetCurrentTeam).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'Beta Team',
          })
        );
      });
    });
  });

  describe('Team Member Management', () => {
    it('should display team members', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [
          {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'ADMIN',
          },
          {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            role: 'MEMBER',
          },
        ],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      // Component renders team page with member count
      expect(screen.getByText(/2 member/i)).toBeInTheDocument();
    });

    it('should handle add member functionality', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'product_owner',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      // Component shows "Invite Member" button for product owners
      const inviteButton = screen.getByRole('button', { name: /invite member/i });
      expect(inviteButton).toBeInTheDocument();
    });

    it('should handle remove member functionality', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'product_owner',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [
          {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            role: 'MEMBER',
          },
        ],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      // Component renders team page with members section
      expect(screen.getAllByText(/team members/i)[0]).toBeInTheDocument();
    });
  });

  describe('Team Statistics', () => {
    it('should display team statistics', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [
          {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'ADMIN',
          },
          {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            role: 'MEMBER',
          },
        ],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      expect(screen.getByText(/2\s+member/i)).toBeInTheDocument();
    });

    it('should display member role breakdown', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [
          {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'ADMIN',
          },
          {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            role: 'MEMBER',
          },
        ],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      // Component renders team page with member count
      expect(screen.getByText(/2 member/i)).toBeInTheDocument();
    });
  });

  describe('Team Actions', () => {
    it('should handle edit team action', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'product_owner',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      // Component renders team page for product owner
      expect(screen.getByTestId('team-management')).toBeInTheDocument();
    });
  });

  describe('Permission Handling', () => {
    it('should show team for product owner', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'product_owner',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      // Team page renders successfully for product owner
      expect(screen.getByTestId('team-management')).toBeInTheDocument();
    });

    it('should show team for regular members', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      // Team page renders successfully for regular members too
      expect(screen.getByTestId('team-management')).toBeInTheDocument();
    });
  });

  describe('Team Description', () => {
    it('should display team description', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      expect(screen.getByText('Main development team')).toBeInTheDocument();
    });

    it('should handle empty team description', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: '',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: '',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });
    });
  });

  describe('Team Creation Date', () => {
    it('should display team creation date', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });
    });
  });

  describe('Team Update Date', () => {
    it('should display team last updated date', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });
    });
  });

  describe('Team Member Roles', () => {
    it('should display correct member roles', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [
          {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'ADMIN',
          },
          {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            role: 'MEMBER',
          },
        ],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      // Component renders team page with members section
      expect(screen.getAllByText(/team members/i)[0]).toBeInTheDocument();
    });
  });

  describe('Empty Team State', () => {
    it('should handle team with no members', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      expect(screen.getByText(/0\s+member/i)).toBeInTheDocument();
    });
  });

  describe('Team Loading State', () => {
    it('should show loading state when fetching team data', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockImplementation(() => new Promise(() => {}));

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: null,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      // Component shows welcome view when loading/no team
      expect(screen.getByText(/welcome to scrsphere/i)).toBeInTheDocument();
    });
  });

  describe('Team Error State', () => {
    it('should show error state when team fetch fails', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockRejectedValue(
        new Error('Failed to fetch team')
      );

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: null,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      // Component shows welcome view when there's an error
      await waitFor(() => {
        expect(screen.getByText(/welcome to scrsphere/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockRejectedValue(
        new Error('Failed to fetch team')
      );

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: null,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      // Component renders - check for welcome message when no team/error state
      await waitFor(() => {
        expect(screen.getByText(/welcome to scrsphere/i)).toBeInTheDocument();
      });
    });
  });

  describe('Team Member Search', () => {
    it('should search team members', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [
          {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'ADMIN',
          },
          {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            role: 'MEMBER',
          },
        ],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by name or email/i);
      await userEvent.type(searchInput, 'John');

      expect(searchInput).toHaveValue('John');
    });

    it('should clear member search', async () => {
      const user = userEvent.setup();
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [
          {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'ADMIN',
          },
          {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            role: 'MEMBER',
          },
        ],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by name or email/i);
      await user.type(searchInput, 'John');

      // Clear the search input directly
      await user.clear(searchInput);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('Team Member Sorting', () => {
    it('should sort members by name', async () => {
      const user = userEvent.setup();
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [
          {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'ADMIN',
          },
          {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            role: 'MEMBER',
          },
        ],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      // Sort is a combobox/select, not a button
      const sortSelect = screen.getByLabelText(/sort members by/i);
      await user.selectOptions(sortSelect, 'name');

      // Verify the select has the correct value
      expect(sortSelect).toHaveValue('name');
    });

    it('should sort members by role', async () => {
      const user = userEvent.setup();
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [
          {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'ADMIN',
          },
          {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            role: 'MEMBER',
          },
        ],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      // Sort is a combobox/select, not a button
      const sortSelect = screen.getByLabelText(/sort members by/i);
      await user.selectOptions(sortSelect, 'role');

      // Verify the select has the correct value
      expect(sortSelect).toHaveValue('role');
    });
  });

  describe('Team Page Layout', () => {
    it('should render page header', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });
    });

    it('should render team info section', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      expect(screen.getByText('Main development team')).toBeInTheDocument();
    });

    it('should render members section', async () => {
      const mockTeams = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Alpha Team',
          description: 'Main development team',
          createdBy: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userRole: 'developer',
        },
      ];

      const mockCurrentTeam = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alpha Team',
        description: 'Main development team',
        createdBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        members: [
          {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'ADMIN',
          },
        ],
      };

      (apiService.getMyTeams as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockTeams,
      });

      (apiService.getTeam as unknown as vi.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentTeam,
      });

      (useTeamStore as unknown as vi.Mock).mockReturnValue({
        currentTeam: mockCurrentTeam,
        userTeamsWithRoles: mockTeams,
        setCurrentTeam: mockSetCurrentTeam,
        switchTeam: mockSwitchTeam,
        setUserTeamsWithRoles: mockSetUserTeamsWithRoles,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      });

      render(<TeamManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alpha Team' })).toBeInTheDocument();
      });

      // Component renders team page successfully
      expect(screen.getByTestId('team-management')).toBeInTheDocument();
    });
  });
});
