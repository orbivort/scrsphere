/**
 * Workflow Lock Service
 *
 * Implements PostgreSQL advisory locks for cross-instance coordination
 * during workflow initialization. This ensures that only one instance
 * can initialize workflows at a time, preventing race conditions.
 */

import prisma from '../utils/prisma';
import logger from '../utils/logger';

/**
 * Lock key constants for different entity types
 * These are used with PostgreSQL advisory locks
 */
export const LOCK_KEY_PREFIX = 1000000;

export enum WorkflowLockKey {
  ProductGoal = 1000001,
  BacklogItem = 1000002,
  Task = 1000003,
}

/**
 * Maps entity types to their corresponding lock keys
 */
const ENTITY_TYPE_TO_LOCK_KEY: Record<string, WorkflowLockKey> = {
  product_goal: WorkflowLockKey.ProductGoal,
  productgoal: WorkflowLockKey.ProductGoal,
  product_backlog_item: WorkflowLockKey.BacklogItem,
  backlog_item: WorkflowLockKey.BacklogItem,
  backlogitem: WorkflowLockKey.BacklogItem,
  task: WorkflowLockKey.Task,
};

/**
 * Default timeout for lock acquisition in milliseconds
 */
const DEFAULT_LOCK_TIMEOUT_MS = 10000;

/**
 * Delay between lock acquisition retry attempts in milliseconds
 */
const LOCK_RETRY_DELAY_MS = 100;

/**
 * Result of a lock acquisition attempt
 */
export interface LockAcquisitionResult {
  acquired: boolean;
  lockKey: number;
  entityType: string;
}

/**
 * WorkflowLockService
 *
 * Provides static methods for acquiring and releasing PostgreSQL advisory locks
 * to coordinate workflow initialization across multiple application instances.
 *
 * Uses session-level advisory locks that are automatically released when
 * the database session ends, providing safety against orphaned locks.
 */
export class WorkflowLockService {
  /**
   * Acquires an advisory lock for the specified entity type
   *
   * Uses pg_try_advisory_lock with a NOWAIT retry pattern to implement
   * a timeout-based lock acquisition strategy.
   *
   * @param entityType - The type of entity to lock (e.g., 'product_backlog_item', 'task')
   * @param timeoutMs - Maximum time to wait for lock acquisition (default: 10000ms)
   * @returns LockAcquisitionResult indicating success/failure and lock details
   */
  static async acquireLock(
    entityType: string,
    timeoutMs: number = DEFAULT_LOCK_TIMEOUT_MS
  ): Promise<LockAcquisitionResult> {
    const lockKey = this.getLockKeyForEntityType(entityType);
    const startTime = Date.now();

    logger.info('Attempting to acquire workflow lock', {
      entityType,
      lockKey,
      timeoutMs,
    });

    while (Date.now() - startTime < timeoutMs) {
      try {
        // Use pg_try_advisory_lock for non-blocking lock acquisition
        const result = await prisma.$queryRaw<[{ pg_try_advisory_lock: boolean }]>`
          SELECT pg_try_advisory_lock(${lockKey}) AS pg_try_advisory_lock
        `;

        const acquired = result[0].pg_try_advisory_lock === true;

        if (acquired) {
          logger.info('Workflow lock acquired successfully', {
            entityType,
            lockKey,
            waitTimeMs: Date.now() - startTime,
          });

          return {
            acquired: true,
            lockKey,
            entityType,
          };
        }

        // Lock not available, wait before retry
        logger.debug('Lock not available, retrying...', {
          entityType,
          lockKey,
          elapsedTimeMs: Date.now() - startTime,
        });

        await this.delay(LOCK_RETRY_DELAY_MS);
      } catch (error) {
        logger.error('Error during lock acquisition attempt', {
          entityType,
          lockKey,
          error: error instanceof Error ? error.message : String(error),
        });

        // Wait before retry on error
        await this.delay(LOCK_RETRY_DELAY_MS);
      }
    }

    // Timeout reached without acquiring lock
    logger.warn('Failed to acquire workflow lock within timeout', {
      entityType,
      lockKey,
      timeoutMs,
      totalTimeMs: Date.now() - startTime,
    });

    return {
      acquired: false,
      lockKey,
      entityType,
    };
  }

