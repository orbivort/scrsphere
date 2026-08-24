import { type Request, type Response, type NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import prisma from '../utils/prisma';

const notificationService = new NotificationService();

export class MessageController {
  async sendDirectMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = req.user?.id;
      if (!senderId) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' },
        });
        return;
      }
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

      // Use createLocalized so the notification stores canonical i18n keys
      // (params.titleKey/messageKey). The frontend uses those keys to re-translate
      // the title at display time, so switching the UI language updates the
      // "Message from ..." text instead of freezing it in the creation language.
      // The message body is the sender's own content and is passed through via
      // the directMessageBody key.
      const notification = await notificationService.createLocalized({
        userId: recipientId,
        type: 'DIRECT_MESSAGE',
        titleKey: 'directMessageTitle',
        titleParams: { senderName: `${sender.firstName} ${sender.lastName}` },
        messageKey: 'directMessageBody',
        messageParams: { message },
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
