import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useDragAndDrop } from './useDragAndDrop';
import { MoSCoWPriority, ItemStatus } from '../../../types';
import type { ProductBacklogItem } from '../../../types';

const createMockBacklogItem = (
  overrides: Partial<ProductBacklogItem> = {}
): ProductBacklogItem => ({
  id: 'pbi-1',
  teamId: 'team-1',
  title: 'Test Item',
  description: 'Test description',
  status: ItemStatus.NEW,
  priority: MoSCoWPriority.MUST_HAVE,
  storyPoints: 8,
  businessValue: 10,
  labels: ['frontend'],
  acceptanceCriteria: 'Test criteria',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  createdBy: 'user-1',
  ...overrides,
});

const createMockDragEvent = (data: {
  itemId?: string;
  currentPriority?: string;
}): React.DragEvent => {
  const dataStore: Record<string, string> = {};

  const dataTransfer = {
    getData: vi.fn((key: string) => dataStore[key] || data[key as keyof typeof data] || ''),
    setData: vi.fn((key: string, value: string) => {
      dataStore[key] = value;
    }),
    effectAllowed: 'none' as 'none' | 'copy' | 'move' | 'link' | 'all',
    dropEffect: 'none' as 'none' | 'copy' | 'move' | 'link',
  };

  return {
    dataTransfer,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    type: 'drag',
    bubbles: false,
    cancelable: false,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: true,
    timeStamp: Date.now(),
    isDefaultPrevented: () => false,
    isPropagationStopped: () => false,
    persist: vi.fn(),
    target: null,
    currentTarget: null,
    relatedTarget: null,
    nativeEvent: {},
  } as unknown as React.DragEvent;
};

