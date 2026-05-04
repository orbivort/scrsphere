/**
 * Log Action Utility
 *
 * Provides utilities for tracking user actions with context enrichment.
 * This is useful for analytics, debugging, and auditing user interactions.
 */

import { logger } from './logger';
import type { LogContext } from './logger';

// Action log entry interface
export interface ActionLogEntry {
  timestamp: string;
  action: string;
  message: string;
  context: LogContext;
  data?: Record<string, unknown>;
  duration?: number;
}

// Action tracker for measuring action duration
interface ActionTracker {
  action: string;
  startTime: number;
  context?: LogContext;
}

// Active action trackers
const activeActions = new Map<string, ActionTracker>();

/**
 * Log a user action with context
 *
 * @param action - The action name (e.g., 'button_click', 'form_submit')
 * @param message - A descriptive message about the action
 * @param data - Optional additional data to log
 * @param context - Optional additional context
 *
 * @example
 * ```ts
 * logAction('button_click', 'User clicked the submit button', {
 *   buttonId: 'submit-form',
 *   formValid: true
 * });
 * ```
 */
export const logAction = (
  action: string,
  message: string,
  data?: Record<string, unknown>,
  context?: LogContext
): ActionLogEntry => {
  const entry: ActionLogEntry = {
    timestamp: new Date().toISOString(),
    action,
    message,
    context: {
      action,
      ...context,
    },
    data,
  };

  logger.info(message, entry.context, data);

  return entry;
};

/**
 * Start tracking an action (for measuring duration)
 *
 * @param actionId - Unique identifier for this action instance
 * @param action - The action name
 * @param context - Optional context for the action
 *
 * @example
 * ```ts
 * startActionTrack('api-call-1', 'api_request', { endpoint: '/api/users' });
 * // ... perform action ...
 * endActionTrack('api-call-1', 'API request completed', { status: 200 });
 * ```
 */
export const startActionTrack = (actionId: string, action: string, context?: LogContext): void => {
  activeActions.set(actionId, {
    action,
    startTime: performance.now(),
    context,
  });

  logger.debug(`Action started: ${action}`, { action, ...context });
};

/**
 * End tracking an action and log the duration
 *
 * @param actionId - The unique identifier used in startActionTrack
 * @param message - A descriptive message about the action completion
 * @param data - Optional additional data to log
 *
 * @returns The action log entry with duration, or null if action not found
 *
 * @example
 * ```ts
 * const entry = endActionTrack('api-call-1', 'API request completed', { status: 200 });
 * console.log(`Action took ${entry?.duration}ms`);
 * ```
 */
export const endActionTrack = (
  actionId: string,
  message: string,
  data?: Record<string, unknown>
): ActionLogEntry | null => {
  const tracker = activeActions.get(actionId);

  if (!tracker) {
    logger.warn(`Action tracker not found: ${actionId}`);
    return null;
  }

  const endTime = performance.now();
  const duration = Math.round(endTime - tracker.startTime);

  activeActions.delete(actionId);

  const entry: ActionLogEntry = {
    timestamp: new Date().toISOString(),
    action: tracker.action,
    message,
    context: {
      action: tracker.action,
      ...tracker.context,
    },
    data,
    duration,
  };

  logger.info(message, entry.context, { ...data, duration });

  return entry;
};

/**
 * Track an async action with automatic duration measurement
 *
 * @param action - The action name
 * @param message - A descriptive message about the action
 * @param fn - The async function to execute
 * @param context - Optional additional context
 *
 * @returns The result of the async function
 *
 * @example
 * ```ts
 * const result = await trackAction(
 *   'fetch_users',
 *   'Fetching user list',
 *   async () => {
 *     const response = await fetch('/api/users');
 *     return response.json();
 *   },
 *   { page: 1, limit: 10 }
 * );
 * ```
 */
export const trackAction = async <T>(
  action: string,
  message: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> => {
  const startTime = performance.now();

  logger.debug(`${message} (started)`, { action, ...context });

  try {
    const result = await fn();
    const duration = Math.round(performance.now() - startTime);

    logger.info(`${message} (completed)`, { action, ...context }, { duration });

    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);

    logger.error(
      `${message} (failed)`,
      { action, ...context },
      {
        error: error instanceof Error ? error.message : String(error),
        duration,
      }
    );

    throw error;
  }
};

/**
 * Track a sync action with automatic duration measurement
 *
 * @param action - The action name
 * @param message - A descriptive message about the action
 * @param fn - The sync function to execute
 * @param context - Optional additional context
 *
 * @returns The result of the function
 *
 * @example
 * ```ts
 * const result = trackActionSync(
 *   'calculate_total',
 *   'Calculating order total',
 *   () => {
 *     return items.reduce((sum, item) => sum + item.price, 0);
 *   },
 *   { itemCount: items.length }
 * );
 * ```
 */
export const trackActionSync = <T>(
  action: string,
  message: string,
  fn: () => T,
  context?: LogContext
): T => {
  const startTime = performance.now();

  logger.debug(`${message} (started)`, { action, ...context });

  try {
    const result = fn();
    const duration = Math.round(performance.now() - startTime);

    logger.info(`${message} (completed)`, { action, ...context }, { duration });

    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);

    logger.error(
      `${message} (failed)`,
      { action, ...context },
      {
        error: error instanceof Error ? error.message : String(error),
        duration,
      }
    );

    throw error;
  }
};

/**
 * Create a namespaced action logger
 *
 * @param namespace - The namespace for all actions (e.g., 'UserManagement')
 *
 * @returns An object with namespaced action logging methods
 *
 * @example
 * ```ts
 * const userActions = createActionLogger('UserManagement');
 *
 * userActions.logAction('create_user', 'Created new user', { userId: '123' });
 * // Logs: action='UserManagement.create_user'
 * ```
 */
export const createActionLogger = (namespace: string) => {
  const namespacedAction = (action: string) => `${namespace}.${action}`;

  return {
    logAction: (
      action: string,
      message: string,
      data?: Record<string, unknown>,
      context?: LogContext
    ) => logAction(namespacedAction(action), message, data, context),

    startActionTrack: (actionId: string, action: string, context?: LogContext) =>
      startActionTrack(actionId, namespacedAction(action), context),

    endActionTrack: (actionId: string, message: string, data?: Record<string, unknown>) =>
      endActionTrack(actionId, message, data),

    trackAction: <T>(action: string, message: string, fn: () => Promise<T>, context?: LogContext) =>
      trackAction(namespacedAction(action), message, fn, context),

    trackActionSync: <T>(action: string, message: string, fn: () => T, context?: LogContext) =>
      trackActionSync(namespacedAction(action), message, fn, context),
  };
};

// Export types
export type ActionLogger = ReturnType<typeof createActionLogger>;
