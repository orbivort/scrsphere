import React from 'react';

import type { TeamMembership } from '../../types/auth.types';

import styles from './ForceDeleteWarning.module.css';

interface ForceDeleteWarningProps {
  blockedTeams: TeamMembership[];
}

export const ForceDeleteWarning: React.FC<ForceDeleteWarningProps> = ({ blockedTeams }) => {
  return (
    <div className={styles['force-delete-warning']} role="alert">
      <h4 className={styles['force-delete-warning-title']}>Grace Period Complete</h4>

      <p className={styles['force-delete-warning-text']}>
        The 14-day grace period has ended. You can now permanently delete your account.
      </p>

      <div className={styles['force-delete-impact']}>
        <p className={styles['force-delete-impact-title']}>This will:</p>
        <ul className={styles['force-delete-impact-list']}>
          <li className={styles['force-delete-impact-item']}>
            Remove you as Product Owner from teams with no replacement assigned
          </li>
          <li className={styles['force-delete-impact-item']}>Delete all your data permanently</li>
          <li className={styles['force-delete-impact-item']}>This action CANNOT be undone</li>
        </ul>
      </div>

      {blockedTeams.length > 0 && (
        <div className={styles['force-delete-teams']}>
          <p className={styles['force-delete-teams-title']}>
            The following teams will have NO Product Owner:
          </p>
          <ul className={styles['force-delete-teams-list']}>
            {blockedTeams.map((team) => (
              <li key={team.id} className={styles['force-delete-teams-item']}>
                {team.name}
              </li>
            ))}
          </ul>
          <p className={styles['force-delete-teams-consequences']}>
            These teams will not be able to add or remove team members, manage sprints, or access
            team settings.
          </p>
        </div>
      )}
    </div>
  );
};

export default ForceDeleteWarning;
