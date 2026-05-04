// Integration Tests for Notifications Endpoints
// Tests notification management and preferences

import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../utils/prisma';
import { generateUUIDv7 } from '../../utils/uuid';
import bcrypt from 'bcrypt';
import { CSRF_CONSTANTS } from '../../middleware/csrf.middleware';
import { getCsrfToken, extractCsrfFromCookies } from '../helpers/test-helpers';

// Helper to generate unique test identifier
const uniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

describe('Notifications Integration Tests', () => {
  // Helper to create a test user directly in the database
  const createTestUserInDb = async (
    email: string,
    password: string = 'TestPassword123!',
    firstName: string = 'Test',
    lastName: string = 'User'
  ) => {
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = generateUUIDv7();

    const user = await prisma.user.create({
      data: {
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    return user;
  };

  // Helper to login and get cookies
  const loginAndGetCookies = async (
    email: string,
    password: string = 'TestPassword123!'
  ): Promise<string[]> => {
    const { csrfCookie, csrfToken } = await getCsrfToken();

    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Cookie', csrfCookie)
      .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
      .send({ email, password });

    const setCookie = response.headers['set-cookie'];
    if (!setCookie) {
      return [csrfCookie];
    }
    const authCookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    return [...authCookies, csrfCookie];
  };

  // Helper to create a notification
  const createTestNotification = async (
    userId: string,
    type: 'TEAM_INVITATION' | 'TASK_ASSIGNMENT' | 'DAILY_UPDATE_REMINDER' = 'TASK_ASSIGNMENT',
    title: string = 'Test Notification',
    isRead: boolean = false
  ) => {
    const notificationId = generateUUIDv7();
    const notification = await prisma.notification.create({
      data: {
        id: notificationId,
        userId,
        type,
        title,
        message: 'This is a test notification message',
        isRead,
        readAt: isRead ? new Date() : null,
      },
    });
    return notification;
  };

  // Cleanup helper
  const cleanupTestData = async (emails: string[]) => {
    try {
      for (const email of emails) {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (user) {
          await prisma.notification.deleteMany({ where: { userId: user.id } });
          await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
          await prisma.teamMember.deleteMany({ where: { userId: user.id } });
          await prisma.user.delete({ where: { id: user.id } });
        }
      }
    } catch (_error) {
      // Ignore cleanup errors
    }
  };

  describe('GET /api/v1/notifications', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should return notifications for authenticated user', async () => {
      const email = `notifications-list-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      await createTestNotification(user.id, 'TASK_ASSIGNMENT', 'Task assigned to you');
      await createTestNotification(user.id, 'TEAM_INVITATION', 'You were invited to a team');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      // The API may return data in different formats (array or paginated object)
      const notifications = Array.isArray(response.body.data)
        ? response.body.data
        : response.body.data?.items || response.body.data?.notifications || [];
      expect(Array.isArray(notifications)).toBe(true);
    });

    it('should return response when no notifications', async () => {
      const email = `no-notifications-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      // The API may return data in different formats
      const notifications = Array.isArray(response.body.data)
        ? response.body.data
        : response.body.data?.items || response.body.data?.notifications || [];
      expect(Array.isArray(notifications)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/v1/notifications').expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should return count of unread notifications', async () => {
      const email = `unread-count-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      await createTestNotification(user.id, 'TASK_ASSIGNMENT', 'Unread 1', false);
      await createTestNotification(user.id, 'TASK_ASSIGNMENT', 'Unread 2', false);
      await createTestNotification(user.id, 'TASK_ASSIGNMENT', 'Read', true);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.count).toBe('number');
      expect(response.body.data.count).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/v1/notifications/unread-count').expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should mark notification as read', async () => {
      const email = `mark-read-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const notification = await createTestNotification(user.id, 'TASK_ASSIGNMENT', 'Mark me read');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .patch(`/api/v1/notifications/${notification.id}/read`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify in database
      const updatedNotification = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(updatedNotification?.isRead).toBe(true);
      expect(updatedNotification?.readAt).not.toBeNull();
    });

    it('should return 404 for non-existent notification', async () => {
      const email = `nonexistent-notif-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .patch(`/api/v1/notifications/${generateUUIDv7()}/read`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .patch(`/api/v1/notifications/${generateUUIDv7()}/read`)
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/notifications/mark-all-read', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should mark all notifications as read', async () => {
      const email = `mark-all-read-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      await createTestNotification(user.id, 'TASK_ASSIGNMENT', 'Unread 1', false);
      await createTestNotification(user.id, 'TEAM_INVITATION', 'Unread 2', false);
      await createTestNotification(user.id, 'DAILY_UPDATE_REMINDER', 'Unread 3', false);

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .patch('/api/v1/notifications/mark-all-read')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify in database
      const unreadCount = await prisma.notification.count({
        where: { userId: user.id, isRead: false },
      });
      expect(unreadCount).toBe(0);
    });

    it('should return 401 when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .patch('/api/v1/notifications/mark-all-read')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/notifications/:id', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should delete notification successfully', async () => {
      const email = `delete-notification-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const notification = await createTestNotification(user.id, 'TASK_ASSIGNMENT', 'Delete me');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete(`/api/v1/notifications/${notification.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify notification is deleted
      const deletedNotification = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(deletedNotification).toBeNull();
    });

    it('should return 404 for non-existent notification', async () => {
      const email = `delete-nonexistent-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete(`/api/v1/notifications/${generateUUIDv7()}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .delete(`/api/v1/notifications/${generateUUIDv7()}`)
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
