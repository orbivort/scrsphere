/**
 * Error Reporting Architecture for Frontend
 *
 * Provides a unified interface for error reporting with support for:
 * - Console-based reporting (development)
 * - Sentry integration (production)
 * - Context enrichment (user, session, page)
 * - Sensitive data redaction
 */

import { useAuthStore, useTeamStore } from '../store';

import { logger } from './logger';

// Sensitive field patterns to redact
const SENSITIVE_FIELDS = [
  'password',
  'passwordConfirmation',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'authToken',
  'apiKey',
  'apiSecret',
  'secret',
  'credential',
  'authorization',
  'cookie',
  'session',
];

// Patterns to detect sensitive data in strings
const SENSITIVE_PATTERNS = [
  /bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi,
  /token[=:]\s*[a-zA-Z0-9\-._~+/]+=*/gi,
  /password[=:]\s*\S+/gi,
  /api[_-]?key[=:]\s*[a-zA-Z0-9\-._~+/]+=*/gi,
];

// Error context information
export interface ErrorContext {
  userId?: string;
  teamId?: string;
  page?: string;
  action?: string;
  componentName?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

// User information for error reporting
export interface ErrorReporterUser {
  id: string;
  email?: string;
  username?: string;
}

// Error reporter interface
export interface ErrorReporter {
  captureException: (error: Error | unknown, context?: ErrorContext) => void;
  captureMessage: (
    message: string,
    level?: 'info' | 'warning' | 'error',
    context?: ErrorContext
  ) => void;
  setUser: (user: ErrorReporterUser | null) => void;
  setContext: (key: string, context: Record<string, unknown>) => void;
  clearContext: (key: string) => void;
}

// Redact sensitive data from an object
const redactSensitiveData = (obj: unknown, depth = 0): unknown => {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[MAX_DEPTH_REACHED]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    let redacted = obj;
    for (const pattern of SENSITIVE_PATTERNS) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }
    return redacted;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item, depth + 1));
  }

  if (obj instanceof Error) {
    // Handle Error objects specially
    return {
      name: obj.name,
      message: redactSensitiveData(obj.message, depth + 1),
      stack: obj.stack,
    };
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check if the key is sensitive
    const isSensitive = SENSITIVE_FIELDS.some(
      (field) => lowerKey === field.toLowerCase() || lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactSensitiveData(value, depth + 1);
    }
  }

  return redacted;
};

// Get current page from window location
const getCurrentPage = (): string => {
  return window.location.pathname;
};

// Enrich error context with auth and team information
const enrichErrorContext = (context?: ErrorContext): ErrorContext => {
  const enrichedContext: ErrorContext = {
    ...context,
    page: context?.page ?? getCurrentPage(),
  };

  // Try to get user info from auth store
  try {
    const authState = useAuthStore.getState();
    if (authState.user && !enrichedContext.userId) {
      enrichedContext.userId = authState.user.id;
    }
  } catch {
    // Auth store may not be initialized yet
  }

  // Try to get team info from team store
  try {
    const teamState = useTeamStore.getState();
    if (teamState.currentTeamId && !enrichedContext.teamId) {
      enrichedContext.teamId = teamState.currentTeamId;
    }
  } catch {
    // Team store may not be initialized yet
  }

  return enrichedContext;
};

/**
 * Console-based Error Reporter for Development
 *
 * Outputs errors to the console with structured formatting
 */
export class ConsoleErrorReporter implements ErrorReporter {
  private context: Map<string, Record<string, unknown>> = new Map();
  private currentUser: ErrorReporterUser | null = null;

