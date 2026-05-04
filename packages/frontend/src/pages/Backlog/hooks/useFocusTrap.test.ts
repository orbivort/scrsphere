import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';

import { useFocusTrap } from './useFocusTrap';

describe('useFocusTrap', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should not throw when inactive', () => {
      const modalRef = React.createRef<HTMLDivElement>();

      expect(() => {
        renderHook(() => useFocusTrap(false, modalRef));
      }).not.toThrow();
    });

    it('should not throw with null ref', () => {
      const modalRef = { current: null };

      expect(() => {
        renderHook(() => useFocusTrap(true, modalRef));
      }).not.toThrow();
    });
  });

  describe('Focus Management', () => {
    it('should attempt to focus close button when modal opens', () => {
      const closeButton = document.createElement('button');
      closeButton.setAttribute('data-modal-close', '');
      container.appendChild(closeButton);

      const modalRef = { current: container };

      expect(() => {
        renderHook(() => useFocusTrap(true, modalRef));
      }).not.toThrow();
    });

    it('should attempt to focus first focusable element if no close button', () => {
      const input = document.createElement('input');
      container.appendChild(input);

      const modalRef = { current: container };

      expect(() => {
        renderHook(() => useFocusTrap(true, modalRef));
      }).not.toThrow();
    });
  });

  describe('Focusable Elements', () => {
    it('should handle all focusable element types', () => {
      const button = document.createElement('button');
      const input = document.createElement('input');
      const select = document.createElement('select');
      const textarea = document.createElement('textarea');
      const link = document.createElement('a');
      link.setAttribute('href', '#');
      const divWithTabindex = document.createElement('div');
      divWithTabindex.setAttribute('tabindex', '0');

      container.appendChild(button);
      container.appendChild(input);
      container.appendChild(select);
      container.appendChild(textarea);
      container.appendChild(link);
      container.appendChild(divWithTabindex);

      const modalRef = { current: container };

      expect(() => {
        renderHook(() => useFocusTrap(true, modalRef));
      }).not.toThrow();
    });

    it('should handle disabled elements', () => {
      const disabledButton = document.createElement('button');
      disabledButton.disabled = true;
      const enabledButton = document.createElement('button');

      container.appendChild(disabledButton);
      container.appendChild(enabledButton);

      const modalRef = { current: container };

      expect(() => {
        renderHook(() => useFocusTrap(true, modalRef));
      }).not.toThrow();
    });

    it('should handle elements with negative tabindex', () => {
      const button = document.createElement('button');
      button.setAttribute('tabindex', '-1');
      container.appendChild(button);

      const modalRef = { current: container };

      expect(() => {
        renderHook(() => useFocusTrap(true, modalRef));
      }).not.toThrow();
    });
  });

  describe('Escape Key', () => {
    it('should dispatch modalCloseRequest event on Escape', () => {
      const closeButton = document.createElement('button');
      closeButton.setAttribute('data-modal-close', '');
      container.appendChild(closeButton);

      const modalRef = { current: container };

      renderHook(() => useFocusTrap(true, modalRef));

      const closeHandler = vi.fn();
      container.addEventListener('modalCloseRequest', closeHandler);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(escapeEvent);

      expect(closeHandler).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners when inactive', () => {
      const closeButton = document.createElement('button');
      closeButton.setAttribute('data-modal-close', '');
      container.appendChild(closeButton);

      const modalRef = { current: container };

      const { rerender } = renderHook(({ active }) => useFocusTrap(active, modalRef), {
        initialProps: { active: true },
      });

      rerender({ active: false });

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      const closeHandler = vi.fn();
      container.addEventListener('modalCloseRequest', closeHandler);
      document.dispatchEvent(escapeEvent);

      expect(closeHandler).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty modal', () => {
      const modalRef = { current: container };

      expect(() => {
        renderHook(() => useFocusTrap(true, modalRef));
      }).not.toThrow();
    });

    it('should handle null modal ref', () => {
      const modalRef = { current: null };

      expect(() => {
        renderHook(() => useFocusTrap(true, modalRef));
      }).not.toThrow();
    });
  });
});
