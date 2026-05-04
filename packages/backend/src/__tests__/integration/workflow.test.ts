import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../utils/prisma';
import { generateUUIDv7 } from '../../utils/uuid';
import bcrypt from 'bcrypt';
import { CSRF_CONSTANTS } from '../../middleware/csrf.middleware';
import { getCsrfToken, extractCsrfFromCookies } from '../helpers/test-helpers';

const uniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

describe('Workflow Integration Tests', () => {
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

  const cleanupTestData = async (emails: string[]) => {
    try {
      for (const email of emails) {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (user) {
          await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
          await prisma.notification.deleteMany({ where: { userId: user.id } });
          await prisma.statusChangeHistory.deleteMany({ where: { changedBy: user.id } });
          await prisma.teamMember.deleteMany({ where: { userId: user.id } });
          await prisma.user.delete({ where: { id: user.id } });
        }
      }
    } catch (_error) {
      // Ignore cleanup errors
    }
  };

  describe('GET /api/v1/workflows/:entityType', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should return workflow for known entity type', async () => {
      const email = `workflow-get-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/workflows/Task')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toContain('Task');
    });

    it('should return 404 for unknown entity type', async () => {
      const email = `workflow-404-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/workflows/UnknownEntity')
        .set('Cookie', cookies)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/v1/workflows/Task').expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/workflows/:entityType/states', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should return workflow states for known entity type', async () => {
      const email = `workflow-states-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/workflows/BacklogItem/states')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/workflows/:entityType/transitions', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should return workflow transitions for known entity type', async () => {
      const email = `workflow-transitions-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/workflows/ProductGoal/transitions')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/workflows/validate', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      for (const teamId of testTeams) {
        await prisma.teamMember.deleteMany({ where: { teamId } });
        await prisma.team.delete({ where: { id: teamId } }).catch(() => {});
      }
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should validate a valid transition', async () => {
      const email = `workflow-validate-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email, 'TestPassword123!', 'Product', 'Owner');
      const team = await prisma.team.create({
        data: {
          id: generateUUIDv7(),
          name: `Workflow Team ${uniqueId()}`,
          description: 'Test team',
        },
      });
      testTeams.push(team.id);
      await prisma.teamMember.create({
        data: {
          id: generateUUIDv7(),
          teamId: team.id,
          userId: user.id,
          role: 'PRODUCT_OWNER',
        },
      });

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/workflows/validate')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          entityType: 'ProductGoal',
          fromStatus: 'NEW',
          toStatus: 'ACTIVE',
          teamId: team.id,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
    });

    it('should reject an invalid transition', async () => {
      const email = `workflow-invalid-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/workflows/validate')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          entityType: 'ProductGoal',
          fromStatus: 'COMPLETED',
          toStatus: 'NEW',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.allowed).toBe(false);
    });
  });

  describe('POST /api/v1/workflows/status-change', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      for (const teamId of testTeams) {
        await prisma.teamMember.deleteMany({ where: { teamId } });
        await prisma.team.delete({ where: { id: teamId } }).catch(() => {});
      }
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should execute a status change', async () => {
      const email = `status-change-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email, 'TestPassword123!', 'Product', 'Owner');
      const team = await prisma.team.create({
        data: {
          id: generateUUIDv7(),
          name: `Workflow Team ${uniqueId()}`,
          description: 'Test team',
        },
      });
      testTeams.push(team.id);
      await prisma.teamMember.create({
        data: {
          id: generateUUIDv7(),
          teamId: team.id,
          userId: user.id,
          role: 'PRODUCT_OWNER',
        },
      });

      const cookies = await loginAndGetCookies(email);
      const entityId = generateUUIDv7();
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/workflows/status-change')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          entityType: 'ProductGoal',
          entityId,
          fromStatus: 'NEW',
          toStatus: 'ACTIVE',
          teamId: team.id,
          changeReason: 'Goal approved',
          changeNotes: 'Ready to work on',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entityId).toBe(entityId);
    });

    it('should return 401 when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/workflows/status-change')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          entityType: 'Task',
          entityId: generateUUIDv7(),
          fromStatus: 'TODO',
          toStatus: 'IN_PROGRESS',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/workflows/:entityType/allowed-transitions/:fromStatus', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should return allowed transitions from a status', async () => {
      const email = `allowed-transitions-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email, 'TestPassword123!', 'Dev', 'eloper');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/workflows/Task/allowed-transitions/TODO')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/workflows/:entityType/:entityId/history', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should return status change history for an entity', async () => {
      const email = `workflow-history-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);
      const entityId = generateUUIDv7();

      const response = await request(app)
        .get(`/api/v1/workflows/Task/${entityId}/history`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
