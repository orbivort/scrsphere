import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';

import { useTeamState, type TeamWithRole } from './useTeamState';
import * as storeModule from '../store';
import { apiService } from '../services';

vi.mock('../store', () => ({
  useTeamStore: vi.fn(),
  useAuthStore: vi.fn(),
}));

vi.mock('../services', () => ({
  apiService: {
    getMyTeams: vi.fn(),
    selectTeam: vi.fn(),
    clearTeamContext: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

const createMockTeam = (id: string, name: string, userRole: string): TeamWithRole => ({
  id,
  name,
  description: `${name} description`,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'user-1',
  userRole,
});

describe('useTeamState', () => {
  const mockSetCurrentTeamId = vi.fn();
  const mockSetCurrentTeam = vi.fn();
  const mockSetUserRoleInCurrentTeam = vi.fn();
  const mockClearTeamContext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(storeModule.useAuthStore).mockReturnValue({
      isAuthenticated: true,
    } as any);

    vi.mocked(storeModule.useTeamStore).mockReturnValue({
      currentTeamId: null,
      currentTeam: null,
      userRoleInCurrentTeam: null,
      setCurrentTeamId: mockSetCurrentTeamId,
      setCurrentTeam: mockSetCurrentTeam,
      setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
      clearTeamContext: mockClearTeamContext,
    } as any);
  });

  describe('Role Syncing', () => {
    it('should sync role from team data when userRole is initially null but team has role', async () => {
      const teamWithRole = createMockTeam('team-1', 'Test Team', 'PRODUCT_OWNER');

      vi.mocked(storeModule.useTeamStore).mockReturnValue({
        currentTeamId: 'team-1',
        currentTeam: {
          id: 'team-1',
          name: 'Test Team',
          description: 'Test Team description',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'user-1',
        },
        userRoleInCurrentTeam: null,
        setCurrentTeamId: mockSetCurrentTeamId,
        setCurrentTeam: mockSetCurrentTeam,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
        clearTeamContext: mockClearTeamContext,
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [teamWithRole],
      });

      renderHook(() => useTeamState(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(mockSetUserRoleInCurrentTeam).toHaveBeenCalledWith('PRODUCT_OWNER');
      });
    });

    it('should update role when role changes in team data', async () => {
      const teamWithRole = createMockTeam('team-1', 'Test Team', 'SCRUM_MASTER');

      vi.mocked(storeModule.useTeamStore).mockReturnValue({
        currentTeamId: 'team-1',
        currentTeam: {
          id: 'team-1',
          name: 'Test Team',
          description: 'Test Team description',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'user-1',
        },
        userRoleInCurrentTeam: 'PRODUCT_OWNER',
        setCurrentTeamId: mockSetCurrentTeamId,
        setCurrentTeam: mockSetCurrentTeam,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
        clearTeamContext: mockClearTeamContext,
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [teamWithRole],
      });

      renderHook(() => useTeamState(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(mockSetUserRoleInCurrentTeam).toHaveBeenCalledWith('SCRUM_MASTER');
      });
    });

    it('should not update role when role is the same', async () => {
      const teamWithRole = createMockTeam('team-1', 'Test Team', 'PRODUCT_OWNER');

      vi.mocked(storeModule.useTeamStore).mockReturnValue({
        currentTeamId: 'team-1',
        currentTeam: {
          id: 'team-1',
          name: 'Test Team',
          description: 'Test Team description',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'user-1',
        },
        userRoleInCurrentTeam: 'PRODUCT_OWNER',
        setCurrentTeamId: mockSetCurrentTeamId,
        setCurrentTeam: mockSetCurrentTeam,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
        clearTeamContext: mockClearTeamContext,
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [teamWithRole],
      });

      renderHook(() => useTeamState(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(vi.mocked(apiService.getMyTeams)).toHaveBeenCalled();
      });

      expect(mockSetUserRoleInCurrentTeam).not.toHaveBeenCalled();
    });
  });

  describe('Auto-select Team', () => {
    it('should auto-select first team when user has teams but no current team selected', async () => {
      const teamWithRole = createMockTeam('team-1', 'Test Team', 'PRODUCT_OWNER');

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [teamWithRole],
      });

      renderHook(() => useTeamState(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(mockSetCurrentTeamId).toHaveBeenCalledWith('team-1');
        expect(mockSetCurrentTeam).toHaveBeenCalled();
        expect(mockSetUserRoleInCurrentTeam).toHaveBeenCalledWith('PRODUCT_OWNER');
      });
    });
  });

  describe('Clear Team Context', () => {
    it('should clear team context when user has no teams', async () => {
      vi.mocked(storeModule.useTeamStore).mockReturnValue({
        currentTeamId: 'team-1',
        currentTeam: {
          id: 'team-1',
          name: 'Test Team',
          description: 'Test Team description',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'user-1',
        },
        userRoleInCurrentTeam: 'PRODUCT_OWNER',
        setCurrentTeamId: mockSetCurrentTeamId,
        setCurrentTeam: mockSetCurrentTeam,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
        clearTeamContext: mockClearTeamContext,
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [],
      });

      renderHook(() => useTeamState(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(mockClearTeamContext).toHaveBeenCalled();
      });
    });
  });

  describe('Switch Team', () => {
    it('should switch team successfully', async () => {
      const teamWithRole = createMockTeam('team-1', 'Test Team', 'PRODUCT_OWNER');
      const newTeamWithRole = createMockTeam('team-2', 'New Team', 'SCRUM_MASTER');

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [teamWithRole, newTeamWithRole],
      });

      vi.mocked(apiService.selectTeam).mockResolvedValue({
        success: true,
        data: newTeamWithRole,
      });

      const { result } = renderHook(() => useTeamState(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.teams).toHaveLength(2);
      });

      await act(async () => {
        await result.current.switchTeam('team-2');
      });

      expect(apiService.selectTeam).toHaveBeenCalledWith('team-2');
    });

    it('should handle switch team error', async () => {
      const teamWithRole = createMockTeam('team-1', 'Test Team', 'PRODUCT_OWNER');

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [teamWithRole],
      });

      vi.mocked(apiService.selectTeam).mockRejectedValue(new Error('Failed to switch team'));

      const { result } = renderHook(() => useTeamState(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.teams).toHaveLength(1);
      });

      await act(async () => {
        try {
          await result.current.switchTeam('team-2');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });

    it('should handle switch team with failed response', async () => {
      const teamWithRole = createMockTeam('team-1', 'Test Team', 'PRODUCT_OWNER');

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [teamWithRole],
      });

      vi.mocked(apiService.selectTeam).mockResolvedValue({
        success: false,
        data: null,
      });

      const { result } = renderHook(() => useTeamState(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.teams).toHaveLength(1);
      });

      await act(async () => {
        try {
          await result.current.switchTeam('team-2');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });
  });

  describe('Refresh Teams', () => {
    it('should refresh teams successfully', async () => {
      const teamWithRole = createMockTeam('team-1', 'Test Team', 'PRODUCT_OWNER');

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [teamWithRole],
      });

      const { result } = renderHook(() => useTeamState(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.teams).toHaveLength(1);
      });

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [teamWithRole, createMockTeam('team-2', 'Team 2', 'DEVELOPER')],
      });

      await act(async () => {
        await result.current.refreshTeams();
      });

      expect(apiService.getMyTeams).toHaveBeenCalledTimes(2);
    });
  });

  describe('Clear Team Context Action', () => {
    it('should clear team context via action', async () => {
      const teamWithRole = createMockTeam('team-1', 'Test Team', 'PRODUCT_OWNER');

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [teamWithRole],
      });

      const { result } = renderHook(() => useTeamState(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.teams).toHaveLength(1);
      });

      act(() => {
        result.current.clearTeamContext();
      });

      expect(mockClearTeamContext).toHaveBeenCalled();
      expect(apiService.clearTeamContext).toHaveBeenCalled();
    });
  });

  describe('Fetch Teams Error', () => {
    it('should handle fetch teams error', async () => {
      vi.mocked(apiService.getMyTeams).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useTeamState(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.teamsError).not.toBeNull();
      });

      expect(result.current.teams).toEqual([]);
      expect(result.current.teamsLoading).toBe(false);
    });

    it('should handle fetch teams with failed response', async () => {
      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: false,
        data: null,
      });

      const { result } = renderHook(() => useTeamState(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.teamsError).not.toBeNull();
      });
    });
  });

  describe('Not Authenticated', () => {
    it('should not fetch teams when not authenticated', async () => {
      vi.mocked(storeModule.useAuthStore).mockReturnValue({
        isAuthenticated: false,
      } as any);

      renderHook(() => useTeamState(), { wrapper: createWrapper() });

      expect(apiService.getMyTeams).not.toHaveBeenCalled();
    });
  });

  describe('Team Data Sync', () => {
    it('should clear context when current team not in teams list', async () => {
      const teamWithRole = createMockTeam('team-2', 'Team 2', 'PRODUCT_OWNER');

      vi.mocked(storeModule.useTeamStore).mockReturnValue({
        currentTeamId: 'team-1',
        currentTeam: {
          id: 'team-1',
          name: 'Test Team',
          description: 'Test Team description',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'user-1',
        },
        userRoleInCurrentTeam: 'PRODUCT_OWNER',
        setCurrentTeamId: mockSetCurrentTeamId,
        setCurrentTeam: mockSetCurrentTeam,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
        clearTeamContext: mockClearTeamContext,
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [teamWithRole],
      });

      renderHook(() => useTeamState(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(mockClearTeamContext).toHaveBeenCalled();
      });
    });

    it('should update team data when changed', async () => {
      const teamWithRole = createMockTeam('team-1', 'Updated Team Name', 'PRODUCT_OWNER');

      vi.mocked(storeModule.useTeamStore).mockReturnValue({
        currentTeamId: 'team-1',
        currentTeam: {
          id: 'team-1',
          name: 'Old Team Name',
          description: 'Test Team description',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'user-1',
        },
        userRoleInCurrentTeam: 'PRODUCT_OWNER',
        setCurrentTeamId: mockSetCurrentTeamId,
        setCurrentTeam: mockSetCurrentTeam,
        setUserRoleInCurrentTeam: mockSetUserRoleInCurrentTeam,
        clearTeamContext: mockClearTeamContext,
      } as any);

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [teamWithRole],
      });

      renderHook(() => useTeamState(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(mockSetCurrentTeam).toHaveBeenCalled();
      });
    });
  });

  describe('Return Values', () => {
    it('should return all expected properties', async () => {
      const teamWithRole = createMockTeam('team-1', 'Test Team', 'PRODUCT_OWNER');

      vi.mocked(apiService.getMyTeams).mockResolvedValue({
        success: true,
        data: [teamWithRole],
      });

      const { result } = renderHook(() => useTeamState(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.teams).toBeDefined();
        expect(result.current.teamsLoading).toBeDefined();
        expect(result.current.teamsError).toBeDefined();
        expect(result.current.currentTeamId).toBeDefined();
        expect(result.current.currentTeam).toBeDefined();
        expect(result.current.userRoleInCurrentTeam).toBeDefined();
        expect(result.current.switchTeam).toBeDefined();
        expect(result.current.refreshTeams).toBeDefined();
        expect(result.current.clearTeamContext).toBeDefined();
      });
    });
  });
});
