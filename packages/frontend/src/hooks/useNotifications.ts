import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationApi } from '../services/notificationApi';
import type { NotificationFilters } from '../types/notification.types';

import { queryKeys } from './queryKeys';

const DEFAULT_POLLING_INTERVAL = 30000; // 30 seconds
const MAX_RETRY_DELAY = 30000; // 30 seconds

export const useNotifications = (filters?: NotificationFilters) => {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => notificationApi.getNotifications(filters),
    staleTime: 5 * 1000,
  });
};

export const useNotificationConfig = () => {
  return useQuery({
    queryKey: ['notification-config'],
    queryFn: () => notificationApi.getConfig(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const useUnreadCount = () => {
  const { data: config, isError: isConfigError } = useNotificationConfig();
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const pollingInterval = config?.pollingIntervalMs || DEFAULT_POLLING_INTERVAL;

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: isVisible && !isConfigError ? pollingInterval : false,
    staleTime: Math.max(pollingInterval - 1000, 0),
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, MAX_RETRY_DELAY),
    enabled: !isConfigError,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notification.all });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds?: string[]) => notificationApi.markAllAsRead(notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notification.all });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notification.all });
    },
  });
};
