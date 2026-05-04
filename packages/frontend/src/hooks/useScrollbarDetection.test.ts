import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useScrollbarDetection } from './useScrollbarDetection';

describe('useScrollbarDetection', () => {
  let resizeListeners: Array<(event: Event) => void> = [];

  beforeEach(() => {
    resizeListeners = [];

    vi.spyOn(window, 'addEventListener').mockImplementation(
      (event: string, handler: EventListenerOrEventListenerObject) => {
        if (event === 'resize') {
          resizeListeners.push(handler as (event: Event) => void);
        }
      }
    );

    vi.spyOn(window, 'removeEventListener').mockImplementation(
      (event: string, handler: EventListenerOrEventListenerObject) => {
        if (event === 'resize') {
          resizeListeners = resizeListeners.filter((l) => l !== handler);
        }
      }
    );

    // Mock ResizeObserver
    global.ResizeObserver = vi.fn(function (
      this: ResizeObserver,
      callback: ResizeObserverCallback
    ) {
      this.observe = vi.fn();
      this.disconnect = vi.fn();
      this.unobserve = vi.fn();
      // Store callback for triggering
      (this as unknown as { _callback: ResizeObserverCallback })._callback = callback;
    }) as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return false when enabled is false', () => {
    const ref = { current: document.createElement('div') };

    const { result } = renderHook(() => useScrollbarDetection(ref, false));

    expect(result.current).toBe(false);
  });

  it('should return false when ref is null', () => {
    const ref = { current: null };

    const { result } = renderHook(() => useScrollbarDetection(ref, true));

    expect(result.current).toBe(false);
  });

  it('should detect scrollbar when scrollHeight > clientHeight', () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollHeight', {
      value: 200,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(element, 'clientHeight', {
      value: 100,
      writable: true,
      configurable: true,
    });
    const ref = { current: element };

    const { result } = renderHook(() => useScrollbarDetection(ref, true));

    expect(result.current).toBe(true);
  });

  it('should not detect scrollbar when scrollHeight <= clientHeight', () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollHeight', {
      value: 100,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(element, 'clientHeight', {
      value: 100,
      writable: true,
      configurable: true,
    });
    const ref = { current: element };

    const { result } = renderHook(() => useScrollbarDetection(ref, true));

    expect(result.current).toBe(false);
  });

  it('should update when enabled changes from false to true', () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollHeight', {
      value: 200,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(element, 'clientHeight', {
      value: 100,
      writable: true,
      configurable: true,
    });
    const ref = { current: element };

    const { result, rerender } = renderHook(({ enabled }) => useScrollbarDetection(ref, enabled), {
      initialProps: { enabled: false },
    });

    expect(result.current).toBe(false);

    rerender({ enabled: true });

    expect(result.current).toBe(true);
  });

  it('should update when enabled changes from true to false', () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollHeight', {
      value: 200,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(element, 'clientHeight', {
      value: 100,
      writable: true,
      configurable: true,
    });
    const ref = { current: element };

    const { result, rerender } = renderHook(({ enabled }) => useScrollbarDetection(ref, enabled), {
      initialProps: { enabled: true },
    });

    expect(result.current).toBe(true);

    rerender({ enabled: false });

    expect(result.current).toBe(false);
  });

  it('should add resize event listener when enabled', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const element = document.createElement('div');
    const ref = { current: element };

    renderHook(() => useScrollbarDetection(ref, true));

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should create ResizeObserver when available', () => {
    const element = document.createElement('div');
    const ref = { current: element };

    renderHook(() => useScrollbarDetection(ref, true));

    expect(global.ResizeObserver).toHaveBeenCalled();
  });

  it('should observe the element with ResizeObserver', () => {
    const element = document.createElement('div');
    const ref = { current: element };

    renderHook(() => useScrollbarDetection(ref, true));

    const mockObserver = vi.mocked(global.ResizeObserver).mock.results[0]?.value as ResizeObserver;
    expect(mockObserver.observe).toHaveBeenCalledWith(element);
  });

  it('should disconnect ResizeObserver on unmount', () => {
    const element = document.createElement('div');
    const ref = { current: element };

    const { unmount } = renderHook(() => useScrollbarDetection(ref, true));

    const mockObserver = vi.mocked(global.ResizeObserver).mock.results[0]?.value as ResizeObserver;
    unmount();

    expect(mockObserver.disconnect).toHaveBeenCalled();
  });

  it('should remove resize listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const element = document.createElement('div');
    const ref = { current: element };

    const { unmount } = renderHook(() => useScrollbarDetection(ref, true));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should update scrollbar status on window resize', () => {
    const element = document.createElement('div');
    let scrollHeight = 100;
    const clientHeight = 100;
    Object.defineProperty(element, 'scrollHeight', {
      get: () => scrollHeight,
      configurable: true,
    });
    Object.defineProperty(element, 'clientHeight', {
      get: () => clientHeight,
      configurable: true,
    });
    const ref = { current: element };

    const { result } = renderHook(() => useScrollbarDetection(ref, true));

    expect(result.current).toBe(false);

    scrollHeight = 200;

    act(() => {
      resizeListeners.forEach((listener) => listener(new Event('resize')));
    });

    expect(result.current).toBe(true);
  });

  it('should work without ResizeObserver if not available', () => {
    const originalResizeObserver = global.ResizeObserver;
    // @ts-expect-error - Testing without ResizeObserver
    global.ResizeObserver = undefined;

    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollHeight', {
      value: 200,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(element, 'clientHeight', {
      value: 100,
      writable: true,
      configurable: true,
    });
    const ref = { current: element };

    const { result } = renderHook(() => useScrollbarDetection(ref, true));

    expect(result.current).toBe(true);

    global.ResizeObserver = originalResizeObserver;
  });
});
