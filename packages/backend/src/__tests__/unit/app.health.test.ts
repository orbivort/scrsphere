import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import express, { type Application } from 'express';
import request from 'supertest';

interface EventLoopMetrics {
  min: number;
  max: number;
  mean: number;
  p50: number;
  p90: number;
  p99: number;
}

interface DatabaseHealthStatus {
  status: 'connected' | 'disconnected' | 'timeout';
  responseTime?: number;
  error?: string;
}

const createTestApp = (
  mockEventLoopMonitor: {
    getMetrics: Mock<(skipLogging?: boolean) => EventLoopMetrics>;
  },
  mockCheckHealth: Mock<(timeout: number) => Promise<DatabaseHealthStatus>>,
  config: {
    eventLoop: { warnThreshold: number; criticalThreshold: number };
  }
): Application => {
  const app = express();

  app.get('/health', async (_req, res) => {
    const eventLoopMetrics = mockEventLoopMonitor.getMetrics(true);

    let databaseHealth: DatabaseHealthStatus;
    try {
      databaseHealth = await mockCheckHealth(5000);
    } catch (error) {
      databaseHealth = {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (databaseHealth.status === 'disconnected' || databaseHealth.status === 'timeout') {
      status = 'unhealthy';
    } else if (eventLoopMetrics.max > config.eventLoop.criticalThreshold) {
      status = 'unhealthy';
    } else if (eventLoopMetrics.max > config.eventLoop.warnThreshold) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    const httpStatus = status === 'unhealthy' ? 503 : 200;

    res.status(httpStatus).json({
      success: status !== 'unhealthy',
      data: {
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        eventLoop: eventLoopMetrics,
        database: databaseHealth,
      },
    });
  });

  return app;
};

describe('Health Endpoint', () => {
  let app: Application;
  let mockEventLoopMonitor: {
    getMetrics: Mock<() => EventLoopMetrics>;
  };
  let mockCheckHealth: Mock<(timeout: number) => Promise<DatabaseHealthStatus>>;

  const defaultConfig = {
    eventLoop: {
      warnThreshold: 100,
      criticalThreshold: 500,
    },
  };

  const defaultMetrics: EventLoopMetrics = {
    min: 1,
    max: 50,
    mean: 25,
    p50: 20,
    p90: 40,
    p99: 45,
  };

  const highEventLoopMetrics: EventLoopMetrics = {
    min: 10,
    max: 150,
    mean: 80,
    p50: 70,
    p90: 120,
    p99: 140,
  };

  const criticalEventLoopMetrics: EventLoopMetrics = {
    min: 50,
    max: 600,
    mean: 300,
    p50: 280,
    p90: 500,
    p99: 580,
  };

  beforeEach(() => {
    mockEventLoopMonitor = {
      getMetrics: vi.fn<() => EventLoopMetrics>(),
    };
    mockCheckHealth = vi.fn<(timeout: number) => Promise<DatabaseHealthStatus>>();
    app = createTestApp(mockEventLoopMonitor, mockCheckHealth, defaultConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('healthy status', () => {
    it('should return 200 with healthy status when database is connected', async () => {
      mockEventLoopMonitor.getMetrics.mockReturnValue(defaultMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'connected', responseTime: 5 });

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.database.status).toBe('connected');
      expect(response.body.data.database.responseTime).toBe(5);
    });

    it('should include eventLoop metrics in response', async () => {
      mockEventLoopMonitor.getMetrics.mockReturnValue(defaultMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'connected', responseTime: 5 });

      const response = await request(app).get('/health');

      expect(response.body.data.eventLoop).toEqual(defaultMetrics);
    });

    it('should include database health in response', async () => {
      mockEventLoopMonitor.getMetrics.mockReturnValue(defaultMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'connected', responseTime: 10 });

      const response = await request(app).get('/health');

      expect(response.body.data.database).toEqual({
        status: 'connected',
        responseTime: 10,
      });
    });

    it('should include timestamp and uptime in response', async () => {
      mockEventLoopMonitor.getMetrics.mockReturnValue(defaultMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'connected', responseTime: 5 });

      const response = await request(app).get('/health');

      expect(response.body.data.timestamp).toBeDefined();
      expect(typeof response.body.data.timestamp).toBe('string');
      expect(response.body.data.uptime).toBeDefined();
      expect(typeof response.body.data.uptime).toBe('number');
    });
  });

  describe('unhealthy status', () => {
    it('should return 503 with unhealthy status when database is disconnected', async () => {
      mockEventLoopMonitor.getMetrics.mockReturnValue(defaultMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'disconnected', error: 'Connection refused' });

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('unhealthy');
      expect(response.body.data.database.status).toBe('disconnected');
      expect(response.body.data.database.error).toBe('Connection refused');
    });

    it('should return 503 with unhealthy status when database times out', async () => {
      mockEventLoopMonitor.getMetrics.mockReturnValue(defaultMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'timeout' });

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('unhealthy');
      expect(response.body.data.database.status).toBe('timeout');
    });

    it('should return 503 with unhealthy status when checkHealth throws an error', async () => {
      mockEventLoopMonitor.getMetrics.mockReturnValue(defaultMetrics);
      mockCheckHealth.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('unhealthy');
      expect(response.body.data.database.status).toBe('disconnected');
      expect(response.body.data.database.error).toBe('Database connection failed');
    });

    it('should return 503 with unhealthy status when event loop delay exceeds critical threshold', async () => {
      mockEventLoopMonitor.getMetrics.mockReturnValue(criticalEventLoopMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'connected', responseTime: 5 });

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('unhealthy');
      expect(response.body.data.eventLoop.max).toBe(600);
    });
  });

  describe('degraded status', () => {
    it('should return 200 with degraded status when event loop is high', async () => {
      mockEventLoopMonitor.getMetrics.mockReturnValue(highEventLoopMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'connected', responseTime: 5 });

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('degraded');
      expect(response.body.data.eventLoop.max).toBe(150);
    });

    it('should be degraded when max equals warn threshold plus one', async () => {
      const thresholdMetrics: EventLoopMetrics = {
        min: 1,
        max: 101,
        mean: 50,
        p50: 40,
        p90: 80,
        p99: 95,
      };
      mockEventLoopMonitor.getMetrics.mockReturnValue(thresholdMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'connected', responseTime: 5 });

      const response = await request(app).get('/health');

      expect(response.body.data.status).toBe('degraded');
    });

    it('should be healthy when max equals warn threshold', async () => {
      const thresholdMetrics: EventLoopMetrics = {
        min: 1,
        max: 100,
        mean: 50,
        p50: 40,
        p90: 80,
        p99: 95,
      };
      mockEventLoopMonitor.getMetrics.mockReturnValue(thresholdMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'connected', responseTime: 5 });

      const response = await request(app).get('/health');

      expect(response.body.data.status).toBe('healthy');
    });

    it('should be degraded when max equals critical threshold', async () => {
      const thresholdMetrics: EventLoopMetrics = {
        min: 1,
        max: 500,
        mean: 250,
        p50: 200,
        p90: 400,
        p99: 480,
      };
      mockEventLoopMonitor.getMetrics.mockReturnValue(thresholdMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'connected', responseTime: 5 });

      const response = await request(app).get('/health');

      expect(response.body.data.status).toBe('degraded');
    });

    it('should be unhealthy when max exceeds critical threshold by one', async () => {
      const thresholdMetrics: EventLoopMetrics = {
        min: 1,
        max: 501,
        mean: 250,
        p50: 200,
        p90: 400,
        p99: 480,
      };
      mockEventLoopMonitor.getMetrics.mockReturnValue(thresholdMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'connected', responseTime: 5 });

      const response = await request(app).get('/health');

      expect(response.body.data.status).toBe('unhealthy');
      expect(response.status).toBe(503);
    });
  });

  describe('response structure', () => {
    it('should include eventLoop object with all metrics', async () => {
      mockEventLoopMonitor.getMetrics.mockReturnValue(defaultMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'connected', responseTime: 5 });

      const response = await request(app).get('/health');

      expect(response.body.data.eventLoop).toHaveProperty('min');
      expect(response.body.data.eventLoop).toHaveProperty('max');
      expect(response.body.data.eventLoop).toHaveProperty('mean');
      expect(response.body.data.eventLoop).toHaveProperty('p50');
      expect(response.body.data.eventLoop).toHaveProperty('p90');
      expect(response.body.data.eventLoop).toHaveProperty('p99');
    });

    it('should include database object with status', async () => {
      mockEventLoopMonitor.getMetrics.mockReturnValue(defaultMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'connected', responseTime: 5 });

      const response = await request(app).get('/health');

      expect(response.body.data.database).toHaveProperty('status');
    });

    it('should have correct response shape for success', async () => {
      mockEventLoopMonitor.getMetrics.mockReturnValue(defaultMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'connected', responseTime: 5 });

      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('eventLoop');
      expect(response.body.data).toHaveProperty('database');
    });
  });

  describe('priority of health issues', () => {
    it('should prioritize database issues over event loop issues', async () => {
      mockEventLoopMonitor.getMetrics.mockReturnValue(highEventLoopMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'disconnected', error: 'Connection lost' });

      const response = await request(app).get('/health');

      expect(response.body.data.status).toBe('unhealthy');
      expect(response.status).toBe(503);
    });

    it('should prioritize timeout over event loop issues', async () => {
      mockEventLoopMonitor.getMetrics.mockReturnValue(highEventLoopMetrics);
      mockCheckHealth.mockResolvedValue({ status: 'timeout' });

      const response = await request(app).get('/health');

      expect(response.body.data.status).toBe('unhealthy');
      expect(response.status).toBe(503);
    });
  });
});
