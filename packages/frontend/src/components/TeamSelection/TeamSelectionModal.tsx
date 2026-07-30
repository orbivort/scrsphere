import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import { useTeamContext } from '../../contexts/TeamContext';
import { logger } from '../../utils/logger';

import styles from './TeamSelectionModal.module.css';

interface TeamSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamSelectionModal: React.FC<TeamSelectionModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('common');
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
        return t('teamSelection.roles.productOwner');
      case 'SCRUM_MASTER':
        return t('teamSelection.roles.scrumMaster');
      case 'DEVELOPER':
        return t('teamSelection.roles.developer');
      default:
        return role;
    }
  };

  return (
    <div className={styles['team-selection-overlay']}>
      <div className={styles['team-selection-modal']}>
        <div className={styles['team-selection-header']}>
          <h2>{t('teamSelection.title')}</h2>
          <button className={styles['close-button']} onClick={onClose} aria-label={t('close')}>
            ×
          </button>
        </div>

        <div className={styles['team-selection-content']}>
          {isLoading ? (
            <div className={styles['loading-state']}>
              <div className={styles.spinner} />
              <p>{t('teamSelection.loading')}</p>
            </div>
          ) : userTeams.length === 0 ? (
            <div className={styles['empty-state']}>
              <p>{t('teamSelection.empty')}</p>
              <button className="button button-primary" onClick={onClose}>
                {t('teamSelection.goToTeamPage')}
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
                      <span>{t('teamSelection.switching')}</span>
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
