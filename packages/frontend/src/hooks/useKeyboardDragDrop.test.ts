import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useKeyboardDragDrop, type DragDropItem } from './useKeyboardDragDrop';

// Test item type
interface TestItem extends DragDropItem {
  id: string;
  label: string;
  disabled?: boolean;
  category?: string;
}

// Mock items for testing
const createMockItems = (): TestItem[] => [
  { id: 'item-1', label: 'First Item', category: 'A' },
  { id: 'item-2', label: 'Second Item', category: 'A' },
  { id: 'item-3', label: 'Third Item', category: 'B' },
  { id: 'item-4', label: 'Fourth Item', category: 'B' },
  { id: 'item-5', label: 'Fifth Item', category: 'C' },
];

describe('useKeyboardDragDrop', () => {
  const mockOnMove = vi.fn();
  const mockAnnounce = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnComplete = vi.fn();
  const mockIsValidDrop = vi.fn().mockReturnValue(true);

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsValidDrop.mockReturnValue(true);
  });

  const defaultProps = {
    items: createMockItems(),
    onMove: mockOnMove,
    getItemId: (item: TestItem) => item.id,
    getItemLabel: (item: TestItem) => item.label,
    announce: mockAnnounce,
    onCancel: mockOnCancel,
    onComplete: mockOnComplete,
    isValidDrop: mockIsValidDrop,
  };

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));

      expect(result.current.draggedItemId).toBeNull();
      expect(result.current.focusedItemId).toBeNull();
      expect(result.current.grabState).toBe('idle');
    });

    it('should return handlers object', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));

      expect(result.current.handlers).toBeDefined();
      expect(result.current.handlers.handleKeyDown).toBeInstanceOf(Function);
      expect(result.current.handlers.handleFocus).toBeInstanceOf(Function);
      expect(result.current.handlers.handleBlur).toBeInstanceOf(Function);
    });

    it('should return ariaAttributes function', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));

      expect(result.current.ariaAttributes).toBeInstanceOf(Function);
    });

    it('should return getDropIndicator function', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));

      expect(result.current.getDropIndicator).toBeInstanceOf(Function);
    });

    it('should return cancelDrag function', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));

      expect(result.current.cancelDrag).toBeInstanceOf(Function);
    });
  });

  describe('Grab Mode (Space/Enter)', () => {
    it('should enter grabbed state on Space key', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      const mockEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(mockEvent, items[0]);
      });

      expect(result.current.draggedItemId).toBe('item-1');
      expect(result.current.grabState).toBe('grabbed');
      expect(result.current.focusedItemId).toBe('item-1');
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should enter grabbed state on Enter key', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      const mockEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(mockEvent, items[1]);
      });

      expect(result.current.draggedItemId).toBe('item-2');
      expect(result.current.grabState).toBe('grabbed');
    });

    it('should announce grabbed message when entering grab mode', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      const mockEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(mockEvent, items[0]);
      });

      expect(mockAnnounce).toHaveBeenCalledWith(expect.stringContaining('Grabbed First Item'));
    });

    it('should not grab disabled items', () => {
      const items = createMockItems();
      items[0].disabled = true;

      const { result } = renderHook(() => useKeyboardDragDrop({ ...defaultProps, items }));

      const mockEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(mockEvent, items[0]);
      });

      expect(result.current.grabState).toBe('idle');
      expect(result.current.draggedItemId).toBeNull();
    });
  });

  describe('Arrow Key Navigation', () => {
    it('should move focus down with ArrowDown key when idle', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // First focus an item
      act(() => {
        result.current.handlers.handleFocus('item-1');
      });

      const mockEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(mockEvent, items[0]);
      });

      expect(result.current.focusedItemId).toBe('item-2');
    });

    it('should move focus up with ArrowUp key when idle', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // First focus an item
      act(() => {
        result.current.handlers.handleFocus('item-2');
      });

      const mockEvent = {
        key: 'ArrowUp',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(mockEvent, items[1]);
      });

      expect(result.current.focusedItemId).toBe('item-1');
    });

    it('should move dragged item down with ArrowDown when grabbed', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Move down
      const moveEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(moveEvent, items[0]);
      });

      expect(result.current.focusedItemId).toBe('item-2');
      expect(result.current.grabState).toBe('grabbed');
    });

    it('should move dragged item up with ArrowUp when grabbed', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode on second item
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[1]);
      });

      // Move up
      const moveEvent = {
        key: 'ArrowUp',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(moveEvent, items[1]);
      });

      expect(result.current.focusedItemId).toBe('item-1');
    });

    it('should support ArrowLeft as alternative to ArrowUp', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      act(() => {
        result.current.handlers.handleFocus('item-2');
      });

      const mockEvent = {
        key: 'ArrowLeft',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(mockEvent, items[1]);
      });

      expect(result.current.focusedItemId).toBe('item-1');
    });

    it('should support ArrowRight as alternative to ArrowDown', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      act(() => {
        result.current.handlers.handleFocus('item-1');
      });

      const mockEvent = {
        key: 'ArrowRight',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(mockEvent, items[0]);
      });

      expect(result.current.focusedItemId).toBe('item-2');
    });

    it('should not move beyond first item with ArrowUp', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode on first item
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Try to move up
      const moveEvent = {
        key: 'ArrowUp',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(moveEvent, items[0]);
      });

      expect(result.current.focusedItemId).toBe('item-1');
    });

    it('should not move beyond last item with ArrowDown', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode on last item
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[4]);
      });

      // Try to move down
      const moveEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(moveEvent, items[4]);
      });

      expect(result.current.focusedItemId).toBe('item-5');
    });

    it('should skip disabled items during navigation', () => {
      const items = createMockItems();
      items[1].disabled = true;

      const { result } = renderHook(() => useKeyboardDragDrop({ ...defaultProps, items }));

      act(() => {
        result.current.handlers.handleFocus('item-1');
      });

      const mockEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(mockEvent, items[0]);
      });

      // Should skip item-2 (disabled) and go to item-3
      expect(result.current.focusedItemId).toBe('item-3');
    });

    it('should move to first item with Home key', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode on third item
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[2]);
      });

      // Press Home
      const homeEvent = {
        key: 'Home',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(homeEvent, items[2]);
      });

      expect(result.current.focusedItemId).toBe('item-1');
    });

    it('should move to last item with End key', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode on first item
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Press End
      const endEvent = {
        key: 'End',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(endEvent, items[0]);
      });

      expect(result.current.focusedItemId).toBe('item-5');
    });
  });

  describe('Drop Operation (Enter when grabbed)', () => {
    it('should complete drop on Enter when grabbed', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Move to target
      const moveEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(moveEvent, items[0]);
      });

      // Drop
      const dropEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(dropEvent, items[1]);
      });

      expect(mockOnMove).toHaveBeenCalledWith('item-1', 'item-2', 'after');
      expect(result.current.grabState).toBe('idle');
    });

    it('should call onComplete callback after drop', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Move and drop
      const moveEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(moveEvent, items[0]);
      });

      const dropEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(dropEvent, items[1]);
      });

      expect(mockOnComplete).toHaveBeenCalledWith('item-1', 'item-2');
    });

    it('should announce drop completion', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Move and drop
      const moveEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(moveEvent, items[0]);
      });

      const dropEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(dropEvent, items[1]);
      });

      expect(mockAnnounce).toHaveBeenCalledWith(expect.stringContaining('Dropped First Item'));
    });

    it('should drop with "before" position when moving up', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode on second item
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[1]);
      });

      // Move up
      const moveEvent = {
        key: 'ArrowUp',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(moveEvent, items[1]);
      });

      // Drop
      const dropEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(dropEvent, items[0]);
      });

      expect(mockOnMove).toHaveBeenCalledWith('item-2', 'item-1', 'before');
    });

    it('should cancel drag when dropping on itself', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Press Enter again without moving
      const dropEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(dropEvent, items[0]);
      });

      expect(mockOnMove).not.toHaveBeenCalled();
      expect(result.current.grabState).toBe('idle');
    });
  });

  describe('Cancel Operation (Escape)', () => {
    it('should cancel drag on Escape key', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Cancel with Escape
      const escapeEvent = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(escapeEvent, items[0]);
      });

      expect(result.current.grabState).toBe('idle');
      expect(result.current.draggedItemId).toBeNull();
    });

    it('should call onCancel callback when cancelled', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Cancel
      const escapeEvent = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(escapeEvent, items[0]);
      });

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should announce cancellation', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      vi.clearAllMocks();

      // Cancel
      const escapeEvent = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(escapeEvent, items[0]);
      });

      expect(mockAnnounce).toHaveBeenCalledWith(
        expect.stringContaining('Cancelled dragging First Item')
      );
    });

    it('should cancel drag using cancelDrag function', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Cancel using function
      act(() => {
        result.current.cancelDrag();
      });

      expect(result.current.grabState).toBe('idle');
      expect(result.current.draggedItemId).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should prevent invalid drops', () => {
      mockIsValidDrop.mockReturnValue(false);

      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Move and try to drop
      const moveEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(moveEvent, items[0]);
      });

      const dropEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(dropEvent, items[1]);
      });

      expect(mockOnMove).not.toHaveBeenCalled();
      expect(mockAnnounce).toHaveBeenCalledWith(expect.stringContaining('Cannot drop here'));
    });

    it('should call isValidDrop with correct parameters', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Move and drop
      const moveEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(moveEvent, items[0]);
      });

      const dropEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(dropEvent, items[1]);
      });

      expect(mockIsValidDrop).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'item-1' }),
        expect.objectContaining({ id: 'item-2' }),
        'after'
      );
    });

    it('should work without isValidDrop prop', () => {
      const propsWithoutValidation = {
        ...defaultProps,
        isValidDrop: undefined,
      };

      const { result } = renderHook(() => useKeyboardDragDrop(propsWithoutValidation));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Move and drop
      const moveEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(moveEvent, items[0]);
      });

      const dropEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(dropEvent, items[1]);
      });

      expect(mockOnMove).toHaveBeenCalled();
    });
  });

  describe('ARIA Attributes', () => {
    it('should return correct ARIA attributes for idle state', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));

      const attrs = result.current.ariaAttributes('item-1');

      expect(attrs.role).toBe('listitem');
      expect(attrs['aria-grabbed']).toBe('false');
      expect(attrs['aria-dropeffect']).toBe('none');
    });

    it('should return correct ARIA attributes for grabbed item', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      const attrs = result.current.ariaAttributes('item-1');

      expect(attrs['aria-grabbed']).toBe('true');
      expect(attrs['aria-pressed']).toBe('true');
    });

    it('should return correct ARIA attributes for drop target', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Move to target
      const moveEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(moveEvent, items[0]);
      });

      const attrs = result.current.ariaAttributes('item-2');

      expect(attrs['aria-dropeffect']).toBe('move');
    });
  });

  describe('Drop Indicator', () => {
    it('should return null for drop indicator when idle', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));

      expect(result.current.getDropIndicator('item-1')).toBeNull();
    });

    it('should return correct drop indicator position', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Move down
      const moveEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(moveEvent, items[0]);
      });

      expect(result.current.getDropIndicator('item-2')).toBe('after');
    });

    it('should return null for drop indicator on dragged item', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      expect(result.current.getDropIndicator('item-1')).toBeNull();
    });
  });

  describe('Focus Handlers', () => {
    it('should update focusedItemId on handleFocus', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));

      act(() => {
        result.current.handlers.handleFocus('item-1');
      });

      expect(result.current.focusedItemId).toBe('item-1');
    });

    it('should clear focusedItemId on handleBlur when idle', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));

      act(() => {
        result.current.handlers.handleFocus('item-1');
      });

      act(() => {
        result.current.handlers.handleBlur();
      });

      expect(result.current.focusedItemId).toBeNull();
    });

    it('should not clear focusedItemId on handleBlur when grabbed', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      act(() => {
        result.current.handlers.handleBlur();
      });

      expect(result.current.focusedItemId).toBe('item-1');
    });
  });

  describe('Announcement Integration', () => {
    it('should work without announce function', () => {
      const propsWithoutAnnounce = {
        ...defaultProps,
        announce: undefined,
      };

      const { result } = renderHook(() => useKeyboardDragDrop(propsWithoutAnnounce));
      const items = createMockItems();

      // Should not throw
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      expect(() => {
        act(() => {
          result.current.handlers.handleKeyDown(grabEvent, items[0]);
        });
      }).not.toThrow();
    });

    it('should announce movement direction', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      vi.clearAllMocks();

      // Move down
      const moveEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(moveEvent, items[0]);
      });

      expect(mockAnnounce).toHaveBeenCalledWith(expect.stringContaining('Moving First Item down'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty items array', () => {
      const { result } = renderHook(() => useKeyboardDragDrop({ ...defaultProps, items: [] }));

      expect(result.current.draggedItemId).toBeNull();
      expect(result.current.grabState).toBe('idle');
    });

    it('should handle single item array', () => {
      const singleItem = [{ id: 'only-item', label: 'Only Item' }];
      const { result } = renderHook(() =>
        useKeyboardDragDrop({ ...defaultProps, items: singleItem })
      );

      const mockEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(mockEvent, singleItem[0]);
      });

      expect(result.current.grabState).toBe('grabbed');

      // Try to move - should stay in place
      const moveEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(moveEvent, singleItem[0]);
      });

      expect(result.current.focusedItemId).toBe('only-item');
    });

    it('should handle items changing during drag', () => {
      const { result, rerender } = renderHook((props) => useKeyboardDragDrop(props), {
        initialProps: defaultProps,
      });

      const items = createMockItems();

      // Start grab mode
      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Rerender with different items
      const newItems = items.slice(0, 2);
      rerender({ ...defaultProps, items: newItems });

      // State should still be valid
      expect(result.current.draggedItemId).toBe('item-1');
    });

    it('should handle rapid key presses', () => {
      const { result } = renderHook(() => useKeyboardDragDrop(defaultProps));
      const items = createMockItems();

      const grabEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      // Rapid grab/release
      act(() => {
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
        result.current.handlers.handleKeyDown(grabEvent, items[0]);
      });

      // Should be in grabbed state (toggle behavior)
      expect(result.current.grabState).toBe('grabbed');
    });
  });

  describe('Type Safety', () => {
    it('should work with custom item types', () => {
      interface CustomItem extends DragDropItem {
        id: string;
        label: string;
        customField: number;
      }

      const customItems: CustomItem[] = [
        { id: '1', label: 'Item 1', customField: 100 },
        { id: '2', label: 'Item 2', customField: 200 },
      ];

      const { result } = renderHook(() =>
        useKeyboardDragDrop({
          items: customItems,
          onMove: vi.fn(),
          getItemId: (item) => item.id,
          getItemLabel: (item) => item.label,
        })
      );

      expect(result.current).toBeDefined();
    });
  });
});
