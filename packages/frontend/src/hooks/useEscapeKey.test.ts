import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useEscapeKey } from './useEscapeKey';

describe('useEscapeKey', () => {
  const mockHandler = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should add keydown event listener when enabled is true', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

    renderHook(() => useEscapeKey(mockHandler, true));

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should not add event listener when enabled is false', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

    renderHook(() => useEscapeKey(mockHandler, false));

    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it('should call handler when Escape key is pressed', () => {
    renderHook(() => useEscapeKey(mockHandler, true));

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('should not call handler when other keys are pressed', () => {
    renderHook(() => useEscapeKey(mockHandler, true));

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    document.dispatchEvent(enterEvent);

    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
    document.dispatchEvent(spaceEvent);

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
    document.dispatchEvent(tabEvent);

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should remove event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useEscapeKey(mockHandler, true));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should remove event listener when enabled changes from true to false', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { rerender } = renderHook(({ enabled }) => useEscapeKey(mockHandler, enabled), {
      initialProps: { enabled: true },
    });

    rerender({ enabled: false });

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should add event listener when enabled changes from false to true', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

    const { rerender } = renderHook(({ enabled }) => useEscapeKey(mockHandler, enabled), {
      initialProps: { enabled: false },
    });

    expect(addEventListenerSpy).not.toHaveBeenCalled();

    rerender({ enabled: true });

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should default to enabled=true when not specified', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

    renderHook(() => useEscapeKey(mockHandler));

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should not call handler after unmount', () => {
    const { unmount } = renderHook(() => useEscapeKey(mockHandler, true));

    unmount();

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should not call handler after disabled', () => {
    const { rerender } = renderHook(({ enabled }) => useEscapeKey(mockHandler, enabled), {
      initialProps: { enabled: true },
    });

    rerender({ enabled: false });

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should update handler when handler function changes', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { rerender } = renderHook(({ handler }) => useEscapeKey(handler, true), {
      initialProps: { handler: handler1 },
    });

    let escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();

    rerender({ handler: handler2 });

    escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple escape key presses', () => {
    renderHook(() => useEscapeKey(mockHandler, true));

    for (let i = 0; i < 5; i++) {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
    }

    expect(mockHandler).toHaveBeenCalledTimes(5);
  });
});
