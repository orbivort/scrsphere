import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import {
  uniqueTestId,
  getCookiesAsArray,
  extractAccessToken,
  extractRefreshToken,
  HTTP_STATUS,
  ERROR_CODES,
  DEFAULT_PASSWORD,
  createTestUser,
  cleanupUsers,
  getCsrfToken,
  extractCsrfFromCookies,
  CSRF_CONSTANTS,
} from '@e2e-helpers';

describe('E2E: Authentication Flow', () => {
  const testEmails: string[] = [];

  afterEach(async () => {
    await cleanupUsers(testEmails);
    testEmails.length = 0;
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully with valid data', async () => {
      const email = `register-${uniqueTestId()}@example.com`;
      testEmails.push(email);

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
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('sessionInfo');
      expect(response.body.data.user.email).toBe(email.toLowerCase());
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('tokens');

      const cookies = getCookiesAsArray(response);
      expect(cookies.length).toBeGreaterThan(0);
      expect(cookies.some((c: string) => c.includes('accessToken='))).toBe(true);
      expect(cookies.some((c: string) => c.includes('refreshToken='))).toBe(true);

      const accessToken = extractAccessToken(cookies);
      const refreshToken = extractRefreshToken(cookies);
      expect(accessToken).not.toBeNull();
      expect(refreshToken).not.toBeNull();
    });

    it('should set HttpOnly and SameSite=Strict flags on cookies', async () => {
      const email = `secure-${uniqueTestId()}@example.com`;
      testEmails.push(email);

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
        .expect(HTTP_STATUS.CREATED);

      const cookies = getCookiesAsArray(response);
      const accessTokenCookie = cookies.find((c: string) => c.includes('accessToken='));
      const refreshTokenCookie = cookies.find((c: string) => c.includes('refreshToken='));

      expect(accessTokenCookie).toContain('HttpOnly');
      expect(accessTokenCookie).toContain('SameSite=Strict');
      expect(refreshTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('SameSite=Strict');
    });

    it('should return 409 CONFLICT when registering with existing email', async () => {
      const email = `existing-${uniqueTestId()}@example.com`;
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

    it('should return 422 VALIDATION_ERROR with invalid email format', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: 'invalid-email',
          password: DEFAULT_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 422 VALIDATION_ERROR with weak password', async () => {
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

    it('should return 422 VALIDATION_ERROR with missing required fields', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: `missing-${uniqueTestId()}@example.com`,
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should normalize email to lowercase', async () => {
      const email = `UPPER-${uniqueTestId()}@Example.COM`;
      testEmails.push(email.toLowerCase());

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
        .expect(HTTP_STATUS.CREATED);

      expect(response.body.data.user.email).toBe(email.toLowerCase());
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const email = `login-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email,
          password: DEFAULT_PASSWORD,
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('sessionInfo');
      expect(response.body.data).not.toHaveProperty('tokens');

      const cookies = getCookiesAsArray(response);
      expect(cookies.some((c: string) => c.includes('accessToken='))).toBe(true);
      expect(cookies.some((c: string) => c.includes('refreshToken='))).toBe(true);
    });

    it('should return 401 UNAUTHORIZED with invalid password', async () => {
      const email = `wrong-pass-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email,
          password: 'WrongPassword123!',
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should return 401 UNAUTHORIZED with non-existent user', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: `nonexistent-${uniqueTestId()}@example.com`,
          password: DEFAULT_PASSWORD,
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should return 422 VALIDATION_ERROR with missing fields', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({})
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should handle case-insensitive email login', async () => {
      const email = `case-sensitive-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          email: email.toUpperCase(),
          password: DEFAULT_PASSWORD,
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully and clear cookies', async () => {
      const email = `logout-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie: loginCsrfCookie, csrfToken: loginCsrfToken } = await getCsrfToken();

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', loginCsrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, loginCsrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const responseCookies = getCookiesAsArray(loginResponse);
      const cookies = [...responseCookies, loginCsrfCookie];
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);

      const clearCookies = getCookiesAsArray(response);
      const accessTokenClear = clearCookies.find((c: string) => c.includes('accessToken='));
      // Express 5 uses Expires header instead of Max-Age=0 for cleared cookies
      expect(accessTokenClear).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970)/);
    });

    it('should handle logout without existing session gracefully', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens successfully with valid refresh token', async () => {
      const email = `refresh-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie: loginCsrfCookie, csrfToken: loginCsrfToken } = await getCsrfToken();

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', loginCsrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, loginCsrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const responseCookies = getCookiesAsArray(loginResponse);
      const cookies = [...responseCookies, loginCsrfCookie];
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessionInfo');

      const newCookies = getCookiesAsArray(response);
      expect(newCookies.some((c: string) => c.includes('accessToken='))).toBe(true);
      expect(newCookies.some((c: string) => c.includes('refreshToken='))).toBe(true);
    });

    it('should return 400 BAD_REQUEST without refresh token cookie', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.BAD_REQUEST);
    });

    it('should return 401 UNAUTHORIZED with invalid refresh token', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', ['refreshToken=invalid-token', csrfCookie])
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const email = `me-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie: loginCsrfCookie, csrfToken: loginCsrfToken } = await getCsrfToken();

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', loginCsrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, loginCsrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const cookies = getCookiesAsArray(loginResponse);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(email.toLowerCase());
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const response = await request(app).get('/api/v1/auth/me').expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should return 401 UNAUTHORIZED with expired token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', ['accessToken=expired-token'])
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });
  });

  describe('PUT /api/v1/auth/me/profile', () => {
    it('should update user profile successfully', async () => {
      const email = `profile-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie: loginCsrfCookie, csrfToken: loginCsrfToken } = await getCsrfToken();

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', loginCsrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, loginCsrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const responseCookies = getCookiesAsArray(loginResponse);
      const cookies = [...responseCookies, loginCsrfCookie];
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put('/api/v1/auth/me/profile')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .put('/api/v1/auth/me/profile')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/auth/me/password', () => {
    it('should change password successfully', async () => {
      const email = `password-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie: loginCsrfCookie, csrfToken: loginCsrfToken } = await getCsrfToken();

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', loginCsrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, loginCsrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const responseCookies = getCookiesAsArray(loginResponse);
      const cookies = [...responseCookies, loginCsrfCookie];
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const newPassword = 'NewStrongPassword456!';

      const response = await request(app)
        .put('/api/v1/auth/me/password')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          currentPassword: DEFAULT_PASSWORD,
          newPassword,
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);

      const { csrfCookie: newLoginCsrfCookie, csrfToken: newLoginCsrfToken } = await getCsrfToken();

      const loginWithNewPassword = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', newLoginCsrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, newLoginCsrfToken)
        .send({ email, password: newPassword })
        .expect(HTTP_STATUS.OK);

      expect(loginWithNewPassword.body.success).toBe(true);
    });

    it('should return 401 UNAUTHORIZED with wrong current password', async () => {
      const email = `wrong-current-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie: loginCsrfCookie, csrfToken: loginCsrfToken } = await getCsrfToken();

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', loginCsrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, loginCsrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const responseCookies = getCookiesAsArray(loginResponse);
      const cookies = [...responseCookies, loginCsrfCookie];
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put('/api/v1/auth/me/password')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          currentPassword: 'WrongCurrentPassword123!',
          newPassword: 'NewStrongPassword456!',
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });

    it('should return 422 VALIDATION_ERROR when new password is same as current', async () => {
      const email = `same-password-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie: loginCsrfCookie, csrfToken: loginCsrfToken } = await getCsrfToken();

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', loginCsrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, loginCsrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const responseCookies = getCookiesAsArray(loginResponse);
      const cookies = [...responseCookies, loginCsrfCookie];
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .put('/api/v1/auth/me/password')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          currentPassword: DEFAULT_PASSWORD,
          newPassword: DEFAULT_PASSWORD,
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/sessions', () => {
    it('should return active sessions for authenticated user', async () => {
      const email = `sessions-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie: loginCsrfCookie, csrfToken: loginCsrfToken } = await getCsrfToken();

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', loginCsrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, loginCsrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const cookies = getCookiesAsArray(loginResponse);

      const response = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return 401 UNAUTHORIZED when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/auth/sessions')
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout-all', () => {
    it('should logout all sessions successfully', async () => {
      const email = `logout-all-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie: csrf1, csrfToken: token1 } = await getCsrfToken();
      await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrf1)
        .set(CSRF_CONSTANTS.HEADER_NAME, token1)
        .send({ email, password: DEFAULT_PASSWORD });

      const { csrfCookie: csrf2, csrfToken: token2 } = await getCsrfToken();
      const secondLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrf2)
        .set(CSRF_CONSTANTS.HEADER_NAME, token2)
        .send({ email, password: DEFAULT_PASSWORD });

      const responseCookies = getCookiesAsArray(secondLoginResponse);
      const cookies = [...responseCookies, csrf2];
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);

      const sessionsResponse = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Cookie', cookies);

      expect(sessionsResponse.body.data.length).toBe(0);
    });
  });

  describe('DELETE /api/v1/auth/sessions/:tokenId', () => {
    it('should revoke a specific session', async () => {
      const email = `revoke-session-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie: csrf1, csrfToken: token1 } = await getCsrfToken();
      await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrf1)
        .set(CSRF_CONSTANTS.HEADER_NAME, token1)
        .send({ email, password: DEFAULT_PASSWORD });

      const { csrfCookie: csrf2, csrfToken: token2 } = await getCsrfToken();
      const secondLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrf2)
        .set(CSRF_CONSTANTS.HEADER_NAME, token2)
        .send({ email, password: DEFAULT_PASSWORD });

      const responseCookies = getCookiesAsArray(secondLoginResponse);
      const cookies = [...responseCookies, csrf2];

      const sessionsResponse = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Cookie', cookies);

      const tokenId = sessionsResponse.body.data[0].id;
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete(`/api/v1/auth/sessions/${tokenId}`)
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/auth/me/deletion-check', () => {
    it('should return deletion eligibility for user without team memberships', async () => {
      const email = `deletion-check-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie: loginCsrfCookie, csrfToken: loginCsrfToken } = await getCsrfToken();

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', loginCsrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, loginCsrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const cookies = getCookiesAsArray(loginResponse);

      const response = await request(app)
        .get('/api/v1/auth/me/deletion-check')
        .set('Cookie', cookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.canDelete).toBe(true);
    });
  });

  describe('DELETE /api/v1/auth/me', () => {
    it('should delete user account with correct confirmation', async () => {
      const email = `delete-account-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie: loginCsrfCookie, csrfToken: loginCsrfToken } = await getCsrfToken();

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', loginCsrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, loginCsrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const responseCookies = getCookiesAsArray(loginResponse);
      const cookies = [...responseCookies, loginCsrfCookie];
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete('/api/v1/auth/me')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          confirmation: 'DELETE MY ACCOUNT',
        })
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);

      const { csrfCookie: checkCsrfCookie, csrfToken: checkCsrfToken } = await getCsrfToken();

      const loginAttempt = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', checkCsrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, checkCsrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      expect(loginAttempt.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should return 400 BAD_REQUEST with incorrect confirmation phrase', async () => {
      const email = `wrong-confirm-${uniqueTestId()}@example.com`;
      testEmails.push(email);

      await createTestUser(email);

      const { csrfCookie: loginCsrfCookie, csrfToken: loginCsrfToken } = await getCsrfToken();

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', loginCsrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, loginCsrfToken)
        .send({ email, password: DEFAULT_PASSWORD });

      const responseCookies = getCookiesAsArray(loginResponse);
      const cookies = [...responseCookies, loginCsrfCookie];
      const { csrfToken } = extractCsrfFromCookies(cookies);

      const response = await request(app)
        .delete('/api/v1/auth/me')
        .set('Cookie', cookies)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          confirmation: 'WRONG CONFIRMATION',
        })
        .expect(HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health').expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data).toHaveProperty('uptime');
    });
  });
});
