import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';

import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications';
import { NotificationType, type Notification } from '../../types/notification.types';
import {
  BellIcon,
  CheckIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  InboxIcon,
  UsersIcon,
  FileCheckIcon,
  AlertTriangleIcon,
  SunIcon,
  UserXIcon,
  MessageSquareIcon,
  EditIcon,
  TrashIcon,
} from '../../components/common/Icons';

import styles from './Notifications.module.css';

const getNotificationIcon = (type: NotificationType | string): React.ReactNode => {
  switch (type) {
    case NotificationType.TEAM_INVITATION:
      return <UsersIcon size={20} />;
    case NotificationType.TEAM_REMOVAL:
      return <UserXIcon size={20} />;
    case NotificationType.TASK_ASSIGNMENT:
      return <FileCheckIcon size={20} />;
    case NotificationType.IMPEDIMENT_ASSIGNMENT:
      return <AlertTriangleIcon size={20} />;
    case NotificationType.DAILY_UPDATE_REMINDER:
      return <SunIcon size={20} />;
    case NotificationType.TEAM_CREATED:
      return <UsersIcon size={20} />;
    case NotificationType.TEAM_UPDATED:
      return <EditIcon size={20} />;
    case NotificationType.TEAM_DELETED:
      return <TrashIcon size={20} />;
    case NotificationType.DIRECT_MESSAGE:
      return <MessageSquareIcon size={20} />;
    default:
      return <UsersIcon size={20} />;
  }
};

const getNotificationRoute = (notification: Notification): string => {
  const routes: Record<string, string> = {
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
  return routes[notification.type] ?? '/';
};

type FilterType = 'all' | 'unread' | NotificationType;

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: NotificationType.TEAM_INVITATION, label: 'Team Invitations' },
  { value: NotificationType.TASK_ASSIGNMENT, label: 'Task Assignments' },
  { value: NotificationType.IMPEDIMENT_ASSIGNMENT, label: 'Impediments' },
  { value: NotificationType.DAILY_UPDATE_REMINDER, label: 'Reminders' },
  { value: NotificationType.TEAM_CREATED, label: 'Team Created' },
  { value: NotificationType.TEAM_UPDATED, label: 'Team Updated' },
  { value: NotificationType.TEAM_DELETED, label: 'Team Deleted' },
  { value: NotificationType.DIRECT_MESSAGE, label: 'Direct Messages' },
];

interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  thisWeek: Notification[];
  older: Notification[];
}

