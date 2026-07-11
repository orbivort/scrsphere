import { i18nInstance } from './config.js';
import { getRequestLocale } from '../utils/requestContext.js';

/**
 * Request-scoped translator. Reads the locale from AsyncLocalStorage
 * (set by localeResolver middleware via updateRequestContext({ locale })).
 *
 * Throws a descriptive error if called outside a request scope, to surface
 * misuse early (e.g., calling t() in a background job without passing locale).
 */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18nInstance.t(key, { lng: getRequestLocale(), ...options });
}
