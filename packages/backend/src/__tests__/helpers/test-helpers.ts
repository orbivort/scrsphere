import request from 'supertest';
import app from '../../app';
import { CSRF_CONSTANTS } from '../../middleware/csrf.middleware';

export function getCookiesAsArray(response: request.Response): string[] {
  const setCookie = response.headers['set-cookie'];
  if (Array.isArray(setCookie)) {
    return setCookie;
  }
  if (typeof setCookie === 'string') {
    return [setCookie];
  }
  return [];
}

export async function getCsrfToken(): Promise<{ csrfCookie: string; csrfToken: string }> {
  const response = await request(app).get('/api/v1/auth/csrf-token');
  const cookies = getCookiesAsArray(response);
  const csrfCookie = cookies.find((c) => c.startsWith(`${CSRF_CONSTANTS.COOKIE_NAME}=`));

  if (!csrfCookie) {
    throw new Error('CSRF cookie not found');
  }

  const cookieValue = csrfCookie.split(';')[0];
  if (!cookieValue) {
    throw new Error('Invalid CSRF cookie format');
  }

  const tokenParts = cookieValue.split('=');
  const csrfToken = tokenParts[1] ?? '';

  return { csrfCookie, csrfToken };
}

export function extractCsrfFromCookies(cookies: string[]): {
  csrfCookie: string;
  csrfToken: string;
} {
  const csrfCookie = cookies.find((c) => c.startsWith(`${CSRF_CONSTANTS.COOKIE_NAME}=`));

  if (!csrfCookie) {
    throw new Error('CSRF cookie not found in cookies array');
  }

  const cookieValue = csrfCookie.split(';')[0];
  if (!cookieValue) {
    throw new Error('Invalid CSRF cookie format');
  }

  const tokenParts = cookieValue.split('=');
  const csrfToken = tokenParts[1] ?? '';

  return { csrfCookie, csrfToken };
}

export function replaceCsrfCookie(
  cookies: string[],
  newCsrf: { csrfCookie: string; csrfToken: string }
): string[] {
  const filtered = cookies.filter((c) => !c.startsWith(`${CSRF_CONSTANTS.COOKIE_NAME}=`));
  return [...filtered, newCsrf.csrfCookie];
}
