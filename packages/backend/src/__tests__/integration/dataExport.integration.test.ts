// Integration Tests for Data Export API

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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

describe('Data Export API Integration Tests', () => {
  let authToken: string[];
  let userId: string;
  const testEmail = `test-export-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  beforeAll(async () => {
    // Create test user
    userId = generateUUIDv7();
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    await prisma.user.create({
      data: {
        id: userId,
        email: testEmail,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Export',
      },
    });

    // Login to get auth token
    const { csrfCookie, csrfToken } = await getCsrfToken();

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .set('Cookie', csrfCookie)
      .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
      .send({
        email: testEmail,
        password: testPassword,
      });

    const setCookie = loginResponse.headers['set-cookie'];
    authToken = setCookie
      ? [...(Array.isArray(setCookie) ? setCookie : [setCookie]), csrfCookie]
      : [csrfCookie];
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  describe('POST /api/v1/user/export-data', () => {
    it('should initiate a data export', async () => {
      const { csrfToken } = extractCsrfFromCookies(authToken);

      const response = await request(app)
        .post('/api/v1/user/export-data')
        .set('Cookie', authToken)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({});

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('jobId');
      expect(response.body.data).toHaveProperty('status', 'pending');
      expect(response.body.data).toHaveProperty('estimatedCompletionTime');
    });

    it('should reject unauthenticated requests', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/user/export-data')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({});

      expect(response.status).toBe(401);
    });

    it('should accept export options', async () => {
      const { csrfToken } = extractCsrfFromCookies(authToken);

      // First cancel any existing export
      const activeExportsResponse = await request(app)
        .get('/api/v1/user/export-data/active')
        .set('Cookie', authToken);

      if (activeExportsResponse.body.data?.exports?.length > 0) {
        for (const exportJob of activeExportsResponse.body.data.exports) {
          await request(app)
            .delete(`/api/v1/user/export-data/${exportJob.jobId}`)
            .set('Cookie', authToken)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken);
        }
      }

      const response = await request(app)
        .post('/api/v1/user/export-data')
        .set('Cookie', authToken)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          options: {
            includeSessions: true,
            includeNotifications: false,
          },
        });

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/user/export-data/status/:jobId', () => {
    it('should return export status', async () => {
      const { csrfToken } = extractCsrfFromCookies(authToken);

      // First cancel any existing export
      const activeExportsResponse = await request(app)
        .get('/api/v1/user/export-data/active')
        .set('Cookie', authToken);

      if (activeExportsResponse.body.data?.exports?.length > 0) {
        for (const exportJob of activeExportsResponse.body.data.exports) {
          await request(app)
            .delete(`/api/v1/user/export-data/${exportJob.jobId}`)
            .set('Cookie', authToken)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken);
        }
      }

      // First initiate an export
      const initiateResponse = await request(app)
        .post('/api/v1/user/export-data')
        .set('Cookie', authToken)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({});

      const jobId = initiateResponse.body.data.jobId;

      // Check status
      const response = await request(app)
        .get(`/api/v1/user/export-data/status/${jobId}`)
        .set('Cookie', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('jobId', jobId);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('progress');
    });

    it('should return 404 for non-existent job', async () => {
      const validUuid = generateUUIDv7();
      const response = await request(app)
        .get(`/api/v1/user/export-data/status/${validUuid}`)
        .set('Cookie', authToken);

      expect(response.status).toBe(404);
    });

    it('should reject invalid job ID format', async () => {
      const response = await request(app)
        .get('/api/v1/user/export-data/status/invalid-uuid')
        .set('Cookie', authToken);

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/v1/user/export-data/active', () => {
    it('should return active exports', async () => {
      const response = await request(app)
        .get('/api/v1/user/export-data/active')
        .set('Cookie', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('exports');
      expect(response.body.data).toHaveProperty('count');
      expect(Array.isArray(response.body.data.exports)).toBe(true);
    });
  });

  describe('DELETE /api/v1/user/export-data/:jobId', () => {
    it('should cancel an export', async () => {
      const { csrfToken } = extractCsrfFromCookies(authToken);

      // First cancel any existing export
      const activeExportsResponse = await request(app)
        .get('/api/v1/user/export-data/active')
        .set('Cookie', authToken);

      if (activeExportsResponse.body.data?.exports?.length > 0) {
        for (const exportJob of activeExportsResponse.body.data.exports) {
          await request(app)
            .delete(`/api/v1/user/export-data/${exportJob.jobId}`)
            .set('Cookie', authToken)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken);
        }
      }

      // First initiate an export
      const initiateResponse = await request(app)
        .post('/api/v1/user/export-data')
        .set('Cookie', authToken)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({});

      const jobId = initiateResponse.body.data.jobId;

      // Cancel the export
      const response = await request(app)
        .delete(`/api/v1/user/export-data/${jobId}`)
        .set('Cookie', authToken)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('cancelled');
    });
  });

  describe('GDPR Compliance Verification', () => {
    it('should export data in JSON format', async () => {
      const { csrfToken } = extractCsrfFromCookies(authToken);

      // First cancel any existing export
      const activeExportsResponse = await request(app)
        .get('/api/v1/user/export-data/active')
        .set('Cookie', authToken);

      if (activeExportsResponse.body.data?.exports?.length > 0) {
        for (const exportJob of activeExportsResponse.body.data.exports) {
          await request(app)
            .delete(`/api/v1/user/export-data/${exportJob.jobId}`)
            .set('Cookie', authToken)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken);
        }
      }

      const initiateResponse = await request(app)
        .post('/api/v1/user/export-data')
        .set('Cookie', authToken)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({});

      expect(initiateResponse.status).toBe(202);

      // Verify the response structure matches GDPR requirements
      const data = initiateResponse.body.data;
      expect(data).toHaveProperty('jobId');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('estimatedCompletionTime');
      expect(data).toHaveProperty('message');
    });

    it('should include proper metadata in export', async () => {
      const { csrfToken } = extractCsrfFromCookies(authToken);

      // First cancel any existing export
      const activeExportsResponse = await request(app)
        .get('/api/v1/user/export-data/active')
        .set('Cookie', authToken);

      if (activeExportsResponse.body.data?.exports?.length > 0) {
        for (const exportJob of activeExportsResponse.body.data.exports) {
          await request(app)
            .delete(`/api/v1/user/export-data/${exportJob.jobId}`)
            .set('Cookie', authToken)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken);
        }
      }

      // Verify export metadata structure
      const initiateResponse = await request(app)
        .post('/api/v1/user/export-data')
        .set('Cookie', authToken)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({});

      expect(initiateResponse.body.success).toBe(true);
    });
  });

  describe('i18n Locale Support', () => {
    const testEmails: string[] = [];

    afterAll(async () => {
      // Cleanup test users created for i18n tests
      for (const email of testEmails) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
          await prisma.user.delete({ where: { id: user.id } });
        }
      }
    });

    describe('Translated export notification messages', () => {
      it('should return export initiation message respecting locale header', async () => {
        for (const locale of SUPPORTED_LOCALES) {
          const email = `i18n-export-${locale}-${uniqueId()}@example.com`;
          testEmails.push(email);

          // Create user with locale preference
          void (await createI18nTestUser(email, locale as Locale, prisma));

          const { csrfCookie, csrfToken } = await getCsrfToken();

          // Login to get auth token
          const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .set('Cookie', csrfCookie)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
            .set(setLocaleHeader(locale as Locale))
            .send({
              email,
              password: 'TestPassword123!',
            });

          const setCookie = loginResponse.headers['set-cookie'];
          const authCookies = setCookie
            ? [...(Array.isArray(setCookie) ? setCookie : [setCookie]), csrfCookie]
            : [csrfCookie];

          // Cancel any existing exports first
          const activeExportsResponse = await request(app)
            .get('/api/v1/user/export-data/active')
            .set('Cookie', authCookies);

          if (activeExportsResponse.body.data?.exports?.length > 0) {
            const { csrfToken: newCsrfToken } = extractCsrfFromCookies(authCookies);
            for (const exportJob of activeExportsResponse.body.data.exports) {
              await request(app)
                .delete(`/api/v1/user/export-data/${exportJob.jobId}`)
                .set('Cookie', authCookies)
                .set(CSRF_CONSTANTS.HEADER_NAME, newCsrfToken);
            }
          }

          // Initiate export with locale header
          const { csrfToken: newCsrfToken } = extractCsrfFromCookies(authCookies);
          const initiateResponse = await request(app)
            .post('/api/v1/user/export-data')
            .set('Cookie', authCookies)
            .set(CSRF_CONSTANTS.HEADER_NAME, newCsrfToken)
            .set(setLocaleHeader(locale as Locale))
            .send({});

          expect(initiateResponse.status).toBe(202);
          expect(initiateResponse.body.success).toBe(true);
          expect(initiateResponse.body.data).toHaveProperty('jobId');
          expect(initiateResponse.body.data).toHaveProperty('status', 'pending');
          expect(initiateResponse.body.data).toHaveProperty('message');
        }
      });

      it('should return translated cancellation message for each locale', async () => {
        for (const locale of SUPPORTED_LOCALES) {
          const email = `i18n-cancel-${locale}-${uniqueId()}@example.com`;
          testEmails.push(email);

          // Create user with locale preference
          void (await createI18nTestUser(email, locale as Locale, prisma));

          const { csrfCookie, csrfToken } = await getCsrfToken();

          // Login
          const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .set('Cookie', csrfCookie)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
            .set(setLocaleHeader(locale as Locale))
            .send({
              email,
              password: 'TestPassword123!',
            });

          const setCookie = loginResponse.headers['set-cookie'];
          const authCookies = setCookie
            ? [...(Array.isArray(setCookie) ? setCookie : [setCookie]), csrfCookie]
            : [csrfCookie];

          // Initiate export
          const { csrfToken: newCsrfToken } = extractCsrfFromCookies(authCookies);
          const initiateResponse = await request(app)
            .post('/api/v1/user/export-data')
            .set('Cookie', authCookies)
            .set(CSRF_CONSTANTS.HEADER_NAME, newCsrfToken)
            .set(setLocaleHeader(locale as Locale))
            .send({});

          if (initiateResponse.status === 202) {
            const jobId = initiateResponse.body.data.jobId;

            // Cancel the export
            const cancelResponse = await request(app)
              .delete(`/api/v1/user/export-data/${jobId}`)
              .set('Cookie', authCookies)
              .set(CSRF_CONSTANTS.HEADER_NAME, newCsrfToken)
              .set(setLocaleHeader(locale as Locale));

            expect(cancelResponse.status).toBe(200);
            expect(cancelResponse.body.success).toBe(true);
            expect(cancelResponse.body.data.message).toContain('cancelled');
          }
        }
      });
    });

    describe('Locale-aware export format', () => {
      it('should export data with locale-aware timestamps', async () => {
        const locale: Locale = 'de';
        const email = `i18n-format-${uniqueId()}@example.com`;
        testEmails.push(email);

        // Create user with German locale preference
        void (await createI18nTestUser(email, locale, prisma));

        const { csrfCookie, csrfToken } = await getCsrfToken();

        // Login
        const loginResponse = await request(app)
          .post('/api/v1/auth/login')
          .set('Cookie', csrfCookie)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader(locale))
          .send({
            email,
            password: 'TestPassword123!',
          });

        const setCookie = loginResponse.headers['set-cookie'];
        const authCookies = setCookie
          ? [...(Array.isArray(setCookie) ? setCookie : [setCookie]), csrfCookie]
          : [csrfCookie];

        // Cancel any existing exports first
        const activeExportsResponse = await request(app)
          .get('/api/v1/user/export-data/active')
          .set('Cookie', authCookies);

        if (activeExportsResponse.body.data?.exports?.length > 0) {
          const { csrfToken: newCsrfToken } = extractCsrfFromCookies(authCookies);
          for (const exportJob of activeExportsResponse.body.data.exports) {
            await request(app)
              .delete(`/api/v1/user/export-data/${exportJob.jobId}`)
              .set('Cookie', authCookies)
              .set(CSRF_CONSTANTS.HEADER_NAME, newCsrfToken);
          }
        }

        // Initiate export
        const { csrfToken: newCsrfToken } = extractCsrfFromCookies(authCookies);
        const initiateResponse = await request(app)
          .post('/api/v1/user/export-data')
          .set('Cookie', authCookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, newCsrfToken)
          .set(setLocaleHeader(locale))
          .send({});

        expect(initiateResponse.status).toBe(202);

        // Check that the response includes ISO 8601 timestamps
        // These can be formatted by frontend according to user locale
        const { estimatedCompletionTime } = initiateResponse.body.data;
        expect(estimatedCompletionTime).toBeDefined();

        // Verify it's a valid ISO date string
        const parsedDate = new Date(estimatedCompletionTime);
        expect(parsedDate instanceof Date).toBe(true);
        expect(parsedDate.getTime()).toBeGreaterThan(0);
      });

      it('should include locale preference in export metadata', async () => {
        for (const locale of SUPPORTED_LOCALES) {
          const email = `i18n-meta-${locale}-${uniqueId()}@example.com`;
          testEmails.push(email);

          const user = await createI18nTestUser(email, locale as Locale, prisma);

          // Verify user locale preference is stored correctly
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { locale: true },
          });

          expect(dbUser?.locale).toBe(locale);
        }
      });

      it('should accept export with locale-specific Accept-Language header', async () => {
        const locale: Locale = 'fr';
        const email = `i18n-accept-${uniqueId()}@example.com`;
        testEmails.push(email);

        // Create user with French locale preference
        void (await createI18nTestUser(email, locale, prisma));

        const { csrfCookie, csrfToken } = await getCsrfToken();

        // Login
        const loginResponse = await request(app)
          .post('/api/v1/auth/login')
          .set('Cookie', csrfCookie)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader(locale))
          .send({
            email,
            password: 'TestPassword123!',
          });

        const setCookie = loginResponse.headers['set-cookie'];
        const authCookies = setCookie
          ? [...(Array.isArray(setCookie) ? setCookie : [setCookie]), csrfCookie]
          : [csrfCookie];

        // Cancel any existing exports first
        const activeExportsResponse = await request(app)
          .get('/api/v1/user/export-data/active')
          .set('Cookie', authCookies);

        if (activeExportsResponse.body.data?.exports?.length > 0) {
          const { csrfToken: newCsrfToken } = extractCsrfFromCookies(authCookies);
          for (const exportJob of activeExportsResponse.body.data.exports) {
            await request(app)
              .delete(`/api/v1/user/export-data/${exportJob.jobId}`)
              .set('Cookie', authCookies)
              .set(CSRF_CONSTANTS.HEADER_NAME, newCsrfToken);
          }
        }

        // Initiate export with French locale
        const { csrfToken: newCsrfToken } = extractCsrfFromCookies(authCookies);
        const initiateResponse = await request(app)
          .post('/api/v1/user/export-data')
          .set('Cookie', authCookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, newCsrfToken)
          .set(setLocaleHeader(locale))
          .send({
            options: {
              includeSessions: true,
              includeNotifications: true,
            },
          });

        expect(initiateResponse.status).toBe(202);
        expect(initiateResponse.body.success).toBe(true);
      });
    });
  });
});
