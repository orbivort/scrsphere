import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ConsoleErrorReporter,
  SentryErrorReporter,
  CompositeErrorReporter,
  errorReporter,
  redactSensitiveData,
} from './errorReporter';
import type { ErrorReporter } from './errorReporter';

const mockEnv = (env: Record<string, string | boolean | undefined>) => {
  vi.stubGlobal('import.meta', {
    env: {
      DEV: env.DEV ?? true,
      PROD: env.PROD ?? false,
      MODE: env.MODE ?? 'development',
      VITE_SENTRY_DSN: env.VITE_SENTRY_DSN,
    },
  });
};

describe('ErrorReporter', () => {
  let consoleSpies: {
    error: ReturnType<typeof vi.spyOn>;
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpies = {
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('ConsoleErrorReporter', () => {
    let reporter: ConsoleErrorReporter;

    beforeEach(() => {
      reporter = new ConsoleErrorReporter();
    });

    it('should capture exceptions', () => {
      const error = new Error('Test error');
      reporter.captureException(error, { context: 'test' });

      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should capture messages', () => {
      reporter.captureMessage('Test message', 'error');

      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should store user context', () => {
      reporter.setUser({ id: 'user-123', email: 'test@example.com' });
      reporter.captureException(new Error('Test'));

      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should store additional context', () => {
      reporter.setContext('request', { url: '/api/test' });
      reporter.captureException(new Error('Test'));

      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should clear context', () => {
      reporter.setContext('request', { url: '/api/test' });
      reporter.clearContext('request');
      reporter.captureException(new Error('Test'));

      expect(consoleSpies.error).toHaveBeenCalled();
    });
  });

  describe('SentryErrorReporter', () => {
    it('should create reporter when DSN is provided', () => {
      mockEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123', PROD: true });

      const reporter = new SentryErrorReporter();

      expect(reporter).toBeDefined();
    });

    it('should capture exceptions', () => {
      mockEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123', PROD: true });

      const reporter = new SentryErrorReporter();
      const error = new Error('Test error');
      reporter.captureException(error);

      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should capture messages', () => {
      mockEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123', PROD: true });

      const reporter = new SentryErrorReporter();
      reporter.captureMessage('Test message', 'error');

      expect(consoleSpies.log).toHaveBeenCalled();
    });

    it('should store user context', () => {
      mockEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123', PROD: true });

      const reporter = new SentryErrorReporter();
      reporter.setUser({ id: 'user-123' });

      expect(reporter).toBeDefined();
    });
  });

  describe('errorReporter instance', () => {
    it('should be defined', () => {
      expect(errorReporter).toBeDefined();
      expect(errorReporter.captureException).toBeDefined();
      expect(errorReporter.captureMessage).toBeDefined();
      expect(errorReporter.setUser).toBeDefined();
      expect(errorReporter.setContext).toBeDefined();
      expect(errorReporter.clearContext).toBeDefined();
    });
  });

  describe('redactSensitiveData', () => {
    it('should redact password fields', () => {
      const data = {
        password: 'secret123',
        email: 'test@example.com',
      };

      const redacted = redactSensitiveData(data);

      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.email).toBe('test@example.com');
    });

    it('should redact token fields', () => {
      const data = {
        accessToken: 'abc123',
        refreshToken: 'xyz789',
      };

      const redacted = redactSensitiveData(data);

      expect(redacted.accessToken).toBe('[REDACTED]');
      expect(redacted.refreshToken).toBe('[REDACTED]');
    });

    it('should redact authorization headers', () => {
      const data = {
        headers: {
          authorization: 'Bearer secret-token',
          'content-type': 'application/json',
        },
      };

      const redacted = redactSensitiveData(data);

      expect(redacted.headers.authorization).toBe('[REDACTED]');
      expect(redacted.headers['content-type']).toBe('application/json');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          password: 'secret',
          email: 'test@example.com',
        },
      };

      const redacted = redactSensitiveData(data);

      expect(redacted.user.password).toBe('[REDACTED]');
      expect(redacted.user.email).toBe('test@example.com');
    });

    it('should handle arrays', () => {
      const data = {
        items: [{ password: 'secret1' }, { password: 'secret2' }],
      };

      const redacted = redactSensitiveData(data);

      expect(redacted.items[0].password).toBe('[REDACTED]');
      expect(redacted.items[1].password).toBe('[REDACTED]');
    });

    it('should handle null values', () => {
      const redacted = redactSensitiveData(null);
      expect(redacted).toBeNull();
    });

    it('should handle undefined values', () => {
      const redacted = redactSensitiveData(undefined);
      expect(redacted).toBeUndefined();
    });

    it('should handle primitive values', () => {
      expect(redactSensitiveData(123)).toBe(123);
      expect(redactSensitiveData(true)).toBe(true);
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-01');
      const redacted = redactSensitiveData(date);
      expect(redacted).toBe(date.toISOString());
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error with password=secret');
      const redacted = redactSensitiveData(error) as { name: string; message: string };

      expect(redacted.name).toBe('Error');
      expect(redacted.message).toContain('[REDACTED]');
    });

    it('should handle strings with sensitive patterns', () => {
      const data = 'bearer abc123token=xyz';
      const redacted = redactSensitiveData(data);

      expect(redacted).toContain('[REDACTED]');
    });

    it('should handle max depth', () => {
      const deepObject: Record<string, unknown> = { level: 0 };
      let current = deepObject;
      for (let i = 0; i < 15; i++) {
        current.nested = { level: i + 1 };
        current = current.nested as Record<string, unknown>;
      }

      const redacted = redactSensitiveData(deepObject);
      expect(redacted).toBeDefined();
    });

    it('should redact apiKey fields', () => {
      const data = {
        apiKey: 'my-secret-key',
        name: 'test',
      };

      const redacted = redactSensitiveData(data);

      expect(redacted.apiKey).toBe('[REDACTED]');
      expect(redacted.name).toBe('test');
    });

    it('should redact session fields', () => {
      const data = {
        session: 'session-id-123',
        userId: 'user-1',
      };

      const redacted = redactSensitiveData(data);

      expect(redacted.session).toBe('[REDACTED]');
      expect(redacted.userId).toBe('user-1');
    });

    it('should redact cookie fields', () => {
      const data = {
        cookie: 'session=abc123',
        userAgent: 'Mozilla/5.0',
      };

      const redacted = redactSensitiveData(data);

      expect(redacted.cookie).toBe('[REDACTED]');
      expect(redacted.userAgent).toBe('Mozilla/5.0');
    });

    it('should handle partial key matches', () => {
      const data = {
        userPassword: 'secret',
        apiTokenValue: 'token123',
        name: 'test',
      };

      const redacted = redactSensitiveData(data);

      expect(redacted.userPassword).toBe('[REDACTED]');
      expect(redacted.apiTokenValue).toBe('[REDACTED]');
      expect(redacted.name).toBe('test');
    });
  });

  describe('ConsoleErrorReporter additional tests', () => {
    let reporter: ConsoleErrorReporter;

    beforeEach(() => {
      reporter = new ConsoleErrorReporter();
    });

    it('should handle null user', () => {
      reporter.setUser(null);
      reporter.captureException(new Error('Test'));
      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', () => {
      reporter.captureException('string error');
      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should handle unknown exceptions', () => {
      reporter.captureException({ custom: 'error' });
      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should handle setContext and clearContext', () => {
      reporter.setContext('test', { key: 'value' });
      reporter.captureException(new Error('Test'));
      expect(consoleSpies.error).toHaveBeenCalled();

      reporter.clearContext('test');
      expect(reporter).toBeDefined();
    });

    it('should handle captureMessage with warning level', () => {
      reporter.captureMessage('Warning message', 'warning');
      expect(consoleSpies.warn).toHaveBeenCalled();
    });

    it('should handle captureMessage with error level', () => {
      reporter.captureMessage('Error message', 'error');
      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should handle captureMessage with context', () => {
      reporter.captureMessage('Test message', 'info', { userId: 'user-1', action: 'test' });
      expect(consoleSpies.info).toHaveBeenCalled();
    });

    it('should handle setUser with valid user', () => {
      reporter.setUser({ id: 'user-1', email: 'test@example.com', username: 'testuser' });
      reporter.captureException(new Error('Test'));
      expect(consoleSpies.error).toHaveBeenCalled();
    });
  });

  describe('SentryErrorReporter additional tests', () => {
    it('should handle setContext', () => {
      mockEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123', PROD: true });

      const reporter = new SentryErrorReporter();
      reporter.setContext('custom', { key: 'value' });

      expect(reporter).toBeDefined();
    });

    it('should handle clearContext', () => {
      mockEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123', PROD: true });

      const reporter = new SentryErrorReporter();
      reporter.setContext('custom', { key: 'value' });
      reporter.clearContext('custom');

      expect(reporter).toBeDefined();
    });

    it('should handle captureException with context', () => {
      mockEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123', PROD: true });

      const reporter = new SentryErrorReporter();
      reporter.captureException(new Error('Test'), { userId: 'user-1', action: 'test' });

      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should handle setUser', () => {
      mockEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123', PROD: true });

      const reporter = new SentryErrorReporter();
      reporter.setUser({ id: 'user-1', email: 'test@example.com', username: 'testuser' });
      reporter.captureException(new Error('Test'));

      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should handle null user', () => {
      mockEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123', PROD: true });

      const reporter = new SentryErrorReporter();
      reporter.setUser(null);
      reporter.captureException(new Error('Test'));

      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', () => {
      mockEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123', PROD: true });

      const reporter = new SentryErrorReporter();
      reporter.captureException('string error');

      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should handle unknown exceptions', () => {
      mockEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123', PROD: true });

      const reporter = new SentryErrorReporter();
      reporter.captureException({ custom: 'error' });

      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should work without DSN', () => {
      mockEnv({ VITE_SENTRY_DSN: undefined, PROD: true });

      const reporter = new SentryErrorReporter();
      reporter.captureException(new Error('Test'));

      expect(consoleSpies.error).toHaveBeenCalled();
    });
  });

  describe('SentryErrorReporter additional tests', () => {
    it('should handle captureMessage with different levels', () => {
      mockEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123', PROD: true });

      const reporter = new SentryErrorReporter();
      reporter.captureMessage('Info message', 'info');
      reporter.captureMessage('Warning message', 'warning');

      expect(consoleSpies.log).toHaveBeenCalled();
    });

    it('should handle setContext', () => {
      mockEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123', PROD: true });

      const reporter = new SentryErrorReporter();
      reporter.setContext('custom', { key: 'value' });

      expect(reporter).toBeDefined();
    });

    it('should handle clearContext', () => {
      mockEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123', PROD: true });

      const reporter = new SentryErrorReporter();
      reporter.setContext('custom', { key: 'value' });
      reporter.clearContext('custom');

      expect(reporter).toBeDefined();
    });

    it('should handle captureException with context', () => {
      mockEnv({ VITE_SENTRY_DSN: 'https://test@sentry.io/123', PROD: true });

      const reporter = new SentryErrorReporter();
      reporter.captureException(new Error('Test'), { userId: 'user-1', action: 'test' });

      expect(consoleSpies.error).toHaveBeenCalled();
    });
  });
});

