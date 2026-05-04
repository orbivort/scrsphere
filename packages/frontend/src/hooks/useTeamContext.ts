import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTeamContext } from '../contexts/TeamContext';

interface UseTeamContextOptions {
  requireTeam?: boolean;
  requireRoles?: string[];
  redirectTo?: string;
}

export const useRequireTeam = (options: UseTeamContextOptions = {}) => {
  const { requireTeam = true, requireRoles = [], redirectTo = '/team' } = options;

  const { currentTeam, userRole, userTeams } = useTeamContext();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requireTeam && !currentTeam) {
      if (userTeams.length === 0) {
        navigate(redirectTo);
      } else if (userTeams.length === 1) {
        // Auto-select single team
        // This is handled by TeamProvider
      }
      // Multiple teams: TeamSelectionModal will be shown
      return;
    }

    if (requireRoles.length > 0 && userRole && !requireRoles.includes(userRole)) {
      setError(`Insufficient permissions. Required roles: ${requireRoles.join(', ')}`);
    } else {
      setError(null);
    }
  }, [currentTeam, userRole, userTeams, requireTeam, requireRoles, redirectTo, navigate]);

  return {
    currentTeam,
    userRole,
    hasAccess: !error,
    error,
  };
};

export const useTeamRole = (requiredRoles: string[]) => {
  const { userRole } = useTeamContext();

  const hasRequiredRole = userRole ? requiredRoles.includes(userRole) : false;

  return {
    hasRequiredRole,
    userRole,
    canAccess: hasRequiredRole,
  };
};
