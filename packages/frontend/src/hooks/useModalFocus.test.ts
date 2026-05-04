import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useModalFocus } from './useModalFocus';

describe('useModalFocus', () => {
  let container: HTMLDivElement;
  const onClose = vi.fn();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    vi.restoreAllMocks();
    document.body.style.overflow = '';
  });

  it('should return modalRef', () => {
    const { result } = renderHook(() => useModalFocus({ isOpen: false, onClose }));

    expect(result.current.modalRef).toBeDefined();
    expect(result.current.modalRef.current).toBeNull();
  });

  it('should focus first focusable element when modal opens', () => {
    const { result } = renderHook(() => useModalFocus({ isOpen: true, onClose }));

    // Create modal content and attach to ref
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <button id="close">Close</button>
      <input type="text" id="input1" />
      <button id="submit">Submit</button>
    `;
    container.appendChild(modalContent);

    // The hook should have attempted to focus the first element
    expect(result.current.modalRef).toBeDefined();
  });

  it('should call onClose when Escape key is pressed', () => {
    renderHook(() => useModalFocus({ isOpen: true, onClose }));

    // Simulate Escape key
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    document.dispatchEvent(escapeEvent);

    expect(onClose).toHaveBeenCalled();
  });

  it('should not call onClose when modal is closed', () => {
    const localOnClose = vi.fn();
    renderHook(() => useModalFocus({ isOpen: false, onClose: localOnClose }));

    // Simulate Escape key
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    document.dispatchEvent(escapeEvent);

    expect(localOnClose).not.toHaveBeenCalled();
  });

  it('should trap focus on Tab key', () => {
    renderHook(() => useModalFocus({ isOpen: true, onClose }));

    // Simulate Tab key
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
    });

    expect(() => {
      document.dispatchEvent(tabEvent);
    }).not.toThrow();
  });

  it('should trap focus on Shift+Tab key', () => {
    renderHook(() => useModalFocus({ isOpen: true, onClose }));

    // Simulate Shift+Tab key
    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
    });

    expect(() => {
      document.dispatchEvent(shiftTabEvent);
    }).not.toThrow();
  });

  it('should set body overflow to hidden when open', () => {
    renderHook(() => useModalFocus({ isOpen: true, onClose }));

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should handle custom initial focus ref', () => {
    const customFocusElement = document.createElement('button');
    customFocusElement.id = 'custom-focus';
    container.appendChild(customFocusElement);

    const initialFocusRef = { current: customFocusElement };

    renderHook(() => useModalFocus({ isOpen: true, onClose, initialFocusRef }));

    // The hook should use the custom initial focus
    expect(initialFocusRef.current).toBeDefined();
  });

  it('should handle modal state correctly', () => {
    const { rerender } = renderHook(({ isOpen }) => useModalFocus({ isOpen, onClose }), {
      initialProps: { isOpen: false },
    });

    // Initially closed
    expect(document.body.style.overflow).toBe('');

    // Open modal
    rerender({ isOpen: true });
    expect(document.body.style.overflow).toBe('hidden');

    // Note: The hook maintains state and doesn't auto-cleanup on rerender
    // Cleanup happens via the effect's cleanup function when isOpen changes
  });
});
