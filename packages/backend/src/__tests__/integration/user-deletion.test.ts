import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../utils/prisma';
import { generateUUIDv7 } from '../../utils/uuid';
import bcrypt from 'bcrypt';
import { CSRF_CONSTANTS } from '../../middleware/csrf.middleware';
import { getCsrfToken, extractCsrfFromCookies, replaceCsrfCookie } from '../helpers/test-helpers';

const uniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

describe('User Profile Deletion Integration Tests', () => {
  const createTestUserInDb = async (email: string, password: string = 'TestPassword123') => {
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = generateUUIDv7();

    const user = await prisma.user.create({
      data: {
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    });

    return user;
  };

  const createTestTeamInDb = async (name: string) => {
    const teamId = generateUUIDv7();

    const team = await prisma.team.create({
      data: {
        id: teamId,
        name,
        description: `Test team: ${name}`,
      },
    });

    return team;
  };

  const addTeamMember = async (
    teamId: string,
    userId: string,
    role: 'PRODUCT_OWNER' | 'SCRUM_MASTER' | 'DEVELOPER'
  ) => {
    const membershipId = generateUUIDv7();

    const membership = await prisma.teamMember.create({
      data: {
        id: membershipId,
        teamId,
        userId,
        role,
      },
    });

    return membership;
  };

  const createRefreshToken = async (userId: string) => {
    const tokenId = generateUUIDv7();
    const token = generateUUIDv7();
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        token: token.slice(0, 16),
        tokenHash,
        userId,
        expiresAt,
        lastActivityAt: new Date(),
      },
    });

    return token;
  };

  const createNotification = async (userId: string) => {
    const notificationId = generateUUIDv7();

    const notification = await prisma.notification.create({
      data: {
        id: notificationId,
        userId,
        type: 'TASK_ASSIGNMENT',
        title: 'Test Notification',
        message: 'This is a test notification',
      },
    });

    return notification;
  };

  const loginAndGetCookies = async (
    email: string,
    password: string = 'TestPassword123'
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

  const cleanupTestData = async (emails: string[]) => {
    try {
      for (const email of emails) {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (user) {
          await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
          await prisma.notification.deleteMany({ where: { userId: user.id } });
          await prisma.teamMember.deleteMany({ where: { userId: user.id } });
          await prisma.dailyUpdate.deleteMany({ where: { userId: user.id } });
          await prisma.retroItemVote.deleteMany({ where: { userId: user.id } });
          await prisma.task.updateMany({
            where: { assigneeId: user.id },
            data: { assigneeId: null },
          });
          await prisma.impediment.deleteMany({
            where: { reportedById: user.id },
          });
          await prisma.impediment.updateMany({
            where: { ownerId: user.id },
            data: { ownerId: null },
          });
          await prisma.retrospectiveItem.updateMany({
            where: { authorId: user.id },
            data: { authorId: null },
          });
          await prisma.retroActionItem.deleteMany({
            where: { ownerId: user.id },
          });
          await prisma.sprintBacklogChange.updateMany({
            where: { createdBy: user.id },
            data: { createdBy: null },
          });
          await prisma.doDChecklistVerification.deleteMany({
            where: { verifiedBy: user.id },
          });
          await prisma.doRChecklistVerification.deleteMany({
            where: { verifiedBy: user.id },
          });
          await prisma.user.delete({ where: { id: user.id } });
        }
      }
    } catch (_error) {
      // Ignore cleanup errors
    }
  };

  const cleanupTeams = async (teamNames: string[]) => {
    try {
      for (const name of teamNames) {
        const team = await prisma.team.findFirst({
          where: { name },
        });

        if (team) {
          await prisma.teamMember.deleteMany({ where: { teamId: team.id } });
          await prisma.team.delete({ where: { id: team.id } });
        }
      }
    } catch (_error) {
      // Ignore cleanup errors
    }
  };

  describe('GET /api/v1/auth/me/deletion-check', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should return eligibility for user with no teams', async () => {
      const email = `no-teams-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/auth/me/deletion-check')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.canDelete).toBe(true);
      expect(response.body.data.teams).toHaveLength(0);
      expect(response.body.data.blockedReason).toBeNull();
    });

    it('should return correct info for user who is a developer', async () => {
      const email = `developer-${uniqueId()}@example.com`;
      const teamName = `Developer Test Team ${uniqueId()}`;
      testEmails.push(email);
      testTeams.push(teamName);

      const user = await createTestUserInDb(email);
      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, 'DEVELOPER');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/auth/me/deletion-check')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.canDelete).toBe(true);
      expect(response.body.data.teams).toHaveLength(1);
      expect(response.body.data.teams[0].role).toBe('DEVELOPER');
      expect(response.body.data.teams[0].isLastPO).toBe(false);
      expect(response.body.data.blockedReason).toBeNull();
    });

    it('should return correct info for user who is PO with other POs', async () => {
      const email1 = `po-with-other-${uniqueId()}@example.com`;
      const email2 = `other-po-${uniqueId()}@example.com`;
      const teamName = `Multiple PO Team ${uniqueId()}`;
      testEmails.push(email1, email2);
      testTeams.push(teamName);

      const user1 = await createTestUserInDb(email1);
      const user2 = await createTestUserInDb(email2);
      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user1.id, 'PRODUCT_OWNER');
      await addTeamMember(team.id, user2.id, 'PRODUCT_OWNER');

      const cookies = await loginAndGetCookies(email1);

      const response = await request(app)
        .get('/api/v1/auth/me/deletion-check')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.canDelete).toBe(true);
      expect(response.body.data.teams).toHaveLength(1);
      expect(response.body.data.teams[0].role).toBe('PRODUCT_OWNER');
      expect(response.body.data.teams[0].isLastPO).toBe(false);
      expect(response.body.data.blockedReason).toBeNull();
    });

    it('should return blocked for user who is the only PO', async () => {
      const email = `only-po-${uniqueId()}@example.com`;
      const teamName = `Single PO Team ${uniqueId()}`;
      testEmails.push(email);
      testTeams.push(teamName);

      const user = await createTestUserInDb(email);
      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, 'PRODUCT_OWNER');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/auth/me/deletion-check')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.canDelete).toBe(false);
      expect(response.body.data.teams).toHaveLength(1);
      expect(response.body.data.teams[0].role).toBe('PRODUCT_OWNER');
      expect(response.body.data.teams[0].isLastPO).toBe(true);
      expect(response.body.data.blockedReason).toContain(teamName);
      expect(response.body.data.blockedReason).toContain('only Product Owner');
    });

    it('should return 401 for unauthenticated user', async () => {
      await request(app).get('/api/v1/auth/me/deletion-check').expect(401);
    });

    it('should handle user with multiple teams and mixed roles', async () => {
      const email = `mixed-roles-${uniqueId()}@example.com`;
      const teamName1 = `Mixed Team Alpha ${uniqueId()}`;
      const teamName2 = `Mixed Team Beta ${uniqueId()}`;
      testEmails.push(email);
      testTeams.push(teamName1, teamName2);

      const user = await createTestUserInDb(email);
      const team1 = await createTestTeamInDb(teamName1);
      const team2 = await createTestTeamInDb(teamName2);
      await addTeamMember(team1.id, user.id, 'PRODUCT_OWNER');
      await addTeamMember(team2.id, user.id, 'DEVELOPER');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/auth/me/deletion-check')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.canDelete).toBe(false);
      expect(response.body.data.teams).toHaveLength(2);
      expect(response.body.data.blockedReason).toContain(teamName1);
    });
  });

  describe('DELETE /api/v1/auth/me', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should successfully delete user with correct confirmation', async () => {
      const email = `delete-success-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete('/api/v1/auth/me')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ confirmation: 'DELETE MY ACCOUNT' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Account deleted successfully');

      const clearCookies = response.headers['set-cookie'];
      expect(clearCookies).toBeDefined();
      const clearCookiesArray = Array.isArray(clearCookies) ? clearCookies : [];
      expect(clearCookiesArray.some((c) => /(Max-Age=0|Expires=Thu, 01 Jan 1970)/.test(c))).toBe(
        true
      );

      const deletedUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      expect(deletedUser).toBeNull();

      testEmails.splice(testEmails.indexOf(email), 1);
    });

    it('should return 400 for invalid confirmation phrase', async () => {
      const email = `invalid-confirm-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete('/api/v1/auth/me')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ confirmation: 'WRONG CONFIRMATION' })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      expect(user).not.toBeNull();
    });

    it('should return 403 for user who is last PO', async () => {
      const email = `last-po-delete-${uniqueId()}@example.com`;
      const teamName = `Last PO Delete Team ${uniqueId()}`;
      testEmails.push(email);
      testTeams.push(teamName);

      const user = await createTestUserInDb(email);
      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, 'PRODUCT_OWNER');

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete('/api/v1/auth/me')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ confirmation: 'DELETE MY ACCOUNT' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toContain('grace period');

      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      expect(existingUser).not.toBeNull();
    });

    it('should cascade delete sessions, notifications, and team memberships', async () => {
      const email = `cascade-delete-${uniqueId()}@example.com`;
      const teamName = `Cascade Delete Team ${uniqueId()}`;
      testEmails.push(email);
      testTeams.push(teamName);

      const user = await createTestUserInDb(email);
      const team = await createTestTeamInDb(teamName);

      await addTeamMember(team.id, user.id, 'DEVELOPER');
      await createRefreshToken(user.id);
      await createNotification(user.id);
      await createNotification(user.id);

      const tokensBefore = await prisma.refreshToken.findMany({
        where: { userId: user.id },
      });
      const notificationsBefore = await prisma.notification.findMany({
        where: { userId: user.id },
      });
      const membershipsBefore = await prisma.teamMember.findMany({
        where: { userId: user.id },
      });

      expect(tokensBefore.length).toBeGreaterThan(0);
      expect(notificationsBefore.length).toBe(2);
      expect(membershipsBefore.length).toBe(1);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete('/api/v1/auth/me')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ confirmation: 'DELETE MY ACCOUNT' })
        .expect(200);

      expect(response.body.success).toBe(true);

      const tokensAfter = await prisma.refreshToken.findMany({
        where: { userId: user.id },
      });
      const notificationsAfter = await prisma.notification.findMany({
        where: { userId: user.id },
      });
      const membershipsAfter = await prisma.teamMember.findMany({
        where: { userId: user.id },
      });

      expect(tokensAfter).toHaveLength(0);
      expect(notificationsAfter).toHaveLength(0);
      expect(membershipsAfter).toHaveLength(0);

      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(deletedUser).toBeNull();

      testEmails.splice(testEmails.indexOf(email), 1);
    });

    it('should not allow user to login after deletion', async () => {
      const email = `login-after-delete-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      await request(app)
        .delete('/api/v1/auth/me')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ confirmation: 'DELETE MY ACCOUNT' })
        .expect(200);

      const { csrfCookie: loginCsrfCookie, csrfToken: loginCsrfToken } = await getCsrfToken();

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', loginCsrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, loginCsrfToken)
        .send({
          email,
          password: 'TestPassword123!',
        })
        .expect(401);

      expect(loginResponse.body.success).toBe(false);
      expect(loginResponse.body.error.code).toBe('UNAUTHORIZED');

      testEmails.splice(testEmails.indexOf(email), 1);
    });

    it('should return 401 for unauthenticated user', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      await request(app)
        .delete('/api/v1/auth/me')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ confirmation: 'DELETE MY ACCOUNT' })
        .expect(401);
    });

    it('should return 400 when confirmation is missing', async () => {
      const email = `missing-confirm-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete('/api/v1/auth/me')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({})
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should allow developer to delete account and remove from team', async () => {
      const email = `developer-delete-${uniqueId()}@example.com`;
      const teamName = `Developer Delete Team ${uniqueId()}`;
      testEmails.push(email);
      testTeams.push(teamName);

      const user = await createTestUserInDb(email);
      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, 'DEVELOPER');

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete('/api/v1/auth/me')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ confirmation: 'DELETE MY ACCOUNT' })
        .expect(200);

      expect(response.body.success).toBe(true);

      const existingTeam = await prisma.team.findUnique({
        where: { id: team.id },
      });
      expect(existingTeam).not.toBeNull();

      const membership = await prisma.teamMember.findFirst({
        where: { teamId: team.id, userId: user.id },
      });
      expect(membership).toBeNull();

      testEmails.splice(testEmails.indexOf(email), 1);
    });

    it('should allow PO to delete when there are other POs in team', async () => {
      const email1 = `po-delete-with-other-${uniqueId()}@example.com`;
      const email2 = `other-po-stay-${uniqueId()}@example.com`;
      const teamName = `PO Delete With Other Team ${uniqueId()}`;
      testEmails.push(email1, email2);
      testTeams.push(teamName);

      const user1 = await createTestUserInDb(email1);
      const user2 = await createTestUserInDb(email2);
      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user1.id, 'PRODUCT_OWNER');
      await addTeamMember(team.id, user2.id, 'PRODUCT_OWNER');

      const cookies = await loginAndGetCookies(email1);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete('/api/v1/auth/me')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ confirmation: 'DELETE MY ACCOUNT' })
        .expect(200);

      expect(response.body.success).toBe(true);

      const remainingMembership = await prisma.teamMember.findFirst({
        where: { teamId: team.id, userId: user2.id },
      });
      expect(remainingMembership).not.toBeNull();
      expect(remainingMembership?.role).toBe('PRODUCT_OWNER');

      testEmails.splice(testEmails.indexOf(email1), 1);
    });
  });

  describe('End-to-end deletion flow', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should complete full deletion flow: check eligibility then delete', async () => {
      const email = `full-flow-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);

      const checkResponse = await request(app)
        .get('/api/v1/auth/me/deletion-check')
        .set('Cookie', cookies)
        .expect(200);

      expect(checkResponse.body.data.canDelete).toBe(true);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const deleteResponse = await request(app)
        .delete('/api/v1/auth/me')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ confirmation: 'DELETE MY ACCOUNT' })
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', cookies)
        .expect(401);

      expect(meResponse.body.success).toBe(false);

      testEmails.splice(testEmails.indexOf(email), 1);
    });

    it('should block deletion flow when user is only PO', async () => {
      const email = `blocked-flow-${uniqueId()}@example.com`;
      const teamName = `Blocked Flow Team ${uniqueId()}`;
      testEmails.push(email);
      testTeams.push(teamName);

      const user = await createTestUserInDb(email);
      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, 'PRODUCT_OWNER');

      const cookies = await loginAndGetCookies(email);

      const checkResponse = await request(app)
        .get('/api/v1/auth/me/deletion-check')
        .set('Cookie', cookies)
        .expect(200);

      expect(checkResponse.body.data.canDelete).toBe(false);
      expect(checkResponse.body.data.blockedReason).toContain(teamName);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const deleteResponse = await request(app)
        .delete('/api/v1/auth/me')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ confirmation: 'DELETE MY ACCOUNT' })
        .expect(403);

      expect(deleteResponse.body.success).toBe(false);

      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      expect(existingUser).not.toBeNull();
    });
  });

  describe('Schedule and cancel deletion flow', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should schedule deletion for user who is last PO, then cancel it', async () => {
      const email = `schedule-cancel-${uniqueId()}@example.com`;
      const teamName = `Schedule Cancel Team ${uniqueId()}`;
      testEmails.push(email);
      testTeams.push(teamName);

      const user = await createTestUserInDb(email);
      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, 'PRODUCT_OWNER');

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const scheduleResponse = await request(app)
        .post('/api/v1/auth/me/schedule-deletion')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ confirmation: 'SCHEDULE DELETION' })
        .expect(201);

      expect(scheduleResponse.body.success).toBe(true);
      expect(scheduleResponse.body.data.status).toBe('PENDING');
      expect(scheduleResponse.body.data.gracePeriodDays).toBe(14);
      expect(scheduleResponse.body.data.scheduledDeletionAt).toBeDefined();

      const checkResponse = await request(app)
        .get('/api/v1/auth/me/deletion-check')
        .set('Cookie', cookies)
        .expect(200);

      expect(checkResponse.body.data.pendingDeletion).not.toBeNull();
      expect(checkResponse.body.data.pendingDeletion.gracePeriodDays).toBe(14);

      const cancelCsrf = await getCsrfToken();
      const cancelCookies = replaceCsrfCookie(cookies, cancelCsrf);

      const cancelResponse = await request(app)
        .delete('/api/v1/auth/me/schedule-deletion')
        .set('Cookie', cancelCookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, cancelCsrf.csrfToken)
        .expect(200);

      expect(cancelResponse.body.success).toBe(true);
      expect(cancelResponse.body.data.message).toBe('Scheduled deletion cancelled successfully');

      const checkAfterCancel = await request(app)
        .get('/api/v1/auth/me/deletion-check')
        .set('Cookie', cookies)
        .expect(200);

      expect(checkAfterCancel.body.data.pendingDeletion).toBeNull();

      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      expect(existingUser).not.toBeNull();
    });
  });

  describe('Schedule deletion flow', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should schedule deletion and verify response fields', async () => {
      const email = `schedule-only-${uniqueId()}@example.com`;
      const teamName = `Schedule Only Team ${uniqueId()}`;
      testEmails.push(email);
      testTeams.push(teamName);

      const user = await createTestUserInDb(email);
      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, 'PRODUCT_OWNER');

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const scheduleResponse = await request(app)
        .post('/api/v1/auth/me/schedule-deletion')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ confirmation: 'SCHEDULE DELETION' })
        .expect(201);

      expect(scheduleResponse.body.success).toBe(true);
      expect(scheduleResponse.body.data.id).toBeDefined();
      expect(scheduleResponse.body.data.requestedAt).toBeDefined();
      expect(scheduleResponse.body.data.scheduledDeletionAt).toBeDefined();
      expect(scheduleResponse.body.data.gracePeriodDays).toBe(14);
      expect(scheduleResponse.body.data.status).toBe('PENDING');
      expect(scheduleResponse.body.data.blockedTeamIds).toContain(team.id);

      const statusResponse = await request(app)
        .get('/api/v1/auth/me/deletion-status')
        .set('Cookie', cookies)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.canForceDelete).toBe(false);
      expect(statusResponse.body.data.daysRemaining).toBeGreaterThan(0);
    });
  });

  describe('Schedule and force-delete flow', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should force-delete account after grace period has elapsed', async () => {
      const email = `force-delete-${uniqueId()}@example.com`;
      const teamName = `Force Delete Team ${uniqueId()}`;
      testEmails.push(email);
      testTeams.push(teamName);

      const user = await createTestUserInDb(email);
      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, 'PRODUCT_OWNER');

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const scheduleResponse = await request(app)
        .post('/api/v1/auth/me/schedule-deletion')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ confirmation: 'SCHEDULE DELETION' })
        .expect(201);

      expect(scheduleResponse.body.success).toBe(true);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 15);

      await prisma.scheduledDeletion.update({
        where: { id: scheduleResponse.body.data.id },
        data: { scheduledDeletionAt: pastDate },
      });

      const forceCsrf = await getCsrfToken();
      const forceCookies = replaceCsrfCookie(cookies, forceCsrf);

      const forceDeleteResponse = await request(app)
        .post('/api/v1/auth/me/force-delete')
        .set('Cookie', forceCookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, forceCsrf.csrfToken)
        .send({ confirmation: 'DELETE MY ACCOUNT' })
        .expect(200);

      expect(forceDeleteResponse.body.success).toBe(true);

      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      expect(existingUser).toBeNull();

      testEmails.splice(testEmails.indexOf(email), 1);
      testTeams.splice(testTeams.indexOf(teamName), 1);
    });

    it('should reject force-delete before grace period elapses', async () => {
      const email = `force-delete-early-${uniqueId()}@example.com`;
      const teamName = `Force Delete Early Team ${uniqueId()}`;
      testEmails.push(email);
      testTeams.push(teamName);

      const user = await createTestUserInDb(email);
      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, 'PRODUCT_OWNER');

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const scheduleResponse = await request(app)
        .post('/api/v1/auth/me/schedule-deletion')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ confirmation: 'SCHEDULE DELETION' })
        .expect(201);

      expect(scheduleResponse.body.success).toBe(true);

      const forceCsrf = await getCsrfToken();
      const forceCookies = replaceCsrfCookie(cookies, forceCsrf);

      const forceDeleteResponse = await request(app)
        .post('/api/v1/auth/me/force-delete')
        .set('Cookie', forceCookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, forceCsrf.csrfToken)
        .send({ confirmation: 'DELETE MY ACCOUNT' })
        .expect(400);

      expect(forceDeleteResponse.body.success).toBe(false);
      expect(forceDeleteResponse.body.error.message).toContain('Grace period has not elapsed');

      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      expect(existingUser).not.toBeNull();
    });
  });
});
