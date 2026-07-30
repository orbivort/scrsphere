import { type NotificationType, type Notification, type Prisma } from '../generated/prisma/client';
import prisma from '../utils/prisma';
import { generateUUIDv7 } from '../utils/uuid';
import config from '../config';
import { NotFoundError } from '../utils/errors';
import type { Locale } from '@scrumooth/shared';
import { DEFAULT_LOCALE } from '@scrumooth/shared';
import { i18nInstance } from '../i18n/config.js';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  data?: Prisma.InputJsonValue;
  createdBy?: string;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  type?: NotificationType;
  isRead?: boolean;
}

export class NotificationService {
  async create(input: CreateNotificationInput): Promise<Notification> {
    return await prisma.notification.create({
      data: {
        id: generateUUIDv7(),
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data ?? {},
        createdBy: input.createdBy ?? input.userId,
      },
    });
  }

  /**
   * Create a localized notification by resolving the recipient's locale
   * and translating the title/message keys via i18next.
   * Stores both canonical data (messageKey column + params JSON) and rendered
   * text (title/message columns) for backward compatibility and email/push
   * notifications.
   *
   * The `messageKey` database column stores the message's i18n key (not the
   * title key). The `params` column stores a full i18n context object
   * containing both title and message keys with their respective parameters,
   * so the notification can be re-translated at display time if the user's
   * locale changes.
   *
   * @param input.titleKey   - i18n key for the notification title
   * @param input.titleParams - Interpolation parameters for the title key (optional)
   * @param input.messageKey  - i18n key for the notification message (optional)
   * @param input.messageParams - Interpolation parameters for the message key (optional)
   */
  async createLocalized(input: {
    userId: string;
    type: string;
    titleKey: string;
    titleParams?: Record<string, unknown>;
    messageKey?: string;
    messageParams?: Record<string, unknown>;
    data?: unknown;
    createdBy?: string;
  }): Promise<Notification> {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { locale: true },
    });

    const t = i18nInstance.getFixedT(
      (user?.locale as Locale | undefined) ?? DEFAULT_LOCALE,
      'notifications'
    );
    const title = t(input.titleKey, input.titleParams);
    const message = input.messageKey ? t(input.messageKey, input.messageParams) : undefined;

    // Create notification with both canonical data and rendered text
    return await prisma.notification.create({
      data: {
        id: generateUUIDv7(),
        userId: input.userId,
        type: input.type as NotificationType,
        title, // Rendered text for email/push fallback
        message, // Rendered text for email/push fallback
        messageKey: input.messageKey ?? null, // Canonical message key for display-time translation
        params: {
          titleKey: input.titleKey,
          titleParams: input.titleParams ?? {},
          messageKey: input.messageKey ?? null,
          messageParams: input.messageParams ?? {},
        } as Prisma.InputJsonValue, // Canonical i18n context for re-translation
        data: input.data as Prisma.InputJsonValue,
        createdBy: input.createdBy ?? input.userId,
      },
    });
  }

  async findByUserId(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<{
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    unreadCount: number;
  }> {
    const page = filters.page ?? 1;
    const maxPageSize = config.notification.maxPageSize;
    const limit = Math.min(filters.limit ?? 50, maxPageSize);
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { userId };
    if (filters.type) where.type = filters.type;
    if (filters.isRead !== undefined) where.isRead = filters.isRead;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string, notificationIds?: string[]): Promise<number> {
    const where: Prisma.NotificationWhereInput = { userId, isRead: false };
    if (notificationIds && notificationIds.length > 0) {
      where.id = { in: notificationIds };
    }

    const result = await prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return result.count;
  }

  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}

export const notificationService = new NotificationService();
