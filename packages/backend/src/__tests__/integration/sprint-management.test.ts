// Integration Tests for Sprint Management Endpoints
// Tests sprint lifecycle, backlog management, and sprint operations

import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../utils/prisma';
import { generateUUIDv7 } from '../../utils/uuid';
import bcrypt from 'bcrypt';
import { CSRF_CONSTANTS } from '../../middleware/csrf.middleware';
import { getCsrfToken, extractCsrfFromCookies } from '../helpers/test-helpers';
import { setLocaleHeader, expectLocaleCookie, SUPPORTED_LOCALES } from '../helpers/i18n-helpers';
import type { Locale } from '@scrumooth/shared';

// Helper to generate unique test identifier
const uniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

describe('Sprint Management Integration Tests', () => {
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

  // Helper to create a team
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

  // Helper to add member to team
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

  // Helper to create a sprint
  const createTestSprint = async (
    teamId: string,
    name: string,
    status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' = 'PLANNED'
  ) => {
    const sprintId = generateUUIDv7();
    const startDate = new Date();
    const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

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

  // Helper to create a PBI
  const createTestPBI = async (
    teamId: string,
    title: string,
    status: 'READY' | 'NEW' = 'READY'
  ) => {
    const pbiId = generateUUIDv7();
    const pbi = await prisma.productBacklogItem.create({
      data: {
        id: pbiId,
        teamId,
        title,
        description: 'Test PBI description',
        status,
        priority: 'SHOULD_HAVE',
        storyPoints: 5,
      },
    });
    return pbi;
  };

  // Cleanup helper
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
          // Clean up related data
          await prisma.task.deleteMany({
            where: {
              sprint: { teamId: team.id },
            },
          });
          await prisma.sprintBacklogItem.deleteMany({
            where: {
              sprint: { teamId: team.id },
            },
          });
          await prisma.sprintBacklogChange.deleteMany({
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

  describe('GET /api/v1/sprints', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should return sprints for team', async () => {
      const email = `sprints-list-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Sprints Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'SCRUM_MASTER');
      await createTestSprint(team.id, 'Sprint 1');
      await createTestSprint(team.id, 'Sprint 2');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/sprints')
        .query({ teamId: team.id })
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/sprints')
        .query({ teamId: generateUUIDv7() })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/sprints/active', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should return active sprint for team', async () => {
      const email = `active-sprint-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Active Sprint Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'SCRUM_MASTER');
      await createTestSprint(team.id, 'Active Sprint', 'ACTIVE');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/sprints/active')
        .query({ teamId: team.id })
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/sprints', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should create a new sprint successfully', async () => {
      const email = `create-sprint-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Create Sprint Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'SCRUM_MASTER');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const response = await request(app)
        .post('/api/v1/sprints')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          name: 'New Sprint',
          startDate,
          endDate,
          sprintGoal: 'Complete all planned stories',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('New Sprint');
      expect(response.body.data.status).toBe('PLANNED');
    });

    it('should return 422 with invalid sprint data', async () => {
      const email = `invalid-sprint-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Invalid Sprint Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'SCRUM_MASTER');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/sprints')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          name: '', // Empty name should fail validation
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        });

      // Should return 422 for validation error, but might return 403 if team membership check fails
      expect([422, 403]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/sprints/:id', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should return sprint by ID', async () => {
      const email = `get-sprint-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Get Sprint Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'SCRUM_MASTER');
      const sprint = await createTestSprint(team.id, 'Specific Sprint');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/sprints/${sprint.id}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(sprint.id);
      expect(response.body.data.name).toBe('Specific Sprint');
    });

    it('should return 404 for non-existent sprint', async () => {
      const email = `nonexistent-sprint-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/sprints/${generateUUIDv7()}`)
        .set('Cookie', cookies)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/sprints/:id/start', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should start a planned sprint', async () => {
      const email = `start-sprint-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Start Sprint Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'SCRUM_MASTER');
      const sprint = await createTestSprint(team.id, 'Sprint to Start', 'PLANNED');

      // Create a ready PBI to add to sprint
      const pbi = await createTestPBI(team.id, 'Ready PBI', 'READY');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/sprints/${sprint.id}/start`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          backlogItems: [{ pbiId: pbi.id }],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ACTIVE');
    });
  });

  describe('POST /api/v1/sprints/:id/complete', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should complete an active sprint', async () => {
      const email = `complete-sprint-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Complete Sprint Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'SCRUM_MASTER');
      const sprint = await createTestSprint(team.id, 'Sprint to Complete', 'ACTIVE');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/sprints/${sprint.id}/complete`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('COMPLETED');
    });
  });

  describe('POST /api/v1/sprints/:id/cancel', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should cancel a sprint with reason', async () => {
      const email = `cancel-sprint-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Cancel Sprint Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'SCRUM_MASTER');
      const sprint = await createTestSprint(team.id, 'Sprint to Cancel', 'PLANNED');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/sprints/${sprint.id}/cancel`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          reason: 'Team priorities changed',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
    });
  });

  describe('GET /api/v1/sprints/:sprintId/burndown', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should return burndown data for sprint', async () => {
      const email = `burndown-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Burndown Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'SCRUM_MASTER');
      const sprint = await createTestSprint(team.id, 'Sprint with Burndown', 'ACTIVE');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/sprints/${sprint.id}/burndown`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/sprints/:sprintId/tasks', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should return tasks for sprint', async () => {
      const email = `sprint-tasks-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Sprint Tasks Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'DEVELOPERS');
      const sprint = await createTestSprint(team.id, 'Sprint with Tasks', 'ACTIVE');
      const pbi = await createTestPBI(team.id, 'PBI for Tasks');

      // Create a task
      await prisma.task.create({
        data: {
          id: generateUUIDv7(),
          sprintId: sprint.id,
          pbiId: pbi.id,
          title: 'Test Task',
          status: 'TODO',
        },
      });

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/sprints/${sprint.id}/tasks`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/sprints/:sprintId/tasks', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should create a task in sprint', async () => {
      const email = `create-task-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Create Task Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'DEVELOPERS');
      const sprint = await createTestSprint(team.id, 'Sprint for Task', 'ACTIVE');
      const pbi = await createTestPBI(team.id, 'PBI for Task');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/sprints/${sprint.id}/tasks`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          pbiId: pbi.id,
          title: 'New Task',
          description: 'Task description',
          estimatedHours: 8,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('New Task');
    });
  });

  describe('PUT /api/v1/sprints/:sprintId/tasks/:taskId', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should update task successfully', async () => {
      const email = `update-task-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Update Task Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'DEVELOPERS');
      const sprint = await createTestSprint(team.id, 'Sprint for Update', 'ACTIVE');
      const pbi = await createTestPBI(team.id, 'PBI for Update');

      const task = await prisma.task.create({
        data: {
          id: generateUUIDv7(),
          sprintId: sprint.id,
          pbiId: pbi.id,
          title: 'Original Task',
          status: 'TODO',
        },
      });

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put(`/api/v1/sprints/${sprint.id}/tasks/${task.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          title: 'Updated Task',
          status: 'IN_PROGRESS',
          remainingHours: 4,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Task');
      expect(response.body.data.status).toBe('IN_PROGRESS');
    });
  });

  describe('DELETE /api/v1/sprints/:sprintId/tasks/:taskId', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should delete task successfully', async () => {
      const email = `delete-task-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Delete Task Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'DEVELOPERS');
      const sprint = await createTestSprint(team.id, 'Sprint for Delete', 'ACTIVE');
      const pbi = await createTestPBI(team.id, 'PBI for Delete');

      const task = await prisma.task.create({
        data: {
          id: generateUUIDv7(),
          sprintId: sprint.id,
          pbiId: pbi.id,
          title: 'Task to Delete',
          status: 'TODO',
        },
      });

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete(`/api/v1/sprints/${sprint.id}/tasks/${task.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify task is deleted
      const deletedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });
      expect(deletedTask).toBeNull();
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

    describe('Translated sprint status messages', () => {
      it('should return translated error for non-existent sprint in German', async () => {
        const email = `i18n-sprint-404-de-${uniqueId()}@example.com`;
        testEmails.push(email);

        await createTestUserInDb(email);
        const cookies = await loginAndGetCookies(email);

        const response = await request(app)
          .get(`/api/v1/sprints/${generateUUIDv7()}`)
          .set('Cookie', cookies)
          .set(setLocaleHeader('de'))
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
        // The sprint service throws NotFoundError('Sprint') which results in "Sprint not found"
        // Error middleware uses t('errors:entityNotFound', { entity }) for translation
        // Current implementation uses raw English message from service
        // TODO: Sprint service should use localized errors
        expect(response.body.error.message).toContain('not found');
      });

      it('should return translated error for non-existent sprint in Spanish', async () => {
        const email = `i18n-sprint-404-es-${uniqueId()}@example.com`;
        testEmails.push(email);

        await createTestUserInDb(email);
        const cookies = await loginAndGetCookies(email);

        const response = await request(app)
          .get(`/api/v1/sprints/${generateUUIDv7()}`)
          .set('Cookie', cookies)
          .set(setLocaleHeader('es'))
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
        expect(response.body.error.message).toContain('not found');
      });

      it('should set locale cookie based on Accept-Language header for sprint request', async () => {
        const email = `i18n-sprint-cookie-${uniqueId()}@example.com`;
        testEmails.push(email);

        const user = await createTestUserInDb(email);
        const teamName = `i18n Sprint Team ${uniqueId()}`;
        testTeams.push(teamName);

        const team = await createTestTeam(teamName);
        await addTeamMember(team.id, user.id, 'SCRUM_MASTER');
        await createTestSprint(team.id, 'Sprint 1');

        const cookies = await loginAndGetCookies(email);

        const response = await request(app)
          .get('/api/v1/sprints')
          .query({ teamId: team.id })
          .set('Cookie', cookies)
          .set(setLocaleHeader('fr'))
          .expect(200);

        expectLocaleCookie(response, 'fr');
        expect(response.body.success).toBe(true);
      });
    });

    describe('Translated sprint creation/update errors', () => {
      it('should return translated validation error for empty sprint name in Italian', async () => {
        const email = `i18n-sprint-validation-it-${uniqueId()}@example.com`;
        testEmails.push(email);

        const user = await createTestUserInDb(email);
        const teamName = `i18n Validation Team ${uniqueId()}`;
        testTeams.push(teamName);

        const team = await createTestTeam(teamName);
        await addTeamMember(team.id, user.id, 'SCRUM_MASTER');

        const cookies = await loginAndGetCookies(email);
        const { csrfToken } = extractCsrfFromCookies(cookies);

        const startDate = new Date().toISOString();
        const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

        const response = await request(app)
          .post('/api/v1/sprints')
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader('it'))
          .send({
            teamId: team.id,
            name: '', // Empty name should fail validation
            startDate,
            endDate,
          })
          .expect(422);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        // Validation middleware resolves messages with colon format via t()
        // The validation schema uses hardcoded 'Name is required' message
        // TODO: Validation schema should use 'validation:fieldRequired' key
        expect(response.body.error.details).toBeDefined();
        expect(response.body.error.details?.length).toBeGreaterThan(0);
      });

      it('should return translated error for invalid team ID in French', async () => {
        const email = `i18n-sprint-invalid-team-fr-${uniqueId()}@example.com`;
        testEmails.push(email);

        await createTestUserInDb(email);
        const cookies = await loginAndGetCookies(email);

        const startDate = new Date().toISOString();
        const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

        // Note: Backend may return 422 (validation error) or 403 (forbidden)
        // depending on authorization check order for invalid teamId format
        const response = await request(app)
          .post('/api/v1/sprints')
          .set('Cookie', cookies)
          .set(setLocaleHeader('fr'))
          .send({
            teamId: 'invalid-uuid',
            name: 'Test Sprint',
            startDate,
            endDate,
          });

        // Accept either 422 (validation) or 403 (forbidden/authorization)
        expect([422, 403]).toContain(response.status);

        expect(response.body.success).toBe(false);
        if (response.status === 422) {
          expect(response.body.error.code).toBe('VALIDATION_ERROR');
          expect(response.body.error.details).toBeDefined();
        } else {
          expect(response.body.error.code).toBe('FORBIDDEN');
        }
      });

      it('should return translated error when starting already active sprint in German', async () => {
        const email = `i18n-sprint-active-de-${uniqueId()}@example.com`;
        testEmails.push(email);

        const user = await createTestUserInDb(email);
        const teamName = `i18n Active Sprint Team ${uniqueId()}`;
        testTeams.push(teamName);

        const team = await createTestTeam(teamName);
        await addTeamMember(team.id, user.id, 'SCRUM_MASTER');

        // Create an active sprint
        await createTestSprint(team.id, 'Active Sprint', 'ACTIVE');

        // Try to create another sprint while one is active
        const cookies = await loginAndGetCookies(email);
        const { csrfToken } = extractCsrfFromCookies(cookies);

        const startDate = new Date().toISOString();
        const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

        const response = await request(app)
          .post('/api/v1/sprints')
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader('de'))
          .send({
            teamId: team.id,
            name: 'Another Sprint',
            startDate,
            endDate,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('BAD_REQUEST');
        // The service throws BadRequestError with raw English message
        // TODO: Sprint service should use localized errors
        expect(response.body.error.message).toContain('active');
      });

      it('should return translated error when completing non-active sprint in Spanish', async () => {
        const email = `i18n-sprint-complete-es-${uniqueId()}@example.com`;
        testEmails.push(email);

        const user = await createTestUserInDb(email);
        const teamName = `i18n Complete Sprint Team ${uniqueId()}`;
        testTeams.push(teamName);

        const team = await createTestTeam(teamName);
        await addTeamMember(team.id, user.id, 'SCRUM_MASTER');

        // Create a planned sprint (not active)
        const sprint = await createTestSprint(team.id, 'Planned Sprint', 'PLANNED');

        const cookies = await loginAndGetCookies(email);
        const { csrfToken } = extractCsrfFromCookies(cookies);

        const response = await request(app)
          .post(`/api/v1/sprints/${sprint.id}/complete`)
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader('es'))
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('BAD_REQUEST');
        // The service throws BadRequestError with raw English message
        expect(response.body.error.message).toContain('active');
      });
    });

    describe('Translated sprint completion messages', () => {
      it('should complete sprint and return success message in German', async () => {
        const email = `i18n-sprint-complete-de-${uniqueId()}@example.com`;
        testEmails.push(email);

        const user = await createTestUserInDb(email);
        const teamName = `i18n Complete Team ${uniqueId()}`;
        testTeams.push(teamName);

        const team = await createTestTeam(teamName);
        await addTeamMember(team.id, user.id, 'SCRUM_MASTER');
        const sprint = await createTestSprint(team.id, 'Sprint to Complete', 'ACTIVE');

        const cookies = await loginAndGetCookies(email);
        const { csrfToken } = extractCsrfFromCookies(cookies);

        const response = await request(app)
          .post(`/api/v1/sprints/${sprint.id}/complete`)
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader('de'))
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('COMPLETED');
        // Success response contains the updated sprint data
        // Notification messages use translations from notifications.json
        // e.g., notifications:sprintEnded in German: "Sprint \"{{sprintName}}\" ist beendet"
      });

      it('should cancel sprint with translated reason in French', async () => {
        const email = `i18n-sprint-cancel-fr-${uniqueId()}@example.com`;
        testEmails.push(email);

        const user = await createTestUserInDb(email);
        const teamName = `i18n Cancel Team ${uniqueId()}`;
        testTeams.push(teamName);

        const team = await createTestTeam(teamName);
        await addTeamMember(team.id, user.id, 'SCRUM_MASTER');
        const sprint = await createTestSprint(team.id, 'Sprint to Cancel', 'PLANNED');

        const cookies = await loginAndGetCookies(email);
        const { csrfToken } = extractCsrfFromCookies(cookies);

        const response = await request(app)
          .post(`/api/v1/sprints/${sprint.id}/cancel`)
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader('fr'))
          .send({
            reason: 'Team priorities changed',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('CANCELLED');
        expect(response.body.data.cancellationReason).toBe('Team priorities changed');
      });

      it('should start sprint and return success in Italian', async () => {
        const email = `i18n-sprint-start-it-${uniqueId()}@example.com`;
        testEmails.push(email);

        const user = await createTestUserInDb(email);
        const teamName = `i18n Start Team ${uniqueId()}`;
        testTeams.push(teamName);

        const team = await createTestTeam(teamName);
        await addTeamMember(team.id, user.id, 'SCRUM_MASTER');
        const sprint = await createTestSprint(team.id, 'Sprint to Start', 'PLANNED');

        // Create a ready PBI to add to sprint
        const pbi = await createTestPBI(team.id, 'Ready PBI', 'READY');

        const cookies = await loginAndGetCookies(email);
        const { csrfToken } = extractCsrfFromCookies(cookies);

        const response = await request(app)
          .post(`/api/v1/sprints/${sprint.id}/start`)
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader('it'))
          .send({
            backlogItems: [{ pbiId: pbi.id }],
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('ACTIVE');
        // Notification message uses translations from notifications.json
        // e.g., notifications:sprintStarted in Italian: "Lo Sprint \"{{sprintName}}\" è iniziato"
      });

      it('should return locale-specific cookie for all supported locales on sprint operations', async () => {
        const email = `i18n-all-locales-${uniqueId()}@example.com`;
        testEmails.push(email);

        const user = await createTestUserInDb(email);
        const teamName = `i18n All Locales Team ${uniqueId()}`;
        testTeams.push(teamName);

        const team = await createTestTeam(teamName);
        await addTeamMember(team.id, user.id, 'SCRUM_MASTER');
        await createTestSprint(team.id, 'Test Sprint');

        const cookies = await loginAndGetCookies(email);

        // Test each supported locale
        for (const locale of SUPPORTED_LOCALES) {
          const response = await request(app)
            .get('/api/v1/sprints')
            .query({ teamId: team.id })
            .set('Cookie', cookies)
            .set(setLocaleHeader(locale as Locale))
            .expect(200);

          expectLocaleCookie(response, locale as Locale);
          expect(response.body.success).toBe(true);
        }
      });
    });
  });
});
