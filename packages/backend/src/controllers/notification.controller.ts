import { type Request, type Response, type NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { type NotificationType } from '../generated/prisma/client';
import prisma from '../utils/prisma';
import { getParamValue } from '../utils/validation';

const notificationService = new NotificationService();

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page, limit, type, isRead } = req.query;

      const filters = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        type: type as NotificationType,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      };

      const result = await notificationService.findByUserId(userId, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: {
          count,
          lastCheckedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = getParamValue(req.params.id);

      if (!id) {
        res.status(400).json({
          success: false,
          error: { message: 'Notification ID is required' },
        });
        return;
      }

      const notification = await notificationService.markAsRead(id, userId);

      res.json({
        success: true,
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { notificationIds } = req.body || {};

      const updatedCount = await notificationService.markAllAsRead(userId, notificationIds);

      res.json({
        success: true,
        data: { updatedCount },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = getParamValue(req.params.id);

      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        res.status(404).json({
          success: false,
          error: { message: 'Notification not found' },
        });
        return;
      }

      await prisma.notification.delete({ where: { id } });

      res.json({
        success: true,
        data: { message: 'Notification deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
}
