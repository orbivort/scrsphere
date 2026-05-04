import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  WorkflowLockService,
  WorkflowLockKey,
  LOCK_KEY_PREFIX,
} from '../../../services/workflow-lock.service';
import prisma from '../../../utils/prisma';
import logger from '../../../utils/logger';

vi.mock('../../../utils/prisma', () => ({
  default: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock('../../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('WorkflowLockService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('acquireLock', () => {
    it('should acquire lock successfully on first attempt', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ pg_try_advisory_lock: true }]);

      const result = await WorkflowLockService.acquireLock('product_backlog_item');

      expect(result.acquired).toBe(true);
      expect(result.entityType).toBe('product_backlog_item');
      expect(result.lockKey).toBe(WorkflowLockKey.BacklogItem);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        'Workflow lock acquired successfully',
        expect.any(Object)
      );
    });

    it('should return acquired false when lock cannot be acquired', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ pg_try_advisory_lock: false }]);

      const result = await WorkflowLockService.acquireLock('task', 50);

      expect(result.acquired).toBe(false);
      expect(result.entityType).toBe('task');
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to acquire workflow lock within timeout',
        expect.any(Object)
      );
    });

    it('should handle errors during lock acquisition', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Database error'));

      const result = await WorkflowLockService.acquireLock('task', 50);

      expect(result.acquired).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Error during lock acquisition attempt',
        expect.any(Object)
      );
    });

    it('should use default timeout when not specified', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ pg_try_advisory_lock: true }]);

      await WorkflowLockService.acquireLock('task');

      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should handle all supported entity types', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ pg_try_advisory_lock: true }]);

      const entityTypes = [
        { type: 'product_goal', expectedKey: WorkflowLockKey.ProductGoal },
        { type: 'productgoal', expectedKey: WorkflowLockKey.ProductGoal },
        { type: 'product_backlog_item', expectedKey: WorkflowLockKey.BacklogItem },
        { type: 'backlog_item', expectedKey: WorkflowLockKey.BacklogItem },
        { type: 'backlogitem', expectedKey: WorkflowLockKey.BacklogItem },
        { type: 'task', expectedKey: WorkflowLockKey.Task },
      ];

      for (const { type, expectedKey } of entityTypes) {
        vi.clearAllMocks();
        vi.mocked(prisma.$queryRaw).mockResolvedValue([{ pg_try_advisory_lock: true }]);

        const result = await WorkflowLockService.acquireLock(type);

        expect(result.lockKey).toBe(expectedKey);
        expect(result.entityType).toBe(type);
      }
    });

    it('should generate hash-based key for unknown entity types', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ pg_try_advisory_lock: true }]);

      const result = await WorkflowLockService.acquireLock('unknown_entity');

      expect(result.acquired).toBe(true);
      expect(result.lockKey).toBeGreaterThan(LOCK_KEY_PREFIX);
      expect(logger.warn).toHaveBeenCalledWith(
        'Unknown entity type for lock, using hash-based key',
        expect.any(Object)
      );
    });
  });

  describe('releaseLock', () => {
    it('should release lock successfully', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ pg_advisory_unlock: true }]);

      const result = await WorkflowLockService.releaseLock(WorkflowLockKey.BacklogItem);

      expect(result).toBe(true);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('Workflow lock released successfully', {
        lockKey: WorkflowLockKey.BacklogItem,
      });
    });

    it('should return false when lock was not held', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ pg_advisory_unlock: false }]);

      const result = await WorkflowLockService.releaseLock(WorkflowLockKey.Task);

      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        'Workflow lock release returned false (lock may not have been held)',
        { lockKey: WorkflowLockKey.Task }
      );
    });

    it('should handle errors during lock release', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Database error'));

      const result = await WorkflowLockService.releaseLock(WorkflowLockKey.ProductGoal);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Error releasing workflow lock',
        expect.any(Object)
      );
    });
  });

  describe('withLock', () => {
    it('should execute callback with lock held', async () => {
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([{ pg_advisory_unlock: true }]);

      const callback = vi.fn().mockResolvedValue('callback-result');

      const result = await WorkflowLockService.withLock('task', callback);

      expect(result).toBe('callback-result');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith(
        'Executing callback with lock held',
        expect.any(Object)
      );
    });

    it('should release lock even when callback throws', async () => {
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([{ pg_advisory_unlock: true }]);

      const callback = vi.fn().mockRejectedValue(new Error('Callback error'));

      await expect(WorkflowLockService.withLock('task', callback)).rejects.toThrow(
        'Callback error'
      );

      // Lock should still be released
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('should throw error when lock acquisition fails', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ pg_try_advisory_lock: false }]);

      const callback = vi.fn().mockResolvedValue('result');

      await expect(WorkflowLockService.withLock('task', callback, 50)).rejects.toThrow(
        "Failed to acquire lock for entity type 'task'"
      );

      expect(callback).not.toHaveBeenCalled();
    });

    it('should pass custom timeout to acquireLock', async () => {
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([{ pg_advisory_unlock: true }]);

      const callback = vi.fn().mockResolvedValue('result');

      await WorkflowLockService.withLock('task', callback, 5000);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('isLockAvailable', () => {
    it('should return true when lock is available', async () => {
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([]);

      const result = await WorkflowLockService.isLockAvailable('task');

      expect(result).toBe(true);
      // Should acquire and immediately release
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('should return false when lock is held by another session', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ pg_try_advisory_lock: false }]);

      const result = await WorkflowLockService.isLockAvailable('task');

      expect(result).toBe(false);
    });

    it('should return false when error occurs', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Database error'));

      const result = await WorkflowLockService.isLockAvailable('task');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Error checking lock availability',
        expect.any(Object)
      );
    });
  });

  describe('WorkflowLockKey enum', () => {
    it('should have correct lock key values', () => {
      expect(WorkflowLockKey.ProductGoal).toBe(1000001);
      expect(WorkflowLockKey.BacklogItem).toBe(1000002);
      expect(WorkflowLockKey.Task).toBe(1000003);
    });

    it('should have correct lock key prefix', () => {
      expect(LOCK_KEY_PREFIX).toBe(1000000);
    });
  });

  describe('entity type normalization', () => {
    it('should handle entity types with different cases', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ pg_try_advisory_lock: true }]);

      const result1 = await WorkflowLockService.acquireLock('TASK');
      const result2 = await WorkflowLockService.acquireLock('Task');
      const result3 = await WorkflowLockService.acquireLock('  task  ');

      expect(result1.lockKey).toBe(WorkflowLockKey.Task);
      expect(result2.lockKey).toBe(WorkflowLockKey.Task);
      expect(result3.lockKey).toBe(WorkflowLockKey.Task);
    });
  });
});