  /**
   * Releases a previously acquired advisory lock
   *
   * Uses pg_advisory_unlock to release the lock. This should be called
   * in a finally block to ensure locks are always released.
   *
   * @param lockKey - The lock key to release
   * @returns boolean indicating whether the lock was successfully released
   */
  static async releaseLock(lockKey: number): Promise<boolean> {
    logger.info('Attempting to release workflow lock', { lockKey });

    try {
      const result = await prisma.$queryRaw<[{ pg_advisory_unlock: boolean }]>`
        SELECT pg_advisory_unlock(${lockKey}) AS pg_advisory_unlock
      `;

      const released = result[0].pg_advisory_unlock === true;

      if (released) {
        logger.info('Workflow lock released successfully', { lockKey });
      } else {
        logger.warn('Workflow lock release returned false (lock may not have been held)', {
          lockKey,
        });
      }

      return released;
    } catch (error) {
      logger.error('Error releasing workflow lock', {
        lockKey,
        error: error instanceof Error ? error.message : String(error),
      });

      return false;
    }
  }

  /**
   * Executes a callback while holding an advisory lock
   *
   * This is a convenience method that handles lock acquisition and release
   * automatically, ensuring the lock is always released even if the callback
   * throws an error.
   *
   * @param entityType - The type of entity to lock
   * @param callback - The async function to execute while holding the lock
   * @param timeoutMs - Maximum time to wait for lock acquisition
   * @returns The result of the callback function
   * @throws Error if lock acquisition fails or callback throws
   */
  static async withLock<T>(
    entityType: string,
    callback: () => Promise<T>,
    timeoutMs: number = DEFAULT_LOCK_TIMEOUT_MS
  ): Promise<T> {
    const lockResult = await this.acquireLock(entityType, timeoutMs);

    if (!lockResult.acquired) {
      throw new Error(
        `Failed to acquire lock for entity type '${entityType}' within ${timeoutMs}ms`
      );
    }

    try {
      logger.debug('Executing callback with lock held', {
        entityType,
        lockKey: lockResult.lockKey,
      });

      const result = await callback();

      logger.debug('Callback execution completed successfully', {
        entityType,
        lockKey: lockResult.lockKey,
      });

      return result;
    } finally {
      await this.releaseLock(lockResult.lockKey);
    }
  }

  /**
   * Gets the lock key for a given entity type
   *
   * @param entityType - The entity type string
   * @returns The corresponding lock key number
   * @throws Error if entity type is not recognized
   */
  private static getLockKeyForEntityType(entityType: string): number {
    const normalizedType = entityType.toLowerCase().trim();
    const lockKey = ENTITY_TYPE_TO_LOCK_KEY[normalizedType];

    if (lockKey === undefined) {
      logger.warn('Unknown entity type for lock, using hash-based key', {
        entityType,
        normalizedType,
      });

      // Generate a deterministic lock key for unknown entity types
      // This uses a simple hash function to create a consistent key
      return this.hashEntityType(normalizedType);
    }

    return lockKey;
  }

  /**
   * Creates a deterministic hash for unknown entity types
   *
   * This ensures that unknown entity types still get consistent lock keys
   * while avoiding collisions with the predefined keys.
   *
   * @param entityType - The entity type string to hash
   * @returns A numeric lock key
   */
  private static hashEntityType(entityType: string): number {
    let hash = LOCK_KEY_PREFIX;

    for (let i = 0; i < entityType.length; i++) {
      hash = ((hash << 5) - hash + entityType.charCodeAt(i)) | 0;
    }

    // Ensure the hash is positive and doesn't collide with predefined keys
    return Math.abs(hash) + 1000000;
  }

  /**
   * Delays execution for a specified duration
   *
   * @param ms - Milliseconds to delay
   */
  private static async delay(ms: number): Promise<void> {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Checks if a lock is currently held for the specified entity type
   *
   * This is useful for debugging and monitoring lock states.
   * Note: This attempts to acquire and immediately release the lock.
   *
   * @param entityType - The entity type to check
   * @returns boolean indicating if the lock is available (not held by another session)
   */
  static async isLockAvailable(entityType: string): Promise<boolean> {
    const lockKey = this.getLockKeyForEntityType(entityType);

    try {
      // Try to acquire the lock
      const result = await prisma.$queryRaw<[{ pg_try_advisory_lock: boolean }]>`
        SELECT pg_try_advisory_lock(${lockKey}) AS pg_try_advisory_lock
      `;

      const acquired = result[0].pg_try_advisory_lock === true;

      // If we acquired it, release it immediately
      if (acquired) {
        await prisma.$queryRaw`
          SELECT pg_advisory_unlock(${lockKey})
        `;
        return true; // Lock was available
      }

      return false; // Lock is held by another session
    } catch (error) {
      logger.error('Error checking lock availability', {
        entityType,
        lockKey,
        error: error instanceof Error ? error.message : String(error),
      });

      return false;
    }
  }
}

export default WorkflowLockService;
