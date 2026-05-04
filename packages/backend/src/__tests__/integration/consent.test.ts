// Integration Tests for Consent Management Endpoints
// Tests user consent tracking and GDPR compliance

import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../utils/prisma';
import { generateUUIDv7 } from '../../utils/uuid';
import bcrypt from 'bcrypt';
import { CSRF_CONSTANTS } from '../../middleware/csrf.middleware';
import { getCsrfToken, extractCsrfFromCookies } from '../helpers/test-helpers';

const uniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

describe('Consent Integration Tests', () => {
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

  const cleanupTestData = async (emails: string[]) => {
    try {
      for (const email of emails) {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (user) {
          await prisma.consentRecord.deleteMany({ where: { userId: user.id } });
          await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
          await prisma.notification.deleteMany({ where: { userId: user.id } });
          await prisma.user.delete({ where: { id: user.id } });
        }
      }
    } catch (_error) {
      // Ignore cleanup errors
    }
  };

  describe('POST /api/v1/consent/record', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should record consent successfully', async () => {
      const email = `consent-record-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);
      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/consent/record')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          consentType: 'cookie_consent',
          action: 'accept_all',
          version: '1.0',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.consentType).toBe('cookie_consent');
      expect(response.body.data.action).toBe('accept_all');
    });
  });

  describe('GET /api/v1/consent/history', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should return user consent history', async () => {
      const email = `consent-history-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const consentId = generateUUIDv7();
      await prisma.consentRecord.create({
        data: {
          id: consentId,
          userId: user.id,
          consentType: 'marketing_consent',
          action: 'accept_all',
          version: '2.0',
        },
      });

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/consent/history')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.records.length).toBe(1);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/v1/consent/history').expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/consent/latest', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should return latest consent for user', async () => {
      const email = `consent-latest-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const consentId = generateUUIDv7();
      await prisma.consentRecord.create({
        data: {
          id: consentId,
          userId: user.id,
          consentType: 'marketing_consent',
          action: 'accept_all',
          version: '1.0',
        },
      });

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/consent/latest')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.consent.consentType).toBe('marketing_consent');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/v1/consent/latest').expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/consent/:consentId', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should return consent by ID', async () => {
      const email = `consent-by-id-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const consentId = generateUUIDv7();
      await prisma.consentRecord.create({
        data: {
          id: consentId,
          userId: user.id,
          consentType: 'cookie_consent',
          action: 'accept_all',
          version: '1.0',
        },
      });

      const response = await request(app).get(`/api/v1/consent/${consentId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.consent.consentType).toBe('cookie_consent');
    });
  });

  describe('POST /api/v1/consent/withdraw', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should withdraw consent successfully', async () => {
      const email = `consent-withdraw-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const consentId = generateUUIDv7();
      await prisma.consentRecord.create({
        data: {
          id: consentId,
          userId: user.id,
          consentType: 'marketing_consent',
          action: 'accept_all',
          version: '1.0',
        },
      });

      const cookies = await loginAndGetCookies(email);

      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/consent/withdraw')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          consentId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe('withdrawn');
    });

    it('should return 401 when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/consent/withdraw')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ consentId: generateUUIDv7() })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
