import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { TeamProvider, TeamInitializer, useTeamContext } from './TeamContext';
import { useAuthStore } from '../store';
import * as useTeamStateModule from '../hooks/useTeamState';
import type { Team } from '../types';

// Mock hooks and modules
vi.mock('../hooks/useTeamState');
vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  },
  setStoreProvider: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createMockTeam = (
  id: string,
  name: string,
  role = 'DEVELOPER'
): Team & { userRole: string } => ({
  id,
  name,
  description: `${name} description`,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'user-1',
  userRole: role,
});

const TestComponent = () => {
  const context = useTeamContext();
  return (
    <div>
      <div data-testid="current-team">{context.currentTeam?.name || 'No team'}</div>
      <div data-testid="user-role">{context.userRole || 'No role'}</div>
      <div data-testid="teams-count">{context.userTeams.length}</div>
      <div data-testid="is-loading">{context.isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="has-error">{context.error || 'no-error'}</div>
      <div data-testid="has-multiple">{context.hasMultipleTeams ? 'yes' : 'no'}</div>
      <button data-testid="switch-team-btn" onClick={() => context.switchTeam('team-2')}>
        Switch Team
      </button>
      <button data-testid="refresh-teams-btn" onClick={() => context.refreshTeams()}>
        Refresh Teams
      </button>
    </div>
  );
};

describe('TeamProvider', () => {
  const mockSwitchTeam = vi.fn();
  const mockRefreshTeams = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ isAuthenticated: true, user: null, isLoading: false, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide team context with default values', () => {
    vi.mocked(useTeamStateModule.useTeamState).mockReturnValue({
      teams: [],
      teamsLoading: false,
      teamsError: null,
      currentTeam: null,
      userRoleInCurrentTeam: null,
      switchTeam: mockSwitchTeam,
      refreshTeams: mockRefreshTeams,
    });

    render(
      <MemoryRouter>
        <TeamProvider>
          <TestComponent />
        </TeamProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('current-team')).toHaveTextContent('No team');
    expect(screen.getByTestId('user-role')).toHaveTextContent('No role');
    expect(screen.getByTestId('teams-count')).toHaveTextContent('0');
    expect(screen.getByTestId('has-multiple')).toHaveTextContent('no');
  });

  it('should display current team when available', () => {
    const mockTeam = createMockTeam('team-1', 'Test Team');

    vi.mocked(useTeamStateModule.useTeamState).mockReturnValue({
      teams: [mockTeam],
      teamsLoading: false,
      teamsError: null,
      currentTeam: mockTeam,
      userRoleInCurrentTeam: 'DEVELOPER',
      switchTeam: mockSwitchTeam,
      refreshTeams: mockRefreshTeams,
    });

    render(
      <MemoryRouter>
        <TeamProvider>
          <TestComponent />
        </TeamProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('current-team')).toHaveTextContent('Test Team');
    expect(screen.getByTestId('user-role')).toHaveTextContent('DEVELOPER');
    expect(screen.getByTestId('teams-count')).toHaveTextContent('1');
  });

  it('should show loading state when authenticated and loading', () => {
    vi.mocked(useTeamStateModule.useTeamState).mockReturnValue({
      teams: [],
      teamsLoading: true,
      teamsError: null,
      currentTeam: null,
      userRoleInCurrentTeam: null,
      switchTeam: mockSwitchTeam,
      refreshTeams: mockRefreshTeams,
    });

    render(
      <MemoryRouter>
        <TeamProvider>
          <TestComponent />
        </TeamProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('is-loading')).toHaveTextContent('loading');
  });

  it('should not show loading when not authenticated', () => {
    useAuthStore.setState({ isAuthenticated: false });

    vi.mocked(useTeamStateModule.useTeamState).mockReturnValue({
      teams: [],
      teamsLoading: true,
      teamsError: null,
      currentTeam: null,
      userRoleInCurrentTeam: null,
      switchTeam: mockSwitchTeam,
      refreshTeams: mockRefreshTeams,
    });

    render(
      <MemoryRouter>
        <TeamProvider>
          <TestComponent />
        </TeamProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('is-loading')).toHaveTextContent('not-loading');
  });

  it('should display error from teamsError', () => {
    vi.mocked(useTeamStateModule.useTeamState).mockReturnValue({
      teams: [],
      teamsLoading: false,
      teamsError: new Error('Failed to fetch teams'),
      currentTeam: null,
      userRoleInCurrentTeam: null,
      switchTeam: mockSwitchTeam,
      refreshTeams: mockRefreshTeams,
    });

    render(
      <MemoryRouter>
        <TeamProvider>
          <TestComponent />
        </TeamProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('has-error')).toHaveTextContent('Failed to fetch teams');
  });

  it('should indicate multiple teams', () => {
    const teams = [
      createMockTeam('team-1', 'Team 1'),
      createMockTeam('team-2', 'Team 2'),
      createMockTeam('team-3', 'Team 3'),
    ];

    vi.mocked(useTeamStateModule.useTeamState).mockReturnValue({
      teams,
      teamsLoading: false,
      teamsError: null,
      currentTeam: teams[0],
      userRoleInCurrentTeam: 'DEVELOPER',
      switchTeam: mockSwitchTeam,
      refreshTeams: mockRefreshTeams,
    });

    render(
      <MemoryRouter>
        <TeamProvider>
          <TestComponent />
        </TeamProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('has-multiple')).toHaveTextContent('yes');
    expect(screen.getByTestId('teams-count')).toHaveTextContent('3');
  });

  it('should call switchTeam when button clicked', async () => {
    const user = userEvent.setup();
    mockSwitchTeam.mockResolvedValue(undefined);

    vi.mocked(useTeamStateModule.useTeamState).mockReturnValue({
      teams: [],
      teamsLoading: false,
      teamsError: null,
      currentTeam: null,
      userRoleInCurrentTeam: null,
      switchTeam: mockSwitchTeam,
      refreshTeams: mockRefreshTeams,
    });

    render(
      <MemoryRouter>
        <TeamProvider>
          <TestComponent />
        </TeamProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByTestId('switch-team-btn'));

    expect(mockSwitchTeam).toHaveBeenCalledWith('team-2');
  });

  it('should call refreshTeams when button clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(useTeamStateModule.useTeamState).mockReturnValue({
      teams: [],
      teamsLoading: false,
      teamsError: null,
      currentTeam: null,
      userRoleInCurrentTeam: null,
      switchTeam: mockSwitchTeam,
      refreshTeams: mockRefreshTeams,
    });

    render(
      <MemoryRouter>
        <TeamProvider>
          <TestComponent />
        </TeamProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByTestId('refresh-teams-btn'));

    expect(mockRefreshTeams).toHaveBeenCalled();
  });
});