  captureException(error: Error | unknown, context?: ErrorContext): void {
    const enrichedContext = enrichErrorContext(context);
    const redactedError = redactSensitiveData(error);
    const redactedContext = redactSensitiveData(enrichedContext) as ErrorContext;

    // eslint-disable-next-line no-console
    console.group(`[ErrorReporter] Exception captured`);
    console.error('Error:', redactedError);
    console.error('Context:', {
      ...redactedContext,
      user: this.currentUser,
      storedContext: Object.fromEntries(this.context),
    });
    // eslint-disable-next-line no-console
    console.groupEnd();

    // Also log to the structured logger
    logger.error(
      error instanceof Error ? error.message : 'Unknown error',
      {
        userId: enrichedContext.userId,
        teamId: enrichedContext.teamId,
        page: enrichedContext.page,
        action: enrichedContext.action,
        componentName: enrichedContext.componentName,
      },
      {
        error: redactedError,
        tags: enrichedContext.tags,
        extra: enrichedContext.extra,
      }
    );
  }

  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: ErrorContext
  ): void {
    const enrichedContext = enrichErrorContext(context);
    const redactedMessage = redactSensitiveData(message) as string;
    const redactedContext = redactSensitiveData(enrichedContext) as ErrorContext;

    const logLevel = level === 'warning' ? 'warn' : level;
    const consoleMethod = level === 'warning' ? 'warn' : level === 'error' ? 'error' : 'info';

    // eslint-disable-next-line no-console
    console[consoleMethod](`[ErrorReporter] ${redactedMessage}`, {
      context: redactedContext,
      user: this.currentUser,
    });

    // Also log to the structured logger
    logger.log(
      logLevel,
      redactedMessage,
      {
        userId: enrichedContext.userId,
        teamId: enrichedContext.teamId,
        page: enrichedContext.page,
        action: enrichedContext.action,
        componentName: enrichedContext.componentName,
      },
      {
        tags: enrichedContext.tags,
        extra: enrichedContext.extra,
      }
    );
  }

  setUser(user: ErrorReporterUser | null): void {
    this.currentUser = user ? { ...user } : null;
  }

  setContext(key: string, context: Record<string, unknown>): void {
    this.context.set(key, redactSensitiveData(context) as Record<string, unknown>);
  }

  clearContext(key: string): void {
    this.context.delete(key);
  }
}

/**
 * Sentry Error Reporter Stub for Production
 *
 * This is a stub implementation that can be activated with VITE_SENTRY_DSN.
 * When Sentry SDK is installed, this will integrate with it.
 */
export class SentryErrorReporter implements ErrorReporter {
  private dsn: string | undefined;
  private context: Map<string, Record<string, unknown>> = new Map();
  private currentUser: ErrorReporterUser | null = null;
  private isInitialized = false;

  constructor() {
    this.dsn = import.meta.env.VITE_SENTRY_DSN;

    if (this.dsn) {
      this.initializeSentry();
    }
  }

  private initializeSentry(): void {
    // Sentry SDK integration would go here
    // Example:
    // import * as Sentry from '@sentry/browser';
    // Sentry.init({
    //   dsn: this.dsn,
    //   environment: import.meta.env.MODE,
    //   release: import.meta.env.VITE_APP_VERSION,
    // });

    this.isInitialized = true;
    logger.info('[SentryErrorReporter] Initialized with DSN');
  }

