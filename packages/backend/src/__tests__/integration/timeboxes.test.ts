// Integration Tests for Scrum Event Timebox Endpoints
// Covers shared timebox state (read), SM-only control (start/pause/reset),
// role guarding, and shared visibility across participants.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../utils/prisma';
import { generateUUIDv7 } from '../../utils/uuid';
import bcrypt from 'bcrypt';
import { CSRF_CONSTANTS } from '../../middleware/csrf.middleware';
import { getCsrfToken, replaceCsrfCookie } from '../helpers/test-helpers';

const uniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

describe('Timebox Integration Tests', () => {
  let teamId = '';
  let sprintId = '';
  let smUserId = '';
  let devUserId = '';
  let smCookies: string[] = [];
  let devCookies: string[] = [];

  const createUserInDb = async (
    email: string,
    firstName = 'Test',
    lastName = 'User'
  ): Promise<string> => {
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    const userId = generateUUIDv7();
    await prisma.user.create({
      data: {
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
      },
    });
    return userId;
  };

  const loginAndGetCookies = async (email: string): Promise<string[]> => {
    const { csrfCookie, csrfToken } = await getCsrfToken();
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Cookie', csrfCookie)
      .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
      .send({ email, password: 'TestPassword123!' });
    return [
      ...(Array.isArray(response.headers['set-cookie']) ? response.headers['set-cookie'] : []),
      csrfCookie,
    ];
  };

  const addMember = async (userId: string, role: 'SCRUM_MASTER' | 'DEVELOPERS') => {
    await prisma.teamMember.create({
      data: {
        id: generateUUIDv7(),
        teamId,
        userId,
        role,
      },
    });
  };

  beforeAll(async () => {
    teamId = generateUUIDv7();
    sprintId = generateUUIDv7();
    const smEmail = `sm-${uniqueId()}@example.com`;
    const devEmail = `dev-${uniqueId()}@example.com`;

    smUserId = await createUserInDb(smEmail);
    devUserId = await createUserInDb(devEmail);

    await prisma.team.create({
      data: { id: teamId, name: `Timebox Team ${uniqueId()}` },
    });
    await prisma.sprint.create({
      data: {
        id: sprintId,
        teamId,
        name: 'Timebox Sprint',
        startDate: new Date('2026-08-01T00:00:00.000Z'),
        endDate: new Date('2026-08-28T23:59:59.000Z'),
      },
    });

    await addMember(smUserId, 'SCRUM_MASTER');
    await addMember(devUserId, 'DEVELOPERS');

    smCookies = await loginAndGetCookies(smEmail);
    devCookies = await loginAndGetCookies(devEmail);
  });

  afterAll(async () => {
    await prisma.timebox.deleteMany({ where: { teamId } });
    await prisma.teamMember.deleteMany({ where: { teamId } });
    await prisma.sprint.deleteMany({ where: { teamId } });
    await prisma.team.delete({ where: { id: teamId } });
    await prisma.user.deleteMany({ where: { id: { in: [smUserId, devUserId] } } });
  });

  describe('GET /:eventType (read)', () => {
    it('returns an initial IDLE timebox for a team member on first access', async () => {
      const response = await request(app)
        .get(`/api/v1/timeboxes/dailyScrum`)
        .set('Cookie', devCookies)
        .set('x-team-id', teamId)
        .query({ sprintId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('IDLE');
      expect(response.body.data.eventType).toBe('dailyScrum');
      expect(response.body.data.timeboxSeconds).toBe(15 * 60);
      expect(response.body.data.elapsedMs).toBe(0);
    });

    it('derives the scaled timebox for a two-week Sprint Planning', async () => {
      const twoWeekSprintId = generateUUIDv7();
      await prisma.sprint.create({
        data: {
          id: twoWeekSprintId,
          teamId,
          name: 'Two Week Sprint',
          startDate: new Date('2026-08-03T00:00:00.000Z'),
          endDate: new Date('2026-08-14T23:59:59.000Z'),
        },
      });

      const response = await request(app)
        .get(`/api/v1/timeboxes/sprintPlanning`)
        .set('Cookie', smCookies)
        .set('x-team-id', teamId)
        .query({ sprintId: twoWeekSprintId });

      expect(response.status).toBe(200);
      expect(response.body.data.timeboxSeconds).toBe(4 * 60 * 60);

      await prisma.timebox.deleteMany({ where: { sprintId: twoWeekSprintId } });
      await prisma.sprint.delete({ where: { id: twoWeekSprintId } });
    });

    it('rejects an invalid event type', async () => {
      const response = await request(app)
        .get('/api/v1/timeboxes/notARealEvent')
        .set('Cookie', devCookies)
        .set('x-team-id', teamId);

      expect(response.status).toBe(422);
    });
  });

  describe('Control actions (SM only)', () => {
    it('lets the SM start and read a running timebox', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const startResponse = await request(app)
        .post('/api/v1/timeboxes/sprintPlanning/start')
        .set('Cookie', replaceCsrfCookie(smCookies, { csrfCookie, csrfToken }))
        .set('x-team-id', teamId)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ sprintId });

      expect(startResponse.status).toBe(200);
      expect(startResponse.body.data.status).toBe('RUNNING');
      expect(startResponse.body.data.elapsedMs).toBeGreaterThanOrEqual(0);

      const readResponse = await request(app)
        .get('/api/v1/timeboxes/sprintPlanning')
        .set('Cookie', smCookies)
        .set('x-team-id', teamId)
        .query({ sprintId });

      expect(readResponse.body.data.status).toBe('RUNNING');
    });

    it('forbids a non-Scrum-Master from controlling the timebox', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/timeboxes/dailyScrum/start')
        .set('Cookie', replaceCsrfCookie(devCookies, { csrfCookie, csrfToken }))
        .set('x-team-id', teamId)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ sprintId });

      expect(response.status).toBe(403);
    });

    it('lets a Developer still read the timebox (transparency)', async () => {
      const response = await request(app)
        .get('/api/v1/timeboxes/sprintPlanning')
        .set('Cookie', devCookies)
        .set('x-team-id', teamId)
        .query({ sprintId });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('RUNNING');
    });

    it('lets the SM pause and reset the timebox', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const pauseResponse = await request(app)
        .post('/api/v1/timeboxes/sprintPlanning/pause')
        .set('Cookie', replaceCsrfCookie(smCookies, { csrfCookie, csrfToken }))
        .set('x-team-id', teamId)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ sprintId });

      expect(pauseResponse.status).toBe(200);
      expect(pauseResponse.body.data.status).toBe('PAUSED');

      const resetResponse = await request(app)
        .post('/api/v1/timeboxes/sprintPlanning/reset')
        .set('Cookie', replaceCsrfCookie(smCookies, { csrfCookie, csrfToken }))
        .set('x-team-id', teamId)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ sprintId });

      expect(resetResponse.status).toBe(200);
      expect(resetResponse.body.data.status).toBe('IDLE');
      expect(resetResponse.body.data.elapsedMs).toBe(0);
    });

    it('lets the SM conclude the timebox and records the outcome', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const concludeResponse = await request(app)
        .post('/api/v1/timeboxes/dailyScrum/conclude')
        .set('Cookie', replaceCsrfCookie(smCookies, { csrfCookie, csrfToken }))
        .set('x-team-id', teamId)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ sprintId });

      expect(concludeResponse.status).toBe(200);
      expect(concludeResponse.body.data.status).toBe('PAUSED');

      const stored = await prisma.timebox.findFirst({
        where: { teamId, eventType: 'dailyScrum', sprintId },
      });
      expect(stored).not.toBeNull();
      expect(stored?.concludedElapsedMs).not.toBeNull();
      expect(stored?.concludedAt).not.toBeNull();
    });

    it('forbids a non-Scrum-Master from concluding the timebox', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/timeboxes/dailyScrum/conclude')
        .set('Cookie', replaceCsrfCookie(devCookies, { csrfCookie, csrfToken }))
        .set('x-team-id', teamId)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ sprintId });

      expect(response.status).toBe(403);
    });
  });
});
