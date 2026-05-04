import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { contextMiddleware } from '../../middleware/context.middleware';
import { requestId } from '../../middleware/requestId.middleware';
import { getRequestContext, updateRequestContext } from '../../utils/requestContext';
import { logger } from '../../utils/logger';

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
