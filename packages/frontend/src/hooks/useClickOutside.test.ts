import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useClickOutside } from './useClickOutside';

describe('useClickOutside', () => {
  const mockHandler = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should add mousedown event listener when enabled is true', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const ref = { current: document.createElement('div') };

    renderHook(() => useClickOutside(ref, mockHandler, true));

    expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
  });

  it('should not add event listener when enabled is false', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const ref = { current: document.createElement('div') };

    renderHook(() => useClickOutside(ref, mockHandler, false));

    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it('should call handler when clicking outside the element', () => {
    const ref = { current: document.createElement('div') };
    document.body.appendChild(ref.current);

    renderHook(() => useClickOutside(ref, mockHandler, true));

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const clickEvent = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(clickEvent);

    expect(mockHandler).toHaveBeenCalledTimes(1);

    document.body.removeChild(ref.current);
    document.body.removeChild(outsideElement);
  });

  it('should not call handler when clicking inside the element', () => {
    const ref = { current: document.createElement('div') };
    document.body.appendChild(ref.current);

    renderHook(() => useClickOutside(ref, mockHandler, true));

    const clickEvent = new MouseEvent('mousedown', { bubbles: true });
    ref.current.dispatchEvent(clickEvent);

    expect(mockHandler).not.toHaveBeenCalled();

    document.body.removeChild(ref.current);
  });

  it('should not call handler when clicking on a child element inside the ref', () => {
    const ref = { current: document.createElement('div') };
    const childElement = document.createElement('span');
    ref.current.appendChild(childElement);
    document.body.appendChild(ref.current);

    renderHook(() => useClickOutside(ref, mockHandler, true));

    const clickEvent = new MouseEvent('mousedown', { bubbles: true });
    childElement.dispatchEvent(clickEvent);

    expect(mockHandler).not.toHaveBeenCalled();

    document.body.removeChild(ref.current);
  });

  it('should remove event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const ref = { current: document.createElement('div') };

    const { unmount } = renderHook(() => useClickOutside(ref, mockHandler, true));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
  });

  it('should remove event listener when enabled changes from true to false', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const ref = { current: document.createElement('div') };

    const { rerender } = renderHook(({ enabled }) => useClickOutside(ref, mockHandler, enabled), {
      initialProps: { enabled: true },
    });

    rerender({ enabled: false });

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
  });

  it('should add event listener when enabled changes from false to true', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const ref = { current: document.createElement('div') };

    const { rerender } = renderHook(({ enabled }) => useClickOutside(ref, mockHandler, enabled), {
      initialProps: { enabled: false },
    });

    expect(addEventListenerSpy).not.toHaveBeenCalled();

    rerender({ enabled: true });

    expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
  });

  it('should use capture phase for event listener', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const ref = { current: document.createElement('div') };

    renderHook(() => useClickOutside(ref, mockHandler, true));

    expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
  });

  it('should not call handler when ref.current is null', () => {
    const ref = { current: null };

    renderHook(() => useClickOutside(ref, mockHandler, true));

    const clickEvent = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(clickEvent);

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should update handler when handler function changes', () => {
    const ref = { current: document.createElement('div') };
    document.body.appendChild(ref.current);

    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { rerender } = renderHook(({ handler }) => useClickOutside(ref, handler, true), {
      initialProps: { handler: handler1 },
    });

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    let clickEvent = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(clickEvent);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();

    rerender({ handler: handler2 });

    clickEvent = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(clickEvent);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);

    document.body.removeChild(ref.current);
    document.body.removeChild(outsideElement);
  });

  it('should default to enabled=true when not specified', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const ref = { current: document.createElement('div') };

    renderHook(() => useClickOutside(ref, mockHandler));

    expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
  });
});
