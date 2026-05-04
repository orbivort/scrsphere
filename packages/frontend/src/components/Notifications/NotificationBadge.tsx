import React from 'react';

import { AlertTriangleIcon } from '../common/Icons';
import { useUnreadCount } from '../../hooks/useNotifications';

import styles from './NotificationBadge.module.css';

export const NotificationBadge: React.FC = () => {
  const { data, isLoading, error } = useUnreadCount();

  const count = data?.count ?? 0;
  const displayCount = count > 99 ? '99+' : count.toString();

  if (error) {
    return (
      <div className={styles['notification-badge-error']} title="Connection error">
        <AlertTriangleIcon size={12} />
      </div>
    );
  }

  if (isLoading || count === 0) {
    return null;
  }

  return <span className={styles['badge-count']}>{displayCount}</span>;
};
