/**
 * useLogger Hook
 *
 * Provides a logger instance with component context automatically included.
 * This hook returns a logger that includes the component name in all log entries.
 */

import { useMemo } from 'react';

import { logger, createComponentLogger } from '../utils/logger';
import type { Logger, LogContext, LogLevel } from '../utils/logger';

export interface UseLoggerOptions {
  /**
   * The name of the component using this logger
   */
  componentName: string;

  /**
   * Additional context to include in all log entries
   */
  context?: LogContext;
}

export interface UseLoggerReturn extends Logger {
  /**
   * The component name passed to the hook
   */
  componentName: string;

  /**
   * Log with action context
   */
  logAction: (action: string, message: string, data?: Record<string, unknown>) => void;
}

/**
 * Hook that provides a logger with component context
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const log = useLogger({ componentName: 'MyComponent' });
 *
 *   useEffect(() => {
 *     log.info('Component mounted');
 *     return () => log.debug('Component unmounted');
 *   }, [log]);
 *
 *   const handleClick = () => {
 *     log.logAction('button_click', 'User clicked the submit button');
 *   };
 *
 *   return <button onClick={handleClick}>Submit</button>;
 * };
 * ```
 */
export const useLogger = (options: UseLoggerOptions): UseLoggerReturn => {
  const { componentName, context } = options;

  // Create a logger with the component context
  const componentLogger = useMemo(() => {
    return createComponentLogger(componentName);
  }, [componentName]);

  // Create the enhanced logger with additional context
  const enhancedLogger = useMemo((): UseLoggerReturn => {
    return {
      componentName,
      debug: (message, logContext, data) =>
        componentLogger.debug(message, { ...context, ...logContext }, data),
      info: (message, logContext, data) =>
        componentLogger.info(message, { ...context, ...logContext }, data),
      warn: (message, logContext, data) =>
        componentLogger.warn(message, { ...context, ...logContext }, data),
      error: (message, logContext, data) =>
        componentLogger.error(message, { ...context, ...logContext }, data),
      log: (level: LogLevel, message, logContext, data) =>
        componentLogger.log(level, message, { ...context, ...logContext }, data),
      getStructuredEntry: (level, message, logContext, data) =>
        componentLogger.getStructuredEntry(level, message, { ...context, ...logContext }, data),
      logAction: (action: string, message: string, data?: Record<string, unknown>) =>
        componentLogger.info(message, { ...context, action }, data),
    };
  }, [componentLogger, context, componentName]);

  return enhancedLogger;
};

/**
 * Hook that provides a simple logger without component context
 *
 * This is useful when you just need access to the global logger
 * but want to follow the hook pattern for consistency.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const log = useGlobalLogger();
 *
 *   useEffect(() => {
 *     log.info('Component initialized');
 *   }, [log]);
 *
 *   return <div>...</div>;
 * };
 * ```
 */
export const useGlobalLogger = (): Logger => {
  return logger;
};

export default useLogger;
