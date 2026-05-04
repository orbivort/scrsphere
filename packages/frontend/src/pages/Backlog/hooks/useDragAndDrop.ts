import { useState, useCallback } from 'react';

import { type MoSCoWPriority, type ProductBacklogItem } from '../../../types';

/**
 * Props for the useDragAndDrop hook
 */
interface UseDragAndDropProps {
  /** Callback when an item is dropped on a new priority column */
  onDrop: (itemId: string, newPriority: MoSCoWPriority) => void;
}

/**
 * Return type for the useDragAndDrop hook
 */
interface UseDragAndDropReturn {
  /** Currently dragged item (null if not dragging) */
  draggedItem: ProductBacklogItem | null;
  /** Handler for drag start event */
  handleDragStart: (e: React.DragEvent, item: ProductBacklogItem) => void;
  /** Handler for drop event */
  handleDrop: (e: React.DragEvent, newPriority: MoSCoWPriority) => void;
  /** Handler for drag over event */
  handleDragOver: (e: React.DragEvent) => void;
  /** Handler for drag end event */
  handleDragEnd: () => void;
}

/**
 * Custom hook for managing drag-and-drop functionality in the backlog board
 *
 * This hook encapsulates all drag-and-drop state and handlers including:
 * - Tracking the currently dragged item
 * - Setting drag data (itemId, currentPriority)
 * - Handling drop events to update item priority
 * - Handling drag over events for visual feedback
 * - Handling drag end events for cleanup
 *
 * @param props - Configuration object with onDrop callback
 * @returns Object containing drag state and handlers
 *
 * @example
 * ```tsx
 * const { draggedItem, handleDragStart, handleDrop, handleDragOver, handleDragEnd } = useDragAndDrop({
 *   onDrop: (itemId, newPriority) => {
 *     updateItemMutation.mutate({ id: itemId, updates: { priority: newPriority } });
 *   },
 * });
 * ```
 */
export const useDragAndDrop = (props: UseDragAndDropProps): UseDragAndDropReturn => {
  const { onDrop } = props;

  const [draggedItem, setDraggedItem] = useState<ProductBacklogItem | null>(null);

  /**
   * Handler for drag start event
   * Sets the drag data and updates the dragged item state
   */
  const handleDragStart = useCallback((e: React.DragEvent, item: ProductBacklogItem) => {
    e.dataTransfer.setData('itemId', item.id);
    e.dataTransfer.setData('currentPriority', item.priority);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem(item);
  }, []);

  /**
   * Handler for drop event
   * Extracts the item ID from drag data and calls onDrop callback
   */
  const handleDrop = useCallback(
    (e: React.DragEvent, newPriority: MoSCoWPriority) => {
      e.preventDefault();
      const itemId = e.dataTransfer.getData('itemId');
      if (itemId) {
        onDrop(itemId, newPriority);
      }
      setDraggedItem(null);
    },
    [onDrop]
  );

  /**
   * Handler for drag over event
   * Prevents default to allow drop
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * Handler for drag end event
   * Clears the dragged item state
   */
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  return {
    draggedItem,
    handleDragStart,
    handleDrop,
    handleDragOver,
    handleDragEnd,
  };
};