const groupNotificationsByDate = (notifications: Notification[]): GroupedNotifications => {
  const groups: GroupedNotifications = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt);

    if (isToday(date)) {
      groups.today.push(notification);
    } else if (isYesterday(date)) {
      groups.yesterday.push(notification);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
};

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>('all');

  const filters = useMemo(
    () => ({
      page,
      limit: 50,
      type: filter !== 'all' && filter !== 'unread' ? filter : undefined,
      isRead: filter === 'unread' ? false : undefined,
    }),
    [page, filter]
  );

  const { data, isLoading, error, refetch } = useNotifications(filters);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const groupedNotifications = useMemo(() => {
    if (!data?.notifications) return { today: [], yesterday: [], thisWeek: [], older: [] };
    return groupNotificationsByDate(data.notifications);
  }, [data?.notifications]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead.mutateAsync(notification.id);
      } catch {
        // Error is already handled by the mutation
      }
    }
    void navigate(getNotificationRoute(notification));
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead.mutateAsync(undefined);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleRetry = () => {
    void refetch();
  };

  return (
    <div className={styles.page} data-testid="notifications">
      <a href="#main-content" className={styles['skip-link']}>
        Skip to main content
      </a>

      <header className={styles.header}>
        <div className={styles['header-content']}>
          <h1 className={styles['page-title']}>
            <span className={styles['page-title-icon']}>
              <BellIcon size={24} />
            </span>
            Notifications
          </h1>
          <p className={styles['page-subtitle']}>
            Stay updated with team activities and important updates
          </p>
        </div>
        <div className={styles['header-actions']}>
          {data?.unreadCount && data.unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className={styles['mark-all-button']}
              disabled={markAllAsRead.isPending}
              type="button"
            >
              <span className={styles['mark-all-button-icon']}>
                <CheckIcon size={16} />
              </span>
              {markAllAsRead.isPending ? 'Marking...' : 'Mark All as Read'}
            </button>
          )}
        </div>
      </header>

      <div className={styles['filter-bar']} role="tablist" aria-label="Filter notifications">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleFilterChange(option.value)}
            className={`${styles['filter-button']} ${filter === option.value ? styles.active : ''}`}
            role="tab"
            aria-selected={filter === option.value}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      <div id="main-content" className={styles.content} tabIndex={-1}>
        {isLoading ? (
          <div className={styles['loading-container']}>
            <div
              className={styles['loading-spinner']}
              role="status"
              aria-label="Loading notifications"
            />
            <p className={styles['loading-text']}>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className={styles['error-state']} role="alert">
            <div className={styles['error-state-icon']}>
              <AlertCircleIcon size={32} />
            </div>
            <h2 className={styles['error-state-title']}>Failed to load notifications</h2>
            <p className={styles['error-state-text']}>
              Something went wrong while fetching your notifications.
            </p>
            <button onClick={handleRetry} className={styles['retry-button']} type="button">
              <RefreshCwIcon size={16} />
              Try Again
            </button>
          </div>
        ) : !data?.notifications || data.notifications.length === 0 ? (
          <div className={styles['empty-state']}>
            <div className={styles['empty-state-icon']}>
              <InboxIcon size={48} />
            </div>
            <h2 className={styles['empty-state-title']}>No notifications yet</h2>
            <p className={styles['empty-state-text']}>
              You will see notifications here when there is activity
            </p>
          </div>
        ) : (
          <>
            <NotificationGroup
              title="Today"
              notifications={groupedNotifications.today}
              onNotificationClick={handleNotificationClick}
            />
            <NotificationGroup
              title="Yesterday"
              notifications={groupedNotifications.yesterday}
              onNotificationClick={handleNotificationClick}
            />
            <NotificationGroup
              title="This Week"
              notifications={groupedNotifications.thisWeek}
              onNotificationClick={handleNotificationClick}
            />
            <NotificationGroup
              title="Older"
              notifications={groupedNotifications.older}
              onNotificationClick={handleNotificationClick}
            />

            {data.pagination.totalPages > 1 && (
              <nav className={styles.pagination} aria-label="Pagination" role="navigation">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={styles['pagination-button']}
                  aria-label="Go to previous page"
                  aria-disabled={page === 1}
                  type="button"
                >
                  Previous
                </button>
                <span className={styles['pagination-info']} aria-current="page">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  className={styles['pagination-button']}
                  aria-label="Go to next page"
                  aria-disabled={page === data.pagination.totalPages}
                  type="button"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface NotificationGroupProps {
  title: string;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
}

const NotificationGroup: React.FC<NotificationGroupProps> = ({
  title,
  notifications,
  onNotificationClick,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className={styles['notification-group']}>
      <h2 className={styles['group-title']}>{title}</h2>
      <div className={styles['notification-list']} role="list">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`${styles['notification-item']} ${!notification.isRead ? styles.unread : ''}`}
            onClick={() => onNotificationClick(notification)}
            role="listitem"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNotificationClick(notification);
              }
            }}
            aria-label={`${notification.title}. ${notification.message ?? ''}. ${formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}`}
          >
            <div
              className={styles['notification-icon']}
              data-type={notification.type}
              aria-hidden="true"
            >
              {getNotificationIcon(notification.type)}
            </div>
            <div className={styles['notification-content']}>
              <h3 className={styles['notification-title']}>{notification.title}</h3>
              {notification.message && (
                <p className={styles['notification-message']}>{notification.message}</p>
              )}
              <div className={styles['notification-meta']}>
                {!notification.isRead && (
                  <span className={styles['unread-indicator']} aria-hidden="true" />
                )}
                <time className={styles['notification-time']} dateTime={notification.createdAt}>
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </time>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
