/* eslint-disable react-refresh/only-export-components -- Context, provider, and hooks are co-located */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../store';
import { useTeamState } from '../hooks';
import { logger } from '../utils/logger';
import loadingStyles from '../components/common/Loading/LoadingState.module.css';
import type { Team } from '../types';

interface TeamContextType {
  currentTeam: Team | null;
  userRole: string | null;
  userTeams: (Team & { userRole: string })[];
  isLoading: boolean;
  error: string | null;
  switchTeam: (teamId: string) => Promise<void>;
  refreshTeams: () => Promise<unknown>;
  hasMultipleTeams: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

/**
 * Team Provider
 *
 * Uses the useTeamState hook which implements React Query as the single
 * source of truth for server state, eliminating duplication with Zustand.
 *
 * @see useTeamState hook for implementation details
 */
export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localError, setLocalError] = useState<string | null>(null);

  const { isAuthenticated } = useAuthStore();

  // Use the new useTeamState hook with React Query as single source of truth
  const {
    teams,
    teamsLoading,
    teamsError,
    currentTeam,
    userRoleInCurrentTeam,
    switchTeam: stateSwitchTeam,
    refreshTeams,
  } = useTeamState();

  const hasMultipleTeams = teams.length > 1;

  // Wrap switchTeam to handle errors
  const switchTeam = useCallback(
    async (teamId: string) => {
      setLocalError(null);
      try {
        await stateSwitchTeam(teamId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to switch team';
        setLocalError(errorMessage);
        logger.error('Error switching team', undefined, { error: err });
        throw err;
      }
    },
    [stateSwitchTeam]
  );

  // Derive error from either React Query or local state
  const error = localError ?? teamsError?.message ?? null;

  // Only show loading when authenticated and actually loading
  const isLoading = isAuthenticated && teamsLoading;

  const value: TeamContextType = {
    currentTeam,
    userRole: userRoleInCurrentTeam,
    userTeams: teams,
    isLoading,
    error,
    switchTeam,
    refreshTeams,
    hasMultipleTeams,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export const useTeamContext = (): TeamContextType => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeamContext must be used within a TeamProvider');
  }
  return context;
};

export const TeamInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentTeam, userTeams, isLoading, switchTeam } = useTeamContext();
  const { isAuthenticated } = useAuthStore();
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const navigate = useNavigate();

  // Prevent infinite loading - timeout after 5 seconds
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
        logger.warn('Team context loading timeout - forcing completion');
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading]);

  useEffect(() => {
    // Only run team initialization if user is authenticated
    // This prevents redirect to /team when user is being logged out
    if (!isAuthenticated) {
      setInitialized(true);
      return;
    }

    if ((!isLoading || loadingTimeout) && !initialized) {
      if (userTeams.length === 0) {
        void navigate('/team');
      } else if (userTeams.length === 1 && !currentTeam) {
        const firstTeam = userTeams[0];
        if (firstTeam) {
          void switchTeam(firstTeam.id);
        }
      } else if (userTeams.length > 1 && !currentTeam) {
        setShowTeamSelection(true);
      }
      setInitialized(true);
    }
  }, [
    isAuthenticated,
    isLoading,
    userTeams,
    currentTeam,
    initialized,
    switchTeam,
    navigate,
    loadingTimeout,
  ]);

  // Handle case when user deletes their last team after initialization
  useEffect(() => {
    if (isAuthenticated && initialized && !isLoading && userTeams.length === 0) {
      void navigate('/team');
    }
  }, [isAuthenticated, initialized, isLoading, userTeams.length, navigate]);

  const handleTeamSelect = async (teamId: string) => {
    await switchTeam(teamId);
    setShowTeamSelection(false);
    void navigate('/dashboard');
  };

  if (isLoading && !loadingTimeout) {
    return (
      <div className={loadingStyles['loading-screen']}>
        <div className={loadingStyles['loading-spinner']} />
        <p>Initializing team context...</p>
      </div>
    );
  }

  return (
    <>
      {children}
      {showTeamSelection && (
        <div className="team-selection-overlay">
          <div className="team-selection-modal">
            <div className="team-selection-header">
              <h2>Select a Team</h2>
              <button
                className="close-button"
                onClick={() => setShowTeamSelection(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="team-selection-content">
              {userTeams.map((team) => (
                <button
                  key={team.id}
                  className="team-card"
                  onClick={() => handleTeamSelect(team.id)}
                >
                  <div className="team-card-content">
                    <div className="team-info">
                      <h3 className="team-name">{team.name}</h3>
                      {team.description && <p className="team-description">{team.description}</p>}
                    </div>
                    <div className={`role-badge ${getRoleBadgeColor(team.userRole)}`}>
                      {getRoleLabel(team.userRole)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'PRODUCT_OWNER':
      return 'badge-po';
    case 'SCRUM_MASTER':
      return 'badge-sm';
    case 'DEVELOPER':
      return 'badge-dev';
    default:
      return 'badge-default';
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'PRODUCT_OWNER':
      return 'Product Owner';
    case 'SCRUM_MASTER':
      return 'Scrum Master';
    case 'DEVELOPER':
      return 'Developer';
    default:
      return role;
  }
}
