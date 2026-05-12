import type {
  Notification,
  NotificationFilters,
  NotificationsResponse,
  UnreadCountResponse,
} from '../types/notification.types';

import { apiService } from './index';

export interface NotificationConfig {
  pollingIntervalMs: number;
  maxPageSize: number;
  retentionDays: number;
}

export interface SendMessageRequest {
  recipientId: string;
  message: string;
}

export const notificationApi = {
  getConfig: async () => {
    const response = await apiService.get<{ success: boolean; data: NotificationConfig }>(
      '/config/notifications'
    );
    return response.data.data;
  },

  getNotifications: async (filters?: NotificationFilters) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());

    const response = await apiService.get<NotificationsResponse>(
      `/notifications?${params.toString()}`
    );
    return response.data.data;
  },

  getUnreadCount: async () => {
    const response = await apiService.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data.data;
  },

  markAsRead: async (notificationId: string) => {
    const response = await apiService.patch<{
      success: boolean;
      data: { notification: Notification };
    }>(`/notifications/${notificationId}/read`);
    return response.data.data.notification;
  },

  markAllAsRead: async (notificationIds?: string[]) => {
    const response = await apiService.patch<{ success: boolean; data: { updatedCount: number } }>(
      '/notifications/mark-all-read',
      { notificationIds }
    );
    return response.data.data.updatedCount;
  },

  deleteNotification: async (notificationId: string) => {
    await apiService.delete(`/notifications/${notificationId}`);
  },

  sendDirectMessage: async (request: SendMessageRequest) => {
    const response = await apiService.post<{
      success: boolean;
      data: { notification: Notification };
    }>('/notifications/send-message', request);
    return response.data.data.notification;
  },
};
