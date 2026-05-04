// Cross-Feature Integration Tests
// Tests interactions between different features and components

import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../utils/prisma';
import { generateUUIDv7 } from '../../utils/uuid';
import bcrypt from 'bcrypt';
import { CSRF_CONSTANTS } from '../../middleware/csrf.middleware';
import { getCsrfToken, extractCsrfFromCookies } from '../helpers/test-helpers';
import {
  ItemStatus,
  MoSCoWPriority,
  SprintStatus,
  NotificationType,
} from '../../generated/prisma/client';

const uniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

describe('Cross-Feature Integration Tests', () => {
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
    role: 'ADMINISTRATOR' | 'PRODUCT_OWNER' | 'SCRUM_MASTER' | 'DEVELOPER'
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
    status: SprintStatus = SprintStatus.ACTIVE
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

  const createTestPBI = async (
    teamId: string,
    title: string = 'Test PBI',
    status: ItemStatus = ItemStatus.READY,
    storyPoints: number = 5
  ) => {
    const pbiId = generateUUIDv7();
    const pbi = await prisma.productBacklogItem.create({
      data: {
        id: pbiId,
        teamId,
        title,
        status,
        storyPoints,
        priority: MoSCoWPriority.COULD_HAVE,
      },
    });
    return pbi;
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
          await prisma.task.deleteMany({ where: { sprint: { teamId: team.id } } });
          await prisma.sprintBacklogChange.deleteMany({ where: { sprint: { teamId: team.id } } });
          await prisma.sprintRetrospective.deleteMany({ where: { sprint: { teamId: team.id } } });
          await prisma.increment.deleteMany({ where: { teamId: team.id } });
          await prisma.dailyUpdate.deleteMany({ where: { sprint: { teamId: team.id } } });
          await prisma.impediment.deleteMany({ where: { teamId: team.id } });
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

  describe('Sprint to Backlog Integration', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should add PBI to sprint and see it in backlog', async () => {
      const email = `add-pbi-integration-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Add PBI Integration Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'PRODUCT_OWNER');
      const sprint = await createTestSprint(team.id, 'Sprint');
      const pbi = await createTestPBI(team.id, 'PBI To Add');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      await request(app)
        .post(`/api/v1/sprints/${sprint.id}/backlog-items`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ pbiId: pbi.id })
        .expect(201);

      const response = await request(app)
        .get(`/api/v1/sprints/${sprint.id}/backlog-pbis`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Sprint to Retrospective Integration', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should create retrospective after sprint completion', async () => {
      const email = `retro-after-sprint-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Retro After Sprint Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'SCRUM_MASTER');
      const sprint = await createTestSprint(team.id, 'Completed Sprint', 'COMPLETED');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const retroResponse = await request(app)
        .post('/api/v1/retrospectives')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          sprintId: sprint.id,
          teamId: team.id,
          facilitatorId: user.id,
          retroDate: new Date().toISOString(),
        })
        .expect(201);

      expect(retroResponse.body.success).toBe(true);
      expect(retroResponse.body.data.sprintId).toBe(sprint.id);
    });

    it('should retrieve retrospective by sprint ID', async () => {
      const email = `retro-by-sprint-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Retro By Sprint Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'SCRUM_MASTER');
      const sprint = await createTestSprint(team.id, 'Sprint', 'COMPLETED');

      await prisma.sprintRetrospective.create({
        data: {
          id: generateUUIDv7(),
          sprintId: sprint.id,
          teamId: team.id,
          facilitatorId: user.id,
          retroDate: new Date(),
        },
      });

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/retrospectives/sprint/${sprint.id}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Daily Updates to Impediment Integration', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should promote impediment from daily update', async () => {
      const email = `promote-from-daily-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Promote From Daily Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'DEVELOPER');
      const sprint = await createTestSprint(team.id, 'Sprint');

      const dailyUpdate = await prisma.dailyUpdate.create({
        data: {
          id: generateUUIDv7(),
          sprintId: sprint.id,
          userId: user.id,
          updateDate: new Date(),
          yesterdayWork: 'Worked on feature',
          todayWork: 'Working on feature',
          impediment: 'Blocked by external dependency',
        },
      });

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/daily-updates/${dailyUpdate.id}/promote-impediment`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          title: 'External Dependency Block',
          description: 'Blocked by external dependency - needs resolution',
          teamId: team.id,
          sprintId: sprint.id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Sprint to Increment Integration', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should create increment from completed sprint', async () => {
      const email = `increment-from-sprint-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Increment From Sprint Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'DEVELOPER');
      const sprint = await createTestSprint(team.id, 'Completed Sprint', 'COMPLETED');
      const pbi = await createTestPBI(team.id, 'Completed PBI', ItemStatus.DONE, 8);

      await prisma.sprintBacklogChange.create({
        data: {
          id: generateUUIDv7(),
          sprintId: sprint.id,
          pbiId: pbi.id,
          changeType: 'ADD',
          createdBy: user.id,
          newStatus: 'DONE',
        },
      });

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/increments')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          name: 'Sprint Increment',
          description: 'Increment from completed sprint',
          sprintId: sprint.id,
          teamId: team.id,
          includedPBIs: [pbi.id],
          totalStoryPoints: 8,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sprintId).toBe(sprint.id);
    });

    it('should deliver increment after sprint review', async () => {
      const email = `deliver-after-review-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Deliver After Review Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'PRODUCT_OWNER');
      const sprint = await createTestSprint(team.id, 'Sprint', 'COMPLETED');

      const increment = await prisma.increment.create({
        data: {
          id: generateUUIDv7(),
          sprintId: sprint.id,
          teamId: team.id,
          name: 'Deliverable Increment',
          status: 'VERIFIED',
          totalStoryPoints: 20,
        },
      });

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/increments/${increment.id}/deliver`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          deliveryMethod: 'sprint_review',
          notes: 'Delivered during sprint review meeting',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('DELIVERED');
    });
  });

  describe('Team Management Cross-Feature Integration', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should create team, add members, and start sprint', async () => {
      const email1 = `cross-feature-1-${uniqueId()}@example.com`;
      const email2 = `cross-feature-2-${uniqueId()}@example.com`;
      testEmails.push(email1, email2);

      const scrumMaster = await createTestUserInDb(email1, 'TestPassword123!', 'Scrum', 'Master');
      const developer = await createTestUserInDb(email2, 'TestPassword123!', 'Dev', 'eloper');

      const teamName = `Cross-Feature Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, scrumMaster.id, 'SCRUM_MASTER');
      await addTeamMember(team.id, developer.id, 'DEVELOPER');

      const cookies = await loginAndGetCookies(email1);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const sprintResponse = await request(app)
        .post('/api/v1/sprints')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          name: 'Cross-Feature Sprint',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          sprintGoal: 'Demonstrate cross-feature integration',
        })
        .expect(201);

      expect(sprintResponse.body.success).toBe(true);

      const teamResponse = await request(app)
        .get(`/api/v1/teams/${team.id}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(teamResponse.body.success).toBe(true);
    });
  });

  describe('Notification Integration with Features', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should create and manage notifications', async () => {
      const email = `notification-integration-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Notification Integration Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'SCRUM_MASTER');

      await prisma.notification.create({
        data: {
          id: generateUUIDv7(),
          userId: user.id,
          type: NotificationType.DAILY_UPDATE_REMINDER,
          title: 'Daily Update Reminder',
          message: 'Please submit your daily update',
        },
      });

      await prisma.notification.create({
        data: {
          id: generateUUIDv7(),
          userId: user.id,
          type: NotificationType.TASK_ASSIGNMENT,
          title: 'Sprint Started',
          message: 'Sprint 1 has been started',
        },
      });

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Data Export Integration', () => {
    const testEmails: string[] = [];
    const testTeams: string[] = [];

    afterEach(async () => {
      await cleanupTeams(testTeams);
      await cleanupTestData(testEmails);
      testEmails.length = 0;
      testTeams.length = 0;
    });

    it('should export data from multiple features', async () => {
      const email = `export-integration-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const teamName = `Export Integration Team ${uniqueId()}`;
      testTeams.push(teamName);

      const team = await createTestTeam(teamName);
      await addTeamMember(team.id, user.id, 'SCRUM_MASTER');
      const sprint = await createTestSprint(team.id, 'Export Sprint');

      await prisma.productBacklogItem.create({
        data: {
          id: generateUUIDv7(),
          teamId: team.id,
          title: 'Export PBI',
          status: ItemStatus.DONE,
          storyPoints: 5,
          priority: MoSCoWPriority.COULD_HAVE,
        },
      });

      await prisma.dailyUpdate.create({
        data: {
          id: generateUUIDv7(),
          sprintId: sprint.id,
          userId: user.id,
          updateDate: new Date(),
          yesterdayWork: 'Export work',
          todayWork: 'Export work',
        },
      });

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/user/export-data')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          options: {
            includeSessions: true,
            includeNotifications: true,
            dataCategories: ['teams', 'sprints', 'backlog'],
          },
        })
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('jobId');
    });
  });

  describe('Workflow Cross-Feature Integration', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should validate workflow transitions for ProductGoal', async () => {
      const email = `workflow-integration-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email, 'TestPassword123!', 'Product', 'Owner');

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const validateResponse = await request(app)
        .post('/api/v1/workflows/validate')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          entityType: 'ProductGoal',
          fromStatus: 'NEW',
          toStatus: 'ACTIVE',
        })
        .expect(200);

      expect(validateResponse.body.success).toBe(true);
      expect(validateResponse.body.data.isValid).toBe(true);
    });
  });
});
