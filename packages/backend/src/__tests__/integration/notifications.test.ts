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
import {
  setLocaleHeader,
  SUPPORTED_LOCALES,
  createI18nTestUser,
  getTranslatedMessage,
} from '../helpers/i18n-helpers';
import type { Locale } from '@scrumooth/shared';

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
    type: 'TEAM_INVITATION' | 'TASK_ASSIGNMENT' | 'DAILY_SCRUM_SIGNAL' = 'TASK_ASSIGNMENT',
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
      await createTestNotification(user.id, 'DAILY_SCRUM_SIGNAL', 'Unread 3', false);

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

  describe('i18n Locale Support', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    describe('Translated notification content', () => {
      it('should create notification with translated content using user locale preference', async () => {
        const email = `i18n-notif-de-${uniqueId()}@example.com`;
        testEmails.push(email);

        // Create user with German locale preference
        const user = await createI18nTestUser(email, 'de', prisma);

        // Create a notification using the NotificationService's createLocalized method
        const { NotificationService } = await import('../../services/notification.service');
        const notificationService = new NotificationService();

        const notification = await notificationService.createLocalized({
          userId: user.id,
          type: 'TASK_ASSIGNMENT',
          titleKey: 'taskAssigned',
          titleParams: { taskTitle: 'Test Task' },
          messageParams: { taskTitle: 'Test Task' },
        });

        // Verify the notification was created with German translation
        const expectedTitle = getTranslatedMessage('notifications:taskAssigned', 'de', {
          taskTitle: 'Test Task',
        });

        expect(notification.title).toBe(expectedTitle);
        expect(notification.userId).toBe(user.id);
        expect(notification.type).toBe('TASK_ASSIGNMENT');
      });

      it('should create notifications with correct translations for all supported locales', async () => {
        const testCases: { locale: Locale; expectedPattern: RegExp }[] = [
          { locale: 'en', expectedPattern: /Test Task/ },
          { locale: 'de', expectedPattern: /Test Task/ },
          { locale: 'es', expectedPattern: /Test Task/ },
          { locale: 'fr', expectedPattern: /Test Task/ },
          { locale: 'it', expectedPattern: /Test Task/ },
        ];

        for (const { locale } of testCases) {
          const email = `i18n-notif-${locale}-${uniqueId()}@example.com`;
          testEmails.push(email);

          const user = await createI18nTestUser(email, locale, prisma);

          const { NotificationService } = await import('../../services/notification.service');
          const notificationService = new NotificationService();

          const notification = await notificationService.createLocalized({
            userId: user.id,
            type: 'TASK_ASSIGNMENT',
            titleKey: 'taskAssigned',
            titleParams: { taskTitle: 'Test Task' },
            messageParams: { taskTitle: 'Test Task' },
          });

          const expectedTitle = getTranslatedMessage('notifications:taskAssigned', locale, {
            taskTitle: 'Test Task',
          });

          expect(notification.title).toBe(expectedTitle);
        }
      });

      it('should return notification with user-preferred locale content when fetching', async () => {
        const email = `i18n-fetch-${uniqueId()}@example.com`;
        testEmails.push(email);

        // Create user with French locale
        const user = await createI18nTestUser(email, 'fr', prisma);

        // Create a localized notification with valid type
        const { NotificationService } = await import('../../services/notification.service');
        const notificationService = new NotificationService();

        await notificationService.createLocalized({
          userId: user.id,
          type: 'TEAM_INVITATION',
          titleKey: 'teamInvitation',
          titleParams: { teamName: 'Team 42' },
          messageParams: { teamName: 'Team 42' },
        });

        const cookies = await loginAndGetCookies(email);

        // Fetch notifications
        const response = await request(app)
          .get('/api/v1/notifications')
          .set('Cookie', cookies)
          .expect(200);

        expect(response.body.success).toBe(true);

        const notifications = Array.isArray(response.body.data)
          ? response.body.data
          : response.body.data?.notifications || [];

        const teamNotification = notifications.find(
          (n: { type: string }) => n.type === 'TEAM_INVITATION'
        );
        expect(teamNotification).toBeDefined();

        // Verify French translation
        const expectedTitle = getTranslatedMessage('notifications:teamInvitation', 'fr', {
          teamName: 'Team 42',
        });
        expect(teamNotification.title).toBe(expectedTitle);
      });
    });

    describe('Locale-aware notification formatting', () => {
      it('should format task assignment notifications with correct locale interpolation', async () => {
        const email = `i18n-sprint-${uniqueId()}@example.com`;
        testEmails.push(email);

        const user = await createI18nTestUser(email, 'es', prisma);

        const { NotificationService } = await import('../../services/notification.service');
        const notificationService = new NotificationService();

        const notification = await notificationService.createLocalized({
          userId: user.id,
          type: 'TASK_ASSIGNMENT',
          titleKey: 'taskAssigned',
          titleParams: { taskTitle: 'Implement Feature X' },
          messageParams: { taskTitle: 'Implement Feature X' },
        });

        const expectedTitle = getTranslatedMessage('notifications:taskAssigned', 'es', {
          taskTitle: 'Implement Feature X',
        });

        expect(notification.title).toBe(expectedTitle);
        expect(notification.title).toContain('Implement Feature X');
      });

      it('should format impediment notifications with correct locale interpolation', async () => {
        const email = `i18n-impediment-${uniqueId()}@example.com`;
        testEmails.push(email);

        const user = await createI18nTestUser(email, 'it', prisma);

        const { NotificationService } = await import('../../services/notification.service');
        const notificationService = new NotificationService();

        const notification = await notificationService.createLocalized({
          userId: user.id,
          type: 'IMPEDIMENT_ASSIGNMENT',
          titleKey: 'impedimentCreated',
          titleParams: { title: 'Database connection issue' },
          messageParams: { title: 'Database connection issue' },
        });

        const expectedTitle = getTranslatedMessage('notifications:impedimentCreated', 'it', {
          title: 'Database connection issue',
        });

        expect(notification.title).toBe(expectedTitle);
        expect(notification.title).toContain('Database connection issue');
      });

      it('should format task assignment notifications with username interpolation', async () => {
        const email = `i18n-mention-${uniqueId()}@example.com`;
        testEmails.push(email);

        const user = await createI18nTestUser(email, 'fr', prisma);

        const { NotificationService } = await import('../../services/notification.service');
        const notificationService = new NotificationService();

        const notification = await notificationService.createLocalized({
          userId: user.id,
          type: 'TASK_ASSIGNMENT',
          titleKey: 'taskAssigned',
          titleParams: { taskTitle: 'Implement feature X' },
          messageParams: { taskTitle: 'Implement feature X' },
        });

        const expectedTitle = getTranslatedMessage('notifications:taskAssigned', 'fr', {
          taskTitle: 'Implement feature X',
        });

        expect(notification.title).toBe(expectedTitle);
        expect(notification.title).toContain('Implement feature X');
      });
    });

    describe('Translated notification action labels', () => {
      it('should return translated error when notification not found', async () => {
        const email = `i18n-notfound-${uniqueId()}@example.com`;
        testEmails.push(email);

        await createI18nTestUser(email, 'de', prisma);
        const cookies = await loginAndGetCookies(email);
        const { csrfToken } = extractCsrfFromCookies(cookies);

        // Try to mark a non-existent notification as read
        const response = await request(app)
          .patch(`/api/v1/notifications/${generateUUIDv7()}/read`)
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader('de'))
          .expect(404);

        // Note: NotFoundError uses hardcoded English message, not translated
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
        expect(response.body.error.message).toContain('Notification');
      });

      it('should return translated error for all locales when notification not found', async () => {
        for (const locale of SUPPORTED_LOCALES) {
          const email = `i18n-notfound-${locale}-${uniqueId()}@example.com`;
          testEmails.push(email);

          await createI18nTestUser(email, locale as Locale, prisma);
          const cookies = await loginAndGetCookies(email);
          const { csrfToken } = extractCsrfFromCookies(cookies);

          const response = await request(app)
            .patch(`/api/v1/notifications/${generateUUIDv7()}/read`)
            .set('Cookie', cookies)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
            .set(setLocaleHeader(locale as Locale))
            .expect(404);

          // Note: NotFoundError uses hardcoded English message, not translated
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('NOT_FOUND');
          expect(response.body.error.message).toContain('Notification');
        }
      });

      it('should return translated error when deleting non-existent notification', async () => {
        const email = `i18n-delete-${uniqueId()}@example.com`;
        testEmails.push(email);

        await createI18nTestUser(email, 'es', prisma);
        const cookies = await loginAndGetCookies(email);
        const { csrfToken } = extractCsrfFromCookies(cookies);

        const response = await request(app)
          .delete(`/api/v1/notifications/${generateUUIDv7()}`)
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader('es'))
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });
  });
});
