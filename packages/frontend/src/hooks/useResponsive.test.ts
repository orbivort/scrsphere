import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useResponsive } from './useResponsive';

describe('useResponsive', () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return false when window width is above default breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useResponsive());

    expect(result.current).toBe(false);
  });

  it('should return true when window width is at default breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true, configurable: true });

    const { result } = renderHook(() => useResponsive());

    expect(result.current).toBe(true);
  });

  it('should return true when window width is below default breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true });

    const { result } = renderHook(() => useResponsive());

    expect(result.current).toBe(true);
  });

  it('should use custom breakpoint when provided', () => {
    Object.defineProperty(window, 'innerWidth', { value: 900, writable: true, configurable: true });

    const { result } = renderHook(() => useResponsive(1000));

    expect(result.current).toBe(true);
  });

  it('should return false when window width is above custom breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1200,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useResponsive(1000));

    expect(result.current).toBe(false);
  });

  it('should update isMobile when window is resized', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useResponsive());

    expect(result.current).toBe(false);

    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true });

    act(() => {
      resizeListeners.forEach((listener) => listener(new Event('resize')));
    });

    expect(result.current).toBe(true);
  });

  it('should update isMobile when window is resized to larger', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true });

    const { result } = renderHook(() => useResponsive());

    expect(result.current).toBe(true);

    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
      configurable: true,
    });

    act(() => {
      resizeListeners.forEach((listener) => listener(new Event('resize')));
    });

    expect(result.current).toBe(false);
  });

  it('should remove resize listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useResponsive());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should handle multiple resize events', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useResponsive());

    expect(result.current).toBe(false);

    Object.defineProperty(window, 'innerWidth', { value: 700, writable: true, configurable: true });
    act(() => {
      resizeListeners.forEach((listener) => listener(new Event('resize')));
    });
    expect(result.current).toBe(true);

    Object.defineProperty(window, 'innerWidth', { value: 600, writable: true, configurable: true });
    act(() => {
      resizeListeners.forEach((listener) => listener(new Event('resize')));
    });
    expect(result.current).toBe(true);

    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
    act(() => {
      resizeListeners.forEach((listener) => listener(new Event('resize')));
    });
    expect(result.current).toBe(false);
  });

  it('should use default breakpoint of 768 when not provided', () => {
    Object.defineProperty(window, 'innerWidth', { value: 767, writable: true, configurable: true });

    const { result } = renderHook(() => useResponsive());

    expect(result.current).toBe(true);

    Object.defineProperty(window, 'innerWidth', { value: 769, writable: true, configurable: true });

    act(() => {
      resizeListeners.forEach((listener) => listener(new Event('resize')));
    });

    expect(result.current).toBe(false);
  });
});
