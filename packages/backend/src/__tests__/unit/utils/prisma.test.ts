// Unit tests for prisma module
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set DATABASE_URL before any imports to satisfy module-level validation
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/testdb';

// Mock dotenv/config
vi.mock('dotenv/config', () => ({}));

// Mock logger
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};
vi.mock('../../../utils/logger', () => ({
  logger: mockLogger,
}));

// Mock PrismaPg adapter - must be a class constructor
const mockPrismaPg = vi.fn();
vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class MockPrismaPg {
    constructor(args: { connectionString: string }) {
      mockPrismaPg(args);
    }
    adapter = 'mocked';
  },
}));

// Mock PrismaClient - must be a class constructor
const mockOn = vi.fn();
const mockQueryRaw = vi.fn();
const mockDisconnect = vi.fn();
const mockPrismaClientArgs = vi.fn();

vi.mock('../../../generated/prisma/client', () => ({
  PrismaClient: class MockPrismaClient {
    $on = mockOn;
    $queryRaw = mockQueryRaw;
    $disconnect = mockDisconnect;
    constructor(args: unknown) {
      mockPrismaClientArgs(args);
    }
  },
}));

// Create a mock for process.exit that we can track
const mockExitFn = vi.fn().mockImplementation((() => undefined) as never);

describe('prisma module', () => {
  const originalEnv = process.env;
  let originalExit: typeof process.exit;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb' };
    // Replace process.exit with our mock before each test
    originalExit = process.exit;
    process.exit = mockExitFn as never;
  });

  afterEach(() => {
    process.env = originalEnv;
    process.exit = originalExit;
    vi.restoreAllMocks();
  });

  describe('DATABASE_URL validation', () => {
    it('should throw error when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL;

      await expect(import(`../../../utils/prisma?test=${Date.now()}`)).rejects.toThrow(
        'DATABASE_URL environment variable is required'
      );
    });
  });

  describe('PrismaPg adapter initialization', () => {
    it('should create PrismaPg adapter with connection string from env', async () => {
      // Need to re-import with fresh module to trigger constructor calls
      vi.resetModules();
      await import('../../../utils/prisma');

      expect(mockPrismaPg).toHaveBeenCalledWith({
        connectionString: 'postgresql://user:pass@localhost:5432/testdb',
      });
    });

    it('should create PrismaPg adapter with different connection string', async () => {
      process.env.DATABASE_URL = 'postgresql://admin:secret@prod-db:5432/proddb';

      vi.resetModules();
      await import('../../../utils/prisma');

      expect(mockPrismaPg).toHaveBeenCalledWith({
        connectionString: 'postgresql://admin:secret@prod-db:5432/proddb',
      });
    });
  });

  describe('PrismaClient initialization', () => {
    it('should create PrismaClient with adapter and log configuration', async () => {
      vi.resetModules();
      await import('../../../utils/prisma');

      expect(mockPrismaClientArgs).toHaveBeenCalledWith({
        adapter: expect.objectContaining({ adapter: 'mocked' }),
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ],
      });
    });
  });

  describe('query event listener', () => {
    it('should register query event listener', async () => {
      vi.resetModules();
      await import('../../../utils/prisma');

      expect(mockOn).toHaveBeenCalledWith('query', expect.any(Function));
    });

    it('should log warning for slow queries (>1000ms)', async () => {
      vi.resetModules();
      await import('../../../utils/prisma');

      const queryHandler = mockOn.mock.calls.find((call) => call[0] === 'query')?.[1];
      expect(queryHandler).toBeDefined();

      queryHandler({
        duration: 1500,
        query: 'SELECT * FROM users',
        params: '[]',
      });

      expect(mockLogger.warn).toHaveBeenCalledWith('Slow query detected', {
        query: 'SELECT * FROM users',
        duration: '1500ms',
        params: '[]',
      });
    });

    it('should not log warning for fast queries (<=1000ms)', async () => {
      vi.resetModules();
      await import('../../../utils/prisma');

      const queryHandler = mockOn.mock.calls.find((call) => call[0] === 'query')?.[1];
      expect(queryHandler).toBeDefined();

      queryHandler({
        duration: 500,
        query: 'SELECT * FROM users',
        params: '[]',
      });

      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should handle query at exactly 1000ms boundary', async () => {
      vi.resetModules();
      await import('../../../utils/prisma');

      const queryHandler = mockOn.mock.calls.find((call) => call[0] === 'query')?.[1];
      expect(queryHandler).toBeDefined();

      queryHandler({
        duration: 1000,
        query: 'SELECT * FROM users',
        params: '[]',
      });

      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should handle queries with empty params', async () => {
      vi.resetModules();
      await import('../../../utils/prisma');

      const queryHandler = mockOn.mock.calls.find((call) => call[0] === 'query')?.[1];
      expect(queryHandler).toBeDefined();

      queryHandler({
        duration: 2000,
        query: 'SELECT 1',
        params: '',
      });

      expect(mockLogger.warn).toHaveBeenCalledWith('Slow query detected', {
        query: 'SELECT 1',
        duration: '2000ms',
        params: '',
      });
    });
  });

  describe('health check interval', () => {
    let originalNodeEnv: string | undefined;

    beforeEach(() => {
      vi.useFakeTimers();
      originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      vi.useRealTimers();
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should run health check every 30 seconds', async () => {
      mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);

      vi.resetModules();
      await import('../../../utils/prisma');

      expect(mockQueryRaw).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(30000);
      expect(mockQueryRaw).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(30000);
      expect(mockQueryRaw).toHaveBeenCalledTimes(2);
    });

    it('should log debug on successful health check', async () => {
      mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);

      vi.resetModules();
      await import('../../../utils/prisma');

      await vi.advanceTimersByTimeAsync(30000);

      expect(mockLogger.debug).toHaveBeenCalledWith('Database connection healthy');
    });

    it('should log error on failed health check', async () => {
      const dbError = new Error('Connection lost');
      mockQueryRaw.mockRejectedValue(dbError);

      vi.resetModules();
      await import('../../../utils/prisma');

      await vi.advanceTimersByTimeAsync(30000);

      expect(mockLogger.error).toHaveBeenCalledWith('Database connection unhealthy', {
        error: dbError,
      });
    });

    it('should continue running health checks after failure', async () => {
      mockQueryRaw
        .mockRejectedValueOnce(new Error('Connection lost'))
        .mockResolvedValueOnce([{ '?column?': 1 }]);

      vi.resetModules();
      await import('../../../utils/prisma');

      await vi.advanceTimersByTimeAsync(30000);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(30000);
      expect(mockQueryRaw).toHaveBeenCalledTimes(2);
      expect(mockLogger.debug).toHaveBeenCalledWith('Database connection healthy');
    });
  });

  describe('checkHealth', () => {
    let originalNodeEnv: string | undefined;

    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      vi.useRealTimers();
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should return connected status with response time on success', async () => {
      mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);

      vi.resetModules();
      const { checkHealth } = await import('../../../utils/prisma');
      const result = await checkHealth(5000);

      expect(result.status).toBe('connected');
      expect(result.responseTime).toBeDefined();
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it('should return disconnected status on error', async () => {
      mockQueryRaw.mockRejectedValue(new Error('Connection refused'));

      vi.resetModules();
      const { checkHealth } = await import('../../../utils/prisma');
      const result = await checkHealth(5000);

      expect(result.status).toBe('disconnected');
      expect(result.error).toBe('Connection refused');
      expect(result.responseTime).toBeUndefined();
    });

    it('should return timeout status when query exceeds timeout', async () => {
      mockQueryRaw.mockImplementation(() => new Promise(() => {}));

      vi.resetModules();
      const { checkHealth } = await import('../../../utils/prisma');
      const resultPromise = checkHealth(100);

      await vi.advanceTimersByTimeAsync(150);
      const result = await resultPromise;

      expect(result.status).toBe('timeout');
      expect(result.responseTime).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it('should use default timeout of 5000ms', async () => {
      mockQueryRaw.mockImplementation(() => new Promise(() => {}));

      vi.resetModules();
      const { checkHealth } = await import('../../../utils/prisma');
      const resultPromise = checkHealth();

      await vi.advanceTimersByTimeAsync(5100);
      const result = await resultPromise;

      expect(result.status).toBe('timeout');
    });

    it('should handle non-Error objects', async () => {
      mockQueryRaw.mockRejectedValue('string error');

      vi.resetModules();
      const { checkHealth } = await import('../../../utils/prisma');
      const result = await checkHealth(5000);

      expect(result.status).toBe('disconnected');
      expect(result.error).toBe('Unknown error');
    });

    it('should handle null error', async () => {
      mockQueryRaw.mockRejectedValue(null);

      vi.resetModules();
      const { checkHealth } = await import('../../../utils/prisma');
      const result = await checkHealth(5000);

      expect(result.status).toBe('disconnected');
      expect(result.error).toBe('Unknown error');
    });

    it('should log error on health check failure', async () => {
      const dbError = new Error('Database is down');
      mockQueryRaw.mockRejectedValue(dbError);

      vi.resetModules();
      const { checkHealth } = await import('../../../utils/prisma');
      await checkHealth(5000);

      expect(mockLogger.error).toHaveBeenCalledWith('Database health check failed', {
        error: dbError,
      });
    });
  });

  describe('disconnectPrisma', () => {
    it('should clear interval and disconnect from database', async () => {
      mockDisconnect.mockResolvedValue(undefined);

      vi.resetModules();
      const { disconnectPrisma } = await import('../../../utils/prisma');
      await disconnectPrisma();

      expect(mockDisconnect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Disconnected from database');
    });

    it('should log error and exit process on disconnect failure', async () => {
      const disconnectError = new Error('Disconnect failed');
      mockDisconnect.mockRejectedValue(disconnectError);

      vi.resetModules();
      const { disconnectPrisma } = await import('../../../utils/prisma');
      await disconnectPrisma();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to disconnect from database', {
        error: disconnectError,
      });
      expect(mockExitFn).toHaveBeenCalledWith(1);
    });

    it('should handle non-Error disconnect failures', async () => {
      mockDisconnect.mockRejectedValue('disconnect string error');

      vi.resetModules();
      const { disconnectPrisma } = await import('../../../utils/prisma');
      await disconnectPrisma();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to disconnect from database', {
        error: 'disconnect string error',
      });
      expect(mockExitFn).toHaveBeenCalledWith(1);
    });
  });

  describe('default export', () => {
    it('should export prisma client instance', async () => {
      vi.resetModules();
      const prismaModule = await import('../../../utils/prisma');

      expect(prismaModule.default).toBeDefined();
      expect(prismaModule.default.$on).toBeDefined();
      expect(prismaModule.default.$queryRaw).toBeDefined();
      expect(prismaModule.default.$disconnect).toBeDefined();
    });
  });
});
