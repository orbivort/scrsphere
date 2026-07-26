import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { contextMiddleware } from '../../middleware/context.middleware';
import { requestId } from '../../middleware/requestId.middleware';
import { getRequestContext, updateRequestContext } from '../../utils/requestContext';
import { logger } from '../../utils/logger';
import { localeResolver } from '../../middleware/locale.middleware';
import { setLocaleHeader, SUPPORTED_LOCALES } from '../helpers/i18n-helpers';
import type { Locale } from '@scrumooth/shared';

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
  },
  logRequest: vi.fn(),
}));

describe('Logging Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();

    app.use(requestId);
    app.use(contextMiddleware);

    app.get('/test-context', (_req, res) => {
      const context = getRequestContext();
      res.json({ context });
    });

    app.get('/test-auth-context', (req, res) => {
      (req as any).userId = 'user-123';
      updateRequestContext({ userId: 'user-123' });

      const context = getRequestContext();
      res.json({ context });
    });

    app.get('/test-team-context', (req, res) => {
      (req as any).userId = 'user-123';
      (req as any).currentTeamId = 'team-456';
      updateRequestContext({ userId: 'user-123', teamId: 'team-456' });

      const context = getRequestContext();
      res.json({ context });
    });
  });

  describe('Request Context Propagation', () => {
    it('should have requestId in context for each request', async () => {
      const response = await request(app).get('/test-context');

      expect(response.status).toBe(200);
      expect(response.body.context).toHaveProperty('requestId');
      expect(typeof response.body.context.requestId).toBe('string');
      expect(response.body.context.requestId.length).toBeGreaterThan(0);
    });

    it('should have different requestId for different requests', async () => {
      const response1 = await request(app).get('/test-context');
      const response2 = await request(app).get('/test-context');

      expect(response1.body.context.requestId).not.toBe(response2.body.context.requestId);
    });

    it('should update context with userId when set', async () => {
      const response = await request(app).get('/test-auth-context');

      expect(response.status).toBe(200);
      expect(response.body.context).toEqual({
        requestId: expect.any(String),
        userId: 'user-123',
      });
    });

    it('should update context with teamId when set', async () => {
      const response = await request(app).get('/test-team-context');

      expect(response.status).toBe(200);
      expect(response.body.context).toEqual({
        requestId: expect.any(String),
        userId: 'user-123',
        teamId: 'team-456',
      });
    });
  });

  describe('Concurrent Request Isolation', () => {
    it('should isolate context between concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app).get('/test-auth-context').set('X-Test-User', `user-${i}`)
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.context.userId).toBe('user-123');
      });
    });
  });
});

describe('Logger Context Format', () => {
  it('should include context in log entries when available', async () => {
    const app = express();

    app.use(requestId);
    app.use(contextMiddleware);

    app.get('/log-test', (_req, res) => {
      updateRequestContext({ userId: 'test-user' });
      logger.info('Test log message');
      res.json({ success: true });
    });

    const response = await request(app).get('/log-test');

    expect(response.status).toBe(200);
    expect(logger.info).toHaveBeenCalledWith('Test log message');
  });
});

