import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '@scrumooth/shared';

import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications';
import type { Notification, NotificationType } from '../../types/notification.types';
import { ChevronRightIcon } from '../common/Icons';
import { useI18nStore } from '../../i18n/useI18nStore';
import { getNotificationTitle, getNotificationMessage } from '../../utils/notificationTranslation';

import styles from './NotificationPanel.module.css';

const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    TEAM_INVITATION: '👥',
    TEAM_REMOVAL: '🚫',
    TASK_ASSIGNMENT: '✅',
    IMPEDIMENT_ASSIGNMENT: '🚧',
    DAILY_UPDATE_REMINDER: '☀️',
    TEAM_CREATED: '🏢',
    TEAM_UPDATED: '✏️',
    TEAM_DELETED: '🗑️',
    DIRECT_MESSAGE: '💬',
  };
  return icons[type] || '📌';
};

const getNotificationRoute = (notification: Notification): string => {
  if (notification.data?.feedbackId || notification.data?.adjustmentId) {
    return '/backlog';
  }

  const routes: Record<NotificationType, string> = {
    TEAM_INVITATION: '/team',
    TEAM_REMOVAL: '/team',
    TASK_ASSIGNMENT: '/sprint',
    IMPEDIMENT_ASSIGNMENT: '/impediments',
    DAILY_UPDATE_REMINDER: '/daily-scrum',
    TEAM_CREATED: '/settings/team-management',
    TEAM_UPDATED: '/settings/team-management',
    TEAM_DELETED: '/settings/team-management',
    DIRECT_MESSAGE: '/team',
  };
  return routes[notification.type] || '/';
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('common');
  const { t: tNotifications } = useTranslation('notifications');
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications({ limit: 10 });
  const markAsRead = useMarkAsRead();
  const { locale } = useI18nStore();
  const markAllAsRead = useMarkAllAsRead();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead.mutateAsync(notification.id);
    }
    onClose();
    void navigate(getNotificationRoute(notification));
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead.mutateAsync(undefined);
  };

  if (!isOpen) return null;

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div ref={panelRef} className={styles['notification-panel']}>
      <div className={styles['panel-header']}>
        <h3>{t('notifications.title')}</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className={styles['mark-all-read']}
            disabled={markAllAsRead.isPending}
          >
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      <div className={styles['panel-content']}>
        {isLoading ? (
          <div className={styles.loading}>{t('notifications.loading')}</div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>{t('notifications.empty')}</div>
        ) : (
          notifications.map((notification: Notification) => (
            <div
              key={notification.id}
              className={`${styles['notification-item']} ${
                !notification.isRead ? styles.unread : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  void handleNotificationClick(notification);
                }
              }}
            >
              <span className={styles['notification-icon']}>
                {getNotificationIcon(notification.type)}
              </span>
              <div className={styles['notification-content']}>
                <div className={styles['notification-title']}>
                  {getNotificationTitle(notification, tNotifications)}
                </div>
                {getNotificationMessage(notification, tNotifications) && (
                  <div className={styles['notification-message']}>
                    {getNotificationMessage(notification, tNotifications)}
                  </div>
                )}
                <div className={styles['notification-time']}>
                  {formatRelativeTime(notification.createdAt, locale)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles['panel-footer']}>
        <button
          onClick={() => {
            onClose();
            void navigate('/notifications');
          }}
          className={styles['view-all']}
        >
          {t('notifications.viewAll')}
          <ChevronRightIcon size={14} />
        </button>
      </div>
    </div>
  );
};
