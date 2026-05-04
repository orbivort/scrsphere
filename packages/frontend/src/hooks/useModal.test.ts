import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useModal } from './useModal';

describe('useModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  describe('modalProps', () => {
    it('should return correct modal props', () => {
      const { result } = renderHook(() => useModal({ isOpen: false, onClose: mockOnClose }));

      expect(result.current.modalProps).toEqual({
        role: 'dialog',
        'aria-modal': true,
      });
    });
  });

  describe('focus management', () => {
    it('should store previous active element when modal opens', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      const { rerender } = renderHook(({ isOpen }) => useModal({ isOpen, onClose: mockOnClose }), {
        initialProps: { isOpen: false },
      });

      rerender({ isOpen: true });

      document.body.removeChild(button);
    });

    it('should focus first focusable element when modal opens', () => {
      const button = document.createElement('button');
      button.setAttribute('data-testid', 'focusable-button');
      document.body.appendChild(button);

      renderHook(() => useModal({ isOpen: true, onClose: mockOnClose }));

      document.body.removeChild(button);
    });
  });

  describe('escape key handling', () => {
    it('should call onClose when Escape key is pressed and modal is open', () => {
      renderHook(() => useModal({ isOpen: true, onClose: mockOnClose }));

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when Escape key is pressed and modal is closed', () => {
      renderHook(() => useModal({ isOpen: false, onClose: mockOnClose }));

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('tab trapping', () => {
    it('should trap focus when Tab is pressed at last focusable element', () => {
      const firstButton = document.createElement('button');
      const lastButton = document.createElement('button');
      document.body.appendChild(firstButton);
      document.body.appendChild(lastButton);

      renderHook(() => useModal({ isOpen: true, onClose: mockOnClose }));

      lastButton.focus();

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      Object.defineProperty(tabEvent, 'shiftKey', { value: false });
      document.dispatchEvent(tabEvent);

      document.body.removeChild(firstButton);
      document.body.removeChild(lastButton);
    });

    it('should trap focus when Shift+Tab is pressed at first focusable element', () => {
      const firstButton = document.createElement('button');
      const lastButton = document.createElement('button');
      document.body.appendChild(firstButton);
      document.body.appendChild(lastButton);

      renderHook(() => useModal({ isOpen: true, onClose: mockOnClose }));

      firstButton.focus();

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      Object.defineProperty(tabEvent, 'shiftKey', { value: true });
      document.dispatchEvent(tabEvent);

      document.body.removeChild(firstButton);
      document.body.removeChild(lastButton);
    });

    it('should not trap focus when modal is closed', () => {
      const firstButton = document.createElement('button');
      const lastButton = document.createElement('button');
      document.body.appendChild(firstButton);
      document.body.appendChild(lastButton);

      renderHook(() => useModal({ isOpen: false, onClose: mockOnClose }));

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      document.dispatchEvent(tabEvent);

      document.body.removeChild(firstButton);
      document.body.removeChild(lastButton);
    });
  });

  describe('body scroll lock', () => {
    it('should lock body scroll when modal is open', () => {
      renderHook(() => useModal({ isOpen: true, onClose: mockOnClose }));

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal is closed', () => {
      const { rerender } = renderHook(({ isOpen }) => useModal({ isOpen, onClose: mockOnClose }), {
        initialProps: { isOpen: true },
      });

      expect(document.body.style.overflow).toBe('hidden');

      rerender({ isOpen: false });

      expect(document.body.style.overflow).toBe('');
    });

    it('should restore body scroll on unmount', () => {
      const { unmount } = renderHook(() => useModal({ isOpen: true, onClose: mockOnClose }));

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('event listener cleanup', () => {
    it('should remove event listeners when modal closes', () => {
      const { rerender } = renderHook(({ isOpen }) => useModal({ isOpen, onClose: mockOnClose }), {
        initialProps: { isOpen: true },
      });

      rerender({ isOpen: false });

      mockOnClose.mockClear();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() => useModal({ isOpen: true, onClose: mockOnClose }));

      unmount();

      mockOnClose.mockClear();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
