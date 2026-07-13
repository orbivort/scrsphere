/**
 * i18n Test Helper Module
 *
 * Utilities for testing internationalization in backend tests.
 * Provides helpers for setting locale headers, verifying translated error messages,
 * checking locale cookies, and creating test users with locale preferences.
 *
 * @module i18n-helpers
 */

import type { Response } from 'supertest';
import type { PrismaClient } from '../../generated/prisma/client';
import type { Locale } from '@scrumooth/shared';
import { SUPPORTED_LOCALES } from '@scrumooth/shared';
import { i18nInstance } from '../../i18n/config';
import { generateUUIDv7 } from '../../utils/uuid';
import bcrypt from 'bcrypt';

/**
 * Re-export SUPPORTED_LOCALES from @scrumooth/shared for convenience in tests.
 * Contains all 5 supported locales: ['en', 'de', 'es', 'fr', 'it']
 */
export { SUPPORTED_LOCALES };

/**
 * Cookie configuration for scrumooth_locale.
 */
export const LOCALE_COOKIE_CONFIG = {
  name: 'scrumooth_locale',
  maxAge: 31536000,
  sameSite: 'strict',
  secure: true,
  httpOnly: false,
  path: '/',
} as const;

/**
 * Returns an object for setting the Accept-Language header in supertest requests.
 *
 * @example
 * ```typescript
 * const response = await request(app)
 *   .get('/api/v1/auth/me')
 *   .set(setLocaleHeader('de'));
 * ```
 *
 * @param locale - The locale to set (e.g., 'en', 'de', 'es', 'fr', 'it')
 * @returns An object with 'Accept-Language' header set to the locale
 */
export function setLocaleHeader(locale: Locale): { 'Accept-Language': Locale } {
  return { 'Accept-Language': locale };
}

/**
 * Assertion helper to verify translated error messages in response.
 *
 * The error response format is: `{ success: false, error: { code, message, details[] } }`
 *
 * @example
 * ```typescript
 * const response = await request(app)
 *   .post('/api/v1/auth/login')
 *   .set(setLocaleHeader('de'))
 *   .send({ email: 'invalid', password: 'invalid' });
 *
 * expectTranslatedError(response, 'errors:invalidCredentials', 'de');
 * ```
 *
 * @param response - The supertest response object
 * @param key - The i18n translation key (e.g., 'errors:invalidCredentials')
 * @param locale - The expected locale for the translation
 * @param params - Optional interpolation parameters for the translation
 */
export function expectTranslatedError(
  response: Response,
  key: string,
  locale: Locale,
  params?: Record<string, unknown>
): void {
  const expectedMessage = i18nInstance.t(key, { lng: locale, ...params });

  // Validate response structure
  if (!response.body) {
    throw new Error('Response body is undefined');
  }

  if (response.body.success !== false) {
    throw new Error(
      `Expected error response (success: false), got success: ${response.body.success}`
    );
  }

  if (!response.body.error) {
    throw new Error('Response body.error is undefined');
  }

  // Assert the translated message matches
  if (response.body.error.message !== expectedMessage) {
    throw new Error(
      `Expected error message "${expectedMessage}" for locale "${locale}" and key "${key}", ` +
        `but got "${response.body.error.message}"`
    );
  }
}

/**
 * Assertion helper to verify translated validation error messages in response.
 *
 * For validation errors (VALIDATION_ERROR), the top-level message is 'Validation failed'
 * and the translated field-specific errors are in the `details[]` array.
 *
 * @example
 * ```typescript
 * const response = await request(app)
 *   .post('/api/v1/product-backlog')
 *   .set(setLocaleHeader('de'))
 *   .send({ title: '' }); // Empty title triggers validation
 *
 * expectTranslatedValidationError(response, 'validation:fieldRequired', 'de');
 * ```
 *
 * @param response - The supertest response object
 * @param key - The i18n translation key (e.g., 'validation:fieldRequired')
 * @param locale - The expected locale for the translation
 * @param params - Optional interpolation parameters for the translation
 * @param field - Optional field name to match (defaults to any field)
 */
export function expectTranslatedValidationError(
  response: Response,
  key: string,
  locale: Locale,
  params?: Record<string, unknown>,
  field?: string
): void {
  const expectedMessage = i18nInstance.t(key, { lng: locale, ...params });

  // Validate response structure
  if (!response.body) {
    throw new Error('Response body is undefined');
  }

  if (response.body.success !== false) {
    throw new Error(
      `Expected error response (success: false), got success: ${response.body.success}`
    );
  }

  if (!response.body.error) {
    throw new Error('Response body.error is undefined');
  }

  if (!response.body.error.details || !Array.isArray(response.body.error.details)) {
    throw new Error(
      `Expected validation error with details array, but got: ${JSON.stringify(response.body.error)}`
    );
  }

  // Find matching detail
  const matchingDetail = response.body.error.details.find(
    (d: { field?: string; message: string }) => {
      const messageMatches = d.message === expectedMessage;
      const fieldMatches = field === undefined || d.field === field;
      return messageMatches && fieldMatches;
    }
  );

  if (!matchingDetail) {
    const detailsStr = JSON.stringify(response.body.error.details);
    throw new Error(
      `Expected validation detail with message "${expectedMessage}" for locale "${locale}" and key "${key}"${
        field ? ` and field "${field}"` : ''
      }, but got details: ${detailsStr}`
    );
  }
}

