import { Router, type Router as RouterType } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { MessageController } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';
import { notificationRateLimit } from '../middleware/rateLimit.middleware';

const router: RouterType = Router();
const controller = new NotificationController();
const messageController = new MessageController();

router.use(notificationRateLimit);

router.get('/', authenticate, controller.getNotifications);
router.get('/unread-count', authenticate, controller.getUnreadCount);
router.post('/send-message', authenticate, messageController.sendDirectMessage);
router.patch('/:id/read', authenticate, controller.markAsRead);
router.patch('/mark-all-read', authenticate, controller.markAllAsRead);
router.delete('/:id', authenticate, controller.deleteNotification);

export default router;
