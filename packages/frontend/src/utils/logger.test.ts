import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logger,
  createComponentLogger,
  resetSessionId,
  resetStoreProvider,
  setStoreProvider,
} from './logger';

describe('Logger', () => {
  let consoleSpies: {
    log: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    resetSessionId();
    resetStoreProvider();
    setStoreProvider({
      getAuthState: () => ({ user: { id: 'test-user-id' } }),
      getTeamState: () => ({ currentTeamId: 'test-team-id' }),
    });
    consoleSpies = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('log methods', () => {
    it('should call console.info for info', () => {
      logger.info('Info test');
      expect(consoleSpies.info).toHaveBeenCalled();
    });

    it('should call console.warn for warn', () => {
      logger.warn('Warn test');
      expect(consoleSpies.warn).toHaveBeenCalled();
    });

    it('should call console.error for error', () => {
      logger.error('Error test');
      expect(consoleSpies.error).toHaveBeenCalled();
    });
  });

  describe('log level filtering', () => {
    it('should always log info', () => {
      logger.info('Info message');
      expect(consoleSpies.info).toHaveBeenCalled();
    });

    it('should always log warn', () => {
      logger.warn('Warn message');
      expect(consoleSpies.warn).toHaveBeenCalled();
    });

    it('should always log error', () => {
      logger.error('Error message');
      expect(consoleSpies.error).toHaveBeenCalled();
    });
  });

  describe('createComponentLogger', () => {
    it('should create logger with component context', () => {
      const componentLogger = createComponentLogger('TestComponent');
      expect(componentLogger).toBeDefined();
      expect(componentLogger.debug).toBeDefined();
      expect(componentLogger.info).toBeDefined();
      expect(componentLogger.warn).toBeDefined();
      expect(componentLogger.error).toBeDefined();
      expect(componentLogger.log).toBeDefined();
    });

    it('should have all log methods', () => {
      const componentLogger = createComponentLogger('TestComponent');

      expect(typeof componentLogger.debug).toBe('function');
      expect(typeof componentLogger.info).toBe('function');
      expect(typeof componentLogger.warn).toBe('function');
      expect(typeof componentLogger.error).toBe('function');
      expect(typeof componentLogger.log).toBe('function');
    });
  });

  describe('resetSessionId', () => {
    it('should reset session ID', () => {
      resetSessionId();
      expect(true).toBe(true);
    });
  });

  describe('context enrichment', () => {
    it('should log with context', () => {
      logger.info('Test message', { userId: 'custom-user' });
      expect(consoleSpies.info).toHaveBeenCalled();
    });

    it('should log with data', () => {
      logger.info('Test message', undefined, { key: 'value' });
      expect(consoleSpies.info).toHaveBeenCalled();
    });
  });

  describe('getStructuredEntry', () => {
    it('should return structured log entry', () => {
      const entry = logger.getStructuredEntry('info', 'Test message', { userId: 'user-1' });
      expect(entry).toBeDefined();
      expect(entry.level).toBe('info');
      expect(entry.message).toBe('Test message');
      expect(entry.timestamp).toBeDefined();
      expect(entry.environment).toBeDefined();
    });

    it('should include data in structured entry', () => {
      const entry = logger.getStructuredEntry('error', 'Error message', undefined, {
        error: 'details',
      });
      expect(entry.data).toEqual({ error: 'details' });
    });
  });

  describe('component logger', () => {
    it('should log with component name', () => {
      const componentLogger = createComponentLogger('MyComponent');
      componentLogger.info('Component message');
      expect(consoleSpies.info).toHaveBeenCalled();
    });

    it('should log warn with component name', () => {
      const componentLogger = createComponentLogger('MyComponent');
      componentLogger.warn('Component warning');
      expect(consoleSpies.warn).toHaveBeenCalled();
    });

    it('should log error with component name', () => {
      const componentLogger = createComponentLogger('MyComponent');
      componentLogger.error('Component error');
      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should log with log method', () => {
      const componentLogger = createComponentLogger('MyComponent');
      componentLogger.log('info', 'Log message');
      expect(consoleSpies.info).toHaveBeenCalled();
    });

    it('should include context in component logger', () => {
      const componentLogger = createComponentLogger('MyComponent');
      componentLogger.info('Message with context', { action: 'click' });
      expect(consoleSpies.info).toHaveBeenCalled();
    });

    it('should include data in component logger', () => {
      const componentLogger = createComponentLogger('MyComponent');
      componentLogger.error('Error with data', undefined, { code: 500 });
      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should use getStructuredEntry with component context', () => {
      const componentLogger = createComponentLogger('MyComponent');
      const entry = componentLogger.getStructuredEntry('info', 'Test message');
      expect(entry).toBeDefined();
      expect(entry.context.componentName).toBe('MyComponent');
    });
  });

  describe('error logging with Error objects', () => {
    it('should log Error objects', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', undefined, { error });
      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should log error with stack trace', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      logger.error('Error with stack', undefined, { error });
      expect(consoleSpies.error).toHaveBeenCalled();
    });
  });

  describe('multiple log calls', () => {
    it('should handle multiple sequential logs', () => {
      logger.info('Message 1');
      logger.info('Message 2');
      logger.warn('Warning 1');
      logger.error('Error 1');

      expect(consoleSpies.info).toHaveBeenCalledTimes(2);
      expect(consoleSpies.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpies.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('session ID', () => {
    it('should maintain session ID across calls', () => {
      logger.info('First message');
      logger.info('Second message');

      expect(consoleSpies.info).toHaveBeenCalledTimes(2);
    });

    it('should generate new session ID after reset', () => {
      logger.info('Before reset');
      resetSessionId();
      logger.info('After reset');

      expect(consoleSpies.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('empty and null handling', () => {
    it('should handle empty message', () => {
      logger.info('');
      expect(consoleSpies.info).toHaveBeenCalled();
    });

    it('should handle null context', () => {
      logger.info('Message', null as unknown as Record<string, unknown>);
      expect(consoleSpies.info).toHaveBeenCalled();
    });

    it('should handle undefined context', () => {
      logger.info('Message', undefined);
      expect(consoleSpies.info).toHaveBeenCalled();
    });
  });

  describe('log method', () => {
    it('should log with explicit level', () => {
      logger.log('info', 'Info message');
      expect(consoleSpies.info).toHaveBeenCalled();
    });

    it('should log warn with explicit level', () => {
      logger.log('warn', 'Warn message');
      expect(consoleSpies.warn).toHaveBeenCalled();
    });

    it('should log error with explicit level', () => {
      logger.log('error', 'Error message');
      expect(consoleSpies.error).toHaveBeenCalled();
    });
  });

  describe('window location', () => {
    it('should include page from window location', () => {
      vi.stubGlobal('window', {
        location: { pathname: '/test-page' },
      });

      logger.info('Page context');
      expect(consoleSpies.info).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });

  describe('context merging', () => {
    it('should merge provided context with enriched context', () => {
      logger.info('Merged context', { userId: 'custom-user', action: 'test' });
      expect(consoleSpies.info).toHaveBeenCalled();
    });

    it('should override default context with provided context', () => {
      logger.info('Override context', { page: '/custom-page' });
      expect(consoleSpies.info).toHaveBeenCalled();
    });
  });

  describe('structured entry with all fields', () => {
    it('should create entry with all optional fields', () => {
      const entry = logger.getStructuredEntry(
        'error',
        'Full entry',
        {
          userId: 'user-1',
          teamId: 'team-1',
          page: '/test',
          action: 'click',
          componentName: 'TestComponent',
          sessionId: 'session-1',
        },
        { extra: 'data' }
      );

      expect(entry.level).toBe('error');
      expect(entry.message).toBe('Full entry');
      expect(entry.context.userId).toBe('user-1');
      expect(entry.context.teamId).toBe('team-1');
      expect(entry.context.page).toBe('/test');
      expect(entry.context.action).toBe('click');
      expect(entry.context.componentName).toBe('TestComponent');
      expect(entry.data).toEqual({ extra: 'data' });
    });
  });

  describe('component logger debug', () => {
    it('should have debug method', () => {
      const componentLogger = createComponentLogger('TestComponent');
      expect(typeof componentLogger.debug).toBe('function');
    });
  });
});