describe('useDragAndDrop', () => {
  let onDrop: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onDrop = vi.fn();
  });

  describe('Initial State', () => {
    it('should have null draggedItem initially', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));

      expect(result.current.draggedItem).toBeNull();
    });

    it('should return all handler functions', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));

      expect(typeof result.current.handleDragStart).toBe('function');
      expect(typeof result.current.handleDrop).toBe('function');
      expect(typeof result.current.handleDragOver).toBe('function');
      expect(typeof result.current.handleDragEnd).toBe('function');
    });
  });

  describe('handleDragStart', () => {
    it('should set draggedItem when drag starts', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const item = createMockBacklogItem();
      const event = createMockDragEvent({});

      act(() => {
        result.current.handleDragStart(event, item);
      });

      expect(result.current.draggedItem).toEqual(item);
    });

    it('should set drag data with itemId', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const item = createMockBacklogItem({ id: 'test-item-id' });
      const event = createMockDragEvent({});

      act(() => {
        result.current.handleDragStart(event, item);
      });

      expect(event.dataTransfer.setData).toHaveBeenCalledWith('itemId', 'test-item-id');
    });

    it('should set drag data with currentPriority', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const item = createMockBacklogItem({ priority: MoSCoWPriority.SHOULD_HAVE });
      const event = createMockDragEvent({});

      act(() => {
        result.current.handleDragStart(event, item);
      });

      expect(event.dataTransfer.setData).toHaveBeenCalledWith(
        'currentPriority',
        MoSCoWPriority.SHOULD_HAVE
      );
    });

    it('should set effectAllowed to move', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const item = createMockBacklogItem();
      const event = createMockDragEvent({});

      act(() => {
        result.current.handleDragStart(event, item);
      });

      expect(event.dataTransfer.effectAllowed).toBe('move');
    });
  });

  describe('handleDrop', () => {
    it('should call onDrop with itemId and newPriority', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const event = createMockDragEvent({
        itemId: 'item-1',
        currentPriority: MoSCoWPriority.MUST_HAVE,
      });

      act(() => {
        result.current.handleDrop(event, MoSCoWPriority.SHOULD_HAVE);
      });

      expect(onDrop).toHaveBeenCalledWith('item-1', MoSCoWPriority.SHOULD_HAVE);
    });

    it('should prevent default on drop', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const event = createMockDragEvent({
        itemId: 'item-1',
        currentPriority: MoSCoWPriority.MUST_HAVE,
      });

      act(() => {
        result.current.handleDrop(event, MoSCoWPriority.SHOULD_HAVE);
      });

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should clear draggedItem after drop', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const item = createMockBacklogItem();
      const dragStartEvent = createMockDragEvent({});
      const dropEvent = createMockDragEvent({
        itemId: 'pbi-1',
        currentPriority: MoSCoWPriority.MUST_HAVE,
      });

      act(() => {
        result.current.handleDragStart(dragStartEvent, item);
      });

      expect(result.current.draggedItem).not.toBeNull();

      act(() => {
        result.current.handleDrop(dropEvent, MoSCoWPriority.SHOULD_HAVE);
      });

      expect(result.current.draggedItem).toBeNull();
    });

    it('should not call onDrop if itemId is empty', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const event = createMockDragEvent({
        itemId: '',
        currentPriority: MoSCoWPriority.MUST_HAVE,
      });

      act(() => {
        result.current.handleDrop(event, MoSCoWPriority.SHOULD_HAVE);
      });

      expect(onDrop).not.toHaveBeenCalled();
    });

    it('should handle different priority drops', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const priorities = [
        MoSCoWPriority.MUST_HAVE,
        MoSCoWPriority.SHOULD_HAVE,
        MoSCoWPriority.COULD_HAVE,
        MoSCoWPriority.WONT_HAVE,
      ];

      priorities.forEach((priority) => {
        const event = createMockDragEvent({
          itemId: 'item-1',
          currentPriority: MoSCoWPriority.MUST_HAVE,
        });

        act(() => {
          result.current.handleDrop(event, priority);
        });

        expect(onDrop).toHaveBeenCalledWith('item-1', priority);
      });
    });
  });

  describe('handleDragOver', () => {
    it('should prevent default on drag over', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const event = createMockDragEvent({});

      act(() => {
        result.current.handleDragOver(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should set dropEffect to move', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const event = createMockDragEvent({});

      act(() => {
        result.current.handleDragOver(event);
      });

      expect(event.dataTransfer.dropEffect).toBe('move');
    });
  });

  describe('handleDragEnd', () => {
    it('should clear draggedItem on drag end', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const item = createMockBacklogItem();
      const event = createMockDragEvent({});

      act(() => {
        result.current.handleDragStart(event, item);
      });

      expect(result.current.draggedItem).not.toBeNull();

      act(() => {
        result.current.handleDragEnd();
      });

      expect(result.current.draggedItem).toBeNull();
    });

    it('should clear draggedItem even if not dragging', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));

      expect(result.current.draggedItem).toBeNull();

      act(() => {
        result.current.handleDragEnd();
      });

      expect(result.current.draggedItem).toBeNull();
    });
  });

  describe('Complete Drag Flow', () => {
    it('should handle complete drag and drop flow', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const item = createMockBacklogItem({
        id: 'flow-item',
        priority: MoSCoWPriority.MUST_HAVE,
      });

      const dragStartEvent = createMockDragEvent({});
      const dragOverEvent = createMockDragEvent({});
      const dropEvent = createMockDragEvent({
        itemId: 'flow-item',
        currentPriority: MoSCoWPriority.MUST_HAVE,
      });

      expect(result.current.draggedItem).toBeNull();

      act(() => {
        result.current.handleDragStart(dragStartEvent, item);
      });

      expect(result.current.draggedItem).toEqual(item);

      act(() => {
        result.current.handleDragOver(dragOverEvent);
      });

      expect(dragOverEvent.preventDefault).toHaveBeenCalled();

      act(() => {
        result.current.handleDrop(dropEvent, MoSCoWPriority.SHOULD_HAVE);
      });

      expect(onDrop).toHaveBeenCalledWith('flow-item', MoSCoWPriority.SHOULD_HAVE);
      expect(result.current.draggedItem).toBeNull();
    });

    it('should handle drag cancelled by drag end', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const item = createMockBacklogItem();

      const dragStartEvent = createMockDragEvent({});

      act(() => {
        result.current.handleDragStart(dragStartEvent, item);
      });

      expect(result.current.draggedItem).not.toBeNull();

      act(() => {
        result.current.handleDragEnd();
      });

      expect(result.current.draggedItem).toBeNull();
      expect(onDrop).not.toHaveBeenCalled();
    });
  });

  describe('Stable References', () => {
    it('should have stable handleDragStart reference', () => {
      const { result, rerender } = renderHook(() => useDragAndDrop({ onDrop }));

      const firstRef = result.current.handleDragStart;
      rerender();
      const secondRef = result.current.handleDragStart;

      expect(firstRef).toBe(secondRef);
    });

    it('should have stable handleDrop reference', () => {
      const { result, rerender } = renderHook(() => useDragAndDrop({ onDrop }));

      const firstRef = result.current.handleDrop;
      rerender();
      const secondRef = result.current.handleDrop;

      expect(firstRef).toBe(secondRef);
    });

    it('should have stable handleDragOver reference', () => {
      const { result, rerender } = renderHook(() => useDragAndDrop({ onDrop }));

      const firstRef = result.current.handleDragOver;
      rerender();
      const secondRef = result.current.handleDragOver;

      expect(firstRef).toBe(secondRef);
    });

    it('should have stable handleDragEnd reference', () => {
      const { result, rerender } = renderHook(() => useDragAndDrop({ onDrop }));

      const firstRef = result.current.handleDragEnd;
      rerender();
      const secondRef = result.current.handleDragEnd;

      expect(firstRef).toBe(secondRef);
    });

    it('should update handleDrop when onDrop changes', () => {
      const onDrop1 = vi.fn();
      const onDrop2 = vi.fn();

      const { result, rerender } = renderHook(({ onDrop }) => useDragAndDrop({ onDrop }), {
        initialProps: { onDrop: onDrop1 },
      });

      const firstRef = result.current.handleDrop;

      rerender({ onDrop: onDrop2 });

      const secondRef = result.current.handleDrop;

      expect(firstRef).not.toBe(secondRef);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple sequential drags', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const item1 = createMockBacklogItem({ id: 'item-1' });
      const item2 = createMockBacklogItem({ id: 'item-2' });

      const event1 = createMockDragEvent({});
      const event2 = createMockDragEvent({});

      act(() => {
        result.current.handleDragStart(event1, item1);
      });

      expect(result.current.draggedItem?.id).toBe('item-1');

      act(() => {
        result.current.handleDragEnd();
      });

      expect(result.current.draggedItem).toBeNull();

      act(() => {
        result.current.handleDragStart(event2, item2);
      });

      expect(result.current.draggedItem?.id).toBe('item-2');
    });

    it('should handle drag start without drop', () => {
      const { result } = renderHook(() => useDragAndDrop({ onDrop }));
      const item = createMockBacklogItem();
      const event = createMockDragEvent({});

      act(() => {
        result.current.handleDragStart(event, item);
      });

      expect(result.current.draggedItem).not.toBeNull();
      expect(onDrop).not.toHaveBeenCalled();
    });
  });
});
