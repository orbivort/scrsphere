import { describe, it, expect, beforeEach, vi } from 'vitest';
import prisma from '../../../utils/prisma';
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  generateTestUUID,
} from '../../setup/testSetup';

// Mock prisma
vi.mock('../../../utils/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock the NotificationService module
const mockCreate = vi.fn();

vi.mock('../../../services/notification.service', () => ({
  NotificationService: class MockNotificationService {
    create = mockCreate;
  },
}));

describe('MessageController', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  // Import the controller after mocks are set up
  let MessageController: typeof import('../../../controllers/message.controller').MessageController;
  let messageController: InstanceType<typeof MessageController>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCreate.mockClear();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();

    // Import the controller fresh for each test
    const module = await import('../../../controllers/message.controller');
    MessageController = module.MessageController;
    messageController = new MessageController();
  });

  describe('sendDirectMessage', () => {
    it('should send a direct message successfully', async () => {
      const senderId = generateTestUUID();
      const recipientId = generateTestUUID();
      const messageContent = 'Hello, this is a test message';

      mockReq.user = { id: senderId };
      mockReq.body = { recipientId, message: messageContent };

      const mockRecipient = {
        id: recipientId,
        email: 'recipient@example.com',
        firstName: 'Recipient',
        lastName: 'User',
      };

      const mockSender = {
        firstName: 'Sender',
        lastName: 'User',
      };

      const mockNotification = {
        id: generateTestUUID(),
        userId: recipientId,
        type: 'DIRECT_MESSAGE',
        title: 'Message from Sender User',
        message: messageContent,
        data: {
          senderId,
          senderName: 'Sender User',
        },
        createdBy: senderId,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockRecipient as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockSender as any);
      mockCreate.mockResolvedValue(mockNotification);

      await messageController.sendDirectMessage(mockReq as any, mockRes as any, mockNext);

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.user.findUnique).toHaveBeenNthCalledWith(1, {
        where: { id: recipientId },
      });
      expect(prisma.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { id: senderId },
        select: { firstName: true, lastName: true },
      });

      expect(mockCreate).toHaveBeenCalledWith({
        userId: recipientId,
        type: 'DIRECT_MESSAGE',
        title: 'Message from Sender User',
        message: messageContent,
        data: {
          senderId,
          senderName: 'Sender User',
        },
        createdBy: senderId,
      });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { notification: mockNotification },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when recipientId is missing', async () => {
      const senderId = generateTestUUID();

      mockReq.user = { id: senderId };
      mockReq.body = { message: 'Hello' };

      await messageController.sendDirectMessage(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Recipient ID and message are required' },
      });
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 400 when message is missing', async () => {
      const senderId = generateTestUUID();
      const recipientId = generateTestUUID();

      mockReq.user = { id: senderId };
      mockReq.body = { recipientId };

      await messageController.sendDirectMessage(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Recipient ID and message are required' },
      });
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 400 when both recipientId and message are missing', async () => {
      const senderId = generateTestUUID();

      mockReq.user = { id: senderId };
      mockReq.body = {};

      await messageController.sendDirectMessage(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Recipient ID and message are required' },
      });
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 404 when recipient is not found', async () => {
      const senderId = generateTestUUID();
      const recipientId = generateTestUUID();
      const messageContent = 'Hello';

      mockReq.user = { id: senderId };
      mockReq.body = { recipientId, message: messageContent };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      await messageController.sendDirectMessage(mockReq as any, mockRes as any, mockNext);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: recipientId },
      });
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Recipient not found' },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return 404 when sender is not found', async () => {
      const senderId = generateTestUUID();
      const recipientId = generateTestUUID();
      const messageContent = 'Hello';

      mockReq.user = { id: senderId };
      mockReq.body = { recipientId, message: messageContent };

      const mockRecipient = {
        id: recipientId,
        email: 'recipient@example.com',
        firstName: 'Recipient',
        lastName: 'User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockRecipient as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      await messageController.sendDirectMessage(mockReq as any, mockRes as any, mockNext);

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Sender not found' },
      });
    });

    it('should pass errors to next middleware', async () => {
      const senderId = generateTestUUID();
      const recipientId = generateTestUUID();
      const messageContent = 'Hello';

      mockReq.user = { id: senderId };
      mockReq.body = { recipientId, message: messageContent };

      const error = new Error('Database connection failed');
      vi.mocked(prisma.user.findUnique).mockRejectedValue(error);

      await messageController.sendDirectMessage(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should handle notification service errors', async () => {
      const senderId = generateTestUUID();
      const recipientId = generateTestUUID();
      const messageContent = 'Hello';

      mockReq.user = { id: senderId };
      mockReq.body = { recipientId, message: messageContent };

      const mockRecipient = {
        id: recipientId,
        email: 'recipient@example.com',
        firstName: 'Recipient',
        lastName: 'User',
      };

      const mockSender = {
        firstName: 'Sender',
        lastName: 'User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockRecipient as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockSender as any);

      const error = new Error('Notification service failed');
      mockCreate.mockRejectedValue(error);

      await messageController.sendDirectMessage(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should handle empty message string', async () => {
      const senderId = generateTestUUID();
      const recipientId = generateTestUUID();

      mockReq.user = { id: senderId };
      mockReq.body = { recipientId, message: '' };

      await messageController.sendDirectMessage(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Recipient ID and message are required' },
      });
    });

    it('should handle message with special characters', async () => {
      const senderId = generateTestUUID();
      const recipientId = generateTestUUID();
      const messageContent = 'Hello! @#$%^&*()_+{}|[]\\:";\'<>?,./';

      mockReq.user = { id: senderId };
      mockReq.body = { recipientId, message: messageContent };

      const mockRecipient = {
        id: recipientId,
        email: 'recipient@example.com',
        firstName: 'Recipient',
        lastName: 'User',
      };

      const mockSender = {
        firstName: 'Sender',
        lastName: 'User',
      };

      const mockNotification = {
        id: generateTestUUID(),
        userId: recipientId,
        type: 'DIRECT_MESSAGE',
        title: 'Message from Sender User',
        message: messageContent,
        data: {
          senderId,
          senderName: 'Sender User',
        },
        createdBy: senderId,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockRecipient as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockSender as any);
      mockCreate.mockResolvedValue(mockNotification);

      await messageController.sendDirectMessage(mockReq as any, mockRes as any, mockNext);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          message: messageContent,
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { notification: mockNotification },
      });
    });

    it('should handle long message content', async () => {
      const senderId = generateTestUUID();
      const recipientId = generateTestUUID();
      const messageContent = 'A'.repeat(1000);

      mockReq.user = { id: senderId };
      mockReq.body = { recipientId, message: messageContent };

      const mockRecipient = {
        id: recipientId,
        email: 'recipient@example.com',
        firstName: 'Recipient',
        lastName: 'User',
      };

      const mockSender = {
        firstName: 'Sender',
        lastName: 'User',
      };

      const mockNotification = {
        id: generateTestUUID(),
        userId: recipientId,
        type: 'DIRECT_MESSAGE',
        title: 'Message from Sender User',
        message: messageContent,
        data: {
          senderId,
          senderName: 'Sender User',
        },
        createdBy: senderId,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockRecipient as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockSender as any);
      mockCreate.mockResolvedValue(mockNotification);

      await messageController.sendDirectMessage(mockReq as any, mockRes as any, mockNext);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          message: messageContent,
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { notification: mockNotification },
      });
    });

    it('should handle unicode characters in message', async () => {
      const senderId = generateTestUUID();
      const recipientId = generateTestUUID();
      const messageContent = 'Hello 世界 🌍 Привет';

      mockReq.user = { id: senderId };
      mockReq.body = { recipientId, message: messageContent };

      const mockRecipient = {
        id: recipientId,
        email: 'recipient@example.com',
        firstName: 'Recipient',
        lastName: 'User',
      };

      const mockSender = {
        firstName: 'Sender',
        lastName: 'User',
      };

      const mockNotification = {
        id: generateTestUUID(),
        userId: recipientId,
        type: 'DIRECT_MESSAGE',
        title: 'Message from Sender User',
        message: messageContent,
        data: {
          senderId,
          senderName: 'Sender User',
        },
        createdBy: senderId,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockRecipient as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockSender as any);
      mockCreate.mockResolvedValue(mockNotification);

      await messageController.sendDirectMessage(mockReq as any, mockRes as any, mockNext);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          message: messageContent,
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { notification: mockNotification },
      });
    });

    it('should handle sender with special characters in name', async () => {
      const senderId = generateTestUUID();
      const recipientId = generateTestUUID();
      const messageContent = 'Hello';

      mockReq.user = { id: senderId };
      mockReq.body = { recipientId, message: messageContent };

      const mockRecipient = {
        id: recipientId,
        email: 'recipient@example.com',
        firstName: 'Recipient',
        lastName: 'User',
      };

      const mockSender = {
        firstName: 'Jean-Pierre',
        lastName: "O'Connor-Smith",
      };

      const mockNotification = {
        id: generateTestUUID(),
        userId: recipientId,
        type: 'DIRECT_MESSAGE',
        title: "Message from Jean-Pierre O'Connor-Smith",
        message: messageContent,
        data: {
          senderId,
          senderName: "Jean-Pierre O'Connor-Smith",
        },
        createdBy: senderId,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockRecipient as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockSender as any);
      mockCreate.mockResolvedValue(mockNotification);

      await messageController.sendDirectMessage(mockReq as any, mockRes as any, mockNext);

      expect(mockCreate).toHaveBeenCalledWith({
        userId: recipientId,
        type: 'DIRECT_MESSAGE',
        title: "Message from Jean-Pierre O'Connor-Smith",
        message: messageContent,
        data: {
          senderId,
          senderName: "Jean-Pierre O'Connor-Smith",
        },
        createdBy: senderId,
      });
    });

    it('should handle sender with unicode characters in name', async () => {
      const senderId = generateTestUUID();
      const recipientId = generateTestUUID();
      const messageContent = 'Hello';

      mockReq.user = { id: senderId };
      mockReq.body = { recipientId, message: messageContent };

      const mockRecipient = {
        id: recipientId,
        email: 'recipient@example.com',
        firstName: 'Recipient',
        lastName: 'User',
      };

      const mockSender = {
        firstName: '田中',
        lastName: '太郎',
      };

      const mockNotification = {
        id: generateTestUUID(),
        userId: recipientId,
        type: 'DIRECT_MESSAGE',
        title: 'Message from 田中 太郎',
        message: messageContent,
        data: {
          senderId,
          senderName: '田中 太郎',
        },
        createdBy: senderId,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockRecipient as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockSender as any);
      mockCreate.mockResolvedValue(mockNotification);

      await messageController.sendDirectMessage(mockReq as any, mockRes as any, mockNext);

      expect(mockCreate).toHaveBeenCalledWith({
        userId: recipientId,
        type: 'DIRECT_MESSAGE',
        title: 'Message from 田中 太郎',
        message: messageContent,
        data: {
          senderId,
          senderName: '田中 太郎',
        },
        createdBy: senderId,
      });
    });
  });
});
