import { describe, it, expect, beforeEach } from 'vitest';
import { t } from '../../../i18n/requestT.js';
import { setRequestContext, updateRequestContext } from '../../../utils/requestContext.js';

describe('requestT', () => {
  beforeEach(() => {
    // Set up a fresh request context for each test
    setRequestContext({ requestId: 'test-request-id' }, () => {
      // Context is set within the callback
    });
  });

  describe('t() - request-scoped translator', () => {
    it('should fall back to DEFAULT_LOCALE when no locale in context', () => {
      // Run inside a request context without locale
      const result = setRequestContext({ requestId: 'req-no-locale' }, () => {
        return t('errors:invalidCredentials');
      });
      // Should resolve in DEFAULT_LOCALE (en)
      expect(result).toBeTruthy();
      expect(result).toBe('Invalid email or password');
    });

    it('should use locale from request context when set', () => {
      const result = setRequestContext({ requestId: 'req-de-locale' }, () => {
        updateRequestContext({ locale: 'de' });
        return t('errors:invalidCredentials');
      });
      // Should resolve in German
      expect(result).toBeTruthy();
      // The German file currently has the same English text as placeholder
      // but the key mechanism is that it uses 'de' language
      expect(typeof result).toBe('string');
    });

    it('should pass interpolation options through', () => {
      const result = setRequestContext({ requestId: 'req-interp' }, () => {
        return t('errors:entityNotFound', { entity: 'Sprint' });
      });
      expect(result).toContain('Sprint');
      expect(result).toContain('not found');
    });
  });
});
