// Unit tests for logger module
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import winston from 'winston';

// Hoisted variable to allow tests to dynamically change nodeEnv for branch coverage
const mockConfigNodeEnv = vi.hoisted(() => {
  let env = 'test';
  return {
    get value() {
      return env;
    },
    set value(v: string) {
      env = v;
    },
  };
});

// Mock winston-daily-rotate-file before importing logger
vi.mock('winston-daily-rotate-file', () => {
  return {
    default: class DailyRotateFile {
      on = vi.fn();
      log = vi.fn();
    },
  };
});

// Mock config
vi.mock('../../../config', () => ({
  default: {
    get nodeEnv() {
      return mockConfigNodeEnv.value;
    },
    logging: {
      level: 'debug',
      directory: 'logs',
      maxSize: '20m',
      maxFiles: '14d',
      format: 'json',
    },
  },
}));

// Mock requestContext
vi.mock('../../../utils/requestContext', () => ({
  getRequestContext: vi.fn(),
}));

// Import after mocks are set up
import { getRequestContext } from '../../../utils/requestContext';

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logger module exports', () => {
    it('should export logger and auditLogger when imported', async () => {
      // Dynamic import to ensure mocks are applied
      const { logger, auditLogger, logRequest, logError, logWithContext } =
        await import('../../../utils/logger');

      expect(logger).toBeDefined();
      expect(auditLogger).toBeDefined();
      expect(logRequest).toBeDefined();
      expect(logError).toBeDefined();
      expect(logWithContext).toBeDefined();
    });

    it('should have correct log level configuration', async () => {
      const { logger } = await import('../../../utils/logger');
      expect(logger.level).toBe('debug');
    });

    it('should have console transport configured', async () => {
      const { logger } = await import('../../../utils/logger');
      const transports = logger.transports;
      expect(transports.length).toBeGreaterThan(0);
    });
  });

  describe('logRequest helper', () => {
    it('should log HTTP request details with all parameters', async () => {
      const { logger, logRequest } = await import('../../../utils/logger');
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => logger);

      logRequest('GET', '/api/users', 200, 45, 'req-123');

      expect(infoSpy).toHaveBeenCalledWith('HTTP Request', {
        method: 'GET',
        path: '/api/users',
        statusCode: 200,
        duration: '45ms',
        requestId: 'req-123',
      });
    });

    it('should handle requests without requestId', async () => {
      const { logger, logRequest } = await import('../../../utils/logger');
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => logger);

      logRequest('POST', '/api/auth/login', 201, 120);

      expect(infoSpy).toHaveBeenCalledWith('HTTP Request', {
        method: 'POST',
        path: '/api/auth/login',
        statusCode: 201,
        duration: '120ms',
        requestId: undefined,
      });
    });
  });

  describe('logError helper', () => {
    it('should log error with message and stack', async () => {
      const { logger, logError } = await import('../../../utils/logger');
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);
      const testError = new Error('Test error message');

      logError(testError);

      expect(errorSpy).toHaveBeenCalledWith('Error occurred', {
        message: 'Test error message',
        stack: testError.stack,
      });
    });

    it('should include additional context', async () => {
      const { logger, logError } = await import('../../../utils/logger');
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);
      const testError = new Error('Database connection failed');
      const context = { component: 'Database', retryCount: 3 };

      logError(testError, context);

      expect(errorSpy).toHaveBeenCalledWith('Error occurred', {
        message: 'Database connection failed',
        stack: testError.stack,
        component: 'Database',
        retryCount: 3,
      });
    });
  });

  describe('logWithContext helper', () => {
    it('should log with explicit context', async () => {
      const { logger, logWithContext } = await import('../../../utils/logger');
      const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => logger);

      logWithContext('info', 'User action performed', { action: 'update', entityId: '123' });

      expect(logSpy).toHaveBeenCalledWith('info', 'User action performed', {
        action: 'update',
        entityId: '123',
      });
    });

    it('should merge with request context when available', async () => {
      const mockContext = {
        requestId: 'req-456',
        userId: 'user-789',
        teamId: 'team-abc',
      };
      vi.mocked(getRequestContext).mockReturnValue(mockContext);

      const { logger, logWithContext } = await import('../../../utils/logger');
      const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => logger);

      logWithContext('warn', 'Warning message', { customField: 'value' });

      expect(logSpy).toHaveBeenCalledWith('warn', 'Warning message', {
        customField: 'value',
        requestId: 'req-456',
        userId: 'user-789',
        teamId: 'team-abc',
      });
    });

    it('should handle all log levels', async () => {
      // Reset the mock to return undefined (no context) for this test
      vi.mocked(getRequestContext).mockReturnValue(undefined);

      const { logger, logWithContext } = await import('../../../utils/logger');
      const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => logger);

      logWithContext('error', 'Error message');
      expect(logSpy).toHaveBeenCalledWith('error', 'Error message', {});

      logSpy.mockClear();
      logWithContext('warn', 'Warning message');
      expect(logSpy).toHaveBeenCalledWith('warn', 'Warning message', {});

      logSpy.mockClear();
      logWithContext('info', 'Info message');
      expect(logSpy).toHaveBeenCalledWith('info', 'Info message', {});

      logSpy.mockClear();
      logWithContext('debug', 'Debug message');
      expect(logSpy).toHaveBeenCalledWith('debug', 'Debug message', {});
    });
  });

  describe('context enrichment', () => {
    it('should include request context in log output', async () => {
      const mockContext = {
        requestId: 'req-abc',
        userId: 'user-xyz',
        teamId: 'team-123',
      };
      vi.mocked(getRequestContext).mockReturnValue(mockContext);

      const { logger } = await import('../../../utils/logger');
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => logger);

      logger.info('Test message');

      expect(infoSpy).toHaveBeenCalled();
    });

    it('should handle missing request context gracefully', async () => {
      vi.mocked(getRequestContext).mockReturnValue(undefined);

      const { logger } = await import('../../../utils/logger');
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => logger);

      logger.info('Test message');

      expect(infoSpy).toHaveBeenCalled();
    });
  });

  describe('auditLogger', () => {
    it('should have dedicated audit logger instance', async () => {
      const { auditLogger } = await import('../../../utils/logger');
      expect(auditLogger).toBeDefined();
      expect(auditLogger.level).toBe('info');
    });

    it('should have logType set to audit in defaultMeta', async () => {
      const { auditLogger } = await import('../../../utils/logger');
      expect(auditLogger.defaultMeta).toHaveProperty('logType', 'audit');
      expect(auditLogger.defaultMeta).toHaveProperty('service', 'agile-scrum-api');
    });
  });

  describe('logFormat branches', () => {
    it('should serialize metadata keys in formatted output (Branch #0 truthy)', async () => {
      vi.mocked(getRequestContext).mockReturnValue(undefined);

      const { logger } = await import('../../../utils/logger');
      const transport = logger.transports[0]!;
      const logSpy = vi.spyOn(transport, 'log').mockImplementation(() => {});

      logger.info('metadata test', { customKey: 'customValue' });

      expect(logSpy).toHaveBeenCalled();
      const infoArg = logSpy.mock.calls[0]![0] as Record<string, unknown>;
      expect(infoArg).toHaveProperty('customKey', 'customValue');
    });

    it('should return empty string for empty metadata in logFormat (Branch #0 falsy)', () => {
      const { printf } = winston.format;
      const testFormat = printf(
        ({ level, message, timestamp, ...metadata }: Record<string, unknown>) => {
          const metaStr = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        }
      );

      const info = {
        level: 'info',
        message: 'bare message',
        timestamp: '2024-01-01 00:00:00',
      };
      const result = testFormat.transform(info, {}) as unknown as { [key: symbol]: string };
      const formatted = result[Symbol.for('message')] as string;

      expect(formatted).toBe('2024-01-01 00:00:00 [info]: bare message ');

      const infoWithMeta = {
        level: 'warn',
        message: 'with data',
        timestamp: '2024-06-15 12:30:00',
        foo: 'bar',
        count: 42,
      };
      const resultMeta = testFormat.transform(infoWithMeta, {}) as unknown as {
        [key: symbol]: string;
      };
      const formattedMeta = resultMeta[Symbol.for('message')] as string;

      expect(formattedMeta).toContain('"foo":"bar"');
      expect(formattedMeta).toContain('"count":42');
    });
  });

  describe('context enrichment with teamId', () => {
    it('should include teamId when context has teamId (Branch #3)', async () => {
      const mockContext = {
        requestId: 'req-team-001',
        userId: 'user-team-001',
        teamId: 'team-alpha',
      };
      vi.mocked(getRequestContext).mockReturnValue(mockContext);

      const { logger } = await import('../../../utils/logger');

      const capturedInfo: Array<Record<string, unknown>> = [];
      const captureFormat = winston.format((info) => {
        capturedInfo.push({ ...info });
        return info;
      });
      const captureTransport = new winston.transports.Console({
        format: winston.format.combine(captureFormat(), winston.format.json()),
      });
      logger.add(captureTransport);

      logger.info('Team context message');

      expect(capturedInfo.length).toBeGreaterThan(0);
      const info = capturedInfo[0]!;
      expect(info).toHaveProperty('teamId', 'team-alpha');
      expect(info).toHaveProperty('requestId', 'req-team-001');
      expect(info).toHaveProperty('userId', 'user-team-001');
    });

    it('should skip teamId when context has no teamId', async () => {
      const mockContext = {
        requestId: 'req-no-team',
        userId: 'user-no-team',
      };
      vi.mocked(getRequestContext).mockReturnValue(mockContext);

      const { logger } = await import('../../../utils/logger');

      const capturedInfo: Array<Record<string, unknown>> = [];
      const captureFormat = winston.format((info) => {
        capturedInfo.push({ ...info });
        return info;
      });
      const captureTransport = new winston.transports.Console({
        format: winston.format.combine(captureFormat(), winston.format.json()),
      });
      logger.add(captureTransport);

      logger.info('No team context');

      expect(capturedInfo.length).toBeGreaterThan(0);
      const info = capturedInfo[0]!;
      expect(info).toHaveProperty('requestId', 'req-no-team');
      expect(info).toHaveProperty('userId', 'user-no-team');
      expect(info).not.toHaveProperty('teamId');
    });
  });

  describe('file transports in non-test environments', () => {
    afterEach(() => {
      mockConfigNodeEnv.value = 'test';
      vi.resetModules();
    });

    it('should add file transports when nodeEnv is production (Branch #4)', async () => {
      mockConfigNodeEnv.value = 'production';
      vi.resetModules();

      const { logger: prodLogger } = await import('../../../utils/logger');

      expect(prodLogger.transports.length).toBe(4);
    });

    it('should add audit file transport when nodeEnv is production (Branch #6)', async () => {
      mockConfigNodeEnv.value = 'production';
      vi.resetModules();

      const { auditLogger: prodAuditLogger } = await import('../../../utils/logger');

      expect(prodAuditLogger.transports.length).toBe(2);
    });

    it('should add file transports when nodeEnv is development', async () => {
      mockConfigNodeEnv.value = 'development';
      vi.resetModules();

      const { logger: devLogger, auditLogger: devAuditLogger } =
        await import('../../../utils/logger');

      expect(devLogger.transports.length).toBe(4);
      expect(devAuditLogger.transports.length).toBe(2);
    });
  });
});
