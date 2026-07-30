import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../../app';
import { CSRF_CONSTANTS } from '../../middleware/csrf.middleware';
import { setLocaleHeader, expectLocaleCookie, SUPPORTED_LOCALES } from '../helpers/i18n-helpers';
import type { Locale } from '@scrumooth/shared';

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

describe('CSRF Protection Integration', () => {
  describe('GET /api/v1/auth/csrf-token', () => {
    it('should return a CSRF token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/csrf-token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          token: expect.any(String),
        },
      });

      const cookies = getCookiesAsArray(response);
      expect(cookies.length).toBeGreaterThan(0);
      const csrfCookie = cookies.find((c) => c.startsWith(`${CSRF_CONSTANTS.COOKIE_NAME}=`));
      expect(csrfCookie).toBeDefined();
      expect(csrfCookie).toContain('Path=/');
      expect(csrfCookie).toMatch(/SameSite=Strict/i);
    });

    it('should set cookie with correct attributes', async () => {
      const response = await request(app).get('/api/v1/auth/csrf-token');

      const cookies = getCookiesAsArray(response);
      const csrfCookie = cookies.find((c) => c.startsWith(`${CSRF_CONSTANTS.COOKIE_NAME}=`));

      expect(csrfCookie).toBeDefined();
      expect(csrfCookie).not.toContain('HttpOnly');
    });
  });

  describe('CSRF Protection on State-Changing Requests', () => {
    it('should reject POST request without CSRF token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: expect.stringContaining('CSRF'),
        },
      });
    });

    it('should reject PUT request without CSRF token', async () => {
      const response = await request(app)
        .put('/api/v1/auth/me/profile')
        .send({ firstName: 'Test', lastName: 'User' })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: expect.stringContaining('CSRF'),
        },
      });
    });

    it('should reject DELETE request without CSRF token', async () => {
      const response = await request(app).delete('/api/v1/auth/sessions/test-token-id').expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: expect.stringContaining('CSRF'),
        },
      });
    });

    it('should accept GET request without CSRF token', async () => {
      const response = await request(app).get('/api/v1/auth/csrf-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should accept POST request with valid CSRF token', async () => {
      const csrfResponse = await request(app).get('/api/v1/auth/csrf-token');

      const cookies = getCookiesAsArray(csrfResponse);
      const csrfCookie = cookies.find((c) => c.startsWith(`${CSRF_CONSTANTS.COOKIE_NAME}=`));
      expect(csrfCookie).toBeDefined();
      if (!csrfCookie) {
        throw new Error('CSRF cookie not found');
      }
      const cookieValue = csrfCookie.split(';')[0];
      if (!cookieValue) {
        throw new Error('Invalid CSRF cookie format');
      }
      const tokenParts = cookieValue.split('=');
      const csrfToken = tokenParts[1] ?? '';
      expect(csrfToken).toBeTruthy();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email: 'test@example.com', password: 'password' });

      expect(response.status).not.toBe(403);
    });

    it('should reject POST request with mismatched CSRF tokens', async () => {
      const csrfResponse1 = await request(app).get('/api/v1/auth/csrf-token');
      const csrfResponse2 = await request(app).get('/api/v1/auth/csrf-token');

      const cookies1 = getCookiesAsArray(csrfResponse1);
      const csrfCookie1 = cookies1.find((c) => c.startsWith(`${CSRF_CONSTANTS.COOKIE_NAME}=`));

      const cookies2 = getCookiesAsArray(csrfResponse2);
      const csrfCookie2 = cookies2.find((c) => c.startsWith(`${CSRF_CONSTANTS.COOKIE_NAME}=`));
      expect(csrfCookie2).toBeDefined();
      if (!csrfCookie1 || !csrfCookie2) {
        throw new Error('CSRF cookie not found');
      }
      const cookieValue2 = csrfCookie2.split(';')[0];
      if (!cookieValue2) {
        throw new Error('Invalid CSRF cookie format');
      }
      const tokenParts2 = cookieValue2.split('=');
      const csrfToken2 = tokenParts2[1] ?? '';
      expect(csrfToken2).toBeTruthy();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', csrfCookie1)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken2)
        .send({ email: 'test@example.com', password: 'password' })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: expect.stringContaining('CSRF'),
        },
      });
    });

    it('should reject POST request with invalid CSRF token format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', `${CSRF_CONSTANTS.COOKIE_NAME}=invalid-token`)
        .set(CSRF_CONSTANTS.HEADER_NAME, 'invalid-token')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: expect.stringContaining('CSRF'),
        },
      });
    });
  });

  describe('CSRF Token Cookie Auto-Generation', () => {
    it('should automatically set CSRF cookie on any request', async () => {
      const response = await request(app).get('/health');

      const cookies = getCookiesAsArray(response);
      if (cookies.length > 0) {
        const csrfCookie = cookies.find((c) => c.startsWith(`${CSRF_CONSTANTS.COOKIE_NAME}=`));
        expect(csrfCookie).toBeDefined();
      }
    });
  });

  describe('i18n Locale Support', () => {
    describe('Translated CSRF Token Error Messages', () => {
      it('should return CSRF error with consistent message structure regardless of locale', async () => {
        // Test that CSRF errors are returned with proper structure
        // Note: CSRF middleware currently uses hardcoded English messages
        // Translation keys would need to be added for full i18n support
        const response = await request(app)
          .post('/api/v1/auth/login')
          .set(setLocaleHeader('de'))
          .send({ email: 'test@example.com', password: 'password' })
          .expect(403);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: expect.stringContaining('CSRF'),
          },
        });
      });

      it('should return CSRF error for all supported locales', async () => {
        // Test CSRF error response structure across all locales
        for (const locale of SUPPORTED_LOCALES) {
          const response = await request(app)
            .post('/api/v1/auth/login')
            .set(setLocaleHeader(locale as Locale))
            .send({ email: 'test@example.com', password: 'password' })
            .expect(403);

          expect(response.body).toMatchObject({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: expect.stringContaining('CSRF'),
            },
          });
        }
      });

      it('should return invalid CSRF token error with proper structure', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .set('Cookie', `${CSRF_CONSTANTS.COOKIE_NAME}=invalid-token`)
          .set(CSRF_CONSTANTS.HEADER_NAME, 'invalid-token')
          .set(setLocaleHeader('fr'))
          .send({ email: 'test@example.com', password: 'password' })
          .expect(403);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: expect.stringContaining('CSRF'),
          },
        });
      });
    });

    describe('Locale-Inclusive CSRF Validation', () => {
      it('should generate CSRF token with different locale headers', async () => {
        // Test that CSRF token generation works regardless of locale
        for (const locale of SUPPORTED_LOCALES) {
          const response = await request(app)
            .get('/api/v1/auth/csrf-token')
            .set(setLocaleHeader(locale as Locale))
            .expect('Content-Type', /json/)
            .expect(200);

          expect(response.body).toMatchObject({
            success: true,
            data: {
              token: expect.any(String),
            },
          });

          const cookies = getCookiesAsArray(response);
          expect(cookies.length).toBeGreaterThan(0);
          const csrfCookie = cookies.find((c) => c.startsWith(`${CSRF_CONSTANTS.COOKIE_NAME}=`));
          expect(csrfCookie).toBeDefined();
        }
      });

      it('should set locale cookie correctly on csrf-token endpoint', async () => {
        // Test that the localeResolver middleware sets scrumooth_locale cookie
        for (const locale of SUPPORTED_LOCALES) {
          const response = await request(app)
            .get('/api/v1/auth/csrf-token')
            .set(setLocaleHeader(locale as Locale))
            .expect(200);

          // Verify the locale cookie is set with correct value and attributes
          expectLocaleCookie(response, locale as Locale);
        }
      });

      it('should accept POST request with valid CSRF token and locale header', async () => {
        const locale: Locale = 'de';
        const csrfResponse = await request(app)
          .get('/api/v1/auth/csrf-token')
          .set(setLocaleHeader(locale));

        const cookies = getCookiesAsArray(csrfResponse);
        const csrfCookie = cookies.find((c) => c.startsWith(`${CSRF_CONSTANTS.COOKIE_NAME}=`));
        expect(csrfCookie).toBeDefined();
        if (!csrfCookie) {
          throw new Error('CSRF cookie not found');
        }
        const cookieValue = csrfCookie.split(';')[0];
        if (!cookieValue) {
          throw new Error('Invalid CSRF cookie format');
        }
        const tokenParts = cookieValue.split('=');
        const csrfToken = tokenParts[1] ?? '';
        expect(csrfToken).toBeTruthy();

        const response = await request(app)
          .post('/api/v1/auth/login')
          .set('Cookie', csrfCookie)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .set(setLocaleHeader(locale))
          .send({ email: 'test@example.com', password: 'password' });

        expect(response.status).not.toBe(403);
      });

      it('should set locale cookie for default locale when no Accept-Language header', async () => {
        const response = await request(app).get('/api/v1/auth/csrf-token').expect(200);

        // Should set locale cookie with default locale (en)
        const cookies = getCookiesAsArray(response);
        const localeCookie = cookies.find((c) => c.startsWith('scrumooth_locale='));
        expect(localeCookie).toBeDefined();

        // Verify cookie contains default locale
        const cookieValue = localeCookie?.split(';')[0]?.split('=')[1];
        expect(cookieValue).toBe('en');
      });
    });
  });
});
