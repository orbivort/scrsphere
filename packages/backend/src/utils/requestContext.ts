// Request Context Propagation using AsyncLocalStorage
import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Request context interface for storing request-scoped data
 */
export interface RequestContext {
  /** Unique identifier for the request */
  requestId: string;
  /** ID of the authenticated user (if any) */
  userId?: string;
  /** ID of the team context (if any) */
  teamId?: string;
}

// Create AsyncLocalStorage instance for request context
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Get the current request context from AsyncLocalStorage
 * @returns The current request context or undefined if not in a request scope
 */
export const getRequestContext = (): RequestContext | undefined => {
  return asyncLocalStorage.getStore();
};

/**
 * Set the request context and run a callback within that context
 * @param context - The request context to set
 * @param callback - The callback to run within the context
 * @returns The result of the callback
 */
export const setRequestContext = <T>(context: RequestContext, callback: () => T): T => {
  return asyncLocalStorage.run(context, callback);
};

/**
 * Get the current request ID from context
 * @returns The current request ID or undefined
 */
export const getRequestId = (): string | undefined => {
  return asyncLocalStorage.getStore()?.requestId;
};

/**
 * Get the current user ID from context
 * @returns The current user ID or undefined
 */
export const getUserId = (): string | undefined => {
  return asyncLocalStorage.getStore()?.userId;
};

/**
 * Get the current team ID from context
 * @returns The current team ID or undefined
 */
export const getTeamId = (): string | undefined => {
  return asyncLocalStorage.getStore()?.teamId;
};

/**
 * Update the current request context with new values
 * This allows middleware to add context values as they become available
 * @param updates - Partial context to merge into existing context
 */
export const updateRequestContext = (updates: Partial<RequestContext>): void => {
  const store = asyncLocalStorage.getStore();
  if (store) {
    Object.assign(store, updates);
  }
};

export default asyncLocalStorage;
