import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock config
vi.mock('../../../config', () => ({
  default: {
    database: {
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeoutMs: 30000,
      },
      transaction: {
        default: {
          maxWait: 5000,
          timeout: 10000,
          retries: 3,
        },
        startSprint: {
          maxWait: 10000,
          timeout: 30000,
          retries: 5,
        },
      },
    },
  },
}));

// Mock prisma
vi.mock('../../../utils/prisma', () => ({
  default: {
    $transaction: vi.fn(),
  },
}));

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import prisma from '../../../utils/prisma';
import { logger } from '../../../utils/logger';
import {
  withTransaction,
  withCircuitBreaker,
  withTransactionAndCircuitBreaker,
  databaseCircuitBreaker,
  isRetryableError,
  TRANSACTION_CONFIG,
} from '../../../utils/dbTransaction';

describe('dbTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseCircuitBreaker.reset();
  });

  describe('withTransaction', () => {
    it('should execute callback within transaction', async () => {
      const mockCallback = vi.fn().mockResolvedValue('result');
      const mockTx = { test: 'transaction' };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any, _opts: any) => {
        return callback(mockTx);
      });

      const result = await withTransaction(mockCallback);

      expect(result).toBe('result');
      expect(mockCallback).toHaveBeenCalledWith(mockTx);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should pass options to prisma transaction', async () => {
      const mockCallback = vi.fn().mockResolvedValue('result');
      const options = { timeout: 5000, maxWait: 5000 };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any, opts: any) => {
        expect(opts).toMatchObject(options);
        return callback({});
      });

      await withTransaction(mockCallback, options);
    });

    it('should retry on retryable error and eventually succeed', async () => {
      const mockCallback = vi.fn().mockResolvedValue('success');
      const retryableError = { code: 'P2034', message: 'Deadlock' };

      vi.mocked(prisma.$transaction)
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce('success');

      const result = await withTransaction(mockCallback, { retries: 3, retryDelay: 10 });

      expect(result).toBe('success');
      expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    });

    it('should throw error after exhausting all retries', async () => {
      const mockCallback = vi.fn().mockResolvedValue('success');
      const retryableError = { code: 'P2034', message: 'Deadlock' };

      vi.mocked(prisma.$transaction).mockRejectedValue(retryableError);

      await expect(withTransaction(mockCallback, { retries: 2, retryDelay: 10 })).rejects.toEqual(
        retryableError
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable error', async () => {
      const mockCallback = vi.fn().mockResolvedValue('success');
      const nonRetryableError = new Error('Validation error');

      vi.mocked(prisma.$transaction).mockRejectedValue(nonRetryableError);

      await expect(withTransaction(mockCallback)).rejects.toThrow('Validation error');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should handle callback that returns a value', async () => {
      const expectedResult = { id: 'test-id', name: 'Test' };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any, _opts: any) => {
        return callback({});
      });

      const result = await withTransaction(async () => expectedResult);

      expect(result).toEqual(expectedResult);
    });

    it('should handle callback that returns null', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any, _opts: any) => {
        return callback({});
      });

      const result = await withTransaction(async () => null);

      expect(result).toBeNull();
    });

    it('should handle callback that returns undefined', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any, _opts: any) => {
        return callback({});
      });

      const result = await withTransaction(async () => undefined);

      expect(result).toBeUndefined();
    });

    it('should handle async callback', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any, _opts: any) => {
        return callback({});
      });

      const result = await withTransaction(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'async result';
      });

      expect(result).toBe('async result');
    });

    it('should log warning when transaction approaches timeout', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any, _opts: any) => {
        return callback({});
      });

      // Mock Date.now to simulate slow transaction
      let callCount = 0;
      vi.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        // First call is start time, second call is end time (9 seconds later for 10 second timeout)
        return callCount === 1 ? 0 : 9000;
      });

      await withTransaction(async () => 'result', { timeout: 10000 });

      expect(logger.warn).toHaveBeenCalled();

      // Restore
      vi.spyOn(Date, 'now').mockRestore();
    });

    it('should log success after retry', async () => {
      const retryableError = { code: 'P2034', message: 'Deadlock' };

      vi.mocked(prisma.$transaction)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce('success');

      await withTransaction(async () => 'success', { retries: 3, retryDelay: 10 });

      expect(logger.info).toHaveBeenCalledWith(
        'Transaction succeeded after retry',
        expect.any(Object)
      );
    });
  });

  describe('withCircuitBreaker', () => {
    it('should return result on successful execution', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');

      const result = await withCircuitBreaker(mockOperation, 'test-operation');

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should open circuit breaker after repeated failures', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Database error'));

      // Exhaust the failure threshold
      for (let i = 0; i < 5; i++) {
        try {
          await withCircuitBreaker(mockOperation, 'test-operation');
        } catch {
          // Expected
        }
      }

      // Circuit breaker should now be open
      await expect(withCircuitBreaker(mockOperation, 'test-operation')).rejects.toThrow(
        'Database circuit breaker is OPEN'
      );
    });

    it('should reset circuit breaker on success after failures', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Database error'));
      const successOperation = vi.fn().mockResolvedValue('success');

      // Cause some failures but not enough to open
      for (let i = 0; i < 2; i++) {
        try {
          await withCircuitBreaker(failingOperation, 'test-operation');
        } catch {
          // Expected
        }
      }

      // Success should reset
      await withCircuitBreaker(successOperation, 'test-operation');

      const status = databaseCircuitBreaker.getStatus();
      expect(status.failures).toBe(0);
    });

    it('should log circuit breaker open event', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Database error'));

      // Exhaust the failure threshold
      for (let i = 0; i < 5; i++) {
        try {
          await withCircuitBreaker(mockOperation, 'test-operation');
        } catch {
          // Expected
        }
      }

      expect(logger.error).toHaveBeenCalledWith(
        'Database circuit breaker opened due to repeated failures',
        expect.any(Object)
      );
    });
  });

  describe('withTransactionAndCircuitBreaker', () => {
    it('should execute transaction with circuit breaker', async () => {
      const mockCallback = vi.fn().mockResolvedValue('result');

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any, _opts: any) => {
        return callback({});
      });

      const result = await withTransactionAndCircuitBreaker(mockCallback, {
        operationName: 'test-transaction',
      });

      expect(result).toBe('result');
    });

    it('should reject when circuit breaker is open', async () => {
      // Open the circuit breaker first
      const failingOperation = vi.fn().mockRejectedValue(new Error('Database error'));

      for (let i = 0; i < 5; i++) {
        try {
          await withCircuitBreaker(failingOperation, 'test-operation');
        } catch {
          // Expected
        }
      }

      // Now try with transaction
      const mockCallback = vi.fn().mockResolvedValue('result');

      await expect(
        withTransactionAndCircuitBreaker(mockCallback, { operationName: 'test-transaction' })
      ).rejects.toThrow('Database circuit breaker is OPEN');
    });
  });

  describe('databaseCircuitBreaker', () => {
    it('should return status', () => {
      const status = databaseCircuitBreaker.getStatus();

      expect(status).toHaveProperty('isOpen');
      expect(status).toHaveProperty('failures');
      expect(status).toHaveProperty('lastFailure');
    });

    it('should reset manually', () => {
      // Add some failures
      const failingOperation = vi.fn().mockRejectedValue(new Error('Database error'));

      for (let i = 0; i < 3; i++) {
        withCircuitBreaker(failingOperation, 'test-operation').catch(() => {
          // Expected
        });
      }

      databaseCircuitBreaker.reset();

      const status = databaseCircuitBreaker.getStatus();
      expect(status.failures).toBe(0);
      expect(status.isOpen).toBe(false);
      expect(logger.info).toHaveBeenCalledWith('Database circuit breaker manually reset');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable error codes', () => {
      const error = { code: 'P2034', message: 'Deadlock' };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for P2028 error code', () => {
      const error = { code: 'P2028', message: 'Transaction error' };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for P2014 error code', () => {
      const error = { code: 'P2014', message: 'Relation error' };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for non-retryable error codes', () => {
      const error = { code: 'P2002', message: 'Unique constraint' };
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for errors without code', () => {
      const error = new Error('Validation error');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for null error', () => {
      expect(isRetryableError(null)).toBe(false);
    });

    it('should return false for undefined error', () => {
      expect(isRetryableError(undefined)).toBe(false);
    });

    it('should return false for string error', () => {
      expect(isRetryableError('error')).toBe(false);
    });
  });

  describe('TRANSACTION_CONFIG', () => {
    it('should have START_SPRINT config', () => {
      expect(TRANSACTION_CONFIG.START_SPRINT).toBeDefined();
      expect(TRANSACTION_CONFIG.START_SPRINT.maxWait).toBe(10000);
      expect(TRANSACTION_CONFIG.START_SPRINT.timeout).toBe(30000);
      expect(TRANSACTION_CONFIG.START_SPRINT.retries).toBe(5);
    });

    it('should have DEFAULT config', () => {
      expect(TRANSACTION_CONFIG.DEFAULT).toBeDefined();
      expect(TRANSACTION_CONFIG.DEFAULT.maxWait).toBe(5000);
      expect(TRANSACTION_CONFIG.DEFAULT.timeout).toBe(10000);
      expect(TRANSACTION_CONFIG.DEFAULT.retries).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle withTransaction with zero retries', async () => {
      const mockCallback = vi.fn().mockResolvedValue('result');

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any, _opts: any) => {
        return callback({});
      });

      const result = await withTransaction(mockCallback, { retries: 0 });

      expect(result).toBe('result');
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should handle withTransaction with very short retry delay', async () => {
      const retryableError = { code: 'P2034', message: 'Deadlock' };

      vi.mocked(prisma.$transaction)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce('success');

      const result = await withTransaction(async () => 'success', { retries: 3, retryDelay: 1 });

      expect(result).toBe('success');
    });

    it('should handle transaction callback that throws', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any, _opts: any) => {
        return callback({});
      });

      await expect(
        withTransaction(async () => {
          throw new Error('Callback error');
        })
      ).rejects.toThrow('Callback error');
    });

    it('should handle transaction callback that returns a promise', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any, _opts: any) => {
        return callback({});
      });

      const result = await withTransaction(async () => {
        return Promise.resolve('promise result');
      });

      expect(result).toBe('promise result');
    });

    it('should handle concurrent transactions', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any, _opts: any) => {
        return callback({});
      });

      const results = await Promise.all([
        withTransaction(async () => 'transaction 1'),
        withTransaction(async () => 'transaction 2'),
        withTransaction(async () => 'transaction 3'),
      ]);

      expect(results).toEqual(['transaction 1', 'transaction 2', 'transaction 3']);
    });

    it('should handle withTransaction with operationName', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Database error'));

      try {
        await withTransaction(async () => 'result', { operationName: 'custom-operation' });
      } catch {
        // Expected
      }

      expect(logger.error).toHaveBeenCalledWith(
        'Transaction failed',
        expect.objectContaining({
          operation: 'custom-operation',
        })
      );
    });

    it('should handle circuit breaker reset after timeout', async () => {
      // Open the circuit breaker
      const failingOperation = vi.fn().mockRejectedValue(new Error('Database error'));

      for (let i = 0; i < 5; i++) {
        try {
          await withCircuitBreaker(failingOperation, 'test-operation');
        } catch {
          // Expected
        }
      }

      // Verify it's open
      let status = databaseCircuitBreaker.getStatus();
      expect(status.isOpen).toBe(true);

      // Manually reset for testing
      databaseCircuitBreaker.reset();

      status = databaseCircuitBreaker.getStatus();
      expect(status.isOpen).toBe(false);
    });

    it('should handle withTransaction with custom maxWait and timeout', async () => {
      const options = { maxWait: 1000, timeout: 2000 };

      vi.mocked(prisma.$transaction).mockImplementation(async (_callback: any, opts: any) => {
        expect(opts.maxWait).toBe(1000);
        expect(opts.timeout).toBe(2000);
        return 'result';
      });

      await withTransaction(async () => 'result', options);
    });

    it('should log error when transaction exhausts all retries', async () => {
      const retryableError = { code: 'P2034', message: 'Deadlock' };

      vi.mocked(prisma.$transaction).mockRejectedValue(retryableError);

      try {
        await withTransaction(async () => 'result', { retries: 1, retryDelay: 10 });
      } catch {
        // Expected
      }

      expect(logger.error).toHaveBeenCalledWith(
        'Transaction exhausted all retries',
        expect.any(Object)
      );
    });
  });
});