describe('TeamInitializer', () => {
  const mockSwitchTeam = vi.fn();
  const mockRefreshTeams = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ isAuthenticated: true, user: null, isLoading: false, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const InitializerTestComponent = () => <div data-testid="initialized-content">Initialized</div>;

  it('should render children when not loading', () => {
    vi.mocked(useTeamStateModule.useTeamState).mockReturnValue({
      teams: [createMockTeam('team-1', 'Team 1')],
      teamsLoading: false,
      teamsError: null,
      currentTeam: createMockTeam('team-1', 'Team 1'),
      userRoleInCurrentTeam: 'DEVELOPER',
      switchTeam: mockSwitchTeam,
      refreshTeams: mockRefreshTeams,
    });

    render(
      <MemoryRouter>
        <TeamProvider>
          <TeamInitializer>
            <InitializerTestComponent />
          </TeamInitializer>
        </TeamProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('initialized-content')).toBeInTheDocument();
  });

  it('should show loading screen when loading', () => {
    vi.mocked(useTeamStateModule.useTeamState).mockReturnValue({
      teams: [],
      teamsLoading: true,
      teamsError: null,
      currentTeam: null,
      userRoleInCurrentTeam: null,
      switchTeam: mockSwitchTeam,
      refreshTeams: mockRefreshTeams,
    });

    render(
      <MemoryRouter>
        <TeamProvider>
          <TeamInitializer>
            <InitializerTestComponent />
          </TeamInitializer>
        </TeamProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Initializing team context...')).toBeInTheDocument();
  });

  it('should not initialize when user is not authenticated', () => {
    useAuthStore.setState({ isAuthenticated: false });

    vi.mocked(useTeamStateModule.useTeamState).mockReturnValue({
      teams: [],
      teamsLoading: false,
      teamsError: null,
      currentTeam: null,
      userRoleInCurrentTeam: null,
      switchTeam: mockSwitchTeam,
      refreshTeams: mockRefreshTeams,
    });

    render(
      <MemoryRouter>
        <TeamProvider>
          <TeamInitializer>
            <InitializerTestComponent />
          </TeamInitializer>
        </TeamProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('initialized-content')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('TeamContext error handling', () => {
  it('should throw error when useTeamContext is used outside provider', () => {
    // Create a component that uses the hook outside provider
    const TestComponentOutsideProvider = () => {
      try {
        useTeamContext();
        return <div data-testid="no-error">No error</div>;
      } catch (error) {
        return <div data-testid="error-thrown">{(error as Error).message}</div>;
      }
    };

    render(
      <MemoryRouter>
        <TestComponentOutsideProvider />
      </MemoryRouter>
    );

    expect(screen.getByTestId('error-thrown')).toHaveTextContent(
      'useTeamContext must be used within a TeamProvider'
    );
  });
});