describe('createErrorReporter paths', () => {
  it('should behave as ConsoleErrorReporter in development mode (direct construction)', () => {
    const reporter = new ConsoleErrorReporter();

    expect(() => {
      reporter.captureException(new Error('Test error'));
      reporter.captureMessage('Test message');
      reporter.setUser({ id: 'user-1' });
      reporter.setContext('custom', { key: 'value' });
      reporter.clearContext('custom');
    }).not.toThrow();
  });

  it('should behave as ConsoleErrorReporter in production without Sentry DSN (direct construction)', () => {
    const reporter = new ConsoleErrorReporter();

    expect(() => {
      reporter.captureException(new Error('Test error'));
      reporter.captureMessage('Test message');
    }).not.toThrow();
  });

  it('should behave as CompositeErrorReporter in production with Sentry DSN (direct construction)', () => {
    const sentryReporter = new SentryErrorReporter();
    const consoleReporter = new ConsoleErrorReporter();
    const reporter = new CompositeErrorReporter([sentryReporter, consoleReporter]);

    expect(() => {
      reporter.captureException(new Error('Test error'));
      reporter.captureMessage('Test message', 'warning', { action: 'test' });
      reporter.setUser({ id: 'user-1', email: 'test@example.com' });
      reporter.setContext('custom', { key: 'value' });
      reporter.clearContext('custom');
    }).not.toThrow();
  });

  it('should not throw when calling methods on CompositeErrorReporter with Sentry DSN (direct construction)', () => {
    const sentryReporter = new SentryErrorReporter();
    const consoleReporter = new ConsoleErrorReporter();
    const reporter = new CompositeErrorReporter([sentryReporter, consoleReporter]);

    expect(() => {
      reporter.captureException(new Error('Test error'));
      reporter.captureMessage('Test message', 'warning', { action: 'test' });
      reporter.setUser({ id: 'user-1', email: 'test@example.com' });
      reporter.setContext('custom', { key: 'value' });
      reporter.clearContext('custom');
    }).not.toThrow();
  });
});

