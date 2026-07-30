import React from 'react';
import { useTranslation } from 'react-i18next';

import styles from './DeletionRightsNotice.module.css';

export const DeletionRightsNotice: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <div
      className={styles['deletion-rights-notice']}
      role="region"
      aria-labelledby="deletion-rights-title"
    >
      <h4 id="deletion-rights-title" className={styles['deletion-rights-title']}>
        {t('deleteAccount.deletionRightsNotice.title')}
      </h4>

      <p className={styles['deletion-rights-text']}>
        {t('deleteAccount.deletionRightsNotice.description')}
      </p>

      <ul className={styles['deletion-rights-list']}>
        <li className={styles['deletion-rights-list-item']}>
          {t('deleteAccount.deletionRightsNotice.list.teamMembersNotified')}
        </li>
        <li className={styles['deletion-rights-list-item']}>
          {t('deleteAccount.deletionRightsNotice.list.assignNewPO')}
        </li>
        <li className={styles['deletion-rights-list-item']}>
          {t('deleteAccount.deletionRightsNotice.list.cancelAnytime')}
        </li>
      </ul>

      <p className={styles['deletion-rights-after']}>
        {t('deleteAccount.deletionRightsNotice.afterGracePeriod')}
      </p>
    </div>
  );
};

export default DeletionRightsNotice;
