import { renderHook } from '@testing-library/react';

import {
  useVirtualScroll,
  useVirtualScrollContainer,
  shouldEnableVirtualization,
} from './useVirtualScroll';

describe('useVirtualScroll', () => {
  describe('Basic Functionality', () => {
    it('should return virtual scroll config with virtualItems array', () => {
      const items = Array(100)
        .fill(null)
        .map((_, i) => ({ id: i }));

      const { result } = renderHook(() => useVirtualScroll(items, 50, 5));

      expect(result.current).toHaveProperty('virtualItems');
      expect(result.current).toHaveProperty('totalSize');
      expect(result.current).toHaveProperty('scrollToIndex');
      expect(result.current).toHaveProperty('measureElement');
      expect(result.current).toHaveProperty('containerRef');
      expect(Array.isArray(result.current.virtualItems)).toBe(true);
    });

    it('should return totalSize as a number', () => {
      const items = Array(100)
        .fill(null)
        .map((_, i) => ({ id: i }));

      const { result } = renderHook(() => useVirtualScroll(items, 50, 5));

      expect(typeof result.current.totalSize).toBe('number');
    });

    it('should return scrollToIndex as a function', () => {
      const items = Array(100)
        .fill(null)
        .map((_, i) => ({ id: i }));

      const { result } = renderHook(() => useVirtualScroll(items, 50, 5));

      expect(typeof result.current.scrollToIndex).toBe('function');
    });

    it('should return measureElement as a function', () => {
      const items = Array(100)
        .fill(null)
        .map((_, i) => ({ id: i }));

      const { result } = renderHook(() => useVirtualScroll(items, 50, 5));

      expect(typeof result.current.measureElement).toBe('function');
    });

    it('should return containerRef as an object with current property', () => {
      const items = Array(100)
        .fill(null)
        .map((_, i) => ({ id: i }));

      const { result } = renderHook(() => useVirtualScroll(items, 50, 5));

      expect(result.current.containerRef).toBeDefined();
      expect(typeof result.current.containerRef).toBe('object');
      expect(result.current.containerRef).toHaveProperty('current');
    });
  });

  describe('Empty Items Handling', () => {
    it('should handle empty items array', () => {
      const items: unknown[] = [];

      const { result } = renderHook(() => useVirtualScroll(items, 50, 5));

      expect(Array.isArray(result.current.virtualItems)).toBe(true);
      expect(result.current.totalSize).toBe(0);
      expect(result.current.virtualItems).toHaveLength(0);
    });
  });

  describe('Virtual Items Structure', () => {
    it('should return virtualItems with expected properties when scroll element is available', () => {
      const items = Array(10)
        .fill(null)
        .map((_, i) => ({ id: i }));

      const { result } = renderHook(() => useVirtualScroll(items, 50, 5));

      if (result.current.virtualItems.length > 0) {
        const virtualItem = result.current.virtualItems[0];
        expect(virtualItem).toHaveProperty('item');
        expect(virtualItem).toHaveProperty('index');
        expect(virtualItem).toHaveProperty('size');
        expect(virtualItem).toHaveProperty('start');
        expect(virtualItem).toHaveProperty('end');
        expect(virtualItem).toHaveProperty('key');
      }
    });

    it('should return correct config structure for non-empty items', () => {
      const items = Array(50)
        .fill(null)
        .map((_, i) => ({ id: i, name: `item-${i}` }));

      const { result } = renderHook(() => useVirtualScroll(items, 100, 5));

      expect(result.current.virtualItems).toBeDefined();
      expect(typeof result.current.totalSize).toBe('number');
      expect(result.current.totalSize).toBeGreaterThanOrEqual(0);
    });

    it('should map items correctly to virtualItems', () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
      ];

      const { result } = renderHook(() => useVirtualScroll(items, 50, 5, { enabled: false }));

      expect(result.current.virtualItems).toHaveLength(3);
      expect(result.current.virtualItems[0]?.item).toEqual(items[0]);
      expect(result.current.virtualItems[1]?.item).toEqual(items[1]);
      expect(result.current.virtualItems[2]?.item).toEqual(items[2]);
    });
  });

  describe('Enabled/Disabled Virtualization', () => {
    it('should return all items when virtualization is disabled', () => {
      const items = Array(100)
        .fill(null)
        .map((_, i) => ({ id: i }));

      const { result } = renderHook(() => useVirtualScroll(items, 50, 5, { enabled: false }));

      // When disabled, all items should be returned
      expect(result.current.virtualItems).toHaveLength(100);
    });

    it('should use estimateSize for item sizes when disabled', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const estimateSize = 75;

      const { result } = renderHook(() =>
        useVirtualScroll(items, estimateSize, 5, { enabled: false })
      );

      result.current.virtualItems.forEach((virtualItem) => {
        expect(virtualItem.size).toBe(estimateSize);
      });
    });

    it('should calculate correct start positions when disabled', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const estimateSize = 50;

      const { result } = renderHook(() =>
        useVirtualScroll(items, estimateSize, 5, { enabled: false })
      );

      expect(result.current.virtualItems[0]?.start).toBe(0);
      expect(result.current.virtualItems[1]?.start).toBe(50);
      expect(result.current.virtualItems[2]?.start).toBe(100);
    });

    it('should calculate correct end positions when disabled', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const estimateSize = 50;

      const { result } = renderHook(() =>
        useVirtualScroll(items, estimateSize, 5, { enabled: false })
      );

      expect(result.current.virtualItems[0]?.end).toBe(50);
      expect(result.current.virtualItems[1]?.end).toBe(100);
      expect(result.current.virtualItems[2]?.end).toBe(150);
    });

    it('should use index as key when disabled', () => {
      const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

      const { result } = renderHook(() => useVirtualScroll(items, 50, 5, { enabled: false }));

      expect(result.current.virtualItems[0]?.key).toBe('0');
      expect(result.current.virtualItems[1]?.key).toBe('1');
      expect(result.current.virtualItems[2]?.key).toBe('2');
    });

    it('should default to enabled when options not provided', () => {
      const items = Array(100)
        .fill(null)
        .map((_, i) => ({ id: i }));

      const { result } = renderHook(() => useVirtualScroll(items, 50, 5));

      // When enabled (default), virtualItems length depends on viewport
      // but should be less than total items for large lists
      expect(result.current.virtualItems.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Custom Options', () => {
    it('should accept custom overscanCount', () => {
      const items = Array(100)
        .fill(null)
        .map((_, i) => ({ id: i }));

      const { result } = renderHook(() => useVirtualScroll(items, 50, 10));

      expect(result.current.virtualItems).toBeDefined();
    });

    it('should accept custom estimateSize', () => {
      const items = Array(10)
        .fill(null)
        .map((_, i) => ({ id: i, name: `item-${i}` }));

      const { result } = renderHook(() => useVirtualScroll(items, 100, 5, { enabled: false }));

      // When disabled, virtualItems are calculated with estimateSize
      // but totalSize comes from virtualizer which returns 0 when disabled
      const expectedVirtualItemsSize = result.current.virtualItems.reduce(
        (sum, item) => sum + item.size,
        0
      );
      expect(expectedVirtualItemsSize).toBe(1000); // 10 items * 100 estimateSize
      expect(result.current.virtualItems[0]?.size).toBe(100); // Each item should have estimateSize
    });
  });
});