describe('CompositeErrorReporter', () => {
  let mockReporter1: ErrorReporter;
  let mockReporter2: ErrorReporter;
  let reporter: CompositeErrorReporter;

  beforeEach(() => {
    mockReporter1 = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
      setUser: vi.fn(),
      setContext: vi.fn(),
      clearContext: vi.fn(),
    };
    mockReporter2 = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
      setUser: vi.fn(),
      setContext: vi.fn(),
      clearContext: vi.fn(),
    };
    reporter = new CompositeErrorReporter([mockReporter1, mockReporter2]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should delegate captureException to all reporters', () => {
    const error = new Error('Test error');
    const context = { action: 'test' };

    reporter.captureException(error, context);

    expect(mockReporter1.captureException).toHaveBeenCalledWith(error, context);
    expect(mockReporter2.captureException).toHaveBeenCalledWith(error, context);
  });

  it('should delegate captureMessage to all reporters', () => {
    reporter.captureMessage('Test message', 'error', { action: 'test' });

    expect(mockReporter1.captureMessage).toHaveBeenCalledWith('Test message', 'error', {
      action: 'test',
    });
    expect(mockReporter2.captureMessage).toHaveBeenCalledWith('Test message', 'error', {
      action: 'test',
    });
  });

  it('should delegate setUser to all reporters', () => {
    const user = { id: 'user-1', email: 'test@example.com' };

    reporter.setUser(user);

    expect(mockReporter1.setUser).toHaveBeenCalledWith(user);
    expect(mockReporter2.setUser).toHaveBeenCalledWith(user);
  });

  it('should delegate setContext to all reporters', () => {
    reporter.setContext('custom', { key: 'value' });

    expect(mockReporter1.setContext).toHaveBeenCalledWith('custom', { key: 'value' });
    expect(mockReporter2.setContext).toHaveBeenCalledWith('custom', { key: 'value' });
  });

  it('should delegate clearContext to all reporters', () => {
    reporter.clearContext('custom');

    expect(mockReporter1.clearContext).toHaveBeenCalledWith('custom');
    expect(mockReporter2.clearContext).toHaveBeenCalledWith('custom');
  });

  describe('forEach failure handling', () => {
    it('should not throw when a reporter fails in captureException', () => {
      mockReporter1.captureException = vi.fn().mockImplementation(() => {
        throw new Error('Reporter 1 failed');
      });

      expect(() => reporter.captureException(new Error('Test'))).not.toThrow();
      expect(mockReporter2.captureException).toHaveBeenCalled();
    });

    it('should not throw when a reporter fails in captureMessage', () => {
      mockReporter1.captureMessage = vi.fn().mockImplementation(() => {
        throw new Error('Reporter 1 failed');
      });

      expect(() => reporter.captureMessage('Test')).not.toThrow();
      expect(mockReporter2.captureMessage).toHaveBeenCalled();
    });

    it('should not throw when a reporter fails in setUser', () => {
      mockReporter1.setUser = vi.fn().mockImplementation(() => {
        throw new Error('Reporter 1 failed');
      });

      expect(() => reporter.setUser({ id: 'user-1' })).not.toThrow();
      expect(mockReporter2.setUser).toHaveBeenCalled();
    });

    it('should not throw when a reporter fails in setContext', () => {
      mockReporter1.setContext = vi.fn().mockImplementation(() => {
        throw new Error('Reporter 1 failed');
      });

      expect(() => reporter.setContext('key', { value: 'test' })).not.toThrow();
      expect(mockReporter2.setContext).toHaveBeenCalled();
    });

    it('should not throw when a reporter fails in clearContext', () => {
      mockReporter1.clearContext = vi.fn().mockImplementation(() => {
        throw new Error('Reporter 1 failed');
      });

      expect(() => reporter.clearContext('key')).not.toThrow();
      expect(mockReporter2.clearContext).toHaveBeenCalled();
    });

    it('should continue calling subsequent reporters when one fails in captureException', () => {
      mockReporter1.captureException = vi.fn().mockImplementation(() => {
        throw new Error('Reporter 1 failed');
      });
      mockReporter2.captureException = vi.fn().mockImplementation(() => {
        throw new Error('Reporter 2 failed');
      });

      expect(() => reporter.captureException(new Error('Test'))).not.toThrow();
      expect(mockReporter1.captureException).toHaveBeenCalled();
      expect(mockReporter2.captureException).toHaveBeenCalled();
    });
  });
});
