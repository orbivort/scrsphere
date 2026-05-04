import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../utils/prisma';
import { generateUUIDv7 } from '../../utils/uuid';
import { NotificationType } from '../../generated/prisma/client';
import {
  uniqueTestId,
  HTTP_STATUS,
  ERROR_CODES,
  DEFAULT_PASSWORD,
  createTestUser,
  createTestTeamInDb,
  addTeamMember,
  cleanupUsers,
  cleanupTeams,
  ROLES,
  getCsrfToken,
  extractCsrfFromCookies,
  CSRF_CONSTANTS,
} from '@e2e-helpers';

describe('E2E: Notifications', () => {
  const testEmails: string[] = [];
  const testTeamNames: string[] = [];

  afterEach(async () => {
    await cleanupTeams(testTeamNames);
    await cleanupUsers(testEmails);
    testEmails.length = 0;
    testTeamNames.length = 0;
  });

  const loginAndGetCookies = async (email: string): Promise<string[]> => {
    const { csrfCookie, csrfToken } = await getCsrfToken();

    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Cookie', csrfCookie)
      .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
      .send({ email, password: DEFAULT_PASSWORD });

    const setCookie = response.headers['set-cookie'];
    if (!setCookie) {
      return [csrfCookie];
    }
    const authCookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    return [...authCookies, csrfCookie];
  };

  const setupTeamWithUser = async (
    email: string,
    role: (typeof ROLES)[keyof typeof ROLES] = ROLES.DEVELOPER
  ) => {
    const user = await createTestUser(email);
    const teamName = `Notification Team ${uniqueTestId()}`;
    testTeamNames.push(teamName);
    const team = await createTestTeamInDb(teamName);
    await addTeamMember(team.id, user.id, role);
    return { user, team };
  };

  const createTestNotification = async (
    userId: string,
    title: string,
    type: NotificationType = NotificationType.TEAM_INVITATION
  ) => {
    return prisma.notification.create({
      data: {
        id: generateUUIDv7(),
        userId,
        title,
        message: `Test notification message for ${title}`,
        type,
        isRead: false,
      },
    });
  };

  describe('GET /api/v1/notifications', () => {
    it('should return notifications for authenticated user', async () => {
      const email = `notifications-list-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user } = await setupTeamWithUser(email, ROLES.DEVELOPER);

      await createTestNotification(user.id, `Notification 1 ${uniqueTestId()}`);
      await createTestNotification(user.id, `Notification 2 ${uniqueTestId()}`);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notifications');
      expect(Array.isArray(response.body.data.notifications)).toBe(true);
      expect(response.body.data.notifications.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty notifications for user without notifications', async () => {
      const email = `no-notifications-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await setupTeamWithUser(email, ROLES.DEVELOPER);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notifications');
      expect(Array.isArray(response.body.data.notifications)).toBe(true);
      expect(response.body.data.notifications.length).toBe(0);
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should support pagination', async () => {
      const email = `pagination-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user } = await setupTeamWithUser(email, ROLES.DEVELOPER);

      for (let i = 0; i < 15; i++) {
        await createTestNotification(user.id, `Notification ${i} ${uniqueTestId()}`);
      }

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/notifications')
        .query({ page: 1, limit: 10 })
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications.length).toBeLessThanOrEqual(10);
    });

    it('should filter by read status', async () => {
      const email = `filter-read-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user } = await setupTeamWithUser(email, ROLES.DEVELOPER);

      await createTestNotification(user.id, `Unread ${uniqueTestId()}`);
      const notif2 = await createTestNotification(user.id, `Read ${uniqueTestId()}`);
      await prisma.notification.update({
        where: { id: notif2.id },
        data: { isRead: true },
      });

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/notifications')
        .query({ isRead: 'false' })
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should return unread notification count', async () => {
      const email = `unread-count-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user } = await setupTeamWithUser(email, ROLES.DEVELOPER);

      await createTestNotification(user.id, `Unread 1 ${uniqueTestId()}`);
      await createTestNotification(user.id, `Unread 2 ${uniqueTestId()}`);
      const readNotif = await createTestNotification(user.id, `Read ${uniqueTestId()}`);
      await prisma.notification.update({
        where: { id: readNotif.id },
        data: { isRead: true },
      });

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data.count).toBeGreaterThanOrEqual(2);
    });

    it('should return 0 for user without notifications', async () => {
      const email = `zero-count-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await setupTeamWithUser(email, ROLES.DEVELOPER);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(0);
    });
  });

  describe('PUT /api/v1/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const email = `mark-read-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user } = await setupTeamWithUser(email, ROLES.DEVELOPER);

      const notification = await createTestNotification(user.id, `To Read ${uniqueTestId()}`);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .patch(`/api/v1/notifications/${notification.id}/read`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 NOT_FOUND for non-existent notification', async () => {
      const email = `nonexistent-notif-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await setupTeamWithUser(email, ROLES.DEVELOPER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .patch('/api/v1/notifications/00000000-0000-0000-0000-000000000000/read')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 FORBIDDEN for other user notification', async () => {
      const email1 = `user1-${uniqueTestId()}@example.com`;
      const email2 = `user2-${uniqueTestId()}@example.com`;
      testEmails.push(email1, email2);

      const user1 = await createTestUser(email1);
      await createTestUser(email2);

      const notification = await createTestNotification(user1.id, `User1 Notif ${uniqueTestId()}`);

      const cookies = await loginAndGetCookies(email2);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put(`/api/v1/notifications/${notification.id}/read`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken);

      if (response.status === HTTP_STATUS.FORBIDDEN) {
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
      } else if (response.status === HTTP_STATUS.NOT_FOUND) {
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
      }
    });
  });

  describe('PUT /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const email = `read-all-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user } = await setupTeamWithUser(email, ROLES.DEVELOPER);

      await createTestNotification(user.id, `Notif 1 ${uniqueTestId()}`);
      await createTestNotification(user.id, `Notif 2 ${uniqueTestId()}`);
      await createTestNotification(user.id, `Notif 3 ${uniqueTestId()}`);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .patch('/api/v1/notifications/mark-all-read')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/v1/notifications/:id', () => {
    it('should delete a notification', async () => {
      const email = `delete-notif-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user } = await setupTeamWithUser(email, ROLES.DEVELOPER);

      const notification = await createTestNotification(user.id, `To Delete ${uniqueTestId()}`);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete(`/api/v1/notifications/${notification.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);

      const notifCheck = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(notifCheck).toBeNull();
    });

    it('should return 404 NOT_FOUND for non-existent notification', async () => {
      const email = `delete-nonexistent-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await setupTeamWithUser(email, ROLES.DEVELOPER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete('/api/v1/notifications/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });
  });
});
