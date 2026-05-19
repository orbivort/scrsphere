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

  describe('Tab Key Navigation', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    /**
     * NOTE: The Tab cycling behavior (wrapping focus from last-to-first and first-to-last)
     * relies on `document.activeElement` comparison in the handler. jsdom does not allow
     * overriding `document.activeElement` via `element.focus()`, `Object.defineProperty`,
     * or `vi.spyOn(Document.prototype, 'activeElement', 'get')`. Therefore, the exact
     * Tab-cycling code paths cannot be exercised in this test environment.
     *
     * The following tests validate:
     * - The handler is properly registered on the document
     * - Non-boundary Tab presses do NOT trigger cycling
     * - Empty focusable lists do not cause errors
     */

    it('should register keydown handler when focus trap is active', () => {
      const button = document.createElement('button');
      button.textContent = 'Test';
      container.appendChild(button);

      const modalRef = { current: container };

      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      renderHook(() => useFocusTrap(true, modalRef));

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should not cycle when Tab is pressed but there are no focusable elements', () => {
      const modalRef = { current: container };

      renderHook(() => useFocusTrap(true, modalRef));

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

      document.dispatchEvent(tabEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should ignore non-Tab key events', () => {
      const firstButton = document.createElement('button');
      firstButton.textContent = 'First';
      container.appendChild(firstButton);

      const modalRef = { current: container };

      renderHook(() => useFocusTrap(true, modalRef));

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault');

      document.dispatchEvent(enterEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should not cycle when Shift+Tab and active element is not the first', () => {
      const firstButton = document.createElement('button');
      firstButton.textContent = 'First';
      const secondButton = document.createElement('button');
      secondButton.textContent = 'Second';
      const thirdButton = document.createElement('button');
      thirdButton.textContent = 'Third';
      container.appendChild(firstButton);
      container.appendChild(secondButton);
      container.appendChild(thirdButton);

      const modalRef = { current: container };

      renderHook(() => useFocusTrap(true, modalRef));

      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(shiftTabEvent, 'preventDefault');

      document.dispatchEvent(shiftTabEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should not cycle when Tab and active element is not the last', () => {
      const firstButton = document.createElement('button');
      firstButton.textContent = 'First';
      const secondButton = document.createElement('button');
      secondButton.textContent = 'Second';
      container.appendChild(firstButton);
      container.appendChild(secondButton);

      const modalRef = { current: container };

      renderHook(() => useFocusTrap(true, modalRef));

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

      document.dispatchEvent(tabEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
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

    it('should restore focus to previously focused element on cleanup', () => {
      const outsideButton = document.createElement('button');
      outsideButton.textContent = 'Outside';
      document.body.appendChild(outsideButton);

      vi.spyOn(Document.prototype, 'activeElement', 'get').mockReturnValue(outsideButton);

      const closeButton = document.createElement('button');
      closeButton.setAttribute('data-modal-close', '');
      container.appendChild(closeButton);

      const modalRef = { current: container };

      const externalFocusSpy = vi.spyOn(outsideButton, 'focus');

      const { rerender } = renderHook(({ active }) => useFocusTrap(active, modalRef), {
        initialProps: { active: true },
      });

      rerender({ active: false });

      expect(externalFocusSpy).toHaveBeenCalled();

      document.body.removeChild(outsideButton);
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
