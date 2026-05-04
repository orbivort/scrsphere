import { useState, useCallback, useRef } from 'react';

/**
 * Represents a draggable item in the keyboard drag-drop system
 */
export interface DragDropItem {
  id: string;
  label: string;
  disabled?: boolean;
}

/**
 * Props for the useKeyboardDragDrop hook
 */
export interface UseKeyboardDragDropProps<T extends DragDropItem> {
  /** Array of items that can be dragged and reordered */
  items: T[];
  /** Callback fired when an item is moved to a new position */
  onMove: (draggedItemId: string, targetItemId: string, position: 'before' | 'after') => void;
  /** Function to extract unique ID from an item */
  getItemId: (item: T) => string;
  /** Function to get accessible label for an item */
  getItemLabel: (item: T) => string;
  /** Function to validate if a drop is allowed */
  isValidDrop?: (draggedItem: T, targetItem: T, position: 'before' | 'after') => boolean;
  /** Function to announce state changes for screen readers */
  announce?: (message: string) => void;
  /** Optional callback when drag operation is cancelled */
  onCancel?: () => void;
  /** Optional callback when drag operation completes */
  onComplete?: (draggedItemId: string, targetItemId: string) => void;
}

/**
 * Represents the current grab state of the drag operation
 */
export type GrabState = 'idle' | 'grabbed' | 'moving';

/**
 * Keyboard event handlers returned by the hook
 */
export interface KeyboardHandlers {
  /** Handler for keydown events on draggable items */
  handleKeyDown: (e: React.KeyboardEvent, item: DragDropItem) => void;
  /** Handler for focus events */
  handleFocus: (itemId: string) => void;
  /** Handler for blur events */
  handleBlur: () => void;
}

/**
 * ARIA attributes for accessibility
 */
export interface AriaAttributes {
  /** Role attribute value */
  role: string;
  /** aria-grabbed state */
  'aria-grabbed': 'true' | 'false' | undefined;
  /** aria-dropeffect value */
  'aria-dropeffect': 'none' | 'copy' | 'move' | 'link' | 'execute' | 'popup';
  /** aria-pressed for toggle state */
  'aria-pressed': 'true' | 'false' | undefined;
}

/**
 * Return type for the useKeyboardDragDrop hook
 */
export interface UseKeyboardDragDropReturn {
  /** ID of the currently dragged item */
  draggedItemId: string | null;
  /** ID of the currently focused item */
  focusedItemId: string | null;
  /** Current grab state */
  grabState: GrabState;
  /** Keyboard event handlers */
  handlers: KeyboardHandlers;
  /** ARIA attributes for accessibility */
  ariaAttributes: (itemId: string) => AriaAttributes;
  /** Get drop indicator position for an item */
  getDropIndicator: (itemId: string) => 'before' | 'after' | null;
  /** Manually cancel the current drag operation */
  cancelDrag: () => void;
}

/**
 * Messages for screen reader announcements
 */
const ANNOUNCEMENT_MESSAGES = {
  grabbed: (label: string) =>
    `Grabbed ${label}. Use arrow keys to move, Enter to drop, Escape to cancel.`,
  moving: (label: string, direction: 'up' | 'down') => `Moving ${label} ${direction}`,
  dropped: (label: string, targetLabel: string, position: 'before' | 'after') =>
    `Dropped ${label} ${position} ${targetLabel}`,
  cancelled: (label: string) => `Cancelled dragging ${label}`,
  invalidDrop: 'Cannot drop here',
  noDropTarget: 'No valid drop target',
} as const;

/**
 * useKeyboardDragDrop Hook
 *
 * A reusable React hook that manages keyboard-based drag operations for reordering lists.
 * Provides full accessibility support with ARIA attributes and screen reader announcements.
 *
 * @example
 * ```tsx
 * const { handlers, ariaAttributes, grabState } = useKeyboardDragDrop({
 *   items: items,
 *   onMove: (draggedId, targetId, position) => {
 *     // Handle the move
 *   },
 *   getItemId: (item) => item.id,
 *   getItemLabel: (item) => item.name,
 *   announce: (message) => announceToScreenReader(message),
 * });
 *
 * return items.map(item => (
 *   <div
 *     key={item.id}
 *     tabIndex={0}
 *     onKeyDown={(e) => handlers.handleKeyDown(e, item)}
 *     {...ariaAttributes(item.id)}
 *   >
 *     {item.name}
 *   </div>
 * ));
 * ```
 */