/**
 * Assertion helper to verify the scrumooth_locale cookie is set correctly.
 *
 * Cookie settings: maxAge=31536000, sameSite='strict', secure=true, httpOnly=false
 *
 * @example
 * ```typescript
 * const response = await request(app)
 *   .get('/api/v1/auth/me')
 *   .set(setLocaleHeader('de'));
 *
 * expectLocaleCookie(response, 'de');
 * ```
 *
 * @param response - The supertest response object
 * @param locale - The expected locale value in the cookie
 */
export function expectLocaleCookie(response: Response, locale: Locale): void {
  const setCookie = response.headers['set-cookie'];
  if (!setCookie) {
    throw new Error('No set-cookie header in response');
  }

  // Normalize to array
  const cookies: string[] = Array.isArray(setCookie) ? setCookie : [setCookie];

  // Find the scrumooth_locale cookie
  const localeCookie = cookies.find((cookie) => cookie.startsWith(`${LOCALE_COOKIE_CONFIG.name}=`));

  if (!localeCookie) {
    throw new Error(
      `Expected "${LOCALE_COOKIE_CONFIG.name}" cookie to be set, but found cookies: ${cookies.join(', ')}`
    );
  }

  // Extract cookie value (before the semicolon)
  const cookieValue = localeCookie.split(';')[0]?.split('=')[1];

  if (cookieValue !== locale) {
    throw new Error(`Expected locale cookie value "${locale}", but got "${cookieValue}"`);
  }

  // Verify cookie settings
  if (!localeCookie.includes(`Max-Age=${LOCALE_COOKIE_CONFIG.maxAge}`)) {
    throw new Error(
      `Expected Max-Age=${LOCALE_COOKIE_CONFIG.maxAge} in locale cookie, ` +
        `but cookie is: "${localeCookie}"`
    );
  }

  if (!localeCookie.toLowerCase().includes(`samesite=${LOCALE_COOKIE_CONFIG.sameSite}`)) {
    throw new Error(
      `Expected SameSite=${LOCALE_COOKIE_CONFIG.sameSite} in locale cookie, ` +
        `but cookie is: "${localeCookie}"`
    );
  }
}

/**
 * Helper to create test users with locale preference.
 *
 * Creates a user in the database with the specified locale preference,
 * which will be used for authenticated request translations.
 *
 * @example
 * ```typescript
 * const prisma = new PrismaClient();
 * const user = await createI18nTestUser('test-de@example.com', 'de', prisma);
 *
 * // User.locale is 'de', so authenticated requests will use German translations
 * ```
 *
 * @param email - The email for the test user
 * @param locale - The locale preference for the user
 * @param prisma - The PrismaClient instance
 * @param password - Optional password (defaults to 'TestPassword123!')
 * @returns The created user with id, email, locale, and password
 */
export async function createI18nTestUser(
  email: string,
  locale: Locale,
  prisma: PrismaClient,
  password: string = 'TestPassword123!'
): Promise<{
  id: string;
  email: string;
  locale: Locale;
  password: string;
  firstName: string;
  lastName: string;
}> {
  const hashedPassword = await bcrypt.hash(password, 12);
  const userId = generateUUIDv7();

  const user = await prisma.user.create({
    data: {
      id: userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: 'I18nTest',
      lastName: 'User',
      locale,
    },
  });

  return {
    id: user.id,
    email: user.email,
    locale: user.locale as Locale,
    password,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

/**
 * Helper to get the translated message for a key and locale.
 *
 * Useful for comparing response messages with expected translations.
 *
 * @example
 * ```typescript
 * const germanMessage = getTranslatedMessage('errors:invalidCredentials', 'de');
 * expect(response.body.error.message).toBe(germanMessage);
 * ```
 *
 * @param key - The i18n translation key (e.g., 'errors:invalidCredentials')
 * @param locale - The locale to translate to
 * @param params - Optional interpolation parameters
 * @returns The translated message string
 */
export function getTranslatedMessage(
  key: string,
  locale: Locale,
  params?: Record<string, unknown>
): string {
  return i18nInstance.t(key, { lng: locale, ...params });
}

/**
 * Helper to verify all locales have translations for a given key.
 *
 * Useful for ensuring translation completeness in tests.
 *
 * @example
 * ```typescript
 * // Verify all locales have the 'errors:invalidCredentials' translation
 * expectAllLocalesHaveTranslation('errors:invalidCredentials');
 * ```
 *
 * @param key - The i18n translation key to check
 * @returns An object mapping each locale to its translation for the key
 */
export function expectAllLocalesHaveTranslation(key: string): Record<Locale, string> {
  const translations: Record<string, string> = {};

  for (const locale of SUPPORTED_LOCALES) {
    const translation = i18nInstance.t(key, { lng: locale });
    translations[locale] = translation;

    // Check that translation exists and is not the fallback
    if (!translation || translation === key) {
      throw new Error(`Missing translation for key "${key}" in locale "${locale}"`);
    }
  }

  return translations as Record<Locale, string>;
}
