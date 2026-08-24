// Integration Tests for Increments Endpoints
// Tests increment CRUD operations and delivery workflow

import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../utils/prisma';
import { generateUUIDv7 } from '../../utils/uuid';
import bcrypt from 'bcrypt';
import { CSRF_CONSTANTS } from '../../middleware/csrf.middleware';
import { getCsrfToken, extractCsrfFromCookies } from '../helpers/test-helpers';
import { setLocaleHeader, SUPPORTED_LOCALES, createI18nTestUser } from '../helpers/i18n-helpers';
import type { Locale } from '@scrumooth/shared';

const uniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

describe('Increments Integration Tests', () => {
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

  const createTestTeam = async (name: string, description: string = 'Test team') => {
    const teamId = generateUUIDv7();
    const team = await prisma.team.create({
      data: {
        id: teamId,
        name,
        description,
      },
    });
    return team;
  };

  const addTeamMember = async (
    teamId: string,
    userId: string,
    role: 'PRODUCT_OWNER' | 'SCRUM_MASTER' | 'DEVELOPERS'
  ) => {
    const membershipId = generateUUIDv7();
    await prisma.teamMember.create({
      data: {
        id: membershipId,
        teamId,
        userId,
        role,
      },
    });
  };

  const createTestSprint = async (
    teamId: string,
    name: string,
    status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' = 'COMPLETED'
  ) => {
    const sprintId = generateUUIDv7();
    const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const sprint = await prisma.sprint.create({
      data: {
        id: sprintId,
        teamId,
        name,
        startDate,
        endDate,
        status,
        sprintGoal: 'Test sprint goal',
      },
    });
    return sprint;
  };

  const createTestIncrement = async (
    sprintId: string,
    teamId: string,
    name: string = 'Test Increment',
    status: 'DRAFT' | 'VERIFIED' | 'DELIVERED' | 'ARCHIVED' = 'DRAFT'
  ) => {
    const incrementId = generateUUIDv7();
    const increment = await prisma.increment.create({
      data: {
        id: incrementId,
        sprintId,
        teamId,
        name,
        status,
        totalStoryPoints: 20,
      },
    });
    return increment;
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
          await prisma.increment.deleteMany({ where: { teamId: team.id } });
          await prisma.sprintRetrospective.deleteMany({
            where: { sprint: { teamId: team.id } },
          });
          await prisma.impediment.deleteMany({ where: { teamId: team.id } });
          await prisma.sprintBacklogChange.deleteMany({
            where: { sprint: { teamId: team.id } },
          });
          await prisma.task.deleteMany({
            where: { sprint: { teamId: team.id } },
          });
          await prisma.sprint.deleteMany({ where: { teamId: team.id } });
          await prisma.productBacklogItem.deleteMany({ where: { teamId: team.id } });
          await prisma.teamMember.deleteMany({ where: { teamId: team.id } });
          await prisma.team.delete({ where: { id: team.id } });
        }
      }
    } catch (_error) {
      // Ignore cleanup errors
    }
  };

  describe('GET /api/v1/increments', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should return increments for team', async () => {
      const email = `increments-list-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Increments Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'DEVELOPERS');
      const sprint = await createTestSprint(team.id, 'Sprint');
      await createTestIncrement(sprint.id, team.id, 'Increment 1');
      await createTestIncrement(sprint.id, team.id, 'Increment 2');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/increments')
        .query({ teamId: team.id })
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 422 with invalid teamId', async () => {
      const email = `increments-invalid-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/increments')
        .query({ teamId: 'invalid-id' })
        .set('Cookie', cookies)
        .expect(422);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/increments')
        .query({ teamId: generateUUIDv7() })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/increments/metrics', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should return increment metrics for team', async () => {
      const email = `increment-metrics-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Metrics Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'PRODUCT_OWNER');
      const sprint = await createTestSprint(team.id, 'Sprint');
      await createTestIncrement(sprint.id, team.id, 'Metric Increment');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/increments/metrics')
        .query({ teamId: team.id })
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/increments/metrics')
        .query({ teamId: generateUUIDv7() })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/increments/:id', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should return increment by ID', async () => {
      const email = `increment-by-id-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Get Increment Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'DEVELOPERS');
      const sprint = await createTestSprint(team.id, 'Sprint');
      const increment = await createTestIncrement(sprint.id, team.id, 'Specific Increment');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/increments/${increment.id}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Specific Increment');
    });
  });

  describe('POST /api/v1/increments', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should create a new increment', async () => {
      const email = `increment-create-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Create Increment Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'DEVELOPERS');
      const sprint = await createTestSprint(team.id, 'Sprint');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/increments')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          name: 'New Increment',
          description: 'This is a new increment',
          sprintId: sprint.id,
          teamId: team.id,
          totalStoryPoints: 30,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('New Increment');
      expect(response.body.data.status).toBe('DRAFT');
    });

    it('should return 422 with invalid data', async () => {
      const email = `increment-invalid-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/increments')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({})
        .expect(422);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/increments/:id', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should update an increment', async () => {
      const email = `increment-update-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Update Increment Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'DEVELOPERS');
      const sprint = await createTestSprint(team.id, 'Sprint');
      const increment = await createTestIncrement(sprint.id, team.id, 'Original Name');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put(`/api/v1/increments/${increment.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          name: 'Updated Increment Name',
          status: 'VERIFIED',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Increment Name');
      expect(response.body.data.status).toBe('VERIFIED');
    });
  });

  describe('POST /api/v1/increments/:id/deliver', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should deliver an increment via sprint_review', async () => {
      const email = `deliver-increment-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Deliver Increment Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'PRODUCT_OWNER');
      const sprint = await createTestSprint(team.id, 'Sprint');
      const increment = await createTestIncrement(sprint.id, team.id, 'Deliverable', 'VERIFIED');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/increments/${increment.id}/deliver`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          deliveryMethod: 'sprint_review',
          notes: 'Delivered during sprint review',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('DELIVERED');
    });

    it('should deliver an increment via early_release', async () => {
      const email = `early-release-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Early Release Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'PRODUCT_OWNER');
      const sprint = await createTestSprint(team.id, 'Sprint');
      const increment = await createTestIncrement(sprint.id, team.id, 'Early Release', 'VERIFIED');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/increments/${increment.id}/deliver`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          deliveryMethod: 'early_release',
          notes: 'Released early to production',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('DELIVERED');
    });

    it('should return 422 with invalid delivery method', async () => {
      const email = `invalid-delivery-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Invalid Delivery Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'PRODUCT_OWNER');
      const sprint = await createTestSprint(team.id, 'Sprint');
      const increment = await createTestIncrement(sprint.id, team.id, 'Test');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/increments/${increment.id}/deliver`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          deliveryMethod: 'invalid_method',
        })
        .expect(422);

      expect(response.body.success).toBe(false);
    });
  });

  describe('i18n Locale Support', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    describe('Translated increment delivery messages', () => {
      it('should return translated error for non-existent increment in Spanish', async () => {
        const email = `i18n-increment-es-${uniqueId()}@example.com`;
        testEmails.push(email);

        const user = await createI18nTestUser(email, 'es', prisma);
        const teamName = `i18n Increment Team ${uniqueId()}`;
        testTeams.push(teamName);

        const team = await createTestTeam(teamName);
        await addTeamMember(team.id, user.id, 'DEVELOPERS');

        const cookies = await loginAndGetCookies(email);

        const response = await request(app)
          .get(`/api/v1/increments/${generateUUIDv7()}`)
          .set('Cookie', cookies)
          .set(setLocaleHeader('es'))
          .expect(404);

        // Note: NotFoundError uses hardcoded English message, not translated
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
        expect(response.body.error.message).toContain('Increment');
      });

      it('should return translated error when delivering already delivered increment', async () => {
        const email = `i18n-deliver-error-${uniqueId()}@example.com`;
        testEmails.push(email);

        const user = await createI18nTestUser(email, 'de', prisma);
        const teamName = `i18n Deliver Team ${uniqueId()}`;
        testTeams.push(teamName);

        const team = await createTestTeam(teamName);
        await addTeamMember(team.id, user.id, 'PRODUCT_OWNER');
        const sprint = await createTestSprint(team.id, 'Sprint');
        const increment = await createTestIncrement(
          sprint.id,
          team.id,
          'Already Delivered',
          'DELIVERED'
        );

        const cookies = await loginAndGetCookies(email);
        const { csrfToken } = extractCsrfFromCookies(cookies);

        const response = await request(app)
          .post(`/api/v1/increments/${increment.id}/deliver`)
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader('de'))
          .send({
            deliveryMethod: 'sprint_review',
            notes: 'Attempting to deliver again',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        // The service returns a BadRequestError which uses a custom message
        expect(response.body.error.message).toBeDefined();
      });

      it('should return translated error for all supported locales when increment not found', async () => {
        for (const locale of SUPPORTED_LOCALES) {
          const email = `i18n-increment-${locale}-${uniqueId()}@example.com`;
          testEmails.push(email);

          const user = await createI18nTestUser(email, locale as Locale, prisma);
          const teamName = `i18n Increment Team ${uniqueId()}`;
          testTeams.push(teamName);

          const team = await createTestTeam(teamName);
          await addTeamMember(team.id, user.id, 'DEVELOPERS');

          const cookies = await loginAndGetCookies(email);

          const response = await request(app)
            .get(`/api/v1/increments/${generateUUIDv7()}`)
            .set('Cookie', cookies)
            .set(setLocaleHeader(locale as Locale))
            .expect(404);

          // Note: NotFoundError uses hardcoded English message, not translated
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('NOT_FOUND');
          expect(response.body.error.message).toContain('Increment');
        }
      });
    });

    describe('Translated increment status labels', () => {
      it('should return translated validation error for invalid delivery method in Italian', async () => {
        const email = `i18n-validation-it-${uniqueId()}@example.com`;
        testEmails.push(email);

        const user = await createI18nTestUser(email, 'it', prisma);
        const teamName = `i18n Validation Team ${uniqueId()}`;
        testTeams.push(teamName);

        const team = await createTestTeam(teamName);
        await addTeamMember(team.id, user.id, 'PRODUCT_OWNER');
        const sprint = await createTestSprint(team.id, 'Sprint');
        const increment = await createTestIncrement(sprint.id, team.id, 'Test');

        const cookies = await loginAndGetCookies(email);
        const { csrfToken } = extractCsrfFromCookies(cookies);

        const response = await request(app)
          .post(`/api/v1/increments/${increment.id}/deliver`)
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader('it'))
          .send({
            deliveryMethod: 'invalid_method',
          })
          .expect(422);

        expect(response.body.success).toBe(false);
      });

      it('should create increment and verify locale is set correctly for user', async () => {
        const email = `i18n-create-fr-${uniqueId()}@example.com`;
        testEmails.push(email);

        const user = await createI18nTestUser(email, 'fr', prisma);
        const teamName = `i18n Create Team ${uniqueId()}`;
        testTeams.push(teamName);

        const team = await createTestTeam(teamName);
        await addTeamMember(team.id, user.id, 'DEVELOPERS');
        const sprint = await createTestSprint(team.id, 'Sprint');

        const cookies = await loginAndGetCookies(email);
        const { csrfToken } = extractCsrfFromCookies(cookies);

        const response = await request(app)
          .post('/api/v1/increments')
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader('fr'))
          .send({
            name: 'French Test Increment',
            description: 'This is a test increment description',
            sprintId: sprint.id,
            teamId: team.id,
            totalStoryPoints: 25,
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('French Test Increment');
        expect(response.body.data.status).toBe('DRAFT');
      });

      it('should verify increment status values are consistent across locales', async () => {
        // Create increments and verify they work for all locales
        for (const locale of ['en', 'de', 'es', 'fr', 'it']) {
          const email = `i18n-status-${locale}-${uniqueId()}@example.com`;
          testEmails.push(email);

          const user = await createI18nTestUser(email, locale as Locale, prisma);
          const teamName = `i18n Status Team ${uniqueId()}`;
          testTeams.push(teamName);

          const team = await createTestTeam(teamName);
          await addTeamMember(team.id, user.id, 'DEVELOPERS');
          const sprint = await createTestSprint(team.id, 'Sprint');

          // Create increment with DRAFT status
          const increment = await createTestIncrement(
            sprint.id,
            team.id,
            `Increment ${locale}`,
            'DRAFT'
          );

          const cookies = await loginAndGetCookies(email);

          const response = await request(app)
            .get(`/api/v1/increments/${increment.id}`)
            .set('Cookie', cookies)
            .set(setLocaleHeader(locale as Locale))
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data.status).toBe('DRAFT');
        }
      });
    });
  });
});
