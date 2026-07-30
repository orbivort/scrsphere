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
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
          sameSite: 'strict',
          httpOnly: false,
          path: '/',
        })
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should use User.locale for each supported locale', () => {
      const supportedLocales = ['en', 'de', 'fr', 'it', 'es'];
      for (const locale of supportedLocales) {
        vi.clearAllMocks();
        mockReq.user = { locale };

        localeResolver(mockReq as any, mockRes as any, mockNext);

        expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale });
      }
    });

    it('should ignore unsupported user locale and fall back to Accept-Language', () => {
      mockReq.user = { locale: 'zh' };
      mockReq.headers = { 'accept-language': 'de-DE,de;q=0.9,en;q=0.5' };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      // Should fall back to Accept-Language since 'zh' is not supported
      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: 'de' });
    });

    it('should ignore unsupported user locale and fall back to DEFAULT_LOCALE when no Accept-Language', () => {
      mockReq.user = { locale: 'zh' };
      mockReq.headers = {};

      localeResolver(mockReq as any, mockRes as any, mockNext);

      // Should fall back to DEFAULT_LOCALE since 'zh' is not supported and no Accept-Language
      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: DEFAULT_LOCALE });
    });
  });

  describe('authenticated user priority: User.locale > Accept-Language', () => {
    it('should prefer User.locale over Accept-Language when both are present and supported', () => {
      mockReq.user = { locale: 'fr' };
      mockReq.headers = { 'accept-language': 'de-DE,de;q=0.9,en;q=0.5' };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      // User.locale ('fr') should win over Accept-Language ('de')
      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: 'fr' });
    });

    it('should fall back to Accept-Language when User.locale is not supported', () => {
      mockReq.user = { locale: 'zh' };
      mockReq.headers = { 'accept-language': 'it-IT,it;q=0.9,en;q=0.5' };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      // Unsupported User.locale falls through to Accept-Language
      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: 'it' });
    });
  });

  describe('Accept-Language header parsing (RFC 4647/9110)', () => {
    it('should resolve Accept-Language with quality values correctly', () => {
      mockReq.user = undefined;
      // de-DE has implicit q=1.0, de has q=0.9, en has q=0.8
      mockReq.headers = { 'accept-language': 'de-DE,de;q=0.9,en;q=0.8' };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: 'de' });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should respect quality value ordering', () => {
      mockReq.user = undefined;
      // en has higher q than de
      mockReq.headers = { 'accept-language': 'de;q=0.5,en;q=0.9' };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: 'en' });
    });

    it('should extract base language from Accept-Language header with region tag', () => {
      mockReq.user = undefined;
      mockReq.headers = { 'accept-language': 'fr-FR,fr;q=0.9' };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: 'fr' });
    });

    it('should find supported locale from mixed Accept-Language with unsupported entries', () => {
      mockReq.user = undefined;
      // First is unsupported (zh-CN), second is supported (es)
      mockReq.headers = { 'accept-language': 'zh-CN,zh;q=0.9,es;q=0.8' };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: 'es' });
    });

    it('should fall back to DEFAULT_LOCALE when all Accept-Language entries are unsupported', () => {
      mockReq.user = undefined;
      mockReq.headers = { 'accept-language': 'zh-CN,zh;q=0.9,ja;q=0.8' };

      localeResolver(mockReq as any, mockRes as any, mockNext);

      expect(mockUpdateRequestContext).toHaveBeenCalledWith({ locale: DEFAULT_LOCALE });
    });

    it('should handle Accept-Language with quality values for Italian', () => {
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
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
          sameSite: 'strict',
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
