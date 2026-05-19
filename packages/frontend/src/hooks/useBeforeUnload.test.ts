import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useBeforeUnload, useFormUnloadProtection } from './useBeforeUnload';

describe('useBeforeUnload', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should add beforeunload event listener when enabled is true', () => {
    renderHook(() => useBeforeUnload(true));

    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('should not add event listener when enabled is false', () => {
    vi.restoreAllMocks();
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useBeforeUnload(false));

    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => useBeforeUnload(true));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('should remove event listener when enabled changes from true to false', () => {
    const { rerender } = renderHook(({ enabled }) => useBeforeUnload(enabled), {
      initialProps: { enabled: true },
    });

    rerender({ enabled: false });

    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('should add event listener when enabled changes from false to true', () => {
    const { rerender } = renderHook(({ enabled }) => useBeforeUnload(enabled), {
      initialProps: { enabled: false },
    });

    vi.restoreAllMocks();
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    rerender({ enabled: true });

    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('should call preventDefault when beforeunload is triggered', () => {
    renderHook(() => useBeforeUnload(true, 'Custom message'));

    const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should not prevent default when handler is called with enabled=false', () => {
    const { rerender } = renderHook(({ enabled }) => useBeforeUnload(enabled), {
      initialProps: { enabled: true },
    });

    rerender({ enabled: false });

    const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });
});

describe('useFormUnloadProtection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return isProtected as true when isDirty is true', () => {
    const { result } = renderHook(() => useFormUnloadProtection(true));

    expect(result.current.isProtected).toBe(true);
  });

  it('should return isProtected as false when isDirty is false', () => {
    const { result } = renderHook(() => useFormUnloadProtection(false));

    expect(result.current.isProtected).toBe(false);
  });

  it('should update isProtected when isDirty changes', () => {
    const { result, rerender } = renderHook(({ isDirty }) => useFormUnloadProtection(isDirty), {
      initialProps: { isDirty: false },
    });

    expect(result.current.isProtected).toBe(false);

    rerender({ isDirty: true });

    expect(result.current.isProtected).toBe(true);
  });

  it('should pass message option to useBeforeUnload', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useFormUnloadProtection(true, { message: 'Custom form message' }));

    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('should not log debug message when debug is false', () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    renderHook(() => useFormUnloadProtection(true, { debug: false }));

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should not log debug message when isDirty is false', () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    renderHook(() => useFormUnloadProtection(false, { debug: true }));

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should log debug message when both debug and isDirty are true', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderHook(() => useFormUnloadProtection(true, { debug: true }));

    expect(consoleSpy).toHaveBeenCalled();
  });
});
