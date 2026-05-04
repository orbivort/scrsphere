import { type Request, type Response, type NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import prisma from '../utils/prisma';

const notificationService = new NotificationService();

export class MessageController {
  async sendDirectMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = req.user!.id;
      const { recipientId, message } = req.body;

      if (!recipientId || !message) {
        res.status(400).json({
          success: false,
          error: { message: 'Recipient ID and message are required' },
        });
        return;
      }

      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
      });

      if (!recipient) {
        res.status(404).json({
          success: false,
          error: { message: 'Recipient not found' },
        });
        return;
      }

      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { firstName: true, lastName: true },
      });

      if (!sender) {
        res.status(404).json({
          success: false,
          error: { message: 'Sender not found' },
        });
        return;
      }

      const notification = await notificationService.create({
        userId: recipientId,
        type: 'DIRECT_MESSAGE',
        title: `Message from ${sender.firstName} ${sender.lastName}`,
        message,
        data: {
          senderId,
          senderName: `${sender.firstName} ${sender.lastName}`,
        },
        createdBy: senderId,
      });

      res.json({
        success: true,
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  }
}
