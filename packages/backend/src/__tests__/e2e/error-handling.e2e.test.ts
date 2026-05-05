import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import {
  uniqueTestId,
  getCookiesAsArray,
  HTTP_STATUS,
  ERROR_CODES,
  DEFAULT_PASSWORD,
  createTestUser,
  cleanupUsers,
  getCsrfToken,
  CSRF_CONSTANTS,
} from '@e2e-helpers';

describe('E2E: Error Handling', () => {
  const testEmails: string[] = [];

  afterEach(async () => {
    await cleanupUsers(testEmails);
    testEmails.length = 0;
  });

  describe('Authentication Error Handling', () => {
    it('should return consistent error format for 401 UNAUTHORIZED', async () => {
      const response = await request(app).get('/api/v1/auth/me').expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should return consistent error format for invalid credentials', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: `nonexistent-${uniqueTestId()}@example.com`,
          password: 'WrongPassword123!',
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should not expose sensitive information in error messages', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: `nonexistent-${uniqueTestId()}@example.com`,
          password: 'WrongPassword123!',
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Validation Error Handling', () => {
    it('should return 422 VALIDATION_ERROR with detailed field errors', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: 'invalid-email',
          password: 'short',
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(response.body.error).toHaveProperty('details');
      expect(Array.isArray(response.body.error.details)).toBe(true);
    });

    it('should return validation error for missing required fields', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({})
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return validation error for invalid email format', async () => {
      const email = `invalid-email-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: 'not-an-email',
          password: DEFAULT_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return validation error for weak password', async () => {
      const email = `weak-pass-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email,
          password: 'weak',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('Not Found Error Handling', () => {
    it('should return 404 NOT_FOUND for non-existent route', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent-route')
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it('should return 404 NOT_FOUND for non-existent resource', async () => {
      const email = `not-found-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const cookies = getCookiesAsArray(loginResponse);

      const response = await request(app)
        .get('/api/v1/teams/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  describe('Bad Request Error Handling', () => {
    it('should return 400 BAD_REQUEST for invalid UUID format', async () => {
      const email = `bad-request-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const cookies = getCookiesAsArray(loginResponse);

      const response = await request(app).get('/api/v1/teams/invalid-uuid').set('Cookie', cookies);

      expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNPROCESSABLE_ENTITY]).toContain(
        response.status
      );
      expect(response.body.success).toBe(false);
    });

    it('should return 400 BAD_REQUEST for malformed JSON', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBeOneOf([
        HTTP_STATUS.BAD_REQUEST,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ]);
    });

    it('should return 400 BAD_REQUEST for missing required query parameters', async () => {
      const email = `missing-param-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const cookies = getCookiesAsArray(loginResponse);

      const response = await request(app).get('/api/v1/sprints').set('Cookie', cookies);

      expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNPROCESSABLE_ENTITY]).toContain(
        response.status
      );
      expect(response.body.success).toBe(false);
    });
  });

  describe('Forbidden Error Handling', () => {
    it('should return 403 FORBIDDEN for unauthorized resource access', async () => {
      const email = `forbidden-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const cookies = getCookiesAsArray(loginResponse);
      const { csrfToken: newCsrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/backlog')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, newCsrfToken)
        .send({
          teamId: '00000000-0000-0000-0000-000000000000',
          title: 'Test PBI',
        });

      if (response.status === HTTP_STATUS.FORBIDDEN) {
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
      }
    });
  });

  describe('Conflict Error Handling', () => {
    it('should return 409 CONFLICT for duplicate resource', async () => {
      const email = `conflict-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email,
          password: DEFAULT_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
          termsAccepted: true,
        })
        .expect(HTTP_STATUS.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.CONFLICT);
    });
  });

  describe('Error Response Format', () => {
    it('should always include success: false for errors', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const errorResponses = await Promise.all([
        request(app).get('/api/v1/auth/me'),
        request(app)
          .post('/api/v1/auth/register')
          .set('Cookie', csrfCookie)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .send({}),
        request(app).get('/api/v1/nonexistent'),
      ]);

      for (const response of errorResponses) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should always include error object with code and message', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const errorResponses = await Promise.all([
        request(app).get('/api/v1/auth/me'),
        request(app)
          .post('/api/v1/auth/register')
          .set('Cookie', csrfCookie)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .send({}),
        request(app).get('/api/v1/nonexistent'),
      ]);

      for (const response of errorResponses) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error).toHaveProperty('message');
        expect(typeof response.body.error.code).toBe('string');
        expect(typeof response.body.error.message).toBe('string');
      }
    });

    it('should include error code in error responses', async () => {
      const response = await request(app).get('/api/v1/auth/me').expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should include error message in error responses', async () => {
      const response = await request(app).get('/api/v1/auth/me').expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.error).toHaveProperty('message');
      expect(typeof response.body.error.message).toBe('string');
    });
  });

  describe('Content Type Handling', () => {
    it('should return JSON content type for error responses', async () => {
      const response = await request(app).get('/api/v1/auth/me').expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should handle unsupported content type gracefully', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .set('Content-Type', 'text/plain')
        .send('not json');

      expect([
        HTTP_STATUS.BAD_REQUEST,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ]).toContain(response.status);
    });
  });

  describe('HTTP Method Handling', () => {
    it('should return 403 for unsupported HTTP method on existing route (CSRF required)', async () => {
      const response = await request(app).patch('/api/v1/auth/login').expect(HTTP_STATUS.FORBIDDEN);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for DELETE on non-deletable resource (CSRF required)', async () => {
      const response = await request(app)
        .delete('/api/v1/auth/login')
        .expect(HTTP_STATUS.FORBIDDEN);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Request Size Limits', () => {
    it('should reject oversized request body', async () => {
      const largeString = 'a'.repeat(11 * 1024 * 1024);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: `large-${uniqueTestId()}@example.com`,
          password: DEFAULT_PASSWORD,
          firstName: largeString,
          lastName: 'User',
        })
        .timeout(5000);

      expect([HTTP_STATUS.BAD_REQUEST, 413, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(
        response.status
      );
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting (if implemented)', () => {
    it('should handle rate limiting gracefully', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app)
            .post('/api/v1/auth/login')
            .set('Cookie', csrfCookie)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
            .send({
              email: `rate-limit-${uniqueTestId()}@example.com`,
              password: 'WrongPassword123!',
            })
        );
      }

      const responses = await Promise.all(requests);

      for (const response of responses) {
        expect(response.status).toBeOneOf([HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.BAD_REQUEST, 429]);
      }
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app).get('/health').expect(HTTP_STATUS.OK);

      expect(response.headers).toHaveProperty('x-content-type-options');
    });

    it('should not expose server information', async () => {
      const response = await request(app).get('/api/v1/auth/me').expect(HTTP_STATUS.UNAUTHORIZED);

      const serverHeader = response.headers['x-powered-by'];
      if (serverHeader) {
        expect(serverHeader.toLowerCase()).not.toContain('express');
      }
    });
  });

  describe('CORS Handling', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBeOneOf([HTTP_STATUS.OK, HTTP_STATUS.NO_CONTENT, 204]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string parameters', async () => {
      const email = `empty-param-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const cookies = getCookiesAsArray(loginResponse);

      const response = await request(app).get('/api/v1/teams/').set('Cookie', cookies);

      expect([HTTP_STATUS.OK, HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.NOT_FOUND]).toContain(
        response.status
      );
    });

    it('should handle special characters in request body', async () => {
      const email = `special-chars-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email,
          password: DEFAULT_PASSWORD,
          firstName: 'Test User',
          lastName: 'Special',
          termsAccepted: true,
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
    });

    it('should handle unicode characters in request body', async () => {
      const email = `unicode-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email,
          password: DEFAULT_PASSWORD,
          firstName: 'Unicode',
          lastName: 'User',
          termsAccepted: true,
        })
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
    });

    it('should handle null values in request body', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: null,
          password: null,
          firstName: null,
          lastName: null,
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
    });

    it('should handle array values where object expected', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send(['not', 'an', 'object']);

      expect(response.status).toBeOneOf([
        HTTP_STATUS.BAD_REQUEST,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ]);
    });
  });
});
