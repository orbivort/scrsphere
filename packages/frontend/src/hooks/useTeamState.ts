/**
 * Team State Hook
 *
 * This hook provides a unified interface for team state management,
 * using React Query as the single source of truth for server state
 * and Zustand only for client-side UI state (current team selection).
 *
 * This eliminates the duplication between Zustand and React Query
 * where team data was being cached in both places.
 *
 * @example
 * const { currentTeam, teams, isLoading, switchTeam } = useTeamState();
 */

import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiService } from '../services';
import { useTeamStore, useAuthStore } from '../store';
import { logger } from '../utils/logger';
import type { Team } from '../types';

import { queryKeys } from './queryKeys';

export interface TeamWithRole extends Team {
  userRole: string;
}

export interface UseTeamStateReturn {
  // Server state (from React Query)
  teams: TeamWithRole[];
  teamsLoading: boolean;
  teamsError: Error | null;

  // Client state (from Zustand)
  currentTeamId: string | null;
  currentTeam: Team | null;
  userRoleInCurrentTeam: string | null;

  // Actions
  switchTeam: (teamId: string) => Promise<void>;
  refreshTeams: () => Promise<void>;
  clearTeamContext: () => void;
}

/**
 * Fetches teams with user roles from the API
 */
const fetchTeamsWithRoles = async (): Promise<TeamWithRole[]> => {
  const response = await apiService.getMyTeams();
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to fetch teams');
};

/**
 * Switches to a specific team
 */
const switchTeamRequest = async (teamId: string): Promise<TeamWithRole> => {
  const response = await apiService.selectTeam(teamId);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error('Failed to switch team');
};

/**
 * Hook for managing team state with React Query as the single source of truth
 */
export const useTeamState = (): UseTeamStateReturn => {
  const queryClient = useQueryClient();

  const { isAuthenticated } = useAuthStore();

  const {
    currentTeamId,
    currentTeam,
    userRoleInCurrentTeam,
    setCurrentTeamId,
    setCurrentTeam,
    setUserRoleInCurrentTeam,
    clearTeamContext: clearStoreContext,
  } = useTeamStore();

  const {
    data: teams = [],
    isLoading: teamsLoading,
    error: teamsError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.myTeams.all,
    queryFn: fetchTeamsWithRoles,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: isAuthenticated,
  });

  // Switch team mutation
  const switchTeamMutation = useMutation({
    mutationFn: switchTeamRequest,
    onSuccess: (data) => {
      // Update client state in Zustand
      const { userRole, ...teamData } = data;
      setCurrentTeamId(teamData.id);
      setCurrentTeam(teamData);
      setUserRoleInCurrentTeam(userRole);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.team.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.myTeams.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.task.all });
    },
    onError: (error) => {
      logger.error('Failed to switch team', undefined, { error });
    },
  });

  /**
   * Switches to a specific team
   */
  const switchTeam = useCallback(
    async (teamId: string): Promise<void> => {
      await switchTeamMutation.mutateAsync(teamId);
    },
    [switchTeamMutation]
  );

  /**
   * Refreshes the teams list
   */
  const refreshTeams = useCallback(async (): Promise<void> => {
    await refetch();
  }, [refetch]);

  /**
   * Clears the team context (on logout)
   */
  const clearTeamContext = useCallback((): void => {
    clearStoreContext();
    apiService.clearTeamContext();
  }, [clearStoreContext]);

  // Auto-sync current team data when teams list changes
  useEffect(() => {
    if (currentTeamId && teams.length > 0) {
      const teamWithRole = teams.find((t) => t.id === currentTeamId);
      if (teamWithRole) {
        const { userRole, ...teamData } = teamWithRole;
        const teamDataChanged = JSON.stringify(teamData) !== JSON.stringify(currentTeam);
        const roleChanged = userRole !== userRoleInCurrentTeam;
        if (teamDataChanged || roleChanged) {
          setCurrentTeam(teamData);
          setUserRoleInCurrentTeam(userRole);
        }
      } else {
        clearStoreContext();
      }
    }
  }, [
    teams,
    currentTeamId,
    currentTeam,
    userRoleInCurrentTeam,
    setCurrentTeam,
    setUserRoleInCurrentTeam,
    clearStoreContext,
  ]);

  // Clear team context when user has no teams (e.g., after deleting last team)
  useEffect(() => {
    if (isAuthenticated && !teamsLoading && teams.length === 0 && currentTeamId) {
      clearStoreContext();
    }
  }, [isAuthenticated, teamsLoading, teams.length, currentTeamId, clearStoreContext]);

  // Auto-select first team when user has teams but no current team selected
  useEffect(() => {
    if (isAuthenticated && !teamsLoading && teams.length > 0 && !currentTeamId) {
      const firstTeam = teams[0];
      if (firstTeam) {
        const { userRole, ...teamData } = firstTeam;
        setCurrentTeamId(teamData.id);
        setCurrentTeam(teamData);
        setUserRoleInCurrentTeam(userRole);
      }
    }
  }, [
    isAuthenticated,
    teamsLoading,
    teams,
    currentTeamId,
    setCurrentTeamId,
    setCurrentTeam,
    setUserRoleInCurrentTeam,
  ]);

  return {
    // Server state
    teams,
    teamsLoading,
    teamsError,

    // Client state
    currentTeamId,
    currentTeam,
    userRoleInCurrentTeam,

    // Actions
    switchTeam,
    refreshTeams,
    clearTeamContext,
  };
};

export default useTeamState;
