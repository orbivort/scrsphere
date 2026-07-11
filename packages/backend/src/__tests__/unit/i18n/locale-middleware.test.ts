import { describe, it, expect, beforeEach, vi } from 'vitest';
import { localeResolver } from '../../../middleware/locale.middleware.js';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup/testSetup.js';
import { DEFAULT_LOCALE } from '@scrumooth/shared';

// Mock the requestContext module to avoid needing real AsyncLocalStorage setup
const { mockUpdateRequestContext } = vi.hoisted(() => ({
  mockUpdateRequestContext: vi.fn(),
}));
vi.mock('../../../utils/requestContext.js', () => ({
  updateRequestContext: mockUpdateRequestContext,
  getRequestContext: vi.fn(),
  setRequestContext: vi.fn(),
  getRequestId: vi.fn(),
  getUserId: vi.fn(),
  getTeamId: vi.fn(),
  getRequestLocale: vi.fn(),
}));

describe('localeResolver middleware', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('authenticated user with locale', () => {
    it('should use User.locale when authenticated user has a supported locale', () => {
      mockReq.user = { locale: 'de' };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: 'de' });
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'scrumooth_locale',
        'de',
        expect.objectContaining({
          maxAge: 31536000,
          sameSite: 'strict',
          secure: true,
          httpOnly: false,
          path: '/',
        })
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should use User.locale for each supported locale', () => {
      const supportedLocales = ['en', 'de', 'fr', 'es', 'it'];
      for (const locale of supportedLocales) {
        vi.clearAllMocks();
        mockReq.user = { locale };

        localeResolver(mockReq as any, mockRes as any, mockNext);

        expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale });
      }
    });

    it('should ignore unsupported user locale and fall back', () => {
      mockReq.user = { locale: 'zh' };
      mockReq.headers = {};

      localeResolver(mockReq as any, mockRes as any, mockNext);

      // Should fall back to DEFAULT_LOCALE since 'zh' is not supported
      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: DEFAULT_LOCALE });
    });
  });

  describe('Accept-Language header fallback', () => {
    it('should fall back to Accept-Language header when no user', () => {
      mockReq.user = undefined;
      mockReq.headers = { 'accept-language': 'de-DE,de;q=0.9,en;q=0.5' };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: 'de' });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should extract base language from Accept-Language header', () => {
      mockReq.user = undefined;
      mockReq.headers = { 'accept-language': 'fr-FR,fr;q=0.9' };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: 'fr' });
    });

    it('should find first supported locale from Accept-Language', () => {
      mockReq.user = undefined;
      // First is unsupported (zh), second is supported (es)
      mockReq.headers = { 'accept-language': 'zh-CN,zh;q=0.9,es;q=0.8' };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: 'es' });
    });

    it('should fall back to DEFAULT_LOCALE when no matching Accept-Language', () => {
      mockReq.user = undefined;
      mockReq.headers = { 'accept-language': 'zh-CN,ja;q=0.9,ko;q=0.8' };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: DEFAULT_LOCALE });
    });

    it('should handle Accept-Language with quality values', () => {
      mockReq.user = undefined;
      mockReq.headers = { 'accept-language': 'it-IT,it;q=0.9,en;q=0.5' };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: 'it' });
    });
  });

  describe('no user and no Accept-Language', () => {
    it('should fall back to DEFAULT_LOCALE when no header', () => {
      mockReq.user = undefined;
      mockReq.headers = {};

      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: DEFAULT_LOCALE });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should fall back to DEFAULT_LOCALE when Accept-Language is not a string', () => {
      mockReq.user = undefined;
      mockReq.headers = { 'accept-language': undefined };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: DEFAULT_LOCALE });
    });
  });

  describe('scrumooth_locale cookie', () => {
    it('should set scrumooth_locale cookie with resolved locale', () => {
      mockReq.user = { locale: 'fr' };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'scrumooth_locale',
        'fr',
        expect.objectContaining({
          maxAge: 31536000,
          sameSite: 'strict',
          secure: true,
          httpOnly: false,
          path: '/',
        })
      );
    });

    it('should set cookie with DEFAULT_LOCALE when no other source', () => {
      mockReq.user = undefined;
      mockReq.headers = {};

      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'scrumooth_locale',
        DEFAULT_LOCALE,
        expect.any(Object)
      );
    });
  });

  describe('middleware flow', () => {
    it('should call next() after resolving locale', () => {
      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() without error', () => {
      localeResolver(mockReq as any, mockRes as any, mockNext);

      // next should be called with no arguments (no error)
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
