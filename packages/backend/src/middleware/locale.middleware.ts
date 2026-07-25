import { type Request, type Response, type NextFunction } from 'express';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale, normalizeLocale } from '@scrumooth/shared';
import { resolveAcceptLanguage } from 'resolve-accept-language';
import { updateRequestContext } from '../utils/requestContext.js';
import { getLocaleCookieOptions, COOKIE_NAMES } from '../utils/cookieConfig.js';

/**
 * BCP 47 locale identifiers corresponding to SUPPORTED_LOCALES.
 * `resolve-accept-language` requires `language-country` format identifiers.
 */
const BCP47_LOCALES: readonly string[] = SUPPORTED_LOCALES.map((locale) => {
  const map: Record<Locale, string> = {
    en: 'en-US',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
    it: 'it-IT',
  };
  return map[locale];
});

const BCP47_DEFAULT = 'en-US';

/**
 * Resolves the request locale, storing it in the AsyncLocalStorage request context.
 *
 * MUST be registered AFTER contextMiddleware (which creates the ALS store) and
 * AFTER authenticate (so req.user.locale is available for authenticated requests).
 *
 * Accept-Language parsing uses `resolve-accept-language` for RFC 4647/9110 compliance,
 * including proper handling of quality values (q=).
 *
 * Priority for authenticated requests: User.locale > Accept-Language > DEFAULT_LOCALE
 * Priority for unauthenticated requests: Accept-Language > DEFAULT_LOCALE
 */
export function localeResolver(req: Request, _res: Response, next: NextFunction): void {
  let locale: Locale = DEFAULT_LOCALE;

  const userLocale = (req as Request & { user?: { locale?: string } }).user?.locale;
  const isUserLocaleSupported =
    userLocale !== undefined && (SUPPORTED_LOCALES as readonly string[]).includes(userLocale);

  // 1. Authenticated user's stored preference (highest priority for authed users)
  if (isUserLocaleSupported) {
    locale = userLocale as Locale;
  }
  // 2. Accept-Language header (RFC 4647/9110 compliant parsing)
  else {
    const acceptLang = req.headers['accept-language'];
    if (typeof acceptLang === 'string') {
      const resolved = resolveAcceptLanguage(acceptLang, BCP47_LOCALES, BCP47_DEFAULT);
      locale = normalizeLocale(resolved);
    }
  }

  // Persist the locale cookie so SSR/refresh renders the correct language pre-hydration
  _res.cookie(COOKIE_NAMES.LOCALE, locale, getLocaleCookieOptions());

  updateRequestContext({ locale });
  next();
}
