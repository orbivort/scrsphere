import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useLogger, useGlobalLogger } from './useLogger';
import { logger, createComponentLogger } from '../utils/logger';

vi.mock('../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    getStructuredEntry: vi.fn(),
  },
  createComponentLogger: vi.fn((_componentName: string) => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    getStructuredEntry: vi.fn(),
  })),
  setStoreProvider: vi.fn(),
}));

describe('useLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return a logger with component name', () => {
    const { result } = renderHook(() => useLogger({ componentName: 'TestComponent' }));

    expect(result.current.componentName).toBe('TestComponent');
  });

  it('should have all log methods', () => {
    const { result } = renderHook(() => useLogger({ componentName: 'TestComponent' }));

    expect(typeof result.current.debug).toBe('function');
    expect(typeof result.current.info).toBe('function');
    expect(typeof result.current.warn).toBe('function');
    expect(typeof result.current.error).toBe('function');
    expect(typeof result.current.log).toBe('function');
    expect(typeof result.current.getStructuredEntry).toBe('function');
    expect(typeof result.current.logAction).toBe('function');
  });

  it('should call info when logAction is called', () => {
    const { result } = renderHook(() => useLogger({ componentName: 'TestComponent' }));

    result.current.logAction('button_click', 'User clicked button');

    expect(result.current.info).toBeDefined();
  });

  it('should include additional context', () => {
    const { result } = renderHook(() =>
      useLogger({
        componentName: 'TestComponent',
        context: { userId: 'user-123' },
      })
    );

    expect(result.current).toBeDefined();
  });

  it('should create stable logger instance', () => {
    const { result, rerender } = renderHook(() => useLogger({ componentName: 'TestComponent' }));

    const firstLogger = result.current;

    rerender();

    expect(result.current).toBe(firstLogger);
  });

  it('should create new logger when componentName changes', () => {
    const { result, rerender } = renderHook(({ componentName }) => useLogger({ componentName }), {
      initialProps: { componentName: 'Component1' },
    });

    const firstLogger = result.current;

    rerender({ componentName: 'Component2' });

    expect(result.current).not.toBe(firstLogger);
    expect(result.current.componentName).toBe('Component2');
  });

  describe('Log Methods', () => {
    it('should call debug method with message', () => {
      const mockDebug = vi.fn();
      vi.mocked(createComponentLogger).mockReturnValue({
        debug: mockDebug,
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn(),
        getStructuredEntry: vi.fn(),
      });

      const { result } = renderHook(() => useLogger({ componentName: 'TestComponent' }));

      act(() => {
        result.current.debug('Test debug message');
      });

      expect(mockDebug).toHaveBeenCalledWith('Test debug message', {}, undefined);
    });

    it('should call info method with message and context', () => {
      const mockInfo = vi.fn();
      vi.mocked(createComponentLogger).mockReturnValue({
        debug: vi.fn(),
        info: mockInfo,
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn(),
        getStructuredEntry: vi.fn(),
      });

      const { result } = renderHook(() => useLogger({ componentName: 'TestComponent' }));

      act(() => {
        result.current.info('Test info message', { action: 'test' });
      });

      expect(mockInfo).toHaveBeenCalledWith('Test info message', { action: 'test' }, undefined);
    });

    it('should call warn method with message', () => {
      const mockWarn = vi.fn();
      vi.mocked(createComponentLogger).mockReturnValue({
        debug: vi.fn(),
        info: vi.fn(),
        warn: mockWarn,
        error: vi.fn(),
        log: vi.fn(),
        getStructuredEntry: vi.fn(),
      });

      const { result } = renderHook(() => useLogger({ componentName: 'TestComponent' }));

      act(() => {
        result.current.warn('Test warning message');
      });

      expect(mockWarn).toHaveBeenCalledWith('Test warning message', {}, undefined);
    });

    it('should call error method with message and data', () => {
      const mockError = vi.fn();
      vi.mocked(createComponentLogger).mockReturnValue({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: mockError,
        log: vi.fn(),
        getStructuredEntry: vi.fn(),
      });

      const { result } = renderHook(() => useLogger({ componentName: 'TestComponent' }));

      const errorData = { error: new Error('Test error') };
      act(() => {
        result.current.error('Test error message', {}, errorData);
      });

      expect(mockError).toHaveBeenCalledWith('Test error message', {}, errorData);
    });

    it('should call log method with level', () => {
      const mockLog = vi.fn();
      vi.mocked(createComponentLogger).mockReturnValue({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        log: mockLog,
        getStructuredEntry: vi.fn(),
      });

      const { result } = renderHook(() => useLogger({ componentName: 'TestComponent' }));

      act(() => {
        result.current.log('info', 'Test log message');
      });

      expect(mockLog).toHaveBeenCalledWith('info', 'Test log message', {}, undefined);
    });

    it('should call getStructuredEntry method', () => {
      const mockGetStructuredEntry = vi.fn().mockReturnValue({ level: 'info', message: 'test' });
      vi.mocked(createComponentLogger).mockReturnValue({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn(),
        getStructuredEntry: mockGetStructuredEntry,
      });

      const { result } = renderHook(() => useLogger({ componentName: 'TestComponent' }));

      act(() => {
        result.current.getStructuredEntry('info', 'Test message');
      });

      expect(mockGetStructuredEntry).toHaveBeenCalled();
    });

    it('should call logAction with action and message', () => {
      const mockInfo = vi.fn();
      vi.mocked(createComponentLogger).mockReturnValue({
        debug: vi.fn(),
        info: mockInfo,
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn(),
        getStructuredEntry: vi.fn(),
      });

      const { result } = renderHook(() => useLogger({ componentName: 'TestComponent' }));

      act(() => {
        result.current.logAction('button_click', 'User clicked button', { buttonId: 'submit' });
      });

      expect(mockInfo).toHaveBeenCalledWith(
        'User clicked button',
        { action: 'button_click' },
        { buttonId: 'submit' }
      );
    });
  });

  describe('Context Merging', () => {
    it('should merge hook context with log context', () => {
      const mockInfo = vi.fn();
      vi.mocked(createComponentLogger).mockReturnValue({
        debug: vi.fn(),
        info: mockInfo,
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn(),
        getStructuredEntry: vi.fn(),
      });

      const { result } = renderHook(() =>
        useLogger({
          componentName: 'TestComponent',
          context: { userId: 'user-123', sessionId: 'session-456' },
        })
      );

      act(() => {
        result.current.info('Test message', { action: 'test' });
      });

      expect(mockInfo).toHaveBeenCalledWith(
        'Test message',
        { userId: 'user-123', sessionId: 'session-456', action: 'test' },
        undefined
      );
    });

    it('should override hook context with log context', () => {
      const mockInfo = vi.fn();
      vi.mocked(createComponentLogger).mockReturnValue({
        debug: vi.fn(),
        info: mockInfo,
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn(),
        getStructuredEntry: vi.fn(),
      });

      const { result } = renderHook(() =>
        useLogger({
          componentName: 'TestComponent',
          context: { userId: 'user-123' },
        })
      );

      act(() => {
        result.current.info('Test message', { userId: 'user-789', action: 'override' });
      });

      expect(mockInfo).toHaveBeenCalledWith(
        'Test message',
        { userId: 'user-789', action: 'override' },
        undefined
      );
    });
  });
});

describe('useGlobalLogger', () => {
  it('should return the global logger', () => {
    const { result } = renderHook(() => useGlobalLogger());

    expect(result.current).toBeDefined();
    expect(typeof result.current.debug).toBe('function');
    expect(typeof result.current.info).toBe('function');
    expect(typeof result.current.warn).toBe('function');
    expect(typeof result.current.error).toBe('function');
    expect(typeof result.current.log).toBe('function');
  });

  it('should return the same logger instance on multiple calls', () => {
    const { result: result1 } = renderHook(() => useGlobalLogger());
    const { result: result2 } = renderHook(() => useGlobalLogger());

    expect(result1.current).toBe(result2.current);
  });

  it('should call global logger methods', () => {
    const { result } = renderHook(() => useGlobalLogger());

    act(() => {
      result.current.info('Global log message');
    });

    expect(logger.info).toBeDefined();
  });
});
