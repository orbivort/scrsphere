import { useCallback, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface VirtualItem<T = unknown> {
  item: T;
  index: number;
  size: number;
  start: number;
  end: number;
  key: string;
}

export interface VirtualScrollConfig<T = unknown> {
  virtualItems: VirtualItem<T>[];
  totalSize: number;
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => void;
  measureElement: (element: HTMLElement | null) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export interface UseVirtualScrollOptions {
  overscanCount?: number;
  estimateSize?: number;
  scrollToIndex?: number;
  enabled?: boolean;
}

/**
 * Maximum number of items to render during initial fallback.
 * This prevents performance issues when virtualizer hasn't initialized yet.
 */
const INITIAL_RENDER_LIMIT = 20;

/**
 * Hook for virtualizing large lists to improve performance.
 * Only renders visible items plus a configurable overscan count.
 *
 * @param items - Array of items to virtualize
 * @param estimateSize - Estimated height of each item in pixels
 * @param overscanCount - Number of items to render outside the visible area (default: 5)
 * @param options - Additional configuration options
 * @returns Virtual scroll configuration including virtual items and container ref
 *
 * @example
 * ```tsx
 * const { virtualItems, totalSize, containerRef } = useVirtualScroll(
 *   items,
 *   80, // estimateSize
 *   3   // overscanCount
 * );
 *
 * return (
 *   <div ref={containerRef} style={{ height: '600px', overflow: 'auto' }}>
 *     <div style={{ height: totalSize }}>
 *       {virtualItems.map(({ item, index, key, size, start }) => (
 *         <div
 *           key={key}
 *           style={{
 *             position: 'absolute',
 *             top: 0,
 *             left: 0,
 *             width: '100%',
 *             height: size,
 *             transform: `translateY(${start}px)`,
 *           }}
 *         >
 *           <ItemComponent item={item} />
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 * ```
 */
export const useVirtualScroll = <T>(
  items: T[],
  estimateSize: number = 50,
  overscanCount: number = 5,
  options: UseVirtualScrollOptions = {}
): VirtualScrollConfig<T> => {
  const { enabled = true } = options;
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: useCallback(() => parentRef.current, []),
    estimateSize: useCallback(() => estimateSize, [estimateSize]),
    overscan: overscanCount,
    enabled,
  });

  const virtualItems = useMemo(() => {
    if (!enabled) {
      return items.map((item, index) => ({
        item: item as T,
        index,
        size: estimateSize,
        start: index * estimateSize,
        end: (index + 1) * estimateSize,
        key: String(index),
      }));
    }
    const virtualItemsList = virtualizer.getVirtualItems();
    // If virtualizer hasn't calculated items yet (e.g., on initial render),
    // fall back to rendering a limited number of items to prevent performance issues
    if (virtualItemsList.length === 0 && items.length > 0) {
      const limit = Math.min(items.length, INITIAL_RENDER_LIMIT + overscanCount);
      const fallbackItems = [];
      for (let index = 0; index < limit; index++) {
        const item = items[index];
        if (item !== undefined) {
          fallbackItems.push({
            item: item as T,
            index,
            size: estimateSize,
            start: index * estimateSize,
            end: (index + 1) * estimateSize,
            key: String(index),
          });
        }
      }
      return fallbackItems;
    }
    return virtualItemsList.map((virtualItem) => {
      const item = items[virtualItem.index];
      return {
        item: item as T,
        index: virtualItem.index,
        size: virtualItem.size,
        start: virtualItem.start,
        end: virtualItem.end,
        key: String(virtualItem.key),
      };
    });
  }, [virtualizer, items, enabled, estimateSize, overscanCount]);

  const scrollToIndex = useCallback(
    (index: number, scrollOptions?: { align?: 'start' | 'center' | 'end' | 'auto' }) => {
      virtualizer.scrollToIndex(index, scrollOptions);
    },
    [virtualizer]
  );

  const measureElement = useCallback(
    (element: HTMLElement | null) => {
      virtualizer.measureElement(element);
    },
    [virtualizer]
  );

  return useMemo(
    () => ({
      virtualItems,
      totalSize: virtualizer.getTotalSize(),
      scrollToIndex,
      measureElement,
      containerRef: parentRef,
    }),
    [virtualItems, virtualizer, scrollToIndex, measureElement]
  );
};

/**
 * Hook for creating a virtual scroll container reference.
 * Useful when you need to share the container ref with other hooks.
 *
 * @returns Object containing containerRef and getScrollElement callback
 */
export const useVirtualScrollContainer = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const getScrollElement = useCallback(() => containerRef.current, []);

  return {
    containerRef,
    getScrollElement,
  };
};

/**
 * Determines if virtual scrolling should be enabled based on item count.
 * Virtual scrolling is recommended for lists with more than 50 items.
 *
 * @param itemCount - Number of items in the list
 * @param threshold - Threshold above which virtualization is enabled (default: 50)
 * @returns Boolean indicating whether virtualization should be enabled
 */
export const shouldEnableVirtualization = (itemCount: number, threshold: number = 50): boolean => {
  return itemCount > threshold;
};