export function useKeyboardDragDrop<T extends DragDropItem>({
  items,
  onMove,
  getItemId,
  getItemLabel,
  isValidDrop,
  announce,
  onCancel,
  onComplete,
}: UseKeyboardDragDropProps<T>): UseKeyboardDragDropReturn {
  // State for tracking drag operation
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [grabState, setGrabState] = useState<GrabState>('idle');
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('after');

  // Track original position for cancel functionality
  const originalIndexRef = useRef<number | null>(null);
  const currentIndexRef = useRef<number | null>(null);

  /**
   * Get item by ID
   */
  const getItemById = useCallback(
    (id: string): T | undefined => {
      return items.find((item) => getItemId(item) === id);
    },
    [items, getItemId]
  );

  /**
   * Get item index by ID
   */
  const getItemIndex = useCallback(
    (id: string): number => {
      return items.findIndex((item) => getItemId(item) === id);
    },
    [items, getItemId]
  );

  /**
   * Announce a message to screen readers
   */
  const announceMessage = useCallback(
    (message: string) => {
      announce?.(message);
    },
    [announce]
  );

  /**
   * Reset drag state
   */
  const resetDragState = useCallback(() => {
    setDraggedItemId(null);
    setGrabState('idle');
    setDropPosition('after');
    originalIndexRef.current = null;
    currentIndexRef.current = null;
  }, []);

  /**
   * Cancel the current drag operation
   */
  const cancelDrag = useCallback(() => {
    if (draggedItemId) {
      const item = getItemById(draggedItemId);
      if (item) {
        announceMessage(ANNOUNCEMENT_MESSAGES.cancelled(getItemLabel(item)));
      }
      onCancel?.();
    }
    resetDragState();
  }, [draggedItemId, getItemById, getItemLabel, announceMessage, onCancel, resetDragState]);

  /**
   * Complete the drop operation
   */
  const completeDrop = useCallback(
    (targetItemId: string, position: 'before' | 'after') => {
      if (!draggedItemId) return;

      const draggedItem = getItemById(draggedItemId);
      const targetItem = getItemById(targetItemId);

      if (!draggedItem || !targetItem) {
        announceMessage(ANNOUNCEMENT_MESSAGES.noDropTarget);
        return;
      }

      // Check if drop is valid
      const isValid = isValidDrop?.(draggedItem, targetItem, position) ?? true;

      if (!isValid) {
        announceMessage(ANNOUNCEMENT_MESSAGES.invalidDrop);
        return;
      }

      // Execute the move
      onMove(draggedItemId, targetItemId, position);

      // Announce completion
      announceMessage(
        ANNOUNCEMENT_MESSAGES.dropped(getItemLabel(draggedItem), getItemLabel(targetItem), position)
      );

      // Call completion callback
      onComplete?.(draggedItemId, targetItemId);

      // Reset state
      resetDragState();
    },
    [
      draggedItemId,
      getItemById,
      isValidDrop,
      onMove,
      announceMessage,
      getItemLabel,
      onComplete,
      resetDragState,
    ]
  );

  /**
   * Move the dragged item to a new position
   */
  const moveDraggedItem = useCallback(
    (direction: 'up' | 'down') => {
      if (!draggedItemId || grabState !== 'grabbed') return;

      const currentIndex = currentIndexRef.current ?? getItemIndex(draggedItemId);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      // Check bounds
      if (newIndex < 0 || newIndex >= items.length) {
        return;
      }

      const targetItem = items[newIndex];
      if (!targetItem || targetItem.disabled) {
        return;
      }

      // Update current index
      currentIndexRef.current = newIndex;
      setFocusedItemId(getItemId(targetItem));
      setDropPosition(direction === 'up' ? 'before' : 'after');

      // Announce movement
      const draggedItem = getItemById(draggedItemId);
      if (draggedItem) {
        announceMessage(ANNOUNCEMENT_MESSAGES.moving(getItemLabel(draggedItem), direction));
      }
    },
    [
      draggedItemId,
      grabState,
      items,
      getItemId,
      getItemIndex,
      getItemById,
      announceMessage,
      getItemLabel,
    ]
  );

  /**
   * Handle keydown events on draggable items
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, item: DragDropItem) => {
      const itemId = item.id;

      // Ignore events on disabled items
      if (item.disabled) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'Enter': {
          e.preventDefault();

          if (grabState === 'idle') {
            // Start grab mode
            setDraggedItemId(itemId);
            setGrabState('grabbed');
            setFocusedItemId(itemId);
            originalIndexRef.current = getItemIndex(itemId);
            currentIndexRef.current = getItemIndex(itemId);
            announceMessage(ANNOUNCEMENT_MESSAGES.grabbed(getItemLabel(item as T)));
          } else if (grabState === 'grabbed') {
            // Complete drop
            if (focusedItemId && focusedItemId !== draggedItemId) {
              completeDrop(focusedItemId, dropPosition);
            } else if (draggedItemId) {
              // Dropping on itself cancels the drag
              cancelDrag();
            }
          }
          break;
        }

        case 'ArrowUp':
        case 'ArrowLeft': {
          e.preventDefault();

          if (grabState === 'grabbed') {
            moveDraggedItem('up');
          } else {
            // Navigate to previous non-disabled item
            const currentIndex = getItemIndex(itemId);
            for (let i = currentIndex - 1; i >= 0; i--) {
              const prevItem = items[i];
              if (prevItem && !prevItem.disabled) {
                setFocusedItemId(getItemId(prevItem));
                break;
              }
            }
          }
          break;
        }

        case 'ArrowDown':
        case 'ArrowRight': {
          e.preventDefault();

          if (grabState === 'grabbed') {
            moveDraggedItem('down');
          } else {
            // Navigate to next non-disabled item
            const currentIndex = getItemIndex(itemId);
            for (let i = currentIndex + 1; i < items.length; i++) {
              const nextItem = items[i];
              if (nextItem && !nextItem.disabled) {
                setFocusedItemId(getItemId(nextItem));
                break;
              }
            }
          }
          break;
        }

        case 'Escape': {
          e.preventDefault();
          if (grabState !== 'idle') {
            cancelDrag();
          }
          break;
        }

        case 'Home': {
          e.preventDefault();
          if (grabState === 'grabbed' && items.length > 0) {
            const firstItem = items[0];
            if (firstItem && !firstItem.disabled) {
              currentIndexRef.current = 0;
              setFocusedItemId(getItemId(firstItem));
              setDropPosition('before');
            }
          }
          break;
        }

        case 'End': {
          e.preventDefault();
          if (grabState === 'grabbed' && items.length > 0) {
            const lastItem = items[items.length - 1];
            if (lastItem && !lastItem.disabled) {
              currentIndexRef.current = items.length - 1;
              setFocusedItemId(getItemId(lastItem));
              setDropPosition('after');
            }
          }
          break;
        }

        default:
          break;
      }
    },
    [
      grabState,
      getItemIndex,
      getItemId,
      items,
      announceMessage,
      getItemLabel,
      focusedItemId,
      draggedItemId,
      completeDrop,
      dropPosition,
      cancelDrag,
      moveDraggedItem,
    ]
  );

  /**
   * Handle focus events
   */
  const handleFocus = useCallback((itemId: string) => {
    setFocusedItemId(itemId);
  }, []);

  /**
   * Handle blur events
   */
  const handleBlur = useCallback(() => {
    // Don't clear focus during drag operation
    if (grabState === 'idle') {
      setFocusedItemId(null);
    }
  }, [grabState]);

  /**
   * Get ARIA attributes for an item
   */
  const ariaAttributes = useCallback(
    (itemId: string): AriaAttributes => {
      const isDragged = draggedItemId === itemId;
      const isFocused = focusedItemId === itemId;

      return {
        role: 'listitem',
        'aria-grabbed': grabState !== 'idle' && isDragged ? 'true' : 'false',
        'aria-dropeffect': grabState === 'grabbed' && isFocused && !isDragged ? 'move' : 'none',
        'aria-pressed': grabState === 'grabbed' && isDragged ? 'true' : undefined,
      };
    },
    [draggedItemId, focusedItemId, grabState]
  );

  /**
   * Get drop indicator position for an item
   */
  const getDropIndicator = useCallback(
    (itemId: string): 'before' | 'after' | null => {
      if (grabState !== 'grabbed' || !focusedItemId || draggedItemId === itemId) {
        return null;
      }

      if (focusedItemId === itemId) {
        return dropPosition;
      }

      return null;
    },
    [grabState, focusedItemId, draggedItemId, dropPosition]
  );

  return {
    draggedItemId,
    focusedItemId,
    grabState,
    handlers: {
      handleKeyDown,
      handleFocus,
      handleBlur,
    },
    ariaAttributes,
    getDropIndicator,
    cancelDrag,
  };
}