  captureException(error: Error | unknown, context?: ErrorContext): void {
    const enrichedContext = enrichErrorContext(context);
    const redactedError = redactSensitiveData(error);
    const redactedContext = redactSensitiveData(enrichedContext) as ErrorContext;

    if (this.isInitialized && this.dsn) {
      // Sentry SDK integration would go here
      // Example:
      // Sentry.withScope((scope) => {
      //   if (enrichedContext.tags) {
      //     Object.entries(enrichedContext.tags).forEach(([key, value]) => {
      //       scope.setTag(key, value);
      //     });
      //   }
      //   if (enrichedContext.extra) {
      //     Object.entries(enrichedContext.extra).forEach(([key, value]) => {
      //       scope.setExtra(key, value);
      //     });
      //   }
      //   Sentry.captureException(error);
      // });

      logger.debug('[SentryErrorReporter] Exception captured for Sentry', enrichedContext, {
        error: redactedError,
      });
    }

    // Always log to console as fallback
    console.error('[SentryErrorReporter] Exception:', redactedError, {
      context: redactedContext,
      user: this.currentUser,
    });
  }

  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: ErrorContext
  ): void {
    const enrichedContext = enrichErrorContext(context);
    const redactedMessage = redactSensitiveData(message) as string;

    if (this.isInitialized && this.dsn) {
      // Sentry SDK integration would go here
      // Example:
      // Sentry.withScope((scope) => {
      //   if (enrichedContext.tags) {
      //     Object.entries(enrichedContext.tags).forEach(([key, value]) => {
      //       scope.setTag(key, value);
      //     });
      //   }
      //   Sentry.captureMessage(message, level);
      // });

      logger.debug('[SentryErrorReporter] Message captured for Sentry', enrichedContext, {
        message: redactedMessage,
        level,
      });
    }

    // Always log to console as fallback
    // eslint-disable-next-line no-console
    console.log(`[SentryErrorReporter] ${level.toUpperCase()}: ${redactedMessage}`, {
      context: enrichedContext,
      user: this.currentUser,
    });
  }

  setUser(user: ErrorReporterUser | null): void {
    this.currentUser = user ? { ...user } : null;

    if (this.isInitialized && this.dsn) {
      // Sentry SDK integration would go here
      // Example:
      // Sentry.setUser(user ? { id: user.id, email: user.email, username: user.username } : null);
    }
  }

  setContext(key: string, context: Record<string, unknown>): void {
    this.context.set(key, redactSensitiveData(context) as Record<string, unknown>);

    if (this.isInitialized && this.dsn) {
      // Sentry SDK integration would go here
      // Example:
      // Sentry.setContext(key, redactSensitiveData(context));
    }
  }

  clearContext(key: string): void {
    this.context.delete(key);

    if (this.isInitialized && this.dsn) {
      // Sentry SDK integration would go here
      // Example:
      // Sentry.setContext(key, null);
    }
  }
}

/**
 * Composite Error Reporter
 *
 * Combines multiple reporters for comprehensive error reporting
 */
class CompositeErrorReporter implements ErrorReporter {
  private reporters: ErrorReporter[];

  constructor(reporters: ErrorReporter[]) {
    this.reporters = reporters;
  }

  captureException(error: Error | unknown, context?: ErrorContext): void {
    this.reporters.forEach((reporter) => {
      try {
        reporter.captureException(error, context);
      } catch (e) {
        console.error('[CompositeErrorReporter] Reporter failed:', e);
      }
    });
  }

  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: ErrorContext
  ): void {
    this.reporters.forEach((reporter) => {
      try {
        reporter.captureMessage(message, level, context);
      } catch (e) {
        console.error('[CompositeErrorReporter] Reporter failed:', e);
      }
    });
  }

  setUser(user: ErrorReporterUser | null): void {
    this.reporters.forEach((reporter) => {
      try {
        reporter.setUser(user);
      } catch (e) {
        console.error('[CompositeErrorReporter] Reporter failed:', e);
      }
    });
  }

  setContext(key: string, context: Record<string, unknown>): void {
    this.reporters.forEach((reporter) => {
      try {
        reporter.setContext(key, context);
      } catch (e) {
        console.error('[CompositeErrorReporter] Reporter failed:', e);
      }
    });
  }

  clearContext(key: string): void {
    this.reporters.forEach((reporter) => {
      try {
        reporter.clearContext(key);
      } catch (e) {
        console.error('[CompositeErrorReporter] Reporter failed:', e);
      }
    });
  }
}

// Create the appropriate error reporter based on environment
const createErrorReporter = (): ErrorReporter => {
  const isDev = import.meta.env.DEV;
  const hasSentryDsn = !!import.meta.env.VITE_SENTRY_DSN;

  if (isDev) {
    // In development, use console reporter
    return new ConsoleErrorReporter();
  }

  if (hasSentryDsn) {
    // In production with Sentry DSN, use both Sentry and console
    return new CompositeErrorReporter([new SentryErrorReporter(), new ConsoleErrorReporter()]);
  }

  // In production without Sentry, use console reporter
  return new ConsoleErrorReporter();
};

// Export the singleton error reporter instance
export const errorReporter = createErrorReporter();

// Export utility functions
export { redactSensitiveData };
