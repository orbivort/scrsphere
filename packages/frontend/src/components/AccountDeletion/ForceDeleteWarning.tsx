import React from 'react';
import { useTranslation } from 'react-i18next';

import type { TeamMembership } from '../../types/auth.types';

import styles from './ForceDeleteWarning.module.css';

interface ForceDeleteWarningProps {
  blockedTeams: TeamMembership[];
}

export const ForceDeleteWarning: React.FC<ForceDeleteWarningProps> = ({ blockedTeams }) => {
  const { t } = useTranslation('common');

  return (
    <div className={styles['force-delete-warning']} role="alert">
      <h4 className={styles['force-delete-warning-title']}>
        {t('deleteAccount.forceDeleteWarning.title')}
      </h4>

      <p className={styles['force-delete-warning-text']}>
        {t('deleteAccount.forceDeleteWarning.description')}
      </p>

      <div className={styles['force-delete-impact']}>
        <p className={styles['force-delete-impact-title']}>
          {t('deleteAccount.forceDeleteWarning.impact.title')}
        </p>
        <ul className={styles['force-delete-impact-list']}>
          <li className={styles['force-delete-impact-item']}>
            {t('deleteAccount.forceDeleteWarning.impact.removePO')}
          </li>
          <li className={styles['force-delete-impact-item']}>
            {t('deleteAccount.forceDeleteWarning.impact.deleteAllData')}
          </li>
          <li className={styles['force-delete-impact-item']}>
            {t('deleteAccount.forceDeleteWarning.impact.cannotUndo')}
          </li>
        </ul>
      </div>

      {blockedTeams.length > 0 && (
        <div className={styles['force-delete-teams']}>
          <p className={styles['force-delete-teams-title']}>
            {t('deleteAccount.forceDeleteWarning.teams.title')}
          </p>
          <ul className={styles['force-delete-teams-list']}>
            {blockedTeams.map((team) => (
              <li key={team.id} className={styles['force-delete-teams-item']}>
                {team.name}
              </li>
            ))}
          </ul>
          <p className={styles['force-delete-teams-consequences']}>
            {t('deleteAccount.forceDeleteWarning.teams.consequences')}
          </p>
        </div>
      )}
    </div>
  );
};

export default ForceDeleteWarning;
