import { i18nInstance } from './config.js';
import { getRequestLocale } from '../utils/requestContext.js';
import { DEFAULT_LOCALE } from '@scrumooth/shared';
import { logger } from '../utils/logger.js';

/**
 * Request-scoped translator. Reads the locale from AsyncLocalStorage
 * (set by localeResolver middleware via updateRequestContext({ locale })).
 *
 * If called outside a request scope (e.g., in a background job or at module
 * initialization time), falls back to DEFAULT_LOCALE and logs a warning.
 * This silent fallback avoids crashing background jobs but surfaces misuse
 * via structured logging.
 */
export function t(key: string, options?: Record<string, unknown>): string {
  const locale = getRequestLocale();
  if (locale === DEFAULT_LOCALE && !options?.lng) {
    logger.warn('requestT called outside request scope, falling back to DEFAULT_LOCALE', {
      key,
    });
  }
  return i18nInstance.t(key, { lng: locale, ...options });
}
