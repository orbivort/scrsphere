import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useTimeout, useTimeoutFn } from './useTimeout';

describe('useTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call callback after delay', () => {
    const callback = vi.fn();

    renderHook(() => useTimeout(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not call callback when delay is null', () => {
    const callback = vi.fn();

    renderHook(() => useTimeout(callback, null));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should use the latest callback', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { rerender } = renderHook(({ callback, delay }) => useTimeout(callback, delay), {
      initialProps: { callback: callback1, delay: 1000 },
    });

    rerender({ callback: callback2, delay: 1000 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should clear timeout on unmount', () => {
    const callback = vi.fn();

    const { unmount } = renderHook(() => useTimeout(callback, 1000));

    unmount();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should reset timeout when delay changes', () => {
    const callback = vi.fn();

    const { rerender } = renderHook(({ callback, delay }) => useTimeout(callback, delay), {
      initialProps: { callback, delay: 1000 },
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    rerender({ callback, delay: 2000 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('useTimeoutFn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return set and clear functions', () => {
    const callback = vi.fn();

    const { result } = renderHook(() => useTimeoutFn(callback, 1000));

    expect(result.current.set).toBeDefined();
    expect(result.current.clear).toBeDefined();
    expect(typeof result.current.set).toBe('function');
    expect(typeof result.current.clear).toBe('function');
  });

  it('should call callback when set is called', () => {
    const callback = vi.fn();

    const { result } = renderHook(() => useTimeoutFn(callback, 1000));

    act(() => {
      result.current.set();
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should clear timeout when clear is called', () => {
    const callback = vi.fn();

    const { result } = renderHook(() => useTimeoutFn(callback, 1000));

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    act(() => {
      timeoutId = result.current.set();
    });

    act(() => {
      if (timeoutId !== undefined) {
        result.current.clear(timeoutId);
      }
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should use the latest callback', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ callback, delay }) => useTimeoutFn(callback, delay),
      { initialProps: { callback: callback1, delay: 1000 } }
    );

    rerender({ callback: callback2, delay: 1000 });

    act(() => {
      result.current.set();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
