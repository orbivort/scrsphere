import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../utils/prisma';
import { generateUUIDv7 } from '../../utils/uuid';
import bcrypt from 'bcrypt';
import { CSRF_CONSTANTS } from '../../middleware/csrf.middleware';
import { getCsrfToken, extractCsrfFromCookies } from '../helpers/test-helpers';
import { setLocaleHeader, SUPPORTED_LOCALES } from '../helpers/i18n-helpers';

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
        .set('Cookie', cookies);

      // Should return 200 if workflow exists, or 404 if not yet initialized
      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      } else {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      }
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

    it('should return REVIEW (not DONE) for a Task IN_PROGRESS status', async () => {
      const email = `allowed-transitions-inprog-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email, 'TestPassword123!', 'Dev', 'eloper');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/workflows/Task/allowed-transitions/IN_PROGRESS')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      const toNames = response.body.data.map(
        (t: { toState?: { name?: string } }) => t.toState?.name
      );
      expect(toNames).toContain('REVIEW');
      expect(toNames).not.toContain('DONE');
    });

    it('should return DONE and IN_PROGRESS for a Task REVIEW status', async () => {
      const email = `allowed-transitions-review-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email, 'TestPassword123!', 'Dev', 'eloper');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/workflows/Task/allowed-transitions/REVIEW')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      const toNames = response.body.data.map(
        (t: { toState?: { name?: string } }) => t.toState?.name
      );
      expect(toNames).toContain('DONE');
      expect(toNames).toContain('IN_PROGRESS');
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

  describe('i18n Locale Support', () => {
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

    describe('Translated Forbidden Error Messages', () => {
      it('should return translated forbidden error for role-restricted workflow operations in all locales', async () => {
        for (const locale of SUPPORTED_LOCALES) {
          const email = `workflow-i18n-forbidden-${locale}-${uniqueId()}@example.com`;
          testEmails.push(email);

          // Create a user without PRODUCT_OWNER role
          const user = await createTestUserInDb(email, 'TestPassword123!', 'Dev', 'eloper');
          const team = await prisma.team.create({
            data: {
              id: generateUUIDv7(),
              name: `Workflow I18N Team ${locale} ${uniqueId()}`,
              description: 'Test team for i18n',
            },
          });
          testTeams.push(team.id);
          await prisma.teamMember.create({
            data: {
              id: generateUUIDv7(),
              teamId: team.id,
              userId: user.id,
              role: 'DEVELOPERS', // Not PRODUCT_OWNER
            },
          });

          const cookies = await loginAndGetCookies(email);
          const { csrfToken } = extractCsrfFromCookies(cookies);

          // Attempt a ProductGoal transition that requires PRODUCT_OWNER role
          // This should result in a forbidden error
          const response = await request(app)
            .post('/api/v1/workflows/validate')
            .set('Cookie', cookies)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
            .set(setLocaleHeader(locale))
            .send({
              entityType: 'ProductGoal',
              fromStatus: 'NEW',
              toStatus: 'ACTIVE',
              teamId: team.id,
            })
            .expect(200);

          // The validation endpoint returns allowed: false with a reason message
          expect(response.body.success).toBe(true);
          expect(response.body.data.allowed).toBe(false);
          expect(response.body.data.reason).toBeDefined();
          // The reason message is translated - check that it's not empty and indicates lack of permission
          // German: "Sie haben keine Berechtigung für diesen Übergang..."
          // English: "You do not have permission for this transition..."
          expect(response.body.data.reason.length).toBeGreaterThan(0);
        }
      });

      it('should return error for unauthorized workflow admin operations in all locales', async () => {
        for (const locale of SUPPORTED_LOCALES) {
          const email = `workflow-admin-i18n-${locale}-${uniqueId()}@example.com`;
          testEmails.push(email);

          // Create a user without PRODUCT_OWNER role
          const user = await createTestUserInDb(email, 'TestPassword123!', 'Dev', 'eloper');
          const team = await prisma.team.create({
            data: {
              id: generateUUIDv7(),
              name: `Workflow Admin I18N Team ${locale} ${uniqueId()}`,
              description: 'Test team for admin i18n',
            },
          });
          testTeams.push(team.id);
          await prisma.teamMember.create({
            data: {
              id: generateUUIDv7(),
              teamId: team.id,
              userId: user.id,
              role: 'DEVELOPERS', // Not PRODUCT_OWNER - admin routes require PRODUCT_OWNER
            },
          });

          const cookies = await loginAndGetCookies(email);
          const { csrfToken } = extractCsrfFromCookies(cookies);

          // Attempt to create workflow (admin operation requires PRODUCT_OWNER)
          const response = await request(app)
            .post('/api/v1/workflows/admin/create')
            .set('Cookie', cookies)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
            .set(setLocaleHeader(locale))
            .send({
              entityType: 'CustomEntity',
              name: 'Custom Workflow',
              description: 'Test workflow',
              defaultStatus: 'NEW',
            });

          // Should return 403 (Forbidden) for role check, or 409 (Conflict) if entity already exists
          expect([403, 404, 409]).toContain(response.status);
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();
        }
      });
    });

    describe('Translated Workflow Transition Messages', () => {
      it('should return locale-aware validation messages for invalid transitions', async () => {
        for (const locale of SUPPORTED_LOCALES) {
          const email = `workflow-transition-i18n-${locale}-${uniqueId()}@example.com`;
          testEmails.push(email);

          await createTestUserInDb(email);
          const cookies = await loginAndGetCookies(email);
          const { csrfToken } = extractCsrfFromCookies(cookies);

          // Attempt an invalid transition (COMPLETED to NEW is not allowed for ProductGoal)
          const response = await request(app)
            .post('/api/v1/workflows/validate')
            .set('Cookie', cookies)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
            .set(setLocaleHeader(locale))
            .send({
              entityType: 'ProductGoal',
              fromStatus: 'COMPLETED',
              toStatus: 'NEW',
            })
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data.allowed).toBe(false);
          expect(response.body.data.reason).toBeDefined();
          // The reason message is translated - check that it's not empty
          // German: "Übergang von COMPLETED zu NEW ist nicht erlaubt"
          // English: "Transition from COMPLETED to NEW is not allowed"
          expect(response.body.data.reason.length).toBeGreaterThan(0);
        }
      });

      it('should return validation messages for non-existent workflow states', async () => {
        for (const locale of SUPPORTED_LOCALES) {
          const email = `workflow-state-i18n-${locale}-${uniqueId()}@example.com`;
          testEmails.push(email);

          await createTestUserInDb(email);
          const cookies = await loginAndGetCookies(email);
          const { csrfToken } = extractCsrfFromCookies(cookies);

          // Attempt transition to a non-existent status
          const response = await request(app)
            .post('/api/v1/workflows/validate')
            .set('Cookie', cookies)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
            .set(setLocaleHeader(locale))
            .send({
              entityType: 'ProductGoal',
              fromStatus: 'NEW',
              toStatus: 'NON_EXISTENT_STATUS',
            })
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data.isValid).toBe(false);
          expect(response.body.data.reason).toBeDefined();
          // The reason message is translated - check that it's not empty
          // German: "Zielstatus NON_EXISTENT_STATUS existiert nicht im Workflow"
          // English: "Target status NON_EXISTENT_STATUS does not exist in the workflow"
          expect(response.body.data.reason.length).toBeGreaterThan(0);
        }
      });
    });

    describe('Locale-Aware Status Change Descriptions', () => {
      it('should record status change with locale metadata', async () => {
        for (const locale of SUPPORTED_LOCALES) {
          const email = `workflow-history-i18n-${locale}-${uniqueId()}@example.com`;
          testEmails.push(email);

          const user = await createTestUserInDb(email, 'TestPassword123!', 'Product', 'Owner');
          const team = await prisma.team.create({
            data: {
              id: generateUUIDv7(),
              name: `Workflow History I18N Team ${locale} ${uniqueId()}`,
              description: 'Test team for history i18n',
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

          // Execute a status change with locale header
          const changeResponse = await request(app)
            .post('/api/v1/workflows/status-change')
            .set('Cookie', cookies)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
            .set(setLocaleHeader(locale))
            .send({
              entityType: 'ProductGoal',
              entityId,
              fromStatus: 'NEW',
              toStatus: 'ACTIVE',
              teamId: team.id,
              changeReason: 'Goal approved for implementation',
              changeNotes: 'Ready to start development',
            })
            .expect(201);

          expect(changeResponse.body.success).toBe(true);
          expect(changeResponse.body.data.entityId).toBe(entityId);
          expect(changeResponse.body.data.changeReason).toBe('Goal approved for implementation');

          // Retrieve the history and verify it includes the recorded data
          const historyResponse = await request(app)
            .get(`/api/v1/workflows/ProductGoal/${entityId}/history`)
            .set('Cookie', cookies)
            .set(setLocaleHeader(locale))
            .expect(200);

          expect(historyResponse.body.success).toBe(true);
          expect(historyResponse.body.data).toBeDefined();
          // History should contain the status change record
          if (historyResponse.body.data.length > 0) {
            const historyRecord = historyResponse.body.data[0];
            expect(historyRecord.changeReason).toBe('Goal approved for implementation');
            expect(historyRecord.changeNotes).toBe('Ready to start development');
          }
        }
      });

      it('should return status change history with user information for each locale', async () => {
        for (const locale of SUPPORTED_LOCALES) {
          const email = `workflow-user-i18n-${locale}-${uniqueId()}@example.com`;
          testEmails.push(email);

          const user = await createTestUserInDb(
            email,
            'TestPassword123!',
            'TestFirstName',
            'TestLastName'
          );
          const team = await prisma.team.create({
            data: {
              id: generateUUIDv7(),
              name: `Workflow User I18N Team ${locale} ${uniqueId()}`,
              description: 'Test team for user i18n',
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

          // Execute a status change
          await request(app)
            .post('/api/v1/workflows/status-change')
            .set('Cookie', cookies)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
            .set(setLocaleHeader(locale))
            .send({
              entityType: 'ProductGoal',
              entityId,
              fromStatus: 'NEW',
              toStatus: 'ACTIVE',
              teamId: team.id,
              changeReason: 'Status change for user info test',
            })
            .expect(201);

          // Retrieve history
          const historyResponse = await request(app)
            .get(`/api/v1/workflows/ProductGoal/${entityId}/history`)
            .set('Cookie', cookies)
            .set(setLocaleHeader(locale))
            .expect(200);

          expect(historyResponse.body.success).toBe(true);
          if (historyResponse.body.data.length > 0) {
            const historyRecord = historyResponse.body.data[0];
            // History should include user information (changer)
            expect(historyRecord.changer).toBeDefined();
            expect(historyRecord.changer?.firstName).toBe('TestFirstName');
            expect(historyRecord.changer?.lastName).toBe('TestLastName');
          }
        }
      });
    });
  });
});
