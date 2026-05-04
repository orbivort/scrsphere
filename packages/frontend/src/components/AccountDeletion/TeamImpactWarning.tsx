import React from 'react';
import { useNavigate } from 'react-router-dom';

import type { TeamMembership } from '../../types/auth.types';

import styles from './TeamImpactWarning.module.css';

import { AlertTriangleIcon, ArrowRightIcon } from '@/components/common/Icons';

interface TeamImpactWarningProps {
  teams: TeamMembership[];
  isBlocked: boolean;
}

/**
 * TeamImpactWarning component displays the user's team memberships
 * and warns if they are the last Product Owner of any team.
 *
 * @param teams - Array of team memberships
 * @param isBlocked - Whether deletion is blocked due to being last PO
 */
export const TeamImpactWarning: React.FC<TeamImpactWarningProps> = ({ teams, isBlocked }) => {
  const navigate = useNavigate();

  // Handle empty teams array
  if (teams.length === 0) {
    return null;
  }

  const handleGoToTeamSettings = () => {
    void navigate('/team');
  };

  const blockedTeams = teams.filter((team) => team.isLastPO);
  const regularTeams = teams.filter((team) => !team.isLastPO);

  return (
    <div
      className={`${styles['team-impact-section']} ${isBlocked ? styles['team-impact-section-blocked'] : ''}`}
      role="region"
      aria-labelledby="team-impact-title"
    >
      <h3 id="team-impact-title" className={styles['team-impact-title']}>
        Team Impact
      </h3>

      <p className={styles['team-impact-description']}>
        You are a member of {teams.length} team{teams.length !== 1 ? 's' : ''}:
      </p>

      {/* Blocked teams - user is the last Product Owner */}
      {blockedTeams.length > 0 && (
        <div className={styles['blocked-teams']}>
          {blockedTeams.map((team) => (
            <div key={team.id} className={styles['team-item-blocked']}>
              <div className={styles['team-item-header']}>
                <span className={styles['team-item-name']}>{team.name}</span>
                <span className={styles['team-item-role']}>{team.role}</span>
              </div>
              <div className={styles['team-item-warning']} role="alert">
                <span className={styles['warning-icon']} aria-hidden="true">
                  <AlertTriangleIcon size={20} />
                </span>
                <div className={styles['warning-content']}>
                  <p className={styles['warning-text']}>
                    <strong>You are the only Product Owner.</strong> If you delete your account,
                    this team will have no Product Owner. You can schedule deletion with a 14-day
                    grace period.
                  </p>
                  <button
                    type="button"
                    className={styles['team-settings-link']}
                    onClick={() => handleGoToTeamSettings()}
                    aria-label={`Go to ${team.name} settings to assign a new Product Owner`}
                  >
                    Go to Team Settings
                    <ArrowRightIcon size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regular teams - user will be removed */}
      {regularTeams.length > 0 && (
        <div className={styles['regular-teams']}>
          {regularTeams.map((team) => (
            <div key={team.id} className={styles['team-item']}>
              <div className={styles['team-item-header']}>
                <span className={styles['team-item-name']}>{team.name}</span>
                <span className={styles['team-item-role']}>{team.role}</span>
              </div>
              <p className={styles['team-item-message']}>You will be removed from this team.</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamImpactWarning;
