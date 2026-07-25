import { type Request, type Response, type NextFunction } from 'express';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@scrumooth/shared';
import { normalizeLocale } from '@scrumooth/shared';
import { updateRequestContext } from '../utils/requestContext.js';
import { getLocaleCookieOptions, COOKIE_NAMES } from '../utils/cookieConfig.js';

/**
 * Resolves the request locale and stores it in the AsyncLocalStorage request context.
 *
 * MUST be registered AFTER contextMiddleware (which creates the ALS store) and
 * AFTER authenticate (so req.user.locale is available for authenticated requests).
 *
 * Priority: Accept-Language header > User's database locale > Default locale
 * This ensures the frontend's current locale takes precedence.
 */
export function localeResolver(req: Request, _res: Response, next: NextFunction): void {
  let locale: Locale = DEFAULT_LOCALE;

  // 1. Accept-Language header (highest priority - frontend's current locale)
  const acceptLang = req.headers['accept-language'];
  if (typeof acceptLang === 'string') {
    const detected = acceptLang
      .split(',')
      .map((l) => l.split(';')[0]?.trim() ?? '')
      .map((l) => l.split('-')[0]?.toLowerCase() ?? '')
      .find((l) => (SUPPORTED_LOCALES as readonly string[]).includes(l));
    if (detected) {
      locale = normalizeLocale(detected);
    }
  }
  // 2. Authenticated user's stored preference (fallback if no Accept-Language)
  else {
    const userLocale = (req as Request & { user?: { locale?: string } }).user?.locale;
    if (userLocale && (SUPPORTED_LOCALES as readonly string[]).includes(userLocale)) {
      locale = userLocale as Locale;
    }
  }

  // Persist the locale cookie so SSR/refresh renders the correct language pre-hydration
  _res.cookie(COOKIE_NAMES.LOCALE, locale, getLocaleCookieOptions());

  updateRequestContext({ locale });
  next();
}
