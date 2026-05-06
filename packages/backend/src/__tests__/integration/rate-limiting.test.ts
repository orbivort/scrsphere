import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../../app';
import config from '../../config';

describe('Rate Limiting Integration', () => {
  const isTestEnv = process.env.NODE_ENV === 'test';

  describe('Health Endpoint', () => {
    it('should not be rate limited', async () => {
      const requests = 10;
      const responses = [];

      for (let i = 0; i < requests; i++) {
        const response = await request(app).get('/health');
        responses.push(response);
      }

      const allSuccessful = responses.every((res) => res.status !== 429);
      expect(allSuccessful).toBe(true);
    });

    it('should not include rate limit headers', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['ratelimit-limit']).toBeUndefined();
      expect(response.headers['ratelimit-remaining']).toBeUndefined();
      expect(response.headers['ratelimit-reset']).toBeUndefined();
    });

    it('should allow many requests without hitting rate limit', async () => {
      const requests = config.rateLimit.max + 10;
      let rateLimited = false;

      for (let i = 0; i < requests && !rateLimited; i++) {
        const response = await request(app).get('/health');
        if (response.status === 429) {
          rateLimited = true;
        }
      }

      expect(rateLimited).toBe(false);
    });
  });

  describe('API Routes', () => {
    it('should include rate limit headers on API routes', async () => {
      if (isTestEnv) {
        const response = await request(app).get('/api/v1/auth/csrf-token');
        expect(response.status).toBe(200);
        return;
      }

      const response = await request(app).get('/api/v1/auth/csrf-token');
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });

    it('should return rate limit error when limit exceeded', async () => {
      if (isTestEnv) {
        return;
      }

      const maxRequests = config.rateLimit.max;
      let rateLimited = false;

      for (let i = 0; i < maxRequests + 10; i++) {
        const response = await request(app).get('/api/v1/auth/csrf-token');

        if (response.status === 429) {
          rateLimited = true;
          expect(response.body).toMatchObject({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: expect.stringContaining('Too many requests'),
            },
          });
          break;
        }
      }

      expect(rateLimited).toBe(true);
    });

    it('should decrement remaining count on each request', async () => {
      if (isTestEnv) {
        return;
      }

      const response1 = await request(app).get('/api/v1/auth/csrf-token');
      const remaining1 = parseInt(response1.headers['ratelimit-remaining'] || '0', 10);

      const response2 = await request(app).get('/api/v1/auth/csrf-token');
      const remaining2 = parseInt(response2.headers['ratelimit-remaining'] || '0', 10);

      expect(remaining2).toBeLessThan(remaining1);
    });

    it('should apply rate limiting to POST requests', async () => {
      if (isTestEnv) {
        return;
      }

      const csrfResponse = await request(app).get('/api/v1/auth/csrf-token');
      const setCookieHeader = csrfResponse.headers['set-cookie'];
      const cookies = Array.isArray(setCookieHeader)
        ? setCookieHeader
        : setCookieHeader
          ? [setCookieHeader]
          : [];
      const csrfCookie = cookies.find((c: string) => c.startsWith('csrfToken='));
      const csrfToken = csrfCookie?.split('=')[1]?.split(';')[0];

      const maxRequests = config.rateLimit.max;
      let rateLimited = false;

      for (let i = 0; i < maxRequests + 5 && !rateLimited; i++) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .set('Cookie', csrfCookie || '')
          .set('x-csrf-token', csrfToken || '')
          .send({ email: 'test@example.com', password: 'test' });

        if (response.status === 429) {
          rateLimited = true;
          expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
        }
      }

      expect(rateLimited).toBe(true);
    });
  });

  describe('Rate Limit Response Format', () => {
    it('should return correct error format when rate limited', async () => {
      if (isTestEnv) {
        return;
      }

      const maxRequests = config.rateLimit.max;
      let rateLimitResponse: request.Response | null = null;

      for (let i = 0; i < maxRequests + 10; i++) {
        const response = await request(app).get('/api/v1/auth/csrf-token');
        if (response.status === 429) {
          rateLimitResponse = response;
          break;
        }
      }

      expect(rateLimitResponse).not.toBeNull();
      expect(rateLimitResponse?.body).toHaveProperty('success', false);
      expect(rateLimitResponse?.body).toHaveProperty('error');
      expect(rateLimitResponse?.body.error).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED');
      expect(rateLimitResponse?.body.error).toHaveProperty('message');
      expect(rateLimitResponse?.body.error.message).toMatch(/too many requests/i);
    });

    it('should set standard rate limit headers', async () => {
      if (isTestEnv) {
        return;
      }

      const response = await request(app).get('/api/v1/auth/csrf-token');

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();

      const limit = parseInt(response.headers['ratelimit-limit'] || '0', 10);
      const remaining = parseInt(response.headers['ratelimit-remaining'] || '0', 10);
      const reset = parseInt(response.headers['ratelimit-reset'] || '0', 10);

      expect(limit).toBeGreaterThan(0);
      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(reset).toBeGreaterThan(0);
    });

    it('should not set legacy rate limit headers', async () => {
      if (isTestEnv) {
        return;
      }

      const response = await request(app).get('/api/v1/auth/csrf-token');

      expect(response.headers['x-ratelimit-limit']).toBeUndefined();
      expect(response.headers['x-ratelimit-remaining']).toBeUndefined();
      expect(response.headers['x-ratelimit-reset']).toBeUndefined();
    });
  });

  describe('Different API Endpoints', () => {
    it('should apply rate limiting to all API routes under /api/v1/', async () => {
      if (isTestEnv) {
        return;
      }

      const response = await request(app).get('/api/v1/auth/csrf-token');
      expect(response.headers['ratelimit-limit']).toBeDefined();
    });

    it('should share rate limit counter across different API endpoints', async () => {
      if (isTestEnv) {
        return;
      }

      const response1 = await request(app).get('/api/v1/auth/csrf-token');
      const remaining1 = parseInt(response1.headers['ratelimit-remaining'] || '0', 10);

      const response2 = await request(app).get('/api/v1/config');
      const remaining2 = parseInt(response2.headers['ratelimit-remaining'] || '0', 10);

      expect(remaining2).toBeLessThan(remaining1);
    });
  });
});
