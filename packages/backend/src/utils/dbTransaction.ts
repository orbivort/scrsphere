// Database Transaction Utilities with Circuit Breaker and Retry Logic
import type { Prisma } from '../generated/prisma/client';
import prisma from './prisma';
import { logger } from './logger';
import config from '../config';

const RETRYABLE_ERROR_CODES = ['P2034', 'P2028', 'P2014'];

export interface TransactionOptions {
  maxWait?: number;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  operationName?: string;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

class DatabaseCircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    isOpen: false,
  };

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  constructor() {
    this.failureThreshold = config.database.circuitBreaker.failureThreshold;
    this.resetTimeoutMs = config.database.circuitBreaker.resetTimeoutMs;
  }

  async execute<T>(operation: () => Promise<T>, operationName?: string): Promise<T> {
    this.checkAndResetState();

    if (this.state.isOpen) {
      const error = new Error(
        `Database circuit breaker is OPEN - ${operationName || 'Database operation'} temporarily unavailable`
      );
      logger.error('Circuit breaker open - rejecting database operation', {
        operation: operationName,
        failures: this.state.failures,
        lastFailure: this.state.lastFailure,
      });
      throw error;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private checkAndResetState(): void {
    if (this.state.isOpen && Date.now() - this.state.lastFailure >= this.resetTimeoutMs) {
      logger.info('Database circuit breaker resetting after timeout', {
        previousFailures: this.state.failures,
      });
      this.state = {
        failures: 0,
        lastFailure: 0,
        isOpen: false,
      };
    }
  }

  private onSuccess(): void {
    if (this.state.failures > 0) {
      logger.debug('Database operation succeeded, resetting circuit breaker failure count', {
        previousFailures: this.state.failures,
      });
    }
    this.state.failures = 0;
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailure = Date.now();

    if (this.state.failures >= this.failureThreshold) {
      this.state.isOpen = true;
      logger.error('Database circuit breaker opened due to repeated failures', {
        failures: this.state.failures,
        threshold: this.failureThreshold,
        resetTimeoutMs: this.resetTimeoutMs,
      });
    } else {
      logger.warn('Database operation failed', {
        failures: this.state.failures,
        threshold: this.failureThreshold,
        lastFailure: this.state.lastFailure,
      });
    }
  }

  getStatus(): { isOpen: boolean; failures: number; lastFailure: number } {
    return {
      isOpen: this.state.isOpen,
      failures: this.state.failures,
      lastFailure: this.state.lastFailure,
    };
  }

  reset(): void {
    this.state = {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    };
    logger.info('Database circuit breaker manually reset');
  }
}

export const databaseCircuitBreaker = new DatabaseCircuitBreaker();

export function isRetryableError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return RETRYABLE_ERROR_CODES.includes((error as { code: string }).code);
  }
  return false;
}

export async function withTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const {
    maxWait = config.database.transaction.default.maxWait,
    timeout = config.database.transaction.default.timeout,
    retries = config.database.transaction.default.retries,
    retryDelay = 1000,
    operationName = 'database_transaction',
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const startTime = Date.now();
    try {
      const result = await prisma.$transaction(operation, {
        maxWait,
        timeout,
      });

      const duration = Date.now() - startTime;

      if (duration > timeout * 0.8) {
        logger.warn('Transaction approaching timeout threshold', {
          operation: operationName,
          duration,
          timeout,
          threshold: timeout * 0.8,
        });
      }

      if (attempt > 1) {
        logger.info('Transaction succeeded after retry', {
          operation: operationName,
          attempt,
          totalAttempts: retries + 1,
          duration,
        });
      }

      return result;
    } catch (error) {
      lastError = error;
      const duration = Date.now() - startTime;

      logger.error('Transaction failed', {
        operation: operationName,
        attempt,
        maxAttempts: retries + 1,
        error: error instanceof Error ? error.message : String(error),
        errorCode: (error as { code?: string })?.code,
        isRetryable: isRetryableError(error),
        duration,
      });

      if (!isRetryableError(error) || attempt >= retries + 1) {
        break;
      }

      logger.warn(`Transaction failed (attempt ${attempt}/${retries + 1}), retrying...`, {
        operation: operationName,
        nextRetryIn: retryDelay * attempt,
      });

      await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
    }
  }

  logger.error('Transaction exhausted all retries', {
    operation: operationName,
    totalAttempts: retries + 1,
    lastError: lastError instanceof Error ? lastError.message : String(lastError),
  });

  throw lastError;
}

export async function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  operationName?: string
): Promise<T> {
  return databaseCircuitBreaker.execute(operation, operationName);
}

export async function withTransactionAndCircuitBreaker<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  return withCircuitBreaker(() => withTransaction(operation, options), options.operationName);
}

export const TRANSACTION_CONFIG = {
  START_SPRINT: {
    maxWait: config.database.transaction.startSprint.maxWait,
    timeout: config.database.transaction.startSprint.timeout,
    retries: config.database.transaction.startSprint.retries,
  },
  DEFAULT: {
    maxWait: config.database.transaction.default.maxWait,
    timeout: config.database.transaction.default.timeout,
    retries: config.database.transaction.default.retries,
  },
} as const;

export default {
  withTransaction,
  withCircuitBreaker,
  withTransactionAndCircuitBreaker,
  databaseCircuitBreaker,
  isRetryableError,
  TRANSACTION_CONFIG,
};
