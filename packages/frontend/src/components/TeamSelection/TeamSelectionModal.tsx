import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTeamContext } from '../../contexts/TeamContext';
import { logger } from '../../utils/logger';

import styles from './TeamSelectionModal.module.css';

interface TeamSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamSelectionModal: React.FC<TeamSelectionModalProps> = ({ isOpen, onClose }) => {
  const { userTeams, switchTeam, isLoading } = useTeamContext();
  const [switching, setSwitching] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleTeamSelect = async (teamId: string) => {
    setSwitching(teamId);

    try {
      await switchTeam(teamId);
      onClose();
      void navigate('/dashboard');
    } catch (error) {
      logger.error('Failed to switch team', undefined, { teamId, error });
    } finally {
      setSwitching(null);
    }
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'PRODUCT_OWNER':
        return styles['badge-po'] ?? '';
      case 'SCRUM_MASTER':
        return styles['badge-sm'] ?? '';
      case 'DEVELOPER':
        return styles['badge-dev'] ?? '';
      default:
        return styles['badge-default'] ?? '';
    }
  };

  const getRoleLabel = (role: string): string => {
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
  };

  return (
    <div className={styles['team-selection-overlay']}>
      <div className={styles['team-selection-modal']}>
        <div className={styles['team-selection-header']}>
          <h2>Select a Team</h2>
          <button className={styles['close-button']} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles['team-selection-content']}>
          {isLoading ? (
            <div className={styles['loading-state']}>
              <div className={styles.spinner} />
              <p>Loading teams...</p>
            </div>
          ) : userTeams.length === 0 ? (
            <div className={styles['empty-state']}>
              <p>You don't have any teams yet.</p>
              <button className="button button-primary" onClick={onClose}>
                Go to Team Page
              </button>
            </div>
          ) : (
            <div className={styles['team-list']}>
              {userTeams.map((team) => (
                <button
                  key={team.id}
                  className={`${styles['team-card']} ${switching === team.id ? styles['team-card-switching'] : ''}`}
                  onClick={() => handleTeamSelect(team.id)}
                  disabled={switching !== null}
                >
                  <div className={styles['team-card-content']}>
                    <div className={styles['team-info']}>
                      <h3 className={styles['team-name']}>{team.name}</h3>
                      {team.description && (
                        <p className={styles['team-description']}>{team.description}</p>
                      )}
                    </div>
                    <div className={`${styles['role-badge']} ${getRoleBadgeColor(team.userRole)}`}>
                      {getRoleLabel(team.userRole)}
                    </div>
                  </div>
                  {switching === team.id && (
                    <div className={styles['switching-indicator']}>
                      <div className={styles['spinner-small']} />
                      <span>Switching...</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