describe('useVirtualScrollContainer', () => {
  it('should return containerRef', () => {
    const { result } = renderHook(() => useVirtualScrollContainer());

    expect(result.current.containerRef).toBeDefined();
    expect(typeof result.current.containerRef).toBe('object');
    expect(result.current.containerRef).toHaveProperty('current');
  });

  it('should return getScrollElement function', () => {
    const { result } = renderHook(() => useVirtualScrollContainer());

    expect(typeof result.current.getScrollElement).toBe('function');
  });

  it('should return null for current initially', () => {
    const { result } = renderHook(() => useVirtualScrollContainer());

    expect(result.current.containerRef.current).toBeNull();
  });

  it('should return same ref object on re-renders', () => {
    const { result, rerender } = renderHook(() => useVirtualScrollContainer());

    const firstRef = result.current.containerRef;
    rerender();
    const secondRef = result.current.containerRef;

    expect(firstRef).toBe(secondRef);
  });
});

describe('shouldEnableVirtualization', () => {
  it('should return false when item count is below threshold', () => {
    expect(shouldEnableVirtualization(49)).toBe(false);
    expect(shouldEnableVirtualization(50)).toBe(false);
    expect(shouldEnableVirtualization(0)).toBe(false);
  });

  it('should return true when item count exceeds threshold', () => {
    expect(shouldEnableVirtualization(51)).toBe(true);
    expect(shouldEnableVirtualization(100)).toBe(true);
    expect(shouldEnableVirtualization(1000)).toBe(true);
  });

  it('should use default threshold of 50', () => {
    expect(shouldEnableVirtualization(50)).toBe(false);
    expect(shouldEnableVirtualization(51)).toBe(true);
  });

  it('should accept custom threshold', () => {
    expect(shouldEnableVirtualization(25, 30)).toBe(false);
    expect(shouldEnableVirtualization(35, 30)).toBe(true);
  });

  it('should handle edge cases', () => {
    expect(shouldEnableVirtualization(-1)).toBe(false);
    expect(shouldEnableVirtualization(1)).toBe(false);
  });

  it('should return false for exactly threshold value', () => {
    expect(shouldEnableVirtualization(50, 50)).toBe(false);
    expect(shouldEnableVirtualization(100, 100)).toBe(false);
  });

  it('should return true for threshold + 1', () => {
    expect(shouldEnableVirtualization(51, 50)).toBe(true);
    expect(shouldEnableVirtualization(101, 100)).toBe(true);
  });
});
