import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import {
  uniqueTestId,
  HTTP_STATUS,
  ERROR_CODES,
  DEFAULT_PASSWORD,
  createTestUser,
  createTestConsentRecordInDb,
  cleanupUsers,
  getCsrfToken,
  extractCsrfFromCookies,
  CSRF_CONSTANTS,
} from '@e2e-helpers';

describe('E2E: Consent Management (GDPR Article 7)', () => {
  const testEmails: string[] = [];

  afterEach(async () => {
    await cleanupUsers(testEmails);
    testEmails.length = 0;
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

  describe('POST /api/v1/consent/record', () => {
    it('should record consent for authenticated user', async () => {
      const email = `consent-auth-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/consent/record')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          consentType: 'cookie_consent',
          action: 'accept_all',
          preferences: {
            essential: true,
            analytics: true,
            marketing: false,
          },
          version: '1.0.0',
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.consentType).toBe('cookie_consent');
      expect(response.body.data.action).toBe('accept_all');
    });

    it('should record consent for anonymous user', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/consent/record')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          consentType: 'cookie_consent',
          action: 'reject_all',
          preferences: {
            essential: true,
            analytics: false,
            marketing: false,
          },
          version: '1.0.0',
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should record consent with custom action', async () => {
      const email = `consent-custom-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/consent/record')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          consentType: 'cookie_consent',
          action: 'custom',
          preferences: {
            essential: true,
            analytics: true,
            marketing: false,
          },
          version: '1.0.0',
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe('custom');
    });

    it('should record consent with withdrawn action', async () => {
      const email = `consent-withdrawn-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/consent/record')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          consentType: 'cookie_consent',
          action: 'withdrawn',
          version: '1.0.0',
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe('withdrawn');
    });

    it('should return 422 UNPROCESSABLE_ENTITY with missing consentType', async () => {
      const email = `missing-type-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/consent/record')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          action: 'accept_all',
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 422 UNPROCESSABLE_ENTITY with missing action', async () => {
      const email = `missing-action-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/consent/record')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          consentType: 'cookie_consent',
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 422 UNPROCESSABLE_ENTITY with invalid action', async () => {
      const email = `invalid-action-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/consent/record')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          consentType: 'cookie_consent',
          action: 'INVALID_ACTION',
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('GET /api/v1/consent/history', () => {
    it('should return consent history for authenticated user', async () => {
      const email = `history-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      await createTestConsentRecordInDb(user.id, 'cookie_consent', 'accept_all');
      await createTestConsentRecordInDb(user.id, 'cookie_consent', 'custom');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/consent/history')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('records');
      expect(Array.isArray(response.body.data.records)).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should return empty history for user with no consent records', async () => {
      const email = `no-history-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/consent/history')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toEqual([]);
    });

    it('should support pagination with limit and offset', async () => {
      const email = `pagination-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      for (let i = 0; i < 15; i++) {
        await createTestConsentRecordInDb(user.id, 'cookie_consent', 'accept_all');
      }

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/consent/history')
        .query({ limit: 5, offset: 0 })
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.records.length).toBeLessThanOrEqual(5);
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.pagination.offset).toBe(0);
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/consent/history')
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/consent/latest', () => {
    it('should return latest consent for authenticated user', async () => {
      const email = `latest-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      await createTestConsentRecordInDb(user.id, 'cookie_consent', 'accept_all', '1.0.0');
      await createTestConsentRecordInDb(user.id, 'cookie_consent', 'custom', '1.1.0');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/consent/latest')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('consent');
    });

    it('should return null when no consent record exists', async () => {
      const email = `no-latest-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/consent/latest')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.consent).toBeNull();
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/consent/latest')
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/consent/withdraw', () => {
    it('should withdraw consent for authenticated user', async () => {
      const email = `withdraw-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      await createTestConsentRecordInDb(user.id, 'cookie_consent', 'accept_all');

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/consent/withdraw')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe('withdrawn');
      expect(response.body.data.message).toContain('withdrawn');
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/consent/withdraw')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/consent/:consentId', () => {
    it('should return consent by ID for authenticated user', async () => {
      const email = `get-by-id-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      const consent = await createTestConsentRecordInDb(user.id, 'cookie_consent', 'accept_all');

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get(`/api/v1/consent/${consent.id}`)
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.consent.id).toBe(consent.id);
    });

    it('should return consent by ID for anonymous user', async () => {
      const consent = await createTestConsentRecordInDb(null, 'cookie_consent', 'accept_all');

      const response = await request(app)
        .get(`/api/v1/consent/${consent.id}`)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.consent.id).toBe(consent.id);
    });

    it('should return null for non-existent consent', async () => {
      const email = `nonexistent-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/consent/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.consent).toBeNull();
    });

    it('should return 422 UNPROCESSABLE_ENTITY with invalid consent ID', async () => {
      const email = `invalid-id-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/consent/invalid-id')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle multiple consent records for same user', async () => {
      const email = `multiple-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      await request(app)
        .post('/api/v1/consent/record')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          consentType: 'cookie_consent',
          action: 'accept_all',
          version: '1.0.0',
        });

      await request(app)
        .post('/api/v1/consent/record')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          consentType: 'cookie_consent',
          action: 'custom',
          version: '1.1.0',
        });

      const response = await request(app)
        .get('/api/v1/consent/history')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.data.records.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle consent with different consent types', async () => {
      const email = `types-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const consentTypes = ['cookie_consent', 'marketing_consent', 'analytics_consent'];

      for (const consentType of consentTypes) {
        const response = await request(app)
          .post('/api/v1/consent/record')
          .set('Cookie', cookies)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .send({
            consentType,
            action: 'accept_all',
            version: '1.0.0',
          })
          .expect(HTTP_STATUS.CREATED);

        expect(response.body.data.consentType).toBe(consentType);
      }
    });

    it('should handle consent with complex preferences', async () => {
      const email = `complex-prefs-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);
      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const complexPreferences = {
        essential: true,
        analytics: true,
        marketing: false,
      };

      const response = await request(app)
        .post('/api/v1/consent/record')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          consentType: 'cookie_consent',
          action: 'custom',
          preferences: complexPreferences,
          version: '2.0.0',
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
    });

    it('should handle consent version updates', async () => {
      const email = `version-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      await createTestConsentRecordInDb(user.id, 'cookie_consent', 'accept_all', '1.0.0');

      const cookies = await loginAndGetCookies(email);
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/consent/record')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          consentType: 'cookie_consent',
          action: 'custom',
          version: '2.0.0',
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
    });

    it('should handle pagination with maximum limit', async () => {
      const email = `max-limit-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUser(email);
      for (let i = 0; i < 60; i++) {
        await createTestConsentRecordInDb(user.id, 'cookie_consent', 'accept_all');
      }

      const cookies = await loginAndGetCookies(email);

      const response = await request(app)
        .get('/api/v1/consent/history')
        .query({ limit: 100 })
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.limit).toBeLessThanOrEqual(50);
    });
  });

  describe('Authorization and Permissions', () => {
    it('should allow anonymous users to record consent', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/consent/record')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          consentType: 'cookie_consent',
          action: 'accept_all',
          version: '1.0.0',
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
    });

    it('should allow anonymous users to view consent by ID', async () => {
      const consent = await createTestConsentRecordInDb(null, 'cookie_consent', 'accept_all');

      const response = await request(app)
        .get(`/api/v1/consent/${consent.id}`)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });

    it('should require authentication for consent history', async () => {
      const response = await request(app)
        .get('/api/v1/consent/history')
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication for latest consent', async () => {
      const response = await request(app)
        .get('/api/v1/consent/latest')
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication for consent withdrawal', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/consent/withdraw')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });
});
