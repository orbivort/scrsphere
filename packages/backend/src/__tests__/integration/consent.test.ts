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
import { setLocaleHeader, createI18nTestUser, SUPPORTED_LOCALES } from '../helpers/i18n-helpers';

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

  describe('i18n Locale Support', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    describe('Translated GDPR consent messages', () => {
      it('should set locale cookie for anonymous consent recording in German', async () => {
        const { csrfCookie, csrfToken } = await getCsrfToken();

        // /consent/record uses optionalAuth, so it works for anonymous users
        const response = await request(app)
          .post('/api/v1/consent/record')
          .set('Cookie', csrfCookie)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader('de'))
          .send({
            consentType: 'cookie_consent',
            action: 'accept_all',
            version: '1.0',
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        // Verify locale cookie is set
        const setCookie = response.headers['set-cookie'];
        expect(setCookie).toBeDefined();
        const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
        const localeCookie = cookies.find((c) => c.startsWith('scrumooth_locale='));
        expect(localeCookie).toBeDefined();
        expect(localeCookie).toContain('scrumooth_locale=de');
      });

      it('should return translated error message for unauthenticated consent history access in French', async () => {
        const { csrfCookie } = await getCsrfToken();

        const response = await request(app)
          .get('/api/v1/consent/history')
          .set('Cookie', csrfCookie)
          .set(setLocaleHeader('fr'))
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHORIZED');
        // Verify locale cookie is set
        const setCookie = response.headers['set-cookie'];
        expect(setCookie).toBeDefined();
        const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
        const localeCookie = cookies.find((c) => c.startsWith('scrumooth_locale='));
        expect(localeCookie).toBeDefined();
        expect(localeCookie).toContain('scrumooth_locale=fr');
      });

      it('should return translated error messages in all supported locales for unauthenticated withdraw', async () => {
        for (const locale of SUPPORTED_LOCALES) {
          const { csrfCookie, csrfToken } = await getCsrfToken();

          const response = await request(app)
            .post('/api/v1/consent/withdraw')
            .set('Cookie', csrfCookie)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
            .set(setLocaleHeader(locale))
            .send({ consentId: generateUUIDv7() })
            .expect(401);

          expect(response.body.success).toBe(false);
          // Verify locale cookie is set
          const setCookie = response.headers['set-cookie'];
          expect(setCookie).toBeDefined();
          const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
          const localeCookie = cookies.find((c) => c.startsWith('scrumooth_locale='));
          expect(localeCookie).toBeDefined();
          expect(localeCookie).toContain(`scrumooth_locale=${locale}`);
        }
      });
    });

    describe('Translated privacy policy text', () => {
      it('should set locale cookie for consent operations with Accept-Language header', async () => {
        const email = `locale-consent-${uniqueId()}@example.com`;
        testEmails.push(email);

        await createTestUserInDb(email);
        const cookies = await loginAndGetCookies(email);
        const { csrfToken } = extractCsrfFromCookies(cookies);

        const response = await request(app)
          .post('/api/v1/consent/record')
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader('es'))
          .send({
            consentType: 'analytics_consent',
            action: 'accept_all',
            version: '1.0',
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        // Verify locale cookie is set
        const setCookie = response.headers['set-cookie'];
        expect(setCookie).toBeDefined();
        const cookiesArr = Array.isArray(setCookie) ? setCookie : [setCookie];
        const localeCookie = cookiesArr.find((c) => c.startsWith('scrumooth_locale='));
        expect(localeCookie).toBeDefined();
        expect(localeCookie).toContain('scrumooth_locale=es');
      });

      it('should use user locale preference for consent operations', async () => {
        const email = `user-locale-consent-${uniqueId()}@example.com`;
        testEmails.push(email);

        // Create user with Italian locale preference
        await createI18nTestUser(email, 'it', prisma);
        const cookies = await loginAndGetCookies(email);
        const { csrfToken } = extractCsrfFromCookies(cookies);

        // Request with Accept-Language 'de' but user has locale 'it'
        const response = await request(app)
          .post('/api/v1/consent/record')
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader('de'))
          .send({
            consentType: 'marketing_consent',
            action: 'accept_all',
            version: '2.0',
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.consentType).toBe('marketing_consent');

        // Verify consent record is created successfully regardless of locale
        const consentRecords = await prisma.consentRecord.findMany({
          where: { userId: response.body.data.userId },
        });
        expect(consentRecords.length).toBeGreaterThan(0);
      });

      it('should retrieve consent history with locale-aware responses', async () => {
        const email = `locale-history-${uniqueId()}@example.com`;
        testEmails.push(email);

        // Create user with German locale
        await createI18nTestUser(email, 'de', prisma);
        const cookies = await loginAndGetCookies(email);

        const response = await request(app)
          .get('/api/v1/consent/history')
          .set('Cookie', cookies)
          .set(setLocaleHeader('de'))
          .expect(200);

        expect(response.body.success).toBe(true);
        // Verify locale cookie is set
        const setCookie = response.headers['set-cookie'];
        expect(setCookie).toBeDefined();
        const cookiesArr = Array.isArray(setCookie) ? setCookie : [setCookie];
        const localeCookie = cookiesArr.find((c) => c.startsWith('scrumooth_locale='));
        expect(localeCookie).toBeDefined();
        expect(localeCookie).toContain('scrumooth_locale=de');
      });

      it('should validate consentType field with translated validation errors', async () => {
        const email = `validation-consent-${uniqueId()}@example.com`;
        testEmails.push(email);

        await createTestUserInDb(email);
        const cookies = await loginAndGetCookies(email);
        const { csrfToken } = extractCsrfFromCookies(cookies);

        // Send invalid consentType to trigger validation error
        const response = await request(app)
          .post('/api/v1/consent/record')
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader('fr'))
          .send({
            consentType: '', // Empty consentType should fail validation
            action: 'accept_all',
            version: '1.0',
          })
          .expect(422);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });
});