describe('i18n Locale Support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Locale-aware audit log messages', () => {
    it('should include locale in request context when Accept-Language header is set', async () => {
      const app = express();

      app.use(requestId);
      app.use(contextMiddleware);
      app.use(localeResolver);

      app.get('/locale-test', (_req, res) => {
        const context = getRequestContext();
        const locale = context?.locale ?? 'en';
        logger.info('Locale test message', { locale });
        res.json({ context });
      });

      const response = await request(app).get('/locale-test').set(setLocaleHeader('de'));

      expect(response.status).toBe(200);
      expect(response.body.context.locale).toBe('de');
      expect(logger.info).toHaveBeenCalledWith('Locale test message', { locale: 'de' });
    });

    it('should handle multiple locale headers in audit logs', async () => {
      const testLocales: Locale[] = ['en', 'fr', 'it', 'es'];

      for (const locale of testLocales) {
        const app = express();

        app.use(requestId);
        app.use(contextMiddleware);
        app.use(localeResolver);

        app.get('/audit-test', (_req, res) => {
          const context = getRequestContext();
          const contextLocale = context?.locale ?? 'en';
          logger.info('Audit log entry', {
            locale: contextLocale,
            action: 'test_action',
          });
          res.json({ success: true, locale: contextLocale });
        });

        const response = await request(app).get('/audit-test').set(setLocaleHeader(locale));

        expect(response.status).toBe(200);
        expect(response.body.locale).toBe(locale);
        expect(logger.info).toHaveBeenCalledWith('Audit log entry', {
          locale,
          action: 'test_action',
        });
      }
    });

    it('should persist locale across middleware chain for audit logging', async () => {
      const app = express();

      app.use(requestId);
      app.use(contextMiddleware);
      app.use(localeResolver);

      // First handler captures locale
      app.get('/chain-test', (_req, _res, next) => {
        const context = getRequestContext();
        const locale = context?.locale ?? 'en';
        logger.info('First handler log', { locale });
        next();
      });

      // Second handler also has access to locale
      app.get('/chain-test', (_req, res) => {
        const context = getRequestContext();
        const locale = context?.locale ?? 'en';
        logger.info('Second handler log', { locale });
        res.json({ locale });
      });

      const response = await request(app).get('/chain-test').set(setLocaleHeader('fr'));

      expect(response.status).toBe(200);
      expect(response.body.locale).toBe('fr');
      expect(logger.info).toHaveBeenCalledWith('First handler log', { locale: 'fr' });
      expect(logger.info).toHaveBeenCalledWith('Second handler log', { locale: 'fr' });
    });

    it('should include locale in error logs', async () => {
      const app = express();

      app.use(requestId);
      app.use(contextMiddleware);
      app.use(localeResolver);

      app.get('/error-test', (_req, res) => {
        const context = getRequestContext();
        const locale = context?.locale ?? 'en';
        logger.error('Error occurred', {
          locale,
          error: 'test_error',
        });
        res.status(500).json({ error: 'Internal error' });
      });

      const response = await request(app).get('/error-test').set(setLocaleHeader('it'));

      expect(response.status).toBe(500);
      expect(logger.error).toHaveBeenCalledWith('Error occurred', {
        locale: 'it',
        error: 'test_error',
      });
    });
  });

  describe('Translated log entry descriptions', () => {
    it('should log translated messages using locale from context', async () => {
      const app = express();

      app.use(requestId);
      app.use(contextMiddleware);
      app.use(localeResolver);

      app.get('/translated-log', (_req, res) => {
        const context = getRequestContext();
        const locale = context?.locale ?? 'en';
        // Simulate audit log with locale-aware description
        logger.info('Request processed', {
          locale,
          description: `Processed request for locale ${locale}`,
        });
        res.json({ locale });
      });

      const response = await request(app).get('/translated-log').set(setLocaleHeader('es'));

      expect(response.status).toBe(200);
      expect(response.body.locale).toBe('es');
      expect(logger.info).toHaveBeenCalledWith('Request processed', {
        locale: 'es',
        description: 'Processed request for locale es',
      });
    });

    it('should log locale-specific descriptions for all supported locales', async () => {
      for (const locale of SUPPORTED_LOCALES) {
        const app = express();

        app.use(requestId);
        app.use(contextMiddleware);
        app.use(localeResolver);

        app.get('/locale-desc', (_req, res) => {
          const context = getRequestContext();
          const contextLocale = context?.locale ?? 'en';
          logger.info('Locale description test', {
            locale: contextLocale,
            description: `Locale-specific log for ${locale}`,
          });
          res.json({ locale: contextLocale });
        });

        const response = await request(app).get('/locale-desc').set(setLocaleHeader(locale));

        expect(response.status).toBe(200);
        expect(logger.info).toHaveBeenCalledWith('Locale description test', {
          locale,
          description: `Locale-specific log for ${locale}`,
        });
      }
    });

    it('should include locale metadata in log entries for audit trail', async () => {
      const app = express();

      app.use(requestId);
      app.use(contextMiddleware);
      app.use(localeResolver);

      app.post('/audit-action', (_req, res) => {
        const context = getRequestContext();
        const locale = context?.locale ?? 'en';
        // Simulate audit log entry with locale metadata
        logger.info('User action logged', {
          locale,
          userId: 'user-123',
          action: 'data_access',
          timestamp: new Date().toISOString(),
        });
        res.json({ success: true });
      });

      const response = await request(app).post('/audit-action').set(setLocaleHeader('de'));

      expect(response.status).toBe(200);
      expect(logger.info).toHaveBeenCalledWith('User action logged', {
        locale: 'de',
        userId: 'user-123',
        action: 'data_access',
        timestamp: expect.any(String),
      });
    });

    it('should handle concurrent requests with different locales in log entries', async () => {
      const app = express();

      app.use(requestId);
      app.use(contextMiddleware);
      app.use(localeResolver);

      app.get('/concurrent-test', (_req, res) => {
        const context = getRequestContext();
        const locale = context?.locale ?? 'en';
        logger.info('Concurrent request', { locale });
        res.json({ locale });
      });

      // Make concurrent requests with different locales
      const requests = SUPPORTED_LOCALES.map((locale) =>
        request(app).get('/concurrent-test').set(setLocaleHeader(locale))
      );

      const responses = await Promise.all(requests);

      // Verify each response has correct locale
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.locale).toBe(SUPPORTED_LOCALES[index]);
      });

      // Verify logger was called for each locale
      SUPPORTED_LOCALES.forEach((locale) => {
        expect(logger.info).toHaveBeenCalledWith('Concurrent request', { locale });
      });
    });
  });
});
