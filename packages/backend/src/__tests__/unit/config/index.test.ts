import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('dotenv', () => ({
  default: {
    config: vi.fn(),
  },
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(() => false),
  },
}));

vi.mock('node:crypto', () => ({
  default: {
    randomBytes: vi.fn(() => ({
      toString: vi.fn(() => 'a'.repeat(128)),
    })),
  },
}));

describe('config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('config object', () => {
    it('should have default server configuration', async () => {
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.API_PREFIX;

      const { config } = await import('../../../config');

      expect(config.nodeEnv).toBe('development');
      expect(config.port).toBe(5000);
      expect(config.apiPrefix).toBe('/api');
    });

    it('should use environment variables for server config', async () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000';
      process.env.API_PREFIX = '/api/v2';

      const { config } = await import('../../../config');

      expect(config.nodeEnv).toBe('production');
      expect(config.port).toBe(3000);
      expect(config.apiPrefix).toBe('/api/v2');
    });

    it('should have default JWT configuration', async () => {
      delete process.env.JWT_SECRET;
      delete process.env.JWT_EXPIRES_IN;
      delete process.env.JWT_REFRESH_EXPIRES_IN;

      const { config } = await import('../../../config');

      expect(config.jwt.secret).toBeDefined();
      expect(config.jwt.secret.length).toBeGreaterThanOrEqual(64);
      expect(config.jwt.expiresIn).toBe('15m');
      expect(config.jwt.refreshExpiresIn).toBe('7d');
    });

    it('should use custom JWT configuration from env', async () => {
      process.env.JWT_SECRET = 'a'.repeat(64);
      process.env.JWT_EXPIRES_IN = '30m';
      process.env.JWT_REFRESH_EXPIRES_IN = '14d';

      const { config } = await import('../../../config');

      expect(config.jwt.secret).toBe('a'.repeat(64));
      expect(config.jwt.expiresIn).toBe('30m');
      expect(config.jwt.refreshExpiresIn).toBe('14d');
    });

    it('should have default session configuration', async () => {
      delete process.env.SESSION_IDLE_TIMEOUT_MS;
      delete process.env.SESSION_ABSOLUTE_TIMEOUT_MS;
      delete process.env.SESSION_WARNING_THRESHOLD_MS;
      delete process.env.SESSION_CLEANUP_INTERVAL_MS;
      delete process.env.MAX_CONCURRENT_SESSIONS;

      const { config } = await import('../../../config');

      expect(config.session.idleTimeoutMs).toBe(1800000);
      expect(config.session.absoluteTimeoutMs).toBe(86400000);
      expect(config.session.warningThresholdMs).toBe(120000);
      expect(config.session.cleanupIntervalMs).toBe(3600000);
      expect(config.session.maxConcurrentSessions).toBe(5);
    });

    it('should have default bcrypt configuration', async () => {
      delete process.env.BCRYPT_SALT_ROUNDS;

      const { config } = await import('../../../config');

      expect(config.bcrypt.saltRounds).toBe(12);
    });

    it('should have default token hash configuration', async () => {
      delete process.env.TOKEN_HASH_ALGORITHM;

      const { config } = await import('../../../config');

      expect(config.tokenHash.algorithm).toBe('sha256');
    });

    it('should have default rate limiting configuration', async () => {
      delete process.env.RATE_LIMIT_WINDOW_MS;
      delete process.env.RATE_LIMIT_MAX_REQUESTS;

      const { config } = await import('../../../config');

      expect(config.rateLimit.windowMs).toBe(900000);
      expect(config.rateLimit.max).toBe(100);
    });

    it('should have default CORS configuration', async () => {
      delete process.env.CORS_ORIGIN;

      const { config } = await import('../../../config');

      expect(config.cors.origin).toEqual(['http://localhost:5173']);
    });

    it('should parse CORS_ORIGIN as comma-separated list', async () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000, http://example.com,https://api.example.com';

      const { config } = await import('../../../config');

      expect(config.cors.origin).toEqual([
        'http://localhost:3000',
        'http://example.com',
        'https://api.example.com',
      ]);
    });

    it('should have default logging configuration', async () => {
      delete process.env.LOG_LEVEL;
      delete process.env.LOG_DIR;
      delete process.env.LOG_MAX_FILES;
      delete process.env.LOG_MAX_SIZE;
      delete process.env.LOG_FORMAT;
      delete process.env.NODE_ENV;

      const { config } = await import('../../../config');

      expect(config.logging.level).toBe('debug');
      expect(config.logging.directory).toBe('logs');
      expect(config.logging.maxFiles).toBe('14d');
      expect(config.logging.maxSize).toBe('20m');
      expect(config.logging.format).toBe('json');
    });

    it('should use info log level in production by default', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.LOG_LEVEL;

      const { config } = await import('../../../config');

      expect(config.logging.level).toBe('info');
    });

    it('should have default notification configuration', async () => {
      delete process.env.NOTIFICATION_POLLING_INTERVAL_SECONDS;
      delete process.env.NOTIFICATION_RETENTION_DAYS;
      delete process.env.NOTIFICATION_CLEANUP_CRON;
      delete process.env.NOTIFICATION_MAX_PAGE_SIZE;

      const { config } = await import('../../../config');

      expect(config.notification.pollingIntervalMs).toBe(5000);
      expect(config.notification.retentionDays).toBe(30);
      expect(config.notification.cleanupCron).toBe('0 2 * * *');
      expect(config.notification.maxPageSize).toBe(50);
    });

    it('should enforce minimum notification polling interval of 1 second', async () => {
      process.env.NOTIFICATION_POLLING_INTERVAL_SECONDS = '0';

      const { config } = await import('../../../config');

      expect(config.notification.pollingIntervalMs).toBe(1000);
    });

    it('should enforce minimum notification max page size of 10', async () => {
      process.env.NOTIFICATION_MAX_PAGE_SIZE = '5';

      const { config } = await import('../../../config');

      expect(config.notification.maxPageSize).toBe(10);
    });

    it('should enforce maximum notification max page size of 100', async () => {
      process.env.NOTIFICATION_MAX_PAGE_SIZE = '200';

      const { config } = await import('../../../config');

      expect(config.notification.maxPageSize).toBe(100);
    });

    it('should have default event loop monitoring configuration', async () => {
      delete process.env.EVENT_LOOP_MONITORING_ENABLED;
      delete process.env.EVENT_LOOP_RESOLUTION;
      delete process.env.EVENT_LOOP_WARN_THRESHOLD;
      delete process.env.EVENT_LOOP_CRITICAL_THRESHOLD;

      const { config } = await import('../../../config');

      expect(config.eventLoop.resolution).toBe(10);
      expect(config.eventLoop.warnThreshold).toBe(100);
      expect(config.eventLoop.criticalThreshold).toBe(500);
    });

    it('should enable event loop monitoring by default in production', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.EVENT_LOOP_MONITORING_ENABLED;

      const { config } = await import('../../../config');

      expect(config.eventLoop.enabled).toBe(true);
    });

    it('should disable event loop monitoring by default in development', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.EVENT_LOOP_MONITORING_ENABLED;

      const { config } = await import('../../../config');

      expect(config.eventLoop.enabled).toBe(false);
    });

    it('should respect EVENT_LOOP_MONITORING_ENABLED env var', async () => {
      process.env.EVENT_LOOP_MONITORING_ENABLED = 'false';
      process.env.NODE_ENV = 'production';

      const { config } = await import('../../../config');

      expect(config.eventLoop.enabled).toBe(false);
    });

    it('should have default health check configuration', async () => {
      delete process.env.HEALTH_CHECK_DATABASE_TIMEOUT;

      const { config } = await import('../../../config');

      expect(config.healthCheck.databaseTimeout).toBe(5000);
    });

    it('should have default deletion configuration', async () => {
      const { config } = await import('../../../config');

      expect(config.deletion.scheduleConfirmationPhrase).toBe('SCHEDULE DELETION');
      expect(config.deletion.gracePeriodDays).toBe(14);
    });

    it('should have default database transaction configuration', async () => {
      delete process.env.DB_TRANSACTION_START_SPRINT_MAX_WAIT;
      delete process.env.DB_TRANSACTION_START_SPRINT_TIMEOUT;
      delete process.env.DB_TRANSACTION_START_SPRINT_RETRIES;
      delete process.env.DB_TRANSACTION_MAX_WAIT;
      delete process.env.DB_TRANSACTION_TIMEOUT;
      delete process.env.DB_TRANSACTION_RETRIES;
      delete process.env.DB_CIRCUIT_BREAKER_FAILURE_THRESHOLD;
      delete process.env.DB_CIRCUIT_BREAKER_RESET_TIMEOUT_MS;

      const { config } = await import('../../../config');

      expect(config.database.transaction.startSprint.maxWait).toBe(5000);
      expect(config.database.transaction.startSprint.timeout).toBe(15000);
      expect(config.database.transaction.startSprint.retries).toBe(2);
      expect(config.database.transaction.default.maxWait).toBe(5000);
      expect(config.database.transaction.default.timeout).toBe(10000);
      expect(config.database.transaction.default.retries).toBe(2);
      expect(config.database.circuitBreaker.failureThreshold).toBe(5);
      expect(config.database.circuitBreaker.resetTimeoutMs).toBe(60000);
    });
  });

  describe('validateConfig', () => {
    it('should throw error when DATABASE_URL is missing', async () => {
      delete process.env.DATABASE_URL;
      delete process.env.JWT_SECRET;

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).toThrow(
        'Missing required environment variables: DATABASE_URL, JWT_SECRET'
      );
    });

    it('should throw error when JWT_SECRET is missing', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      delete process.env.JWT_SECRET;

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).toThrow('Missing required environment variables: JWT_SECRET');
    });

    it('should not throw when all required env vars are set', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.JWT_SECRET = 'a'.repeat(64);

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).not.toThrow();
    });
  });

  describe('production validations', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:strongpassword@localhost:5432/db';
      process.env.CORS_ORIGIN = 'https://example.com';
    });

    const weakSecrets = [
      'your-super-secret-jwt-key',
      'secret',
      'password',
      'jwt-secret',
      'changeme',
      '123456',
      'dev-secret-key-not-for-production',
      'test-secret-key-for-integration-tests-only-not-for-production',
    ];

    weakSecrets.forEach((weakSecret) => {
      it(`should throw error for weak JWT_SECRET: "${weakSecret}"`, async () => {
        process.env.JWT_SECRET = weakSecret;

        const { validateConfig } = await import('../../../config');

        expect(() => validateConfig()).toThrow(
          'JWT_SECRET must be changed from default value in production'
        );
      });
    });

    it('should throw error when JWT_SECRET is less than 64 characters in production', async () => {
      process.env.JWT_SECRET = 'a'.repeat(63);

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).toThrow(
        'JWT_SECRET must be at least 64 characters in production'
      );
    });

    it('should accept JWT_SECRET with 64 or more characters in production', async () => {
      process.env.JWT_SECRET = 'a'.repeat(64);
      process.env.EMAIL_PROVIDER = 'smtp';
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASS = 'password123';
      process.env.EMAIL_FROM_ADDRESS = 'noreply@example.com';
      process.env.FRONTEND_URL = 'https://example.com';
      process.env.EMAIL_TEST_MODE = 'false';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).not.toThrow();
    });

    const weakPasswords = ['password', 'postgres', 'admin', 'root', '123456', 'changeme', 'test'];

    weakPasswords.forEach((weakPassword) => {
      it(`should throw error for weak password in DATABASE_URL: "${weakPassword}"`, async () => {
        process.env.JWT_SECRET = 'a'.repeat(64);
        process.env.DATABASE_URL = `postgresql://user:${weakPassword}@localhost:5432/db`;

        const { validateConfig } = await import('../../../config');

        expect(() => validateConfig()).toThrow(
          `DATABASE_URL contains a weak password '${weakPassword}'`
        );
      });
    });

    it('should throw error when CORS_ORIGIN contains localhost in production', async () => {
      process.env.JWT_SECRET = 'a'.repeat(64);
      process.env.CORS_ORIGIN = 'http://localhost:3000';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).toThrow(
        'CORS_ORIGIN contains localhost/127.0.0.1 (http://localhost:3000)'
      );
    });

    it('should throw error when CORS_ORIGIN contains 127.0.0.1 in production', async () => {
      process.env.JWT_SECRET = 'a'.repeat(64);
      process.env.CORS_ORIGIN = 'http://127.0.0.1:3000';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).toThrow(
        'CORS_ORIGIN contains localhost/127.0.0.1 (http://127.0.0.1:3000)'
      );
    });

    it('should not apply production validations in development mode', async () => {
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = 'secret';
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';
      process.env.CORS_ORIGIN = 'http://localhost:3000';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).not.toThrow();
    });
  });

  describe('notification configuration validation', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.JWT_SECRET = 'a'.repeat(64);
    });

    it('should accept zero retention days (disables cleanup)', async () => {
      process.env.NOTIFICATION_RETENTION_DAYS = '0';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).not.toThrow();
    });

    it('should accept valid notification max page size', async () => {
      process.env.NOTIFICATION_MAX_PAGE_SIZE = '25';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).not.toThrow();
    });
  });

  describe('event loop monitoring configuration validation', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.JWT_SECRET = 'a'.repeat(64);
    });

    it('should throw error when event loop resolution is not positive', async () => {
      process.env.EVENT_LOOP_RESOLUTION = '0';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).toThrow('EVENT_LOOP_RESOLUTION must be a positive integer');
    });

    it('should throw error when event loop resolution is negative', async () => {
      process.env.EVENT_LOOP_RESOLUTION = '-10';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).toThrow('EVENT_LOOP_RESOLUTION must be a positive integer');
    });

    it('should throw error when event loop warn threshold is not positive', async () => {
      process.env.EVENT_LOOP_WARN_THRESHOLD = '0';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).toThrow(
        'EVENT_LOOP_WARN_THRESHOLD must be a positive integer'
      );
    });

    it('should throw error when event loop critical threshold is not positive', async () => {
      process.env.EVENT_LOOP_CRITICAL_THRESHOLD = '0';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).toThrow(
        'EVENT_LOOP_CRITICAL_THRESHOLD must be a positive integer'
      );
    });

    it('should throw error when warn threshold >= critical threshold', async () => {
      process.env.EVENT_LOOP_WARN_THRESHOLD = '500';
      process.env.EVENT_LOOP_CRITICAL_THRESHOLD = '500';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).toThrow(
        'EVENT_LOOP_WARN_THRESHOLD must be less than EVENT_LOOP_CRITICAL_THRESHOLD'
      );
    });

    it('should throw error when warn threshold > critical threshold', async () => {
      process.env.EVENT_LOOP_WARN_THRESHOLD = '600';
      process.env.EVENT_LOOP_CRITICAL_THRESHOLD = '500';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).toThrow(
        'EVENT_LOOP_WARN_THRESHOLD must be less than EVENT_LOOP_CRITICAL_THRESHOLD'
      );
    });

    it('should accept valid event loop configuration', async () => {
      process.env.EVENT_LOOP_RESOLUTION = '10';
      process.env.EVENT_LOOP_WARN_THRESHOLD = '100';
      process.env.EVENT_LOOP_CRITICAL_THRESHOLD = '500';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).not.toThrow();
    });
  });

  describe('health check configuration validation', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.JWT_SECRET = 'a'.repeat(64);
    });

    it('should throw error when health check database timeout is not positive', async () => {
      process.env.HEALTH_CHECK_DATABASE_TIMEOUT = '0';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).toThrow(
        'HEALTH_CHECK_DATABASE_TIMEOUT must be a positive integer'
      );
    });

    it('should throw error when health check database timeout is negative', async () => {
      process.env.HEALTH_CHECK_DATABASE_TIMEOUT = '-1000';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).toThrow(
        'HEALTH_CHECK_DATABASE_TIMEOUT must be a positive integer'
      );
    });

    it('should accept valid health check configuration', async () => {
      process.env.HEALTH_CHECK_DATABASE_TIMEOUT = '5000';

      const { validateConfig } = await import('../../../config');

      expect(() => validateConfig()).not.toThrow();
    });
  });

  describe('replayDeferredLogs', () => {
    it('should export replayDeferredLogs function', async () => {
      const { replayDeferredLogs } = await import('../../../config');

      expect(replayDeferredLogs).toBeDefined();
      expect(typeof replayDeferredLogs).toBe('function');
    });

    it('should not throw when called', async () => {
      const { replayDeferredLogs } = await import('../../../config');

      expect(() => replayDeferredLogs()).not.toThrow();
    });
  });
});
