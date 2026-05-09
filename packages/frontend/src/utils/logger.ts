/**
 * Structured Logging System for Frontend
 *
 * Provides environment-aware logging with structured JSON format,
 * context enrichment from auth and team stores, and configurable log levels.
 */

// Store provider types
type StoreState = {
  user?: { id: string } | null;
};

type TeamStoreState = {
  currentTeamId: string | null;
};

type StoreProvider = {
  getAuthState: () => StoreState | null;
  getTeamState: () => TeamStoreState | null;
};

// Default store provider (will be set by the app at runtime)
let _storeProvider: StoreProvider | null = null;

export const setStoreProvider = (provider: StoreProvider): void => {
  _storeProvider = provider;
};

// Log levels in order of severity
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Context information for log entries
export interface LogContext {
  userId?: string;
  teamId?: string;
  page?: string;
  action?: string;
  componentName?: string;
  sessionId?: string;
}

// Structured log entry interface
export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  data?: Record<string, unknown>;
  environment: string;
  version?: string;
}

// Environment configuration
const isDev = () => import.meta.env.DEV;
const isProd = () => import.meta.env.PROD;

// Get current environment
const getEnvironment = (): string => {
  if (isDev()) return 'development';
  if (isProd()) return 'production';
  return 'test';
};

// Get app version from environment
const getAppVersion = (): string | undefined => {
  return import.meta.env.VITE_APP_VERSION;
};

// Log level priority mapping
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level based on environment
const getMinLogLevel = (): LogLevel => {
  // Check for explicit log level from environment variable
  const envLogLevel = import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined;
  if (envLogLevel && envLogLevel in LOG_LEVEL_PRIORITY) {
    return envLogLevel;
  }
  // In development, allow all logs including debug
  if (isDev()) return 'debug';
  // In production/test, only info, warn, and error
  return 'info';
};

// Check if a log level should be output
const shouldLog = (level: LogLevel): boolean => {
  const minLevel = getMinLogLevel();
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
};

// Generate session ID (simple implementation)
let sessionId: string | null = null;
const getSessionId = (): string => {
  sessionId ??= `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  return sessionId;
};

// Get current page from window location
const getCurrentPage = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  return '';
};

// Enrich context with auth and team information
const enrichContext = (context?: LogContext): LogContext => {
  const enrichedContext: LogContext = {
    ...context,
    page: context?.page ?? getCurrentPage(),
    sessionId: getSessionId(),
  };

  // Try to get user info from store provider
  try {
    if (_storeProvider) {
      const authState = _storeProvider.getAuthState();
      if (authState?.user && !enrichedContext.userId) {
        enrichedContext.userId = authState.user.id;
      }
    }
  } catch {
    // Store provider may not be initialized yet
  }

  // Try to get team info from store provider
  try {
    if (_storeProvider) {
      const teamState = _storeProvider.getTeamState();
      if (teamState?.currentTeamId && !enrichedContext.teamId) {
        enrichedContext.teamId = teamState.currentTeamId;
      }
    }
  } catch {
    // Store provider may not be initialized yet
  }

  return enrichedContext;
};

// Create a structured log entry
const createLogEntry = (
  level: LogLevel,
  message: string,
  context?: LogContext,
  data?: Record<string, unknown>
): StructuredLogEntry => {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: enrichContext(context),
    data,
    environment: getEnvironment(),
    version: getAppVersion(),
  };
};

// Format log entry for console output
const formatForConsole = (entry: StructuredLogEntry): string[] => {
  // In development, use a more readable format
  if (isDev()) {
    const contextStr = Object.entries(entry.context)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');

    const parts = [`[${entry.timestamp}]`, `[${entry.level.toUpperCase()}]`, entry.message];

    if (contextStr) {
      parts.push(`(${contextStr})`);
    }

    return parts;
  }

  // In production, output as JSON for log aggregation
  return [JSON.stringify(entry)];
};

// Console output methods
const consoleOutput = (level: LogLevel, formatted: string[], entry: StructuredLogEntry): void => {
  switch (level) {
    case 'debug':
      // eslint-disable-next-line no-console
      console.log(...formatted, entry.data ?? '');
      break;
    case 'info':
      // eslint-disable-next-line no-console
      console.info(...formatted, entry.data ?? '');
      break;
    case 'warn':
      console.warn(...formatted, entry.data ?? '');
      break;
    case 'error':
      console.error(...formatted, entry.data ?? '');
      break;
  }
};

// Logger interface
export interface Logger {
  debug: (message: string, context?: LogContext, data?: Record<string, unknown>) => void;
  info: (message: string, context?: LogContext, data?: Record<string, unknown>) => void;
  warn: (message: string, context?: LogContext, data?: Record<string, unknown>) => void;
  error: (message: string, context?: LogContext, data?: Record<string, unknown>) => void;
  log: (
    level: LogLevel,
    message: string,
    context?: LogContext,
    data?: Record<string, unknown>
  ) => void;
  getStructuredEntry: (
    level: LogLevel,
    message: string,
    context?: LogContext,
    data?: Record<string, unknown>
  ) => StructuredLogEntry;
}

// Create the logger instance
const createLogger = (): Logger => {
  const log = (
    level: LogLevel,
    message: string,
    context?: LogContext,
    data?: Record<string, unknown>
  ): void => {
    if (!shouldLog(level)) {
      return;
    }

    const entry = createLogEntry(level, message, context, data);
    const formatted = formatForConsole(entry);
    consoleOutput(level, formatted, entry);
  };

  return {
    debug: (message, context, data) => log('debug', message, context, data),
    info: (message, context, data) => log('info', message, context, data),
    warn: (message, context, data) => log('warn', message, context, data),
    error: (message, context, data) => log('error', message, context, data),
    log,
    getStructuredEntry: (level, message, context, data) =>
      createLogEntry(level, message, context, data),
  };
};

// Export the singleton logger instance
export const logger = createLogger();

// Export a factory function for creating component-specific loggers
export const createComponentLogger = (componentName: string): Logger => {
  const componentContext: LogContext = { componentName };

  return {
    debug: (message, context, data) =>
      logger.debug(message, { ...componentContext, ...context }, data),
    info: (message, context, data) =>
      logger.info(message, { ...componentContext, ...context }, data),
    warn: (message, context, data) =>
      logger.warn(message, { ...componentContext, ...context }, data),
    error: (message, context, data) =>
      logger.error(message, { ...componentContext, ...context }, data),
    log: (level, message, context, data) =>
      logger.log(level, message, { ...componentContext, ...context }, data),
    getStructuredEntry: (level, message, context, data) =>
      logger.getStructuredEntry(level, message, { ...componentContext, ...context }, data),
  };
};

// Export utility functions for testing
export const resetSessionId = (): void => {
  sessionId = null;
};

// Reset store provider (for testing)
export const resetStoreProvider = (): void => {
  _storeProvider = null;
};
