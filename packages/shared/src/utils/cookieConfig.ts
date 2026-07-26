/**
 * Shared Cookie Configuration for Scrumooth
 *
 * Single source of truth for locale cookie attributes.
 * Consumed by both frontend (useI18nStore, i18next LanguageDetector)
 * and backend (locale.middleware).
 *
 * @module shared/cookieConfig
 */

/** Locale cookie name — must match i18next LanguageDetector lookupCookie */
export const LOCALE_COOKIE_NAME = 'scrumooth_locale';

/** 1 year in milliseconds */
export const LOCALE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000;

export const LOCALE_COOKIE_SAME_SITE = 'strict' as const;
export const LOCALE_COOKIE_PATH = '/';

export interface LocaleCookieOptions {
  name: string;
  maxAge: number;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  secure: boolean;
  httpOnly: boolean;
}

/**
 * Safely detect whether the current browser context uses HTTPS.
 * Avoids referencing `window` directly because the shared package
 * is compiled without DOM types (Node-only tsconfig).
 */
function isSecureBrowserContext(): boolean {
  if (typeof globalThis === 'undefined') return false;
  // In browsers globalThis === window and has location.protocol
  if (!('location' in globalThis)) return false;
  try {
    const protocol = (globalThis as unknown as { location: { protocol: string } }).location
      .protocol;
    return protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get locale cookie options for the current runtime.
 *
 * @param runtime - 'node' for backend (uses config.nodeEnv), 'browser' for frontend (uses window.location.protocol)
 * @param isProduction - Required for 'node' runtime: whether NODE_ENV === 'production'
 * @returns Cookie options object
 */
export function getLocaleCookieOptions(runtime: 'node', isProduction: boolean): LocaleCookieOptions;
export function getLocaleCookieOptions(
  runtime: 'browser',
  isProduction?: undefined
): LocaleCookieOptions;
export function getLocaleCookieOptions(
  runtime: 'node' | 'browser',
  isProduction?: boolean
): LocaleCookieOptions {
  const secure = runtime === 'node' ? (isProduction ?? false) : isSecureBrowserContext();

  return {
    name: LOCALE_COOKIE_NAME,
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: LOCALE_COOKIE_SAME_SITE,
    path: LOCALE_COOKIE_PATH,
    secure,
    // The locale cookie MUST be httpOnly: false so that the frontend's
    // i18next LanguageDetector can read it via document.cookie.
    // This is intentional and safe: the locale value is a short,
    // non-sensitive string (e.g., 'de', 'fr') that cannot be used for
    // authentication or session hijacking.
    httpOnly: false,
  };
}

/**
 * Build a Set-Cookie header value string for the locale cookie (Node.js runtime).
 */
export function buildLocaleCookieString(locale: string, isProduction: boolean): string {
  const opts = getLocaleCookieOptions('node', isProduction);
  const parts = [
    `${opts.name}=${locale}`,
    `Max-Age=${Math.floor(opts.maxAge / 1000)}`, // Max-Age is in seconds
    `Path=${opts.path}`,
    `SameSite=${opts.sameSite}`,
  ];
  if (opts.secure) parts.push('Secure');
  if (opts.httpOnly) parts.push('HttpOnly');
  return parts.join('; ');
}
