import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../utils/prisma';
import {
  uniqueTestId,
  HTTP_STATUS,
  ERROR_CODES,
  DEFAULT_PASSWORD,
  createTestUser,
  createTestTeamInDb,
  addTeamMember,
  createTestSprintInDb,
  createTestDailyUpdateInDb,
  cleanupUsers,
  cleanupTeams,
  ROLES,
  SPRINT_STATUSES,
  getCsrfToken,
  extractCsrfFromCookies,
  CSRF_CONSTANTS,
} from '@e2e-helpers';

describe('E2E: Daily Updates', () => {
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
    const teamName = `Daily Update Team ${uniqueTestId()}`;
    testTeamNames.push(teamName);
    const team = await createTestTeamInDb(teamName);
    await addTeamMember(team.id, user.id, role);
    return { user, team };
  };

  describe('GET /api/v1/daily-updates/:sprintId', () => {
    it('should return daily updates for a sprint', async () => {
      const email = `get-updates-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user, team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      await createTestDailyUpdateInDb(sprint.id, user.id);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/daily-updates/${sprint.id}`)
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter daily updates by date', async () => {
      const email = `filter-date-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user, team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await createTestDailyUpdateInDb(sprint.id, user.id, today);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/daily-updates/${sprint.id}`)
        .query({ date: today.toISOString().split('T')[0] })
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/daily-updates/00000000-0000-0000-0000-000000000000')
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should return 422 UNPROCESSABLE_ENTITY with invalid sprint ID format', async () => {
      const email = `invalid-sprint-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/daily-updates/invalid-id')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('POST /api/v1/daily-updates/:sprintId', () => {
    it('should create a daily update successfully', async () => {
      const email = `create-update-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/daily-updates/${sprint.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          yesterdayWork: 'Completed API integration',
          todayWork: 'Working on frontend components',
          impediment: 'Waiting for design review',
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.yesterdayWork).toBe('Completed API integration');
      expect(response.body.data.todayWork).toBe('Working on frontend components');
      expect(response.body.data.impediment).toBe('Waiting for design review');
    });

    it('should create a daily update with minimal data', async () => {
      const email = `minimal-update-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/daily-updates/${sprint.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({})
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should return 422 UNPROCESSABLE_ENTITY with content exceeding max length', async () => {
      const email = `long-content-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/daily-updates/${sprint.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          yesterdayWork: 'a'.repeat(2001),
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/daily-updates/00000000-0000-0000-0000-000000000000')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          yesterdayWork: 'Test',
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/daily-updates/update/:id', () => {
    it('should return daily update by ID', async () => {
      const email = `get-by-id-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user, team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const dailyUpdate = await createTestDailyUpdateInDb(sprint.id, user.id);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/daily-updates/update/${dailyUpdate.id}`)
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(dailyUpdate.id);
    });

    it('should return null for non-existent daily update', async () => {
      const email = `nonexistent-update-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/daily-updates/update/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });

    it('should return 422 UNPROCESSABLE_ENTITY with invalid ID format', async () => {
      const email = `invalid-id-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/daily-updates/update/invalid-id')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('PUT /api/v1/daily-updates/update/:id', () => {
    it('should update daily update successfully', async () => {
      const email = `update-daily-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user, team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const dailyUpdate = await createTestDailyUpdateInDb(sprint.id, user.id);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put(`/api/v1/daily-updates/update/${dailyUpdate.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          yesterdayWork: 'Updated yesterday work',
          todayWork: 'Updated today work',
          impediment: 'Updated impediment',
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.yesterdayWork).toBe('Updated yesterday work');
    });

    it('should partially update daily update', async () => {
      const email = `partial-update-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user, team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const dailyUpdate = await createTestDailyUpdateInDb(
        sprint.id,
        user.id,
        undefined,
        'Original yesterday work'
      );

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put(`/api/v1/daily-updates/update/${dailyUpdate.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          todayWork: 'Only updating today work',
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.todayWork).toBe('Only updating today work');
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .put('/api/v1/daily-updates/update/00000000-0000-0000-0000-000000000000')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ todayWork: 'Test' })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/daily-updates/update/:id', () => {
    it('should delete daily update successfully', async () => {
      const email = `delete-update-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user, team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const dailyUpdate = await createTestDailyUpdateInDb(sprint.id, user.id);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete(`/api/v1/daily-updates/update/${dailyUpdate.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);

      const checkUpdate = await prisma.dailyUpdate.findUnique({
        where: { id: dailyUpdate.id },
      });
      expect(checkUpdate).toBeNull();
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .delete('/api/v1/daily-updates/update/00000000-0000-0000-0000-000000000000')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/daily-updates/:sprintId/team-status', () => {
    it('should return team members with update status', async () => {
      const email = `team-status-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user, team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await createTestDailyUpdateInDb(sprint.id, user.id, today);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/daily-updates/${sprint.id}/team-status`)
        .query({ date: today.toISOString().split('T')[0] })
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('submitted');
      expect(response.body.data).toHaveProperty('pending');
      expect(Array.isArray(response.body.data.submitted)).toBe(true);
      expect(Array.isArray(response.body.data.pending)).toBe(true);
    });

    it('should return empty arrays when no date provided', async () => {
      const email = `no-date-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/daily-updates/${sprint.id}/team-status`)
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.submitted).toEqual([]);
      expect(response.body.data.pending).toEqual([]);
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/daily-updates/00000000-0000-0000-0000-000000000000/team-status')
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/daily-updates/:id/promote-impediment', () => {
    it('should promote impediment from daily update successfully', async () => {
      const email = `promote-impediment-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user, team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const dailyUpdate = await createTestDailyUpdateInDb(
        sprint.id,
        user.id,
        undefined,
        'Yesterday work',
        'Today work',
        'Blocking issue that needs to be escalated'
      );

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/daily-updates/${dailyUpdate.id}/promote-impediment`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          title: 'Escalated impediment',
          description: 'This is a blocking issue that needs immediate attention',
          teamId: team.id,
          sprintId: sprint.id,
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('impediment');
      expect(response.body.data.impediment.title).toBe('Escalated impediment');
    });

    it('should return 422 UNPROCESSABLE_ENTITY with missing required fields', async () => {
      const email = `missing-fields-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user, team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const dailyUpdate = await createTestDailyUpdateInDb(sprint.id, user.id);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/daily-updates/${dailyUpdate.id}/promote-impediment`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          title: 'Missing description',
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 422 UNPROCESSABLE_ENTITY with title too short', async () => {
      const email = `short-title-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user, team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const dailyUpdate = await createTestDailyUpdateInDb(sprint.id, user.id);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/daily-updates/${dailyUpdate.id}/promote-impediment`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          title: 'ab',
          description: 'Valid description here',
          teamId: team.id,
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 422 UNPROCESSABLE_ENTITY with description too short', async () => {
      const email = `short-desc-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user, team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const dailyUpdate = await createTestDailyUpdateInDb(sprint.id, user.id);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/daily-updates/${dailyUpdate.id}/promote-impediment`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          title: 'Valid title',
          description: 'short',
          teamId: team.id,
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('POST /api/v1/daily-updates/:sprintId/send-reminder', () => {
    it('should send reminders to team members who have not submitted', async () => {
      const email1 = `reminder-sender-${uniqueTestId()}@example.com`;
      const email2 = `reminder-recipient-${uniqueTestId()}@example.com`;
      testEmails.push(email1, email2);

      const sender = await createTestUser(email1);
      const recipient = await createTestUser(email2);

      const teamName = `Reminder Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);
      const team = await createTestTeamInDb(teamName);

      await addTeamMember(team.id, sender.id, ROLES.SCRUM_MASTER);
      await addTeamMember(team.id, recipient.id, ROLES.DEVELOPER);

      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const cookies = await loginAndGetCookies(email1);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/daily-updates/${sprint.id}/send-reminder`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sentCount');
      expect(response.body.data.sentCount).toBeGreaterThanOrEqual(0);
    });

    it('should return message when all team members have submitted', async () => {
      const email = `all-submitted-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user, team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await createTestDailyUpdateInDb(sprint.id, user.id, today);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/daily-updates/${sprint.id}/send-reminder`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sentCount).toBe(0);
      expect(response.body.data.message).toContain('All team members');
    });

    it('should return 400 BAD_REQUEST for non-existent sprint', async () => {
      const email = `nonexistent-sprint-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/daily-updates/00000000-0000-0000-0000-000000000000/send-reminder')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/daily-updates/00000000-0000-0000-0000-000000000000/send-reminder')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent daily update creation for same user and date', async () => {
      const email = `concurrent-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const createPromise1 = request(app)
        .post(`/api/v1/daily-updates/${sprint.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ yesterdayWork: 'First attempt' });

      const createPromise2 = request(app)
        .post(`/api/v1/daily-updates/${sprint.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ yesterdayWork: 'Second attempt' });

      const [response1, response2] = await Promise.all([createPromise1, createPromise2]);

      const statusCodes = [response1.status, response2.status].sort();
      expect(statusCodes).toContain(HTTP_STATUS.CREATED);
    });

    it('should handle daily update with special characters in content', async () => {
      const email = `special-chars-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const specialContent =
        'Test with <script>alert("xss")</script> & "quotes" and \'apostrophes\'';

      const response = await request(app)
        .post(`/api/v1/daily-updates/${sprint.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          yesterdayWork: specialContent,
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
    });

    it('should handle daily update with unicode characters', async () => {
      const email = `unicode-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const unicodeContent = 'Working on 中文 日本語 한글 emoji 🚀 🎉 ✅';

      const response = await request(app)
        .post(`/api/v1/daily-updates/${sprint.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          todayWork: unicodeContent,
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data.todayWork).toBe(unicodeContent);
    });

    it('should handle daily update with null impediment', async () => {
      const email = `null-impediment-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { user, team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const dailyUpdate = await createTestDailyUpdateInDb(
        sprint.id,
        user.id,
        undefined,
        'Yesterday work',
        'Today work',
        null
      );

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/daily-updates/update/${dailyUpdate.id}`)
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.impediment).toBeNull();
    });
  });

  describe('Authorization and Permissions', () => {
    it('should allow any team member to create daily update', async () => {
      const email = `dev-update-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/daily-updates/${sprint.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          todayWork: 'Developer update',
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
    });

    it('should allow scrum master to view team status', async () => {
      const email = `sm-status-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);
      const sprint = await createTestSprintInDb(
        team.id,
        `Sprint ${uniqueTestId()}`,
        SPRINT_STATUSES.ACTIVE
      );

      const cookies = await loginAndGetCookies(email);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const response = await request(app)
        .get(`/api/v1/daily-updates/${sprint.id}/team-status`)
        .query({ date: today.toISOString().split('T')[0] })
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });
  });
});
