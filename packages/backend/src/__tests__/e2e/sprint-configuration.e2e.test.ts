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
  createTestSprintConfigurationInDb,
  cleanupUsers,
  cleanupTeams,
  ROLES,
  getCsrfToken,
  extractCsrfFromCookies,
  CSRF_CONSTANTS,
} from '@e2e-helpers';

describe('E2E: Sprint Configuration', () => {
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
    role: (typeof ROLES)[keyof typeof ROLES] = ROLES.SCRUM_MASTER
  ) => {
    const user = await createTestUser(email);
    const teamName = `Config Team ${uniqueTestId()}`;
    testTeamNames.push(teamName);
    const team = await createTestTeamInDb(teamName);
    await addTeamMember(team.id, user.id, role);
    return { user, team };
  };

  describe('GET /api/v1/sprint-configuration', () => {
    it('should return sprint configuration for a team', async () => {
      const email = `get-config-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);
      await createTestSprintConfigurationInDb(team.id);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/sprint-configuration')
        .query({ teamId: team.id })
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('teamId', team.id);
    });

    it('should return null when no configuration exists', async () => {
      const email = `no-config-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/sprint-configuration')
        .query({ teamId: team.id })
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });

    it('should return 422 UNPROCESSABLE_ENTITY with missing teamId', async () => {
      const email = `missing-team-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/sprint-configuration')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 422 UNPROCESSABLE_ENTITY with invalid teamId format', async () => {
      const email = `invalid-team-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/sprint-configuration')
        .query({ teamId: 'invalid-uuid' })
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/sprint-configuration')
        .query({ teamId: '00000000-0000-0000-0000-000000000000' })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('POST /api/v1/sprint-configuration', () => {
    it('should create sprint configuration successfully', async () => {
      const email = `create-config-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/sprint-configuration')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          duration: 'TWO_WEEKS',
          year: new Date().getFullYear(),
          sprintStartDay: 1,
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.teamId).toBe(team.id);
      expect(response.body.data.duration).toBe('TWO_WEEKS');
    });

    it('should create sprint configuration with four weeks duration', async () => {
      const email = `four-weeks-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/sprint-configuration')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          duration: 'FOUR_WEEKS',
          year: new Date().getFullYear(),
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data.duration).toBe('FOUR_WEEKS');
    });

    it('should return 422 UNPROCESSABLE_ENTITY with invalid duration', async () => {
      const email = `invalid-duration-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/sprint-configuration')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          duration: 'INVALID_DURATION',
          year: new Date().getFullYear(),
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 422 UNPROCESSABLE_ENTITY with invalid year', async () => {
      const email = `invalid-year-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/sprint-configuration')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          duration: 'TWO_WEEKS',
          year: 2019,
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 422 UNPROCESSABLE_ENTITY with year too far in future', async () => {
      const email = `future-year-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/sprint-configuration')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          duration: 'TWO_WEEKS',
          year: 2101,
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 422 UNPROCESSABLE_ENTITY with invalid sprintStartDay', async () => {
      const email = `invalid-day-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/sprint-configuration')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          duration: 'TWO_WEEKS',
          year: new Date().getFullYear(),
          sprintStartDay: 7,
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 422 UNPROCESSABLE_ENTITY with missing required fields', async () => {
      const email = `missing-fields-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/sprint-configuration')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({})
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/sprint-configuration')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: '00000000-0000-0000-0000-000000000000',
          duration: 'TWO_WEEKS',
          year: new Date().getFullYear(),
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/sprint-configuration/:id', () => {
    it('should update sprint configuration successfully', async () => {
      const email = `update-config-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);
      const config = await createTestSprintConfigurationInDb(team.id);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put(`/api/v1/sprint-configuration/${config.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          duration: 'FOUR_WEEKS',
          sprintStartDay: 2,
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.duration).toBe('FOUR_WEEKS');
      expect(response.body.data.sprintStartDay).toBe(2);
    });

    it('should update only year', async () => {
      const email = `update-year-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);
      const config = await createTestSprintConfigurationInDb(team.id);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put(`/api/v1/sprint-configuration/${config.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          year: new Date().getFullYear() + 1,
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.year).toBe(new Date().getFullYear() + 1);
    });

    it('should return 422 UNPROCESSABLE_ENTITY with invalid config ID', async () => {
      const email = `invalid-config-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put('/api/v1/sprint-configuration/invalid-id')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          duration: 'FOUR_WEEKS',
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .put('/api/v1/sprint-configuration/00000000-0000-0000-0000-000000000000')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          duration: 'FOUR_WEEKS',
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/sprint-configuration/generate', () => {
    it('should generate sprints for a year', async () => {
      const email = `generate-sprints-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/sprint-configuration/generate')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          duration: 'TWO_WEEKS',
          year: new Date().getFullYear(),
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sprints');
      expect(Array.isArray(response.body.data.sprints)).toBe(true);
      expect(response.body.data.sprints.length).toBeGreaterThan(0);
    });

    it('should generate sprints with four weeks duration', async () => {
      const email = `generate-four-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/sprint-configuration/generate')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          duration: 'FOUR_WEEKS',
          year: new Date().getFullYear(),
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sprints.length).toBeGreaterThan(0);
    });

    it('should return 422 UNPROCESSABLE_ENTITY with missing teamId', async () => {
      const email = `missing-team-gen-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/sprint-configuration/generate')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          duration: 'TWO_WEEKS',
          year: new Date().getFullYear(),
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 422 UNPROCESSABLE_ENTITY with invalid year', async () => {
      const email = `invalid-year-gen-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/sprint-configuration/generate')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          duration: 'TWO_WEEKS',
          year: 2019,
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/sprint-configuration/generate')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: '00000000-0000-0000-0000-000000000000',
          duration: 'TWO_WEEKS',
          year: new Date().getFullYear(),
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/sprint-configuration/sprints', () => {
    it('should return generated sprints for a team', async () => {
      const email = `get-sprints-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies1 = await loginAndGetCookies(email);
      const { csrfToken: csrfToken1 } = extractCsrfFromCookies(cookies1);

      await request(app)
        .post('/api/v1/sprint-configuration/generate')
        .set('Cookie', cookies1)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken1)
        .send({
          teamId: team.id,
          duration: 'TWO_WEEKS',
          year: new Date().getFullYear(),
        });

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/sprint-configuration/sprints')
        .query({ teamId: team.id })
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter generated sprints by year', async () => {
      const email = `filter-sprints-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);
      const year = new Date().getFullYear();

      const cookies1 = await loginAndGetCookies(email);
      const { csrfToken: csrfToken1 } = extractCsrfFromCookies(cookies1);

      await request(app)
        .post('/api/v1/sprint-configuration/generate')
        .set('Cookie', cookies1)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken1)
        .send({
          teamId: team.id,
          duration: 'TWO_WEEKS',
          year,
        });

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/sprint-configuration/sprints')
        .query({ teamId: team.id, year })
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((s: { year: number }) => s.year === year)).toBe(true);
    });

    it('should return 422 UNPROCESSABLE_ENTITY with missing teamId', async () => {
      const email = `missing-team-sprints-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/sprint-configuration/sprints')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/sprint-configuration/sprints')
        .query({ teamId: '00000000-0000-0000-0000-000000000000' })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/sprint-configuration/sprints/:sprintId', () => {
    it('should update generated sprint successfully', async () => {
      const email = `update-sprint-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies1 = await loginAndGetCookies(email);
      const { csrfToken: csrfToken1 } = extractCsrfFromCookies(cookies1);

      const generateResponse = await request(app)
        .post('/api/v1/sprint-configuration/generate')
        .set('Cookie', cookies1)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken1)
        .send({
          teamId: team.id,
          duration: 'TWO_WEEKS',
          year: new Date().getFullYear(),
        });

      const sprintId = generateResponse.body.data.sprints[0].id;
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put(`/api/v1/sprint-configuration/sprints/${sprintId}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          sprintGoal: 'Updated sprint goal for testing',
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sprintGoal).toBe('Updated sprint goal for testing');
    });

    it('should return 422 UNPROCESSABLE_ENTITY with empty sprint goal', async () => {
      const email = `empty-goal-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies1 = await loginAndGetCookies(email);
      const { csrfToken: csrfToken1 } = extractCsrfFromCookies(cookies1);

      const generateResponse = await request(app)
        .post('/api/v1/sprint-configuration/generate')
        .set('Cookie', cookies1)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken1)
        .send({
          teamId: team.id,
          duration: 'TWO_WEEKS',
          year: new Date().getFullYear(),
        });

      const sprintId = generateResponse.body.data.sprints[0].id;
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put(`/api/v1/sprint-configuration/sprints/${sprintId}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          sprintGoal: '',
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 422 UNPROCESSABLE_ENTITY with invalid sprint ID', async () => {
      const email = `invalid-sprint-id-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put('/api/v1/sprint-configuration/sprints/invalid-id')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          sprintGoal: 'Test goal',
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .put('/api/v1/sprint-configuration/sprints/00000000-0000-0000-0000-000000000000')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          sprintGoal: 'Test goal',
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/sprint-configuration/sprints/:sprintId', () => {
    it('should delete generated sprint successfully', async () => {
      const email = `delete-sprint-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies1 = await loginAndGetCookies(email);
      const { csrfToken: csrfToken1 } = extractCsrfFromCookies(cookies1);

      const generateResponse = await request(app)
        .post('/api/v1/sprint-configuration/generate')
        .set('Cookie', cookies1)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken1)
        .send({
          teamId: team.id,
          duration: 'TWO_WEEKS',
          year: new Date().getFullYear(),
        });

      const sprintId = generateResponse.body.data.sprints[0].id;
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete(`/api/v1/sprint-configuration/sprints/${sprintId}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);

      const checkSprint = await prisma.generatedSprint.findUnique({
        where: { id: sprintId },
      });
      expect(checkSprint).toBeNull();
    });

    it('should return 422 UNPROCESSABLE_ENTITY with invalid sprint ID', async () => {
      const email = `delete-invalid-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete('/api/v1/sprint-configuration/sprints/invalid-id')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .delete('/api/v1/sprint-configuration/sprints/00000000-0000-0000-0000-000000000000')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle creating configuration for non-existent team', async () => {
      const email = `nonexistent-team-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/sprint-configuration')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: '00000000-0000-0000-0000-000000000000',
          duration: 'TWO_WEEKS',
          year: new Date().getFullYear(),
        });

      expect(response.body.success).toBe(false);
    });

    it('should handle generating sprints for team with existing generated sprints', async () => {
      const email = `regenerate-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      await request(app)
        .post('/api/v1/sprint-configuration/generate')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          duration: 'TWO_WEEKS',
          year: new Date().getFullYear(),
        });

      const response = await request(app)
        .post('/api/v1/sprint-configuration/generate')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          duration: 'TWO_WEEKS',
          year: new Date().getFullYear(),
        });

      expect(response.body.success).toBe(true);
    });

    it('should handle updating non-existent configuration', async () => {
      const email = `update-nonexistent-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put('/api/v1/sprint-configuration/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          duration: 'FOUR_WEEKS',
        });

      expect(response.body.success).toBe(false);
    });

    it('should handle different sprint start days', async () => {
      const email = `start-days-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      for (let day = 0; day <= 6; day++) {
        const response = await request(app)
          .post('/api/v1/sprint-configuration')
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .send({
            teamId: team.id,
            duration: 'TWO_WEEKS',
            year: new Date().getFullYear(),
            sprintStartDay: day,
          });

        if (response.status === HTTP_STATUS.CREATED) {
          expect(response.body.data.sprintStartDay).toBe(day);
          break;
        }
      }
    });
  });

  describe('Authorization and Permissions', () => {
    it('should allow scrum master to create configuration', async () => {
      const email = `sm-create-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/sprint-configuration')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          duration: 'TWO_WEEKS',
          year: new Date().getFullYear(),
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
    });

    it('should allow administrator to create configuration', async () => {
      const email = `admin-create-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.ADMINISTRATOR);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/sprint-configuration')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          teamId: team.id,
          duration: 'TWO_WEEKS',
          year: new Date().getFullYear(),
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
    });

    it('should allow developer to view configuration', async () => {
      const email = `dev-view-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { team } = await setupTeamWithUser(email, ROLES.DEVELOPER);
      await createTestSprintConfigurationInDb(team.id);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/sprint-configuration')
        .query({ teamId: team.id })
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });
  });
});
