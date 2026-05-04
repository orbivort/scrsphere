// Backend Cookie Authentication Tests

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../utils/prisma';
import { COOKIE_NAMES } from '../../utils/cookieConfig';
import { CSRF_CONSTANTS } from '../../middleware/csrf.middleware';
import { getCsrfToken } from '../helpers/test-helpers';

function getCookiesAsArray(response: request.Response): string[] {
  const setCookie = response.headers['set-cookie'];
  if (Array.isArray(setCookie)) {
    return setCookie;
  }
  if (typeof setCookie === 'string') {
    return [setCookie];
  }
  return [];
}

// Helper to generate unique test identifier
const uniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

describe('Cookie-Based Authentication', () => {
  const getTestUser = () => ({
    email: `cookie-test-${uniqueId()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    termsAccepted: true,
  });

  describe('POST /api/v1/auth/register', () => {
    it('should set httpOnly cookies on successful registration', async () => {
      const testUser = getTestUser();
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send(testUser)
        .expect(201);

      expect(response.body.data).not.toHaveProperty('tokens');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('sessionInfo');

      const cookies = getCookiesAsArray(response);
      expect(cookies.length).toBeGreaterThan(0);
      expect(cookies.some((c) => c.includes(COOKIE_NAMES.ACCESS_TOKEN))).toBe(true);
      expect(cookies.some((c) => c.includes(COOKIE_NAMES.REFRESH_TOKEN))).toBe(true);

      const accessTokenCookie = cookies.find((c) => c.includes(COOKIE_NAMES.ACCESS_TOKEN));
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(accessTokenCookie).toContain('SameSite=Strict');

      // Cleanup
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should not return tokens in response body', async () => {
      const testUser = getTestUser();
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send(testUser)
        .expect(201);

      expect(response.body.data.accessToken).toBeUndefined();
      expect(response.body.data.refreshToken).toBeUndefined();

      // Cleanup
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const testUser = getTestUser();

    beforeEach(async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send(testUser);
    });

    afterEach(async () => {
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should set httpOnly cookies on successful login', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const cookies = getCookiesAsArray(response);
      expect(cookies.length).toBeGreaterThan(0);
      expect(cookies.some((c) => c.includes(COOKIE_NAMES.ACCESS_TOKEN))).toBe(true);
      expect(cookies.some((c) => c.includes(COOKIE_NAMES.REFRESH_TOKEN))).toBe(true);

      const accessTokenCookie = cookies.find((c) => c.includes(COOKIE_NAMES.ACCESS_TOKEN));
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(accessTokenCookie).toContain('SameSite=Strict');
    });

    it('should not return tokens in response body', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.data.accessToken).toBeUndefined();
      expect(response.body.data.refreshToken).toBeUndefined();
    });

    it('should fail with invalid credentials', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: testUser.email,
          password: 'WrongPassword',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let cookies: string[];
    const testUser = getTestUser();

    beforeEach(async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send(testUser);
      cookies = getCookiesAsArray(response);
    });

    afterEach(async () => {
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should clear cookies on logout', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const allCookies = [...cookies, csrfCookie];

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', allCookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(200);

      const clearCookies = getCookiesAsArray(response);
      expect(clearCookies.length).toBeGreaterThan(0);

      const accessTokenClear = clearCookies.find((c) => c.includes(COOKIE_NAMES.ACCESS_TOKEN));
      // Express 5 uses Expires header instead of Max-Age=0 for cleared cookies
      expect(accessTokenClear).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970)/);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let cookies: string[];
    const testUser = getTestUser();

    beforeEach(async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send(testUser);
      cookies = getCookiesAsArray(response);
    });

    afterEach(async () => {
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should refresh tokens via cookie', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const allCookies = [...cookies, csrfCookie];

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', allCookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(200);

      const newCookies = getCookiesAsArray(response);
      expect(newCookies.length).toBeGreaterThan(0);
      expect(newCookies.some((c) => c.includes(COOKIE_NAMES.ACCESS_TOKEN))).toBe(true);
    });

    it('should fail without refresh token cookie', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(400);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let cookies: string[];
    const testUser = getTestUser();

    beforeEach(async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send(testUser);
      cookies = getCookiesAsArray(response);
    });

    afterEach(async () => {
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should authenticate via cookie', async () => {
      const response = await request(app).get('/api/v1/auth/me').set('Cookie', cookies).expect(200);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
    });

    it('should fail without authentication cookie', async () => {
      await request(app).get('/api/v1/auth/me').expect(401);
    });
  });

  describe('Cookie Security Attributes', () => {
    it('should set HttpOnly flag', async () => {
      const testUser = getTestUser();
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send(testUser);

      const cookies = getCookiesAsArray(response);
      const accessTokenCookie = cookies.find((c) => c.includes(COOKIE_NAMES.ACCESS_TOKEN));

      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toMatch(/HttpOnly/i);

      // Cleanup
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should set SameSite=Strict', async () => {
      const testUser = getTestUser();
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send(testUser);

      const cookies = getCookiesAsArray(response);
      const accessTokenCookie = cookies.find((c) => c.includes(COOKIE_NAMES.ACCESS_TOKEN));

      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toMatch(/SameSite=Strict/i);

      // Cleanup
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should set Secure flag in production', async () => {
      const testUser = getTestUser();
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send(testUser);

      const cookies = getCookiesAsArray(response);
      const accessTokenCookie = cookies.find((c) => c.includes(COOKIE_NAMES.ACCESS_TOKEN));

      expect(accessTokenCookie).toBeDefined();
      if (process.env.NODE_ENV === 'production') {
        expect(accessTokenCookie).toMatch(/Secure/i);
      }

      // Cleanup
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should set appropriate expiration times', async () => {
      const testUser = getTestUser();
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send(testUser);

      const cookies = getCookiesAsArray(response);

      const accessTokenCookie = cookies.find((c) => c.includes(COOKIE_NAMES.ACCESS_TOKEN));
      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toMatch(/Max-Age=\d+/);

      const refreshTokenCookie = cookies.find((c) => c.includes(COOKIE_NAMES.REFRESH_TOKEN));
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toMatch(/Max-Age=\d+/);

      // Cleanup
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });
  });
});
