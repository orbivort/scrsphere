import React from 'react';

import styles from './DeletionRightsNotice.module.css';

export const DeletionRightsNotice: React.FC = () => {
  return (
    <div
      className={styles['deletion-rights-notice']}
      role="region"
      aria-labelledby="deletion-rights-title"
    >
      <h4 id="deletion-rights-title" className={styles['deletion-rights-title']}>
        Your Right to Erasure
      </h4>

      <p className={styles['deletion-rights-text']}>
        You have the right to delete your account. Since you are the last Product Owner, we ask that
        you schedule deletion with a 14-day grace period so your teams can prepare.
      </p>

      <ul className={styles['deletion-rights-list']}>
        <li className={styles['deletion-rights-list-item']}>Team members will be notified</li>
        <li className={styles['deletion-rights-list-item']}>You can assign a new Product Owner</li>
        <li className={styles['deletion-rights-list-item']}>
          You can cancel the deletion at any time
        </li>
      </ul>

      <p className={styles['deletion-rights-after']}>
        After 14 days, you can permanently delete your account regardless.
      </p>
    </div>
  );
};

export default DeletionRightsNotice;
