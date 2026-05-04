import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
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

describe('E2E: Team Management', () => {
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

  describe('GET /api/v1/teams', () => {
    it('should return teams for authenticated user', async () => {
      const email = `teams-list-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      const teamName = `Test Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, ROLES.DEVELOPER);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/teams')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('teams');
      expect(Array.isArray(response.body.data.teams)).toBe(true);
      expect(response.body.data.teams.length).toBeGreaterThan(0);
    });

    it('should return empty teams array for user without teams', async () => {
      const email = `no-teams-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/teams')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('teams');
      expect(Array.isArray(response.body.data.teams)).toBe(true);
      expect(response.body.data.teams.length).toBe(0);
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const response = await request(app).get('/api/v1/teams').expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('GET /api/v1/teams/my-teams', () => {
    it('should return teams with user roles', async () => {
      const email = `my-teams-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      const teamName = `My Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, ROLES.PRODUCT_OWNER);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/teams/my-teams')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0]).toHaveProperty('userRole');
      expect(response.body.data[0].userRole).toBe(ROLES.PRODUCT_OWNER);
    });
  });

  describe('POST /api/v1/teams', () => {
    it('should create a new team successfully', async () => {
      const email = `create-team-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const teamName = `New Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const response = await request(app)
        .post('/api/v1/teams')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          name: teamName,
          description: 'A test team description',
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(teamName);
      expect(response.body.data.description).toBe('A test team description');
    });

    it('should return 422 VALIDATION_ERROR with empty team name', async () => {
      const email = `empty-name-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/teams')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          name: '',
          description: 'Test description',
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 422 VALIDATION_ERROR with name exceeding max length', async () => {
      const email = `long-name-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/teams')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          name: 'a'.repeat(101),
          description: 'Test description',
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 409 CONFLICT for duplicate team name', async () => {
      const email = `duplicate-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const teamName = `Duplicate Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      await createTestTeamInDb(teamName);

      const response = await request(app)
        .post('/api/v1/teams')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          name: teamName,
          description: 'Another team with same name',
        })
        .expect(HTTP_STATUS.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.CONFLICT);
    });
  });

  describe('GET /api/v1/teams/:teamId', () => {
    it('should return team by ID for team member', async () => {
      const email = `get-team-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      const teamName = `Get Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, ROLES.DEVELOPER);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/teams/${team.id}`)
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(team.id);
      expect(response.body.data.name).toBe(teamName);
    });

    it('should return 404 NOT_FOUND for non-existent team', async () => {
      const email = `nonexistent-team-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/teams/00000000-0000-0000-0000-000000000000`)
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it('should return 422 UNPROCESSABLE_ENTITY for invalid team ID format', async () => {
      const email = `invalid-id-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/teams/invalid-id')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('PUT /api/v1/teams/:teamId', () => {
    it('should update team successfully as administrator', async () => {
      const email = `update-team-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      const teamName = `Update Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, ROLES.ADMINISTRATOR);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put(`/api/v1/teams/${team.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          name: `${teamName} Updated`,
          description: 'Updated description',
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(`${teamName} Updated`);
      expect(response.body.data.description).toBe('Updated description');
    });
  });

  describe('DELETE /api/v1/teams/:teamId', () => {
    it('should delete team successfully as administrator', async () => {
      const email = `delete-team-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      const teamName = `Delete Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, ROLES.ADMINISTRATOR);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete(`/api/v1/teams/${team.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);

      const getResponse = await request(app).get(`/api/v1/teams/${team.id}`).set('Cookie', cookies);

      expect(getResponse.status).toBe(HTTP_STATUS.NOT_FOUND);
      testTeamNames.splice(testTeamNames.indexOf(teamName), 1);
    });
  });

  describe('POST /api/v1/teams/:teamId/members', () => {
    it('should add member to team as scrum master', async () => {
      const adminEmail = `admin-add-${uniqueTestId()}@example.com`;
      const memberEmail = `member-add-${uniqueTestId()}@example.com`;
      testEmails.push(adminEmail, memberEmail);

      const admin = await createTestUser(adminEmail);
      await createTestUser(memberEmail);

      const teamName = `Add Member Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, admin.id, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(adminEmail);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/teams/${team.id}/members`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: memberEmail,
          role: ROLES.DEVELOPER,
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 NOT_FOUND when adding non-existent user', async () => {
      const adminEmail = `admin-nonexistent-${uniqueTestId()}@example.com`;
      testEmails.push(adminEmail);

      const admin = await createTestUser(adminEmail);

      const teamName = `Nonexistent Member Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, admin.id, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(adminEmail);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/teams/${team.id}/members`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: `nonexistent-${uniqueTestId()}@example.com`,
          role: ROLES.DEVELOPER,
        })
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it('should return 403 FORBIDDEN for non-scrum master', async () => {
      const memberEmail = `member-no-perm-${uniqueTestId()}@example.com`;
      const newMemberEmail = `new-member-${uniqueTestId()}@example.com`;
      testEmails.push(memberEmail, newMemberEmail);

      const member = await createTestUser(memberEmail);
      await createTestUser(newMemberEmail);

      const teamName = `No Perm Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, member.id, ROLES.DEVELOPER);

      const cookies = await loginAndGetCookies(memberEmail);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post(`/api/v1/teams/${team.id}/members`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: newMemberEmail,
          role: ROLES.DEVELOPER,
        })
        .expect(HTTP_STATUS.FORBIDDEN);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });

  describe('PUT /api/v1/teams/:teamId/members/:memberId', () => {
    it('should update member role as scrum master', async () => {
      const adminEmail = `admin-role-${uniqueTestId()}@example.com`;
      const memberEmail = `member-role-${uniqueTestId()}@example.com`;
      testEmails.push(adminEmail, memberEmail);

      const admin = await createTestUser(adminEmail);
      await createTestUser(memberEmail);

      const teamName = `Update Role Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, admin.id, ROLES.SCRUM_MASTER);

      const adminCookies = await loginAndGetCookies(adminEmail);
      const { csrfToken: csrfToken1 } = extractCsrfFromCookies(adminCookies);

      const membership = await request(app)
        .post(`/api/v1/teams/${team.id}/members`)
        .set('Cookie', adminCookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken1)
        .send({
          email: memberEmail,
          role: ROLES.DEVELOPER,
        });

      const cookies = await loginAndGetCookies(adminEmail);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put(`/api/v1/teams/${team.id}/members/${membership.body.data.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          role: ROLES.PRODUCT_OWNER,
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/v1/teams/:teamId/members/:memberId', () => {
    it('should remove member from team as scrum master', async () => {
      const adminEmail = `admin-remove-${uniqueTestId()}@example.com`;
      const memberEmail = `member-remove-${uniqueTestId()}@example.com`;
      testEmails.push(adminEmail, memberEmail);

      const admin = await createTestUser(adminEmail);
      await createTestUser(memberEmail);

      const teamName = `Remove Member Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, admin.id, ROLES.SCRUM_MASTER);

      const adminCookies = await loginAndGetCookies(adminEmail);
      const { csrfToken: csrfToken1 } = extractCsrfFromCookies(adminCookies);

      const membership = await request(app)
        .post(`/api/v1/teams/${team.id}/members`)
        .set('Cookie', adminCookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken1)
        .send({
          email: memberEmail,
          role: ROLES.DEVELOPER,
        });

      const cookies = await loginAndGetCookies(adminEmail);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete(`/api/v1/teams/${team.id}/members/${membership.body.data.id}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/teams/:teamId/my-role', () => {
    it('should return user role in team', async () => {
      const email = `my-role-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      const teamName = `My Role Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/teams/${team.id}/my-role`)
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(ROLES.SCRUM_MASTER);
    });
  });

  describe('POST /api/v1/teams/select-team', () => {
    it('should select team for session', async () => {
      const email = `select-team-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      const teamName = `Select Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, ROLES.DEVELOPER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/teams/select-team')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ teamId: team.id })
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });

    it('should return 403 FORBIDDEN when selecting team user is not member of', async () => {
      const email = `no-member-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const teamName = `No Member Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/teams/select-team')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ teamId: team.id })
        .expect(HTTP_STATUS.FORBIDDEN);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not a member');
    });
  });

  describe('Definition of Done', () => {
    it('should get definition of done for team', async () => {
      const email = `dod-get-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      const teamName = `DoD Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, ROLES.DEVELOPER);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/teams/${team.id}/definition-of-done`)
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });

    it('should update definition of done as scrum master', async () => {
      const email = `dod-update-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      const teamName = `DoD Update Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put(`/api/v1/teams/${team.id}/definition-of-done`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          items: [
            {
              description: 'Code reviewed',
              category: 'code_review',
              isActive: true,
              order: 0,
            },
            {
              description: 'Tests pass',
              category: 'testing',
              isActive: true,
              order: 1,
            },
          ],
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Definition of Ready', () => {
    it('should get definition of ready for team', async () => {
      const email = `dor-get-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      const teamName = `DoR Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, ROLES.DEVELOPER);

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/teams/${team.id}/definition-of-ready`)
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });

    it('should update definition of ready as scrum master', async () => {
      const email = `dor-update-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      const teamName = `DoR Update Team ${uniqueTestId()}`;
      testTeamNames.push(teamName);

      const team = await createTestTeamInDb(teamName);
      await addTeamMember(team.id, user.id, ROLES.SCRUM_MASTER);

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put(`/api/v1/teams/${team.id}/definition-of-ready`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          items: [
            {
              description: 'User story defined',
              category: 'documentation',
              isActive: true,
              order: 0,
            },
            {
              description: 'Acceptance criteria defined',
              category: 'documentation',
              isActive: true,
              order: 1,
            },
          ],
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });
  });
});
