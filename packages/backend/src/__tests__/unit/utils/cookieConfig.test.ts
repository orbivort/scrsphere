import { describe, it, expect, vi } from 'vitest';
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
  COOKIE_NAMES,
} from '../../../utils/cookieConfig';

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
  });
});
