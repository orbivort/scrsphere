import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
  COOKIE_NAMES,
} from '../../../utils/cookieConfig';
import config from '../../../config';

vi.mock('../../../config', () => ({
  default: {
    nodeEnv: 'test',
    jwt: {
      expiresIn: '15m',
      refreshExpiresIn: '7d',
    },
  },
}));

describe('Cookie Configuration', () => {
  beforeEach(() => {
    vi.mocked(config).nodeEnv = 'test';
    Object.assign(vi.mocked(config).jwt, { expiresIn: '15m', refreshExpiresIn: '7d' });
  });

  describe('COOKIE_NAMES', () => {
    it('should have correct cookie names', () => {
      expect(COOKIE_NAMES.ACCESS_TOKEN).toBe('accessToken');
      expect(COOKIE_NAMES.REFRESH_TOKEN).toBe('refreshToken');
    });
  });

  describe('getAccessTokenCookieOptions', () => {
    it('should return correct cookie options for access token', () => {
      const options = getAccessTokenCookieOptions();

      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(false); // test environment
      expect(options.sameSite).toBe('strict');
      expect(options.path).toBe('/');
      expect(options.maxAge).toBe(15 * 60 * 1000);
    });

    it('should use secure cookies in production', () => {
      vi.mocked(config).nodeEnv = 'production';

      const options = getAccessTokenCookieOptions();

      expect(options.secure).toBe(true);
    });
  });

  describe('getRefreshTokenCookieOptions', () => {
    it('should return correct cookie options for refresh token', () => {
      const options = getRefreshTokenCookieOptions();

      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(false); // test environment
      expect(options.sameSite).toBe('strict');
      expect(options.path).toBe('/');
      expect(options.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('getClearCookieOptions', () => {
    it('should return correct options for clearing cookies', () => {
      const options = getClearCookieOptions();

      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(false); // test environment
      expect(options.sameSite).toBe('strict');
      expect(options.path).toBe('/');
      expect(options.maxAge).toBe(0);
    });

    it('should use secure cookies in production for clear options', () => {
      vi.mocked(config).nodeEnv = 'production';

      const options = getClearCookieOptions();

      expect(options.secure).toBe(true);
    });
  });

  describe('parseDuration', () => {
    it('should parse seconds duration', () => {
      Object.assign(vi.mocked(config).jwt, { expiresIn: '30s' });
      const options = getAccessTokenCookieOptions();
      expect(options.maxAge).toBe(30 * 1000);
    });

    it('should parse hours duration', () => {
      Object.assign(vi.mocked(config).jwt, { expiresIn: '2h' });
      const options = getAccessTokenCookieOptions();
      expect(options.maxAge).toBe(2 * 60 * 60 * 1000);
    });

    it('should handle unknown duration unit as raw number', () => {
      Object.assign(vi.mocked(config).jwt, { expiresIn: '5000' });
      const options = getAccessTokenCookieOptions();
      expect(options.maxAge).toBe(500);
    });
  });
});
