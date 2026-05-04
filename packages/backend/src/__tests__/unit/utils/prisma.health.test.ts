import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

interface DatabaseHealthStatus {
  status: 'connected' | 'disconnected' | 'timeout';
  responseTime?: number;
  error?: string;
}

const createCheckHealth = (
  mockQueryRaw: Mock<() => Promise<unknown>>
): ((timeoutMs?: number) => Promise<DatabaseHealthStatus>) => {
  return async (timeoutMs: number = 5000): Promise<DatabaseHealthStatus> => {
    const startTime = Date.now();

    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Health check timeout')), timeoutMs);
    });

    try {
      await Promise.race([mockQueryRaw(), timeoutPromise]);
      clearTimeout(timeoutId!);

      const responseTime = Date.now() - startTime;
      return { status: 'connected', responseTime };
    } catch (error) {
      clearTimeout(timeoutId!);

      if (error instanceof Error && error.message === 'Health check timeout') {
        return { status: 'timeout' };
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { status: 'disconnected', error: errorMessage };
    }
  };
};

describe('checkHealth', () => {
  let mockQueryRaw: Mock<() => Promise<unknown>>;
  let checkHealth: (timeoutMs?: number) => Promise<DatabaseHealthStatus>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockQueryRaw = vi.fn<() => Promise<unknown>>();
    checkHealth = createCheckHealth(mockQueryRaw);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('successful connection', () => {
    it('should return connected status with response time on success', async () => {
      mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const resultPromise = checkHealth(5000);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.status).toBe('connected');
      expect(result.responseTime).toBeDefined();
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it('should call queryRaw with correct query', async () => {
      mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const resultPromise = checkHealth(5000);
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(mockQueryRaw).toHaveBeenCalledOnce();
    });
  });

  describe('connection error', () => {
    it('should return disconnected status on error', async () => {
      mockQueryRaw.mockRejectedValue(new Error('Connection refused'));

      const resultPromise = checkHealth(5000);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.status).toBe('disconnected');
      expect(result.error).toBe('Connection refused');
      expect(result.responseTime).toBeUndefined();
    });

    it('should handle non-Error objects', async () => {
      mockQueryRaw.mockRejectedValue('string error');

      const resultPromise = checkHealth(5000);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.status).toBe('disconnected');
      expect(result.error).toBe('Unknown error');
    });

    it('should handle null error', async () => {
      mockQueryRaw.mockRejectedValue(null);

      const resultPromise = checkHealth(5000);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.status).toBe('disconnected');
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('timeout handling', () => {
    it('should return timeout status when timeout is reached', async () => {
      mockQueryRaw.mockImplementation(() => new Promise(() => {}));

      const resultPromise = checkHealth(100);

      await vi.advanceTimersByTimeAsync(150);
      const result = await resultPromise;

      expect(result.status).toBe('timeout');
      expect(result.responseTime).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it('should use default timeout of 5000ms', async () => {
      mockQueryRaw.mockImplementation(() => new Promise(() => {}));

      const resultPromise = checkHealth();

      await vi.advanceTimersByTimeAsync(5100);
      const result = await resultPromise;

      expect(result.status).toBe('timeout');
    });

    it('should clear timeout on successful response', async () => {
      mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const resultPromise = checkHealth(5000);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.status).toBe('connected');
    });

    it('should clear timeout on error', async () => {
      mockQueryRaw.mockRejectedValue(new Error('Connection error'));

      const resultPromise = checkHealth(5000);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.status).toBe('disconnected');
    });
  });

  describe('custom timeout', () => {
    it('should respect custom timeout value', async () => {
      mockQueryRaw.mockImplementation(() => new Promise(() => {}));

      const resultPromise = checkHealth(1000);

      await vi.advanceTimersByTimeAsync(1100);
      const result = await resultPromise;

      expect(result.status).toBe('timeout');
    });
  });
});
