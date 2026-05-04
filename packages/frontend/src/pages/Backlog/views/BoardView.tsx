/**
 * BoardView Component
 *
 * A Kanban-style board view for displaying product backlog items organized by MoSCoW priority.
 * Supports drag-and-drop for re-prioritizing items between columns.
 * Includes keyboard-accessible drag and drop for accessibility.
 * Uses virtual scrolling for performance with large lists (>50 items per column).
 *
 * @module pages/Backlog/views/BoardView
 */

import React, { useMemo } from 'react';

import { type ProductBacklogItem, MoSCoWPriority } from '../../../types';
import { MOSCOW_CONFIG } from '../config/moscow.config';
import { MoscowCard } from '../components/MoscowCard';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useVirtualScroll, shouldEnableVirtualization } from '../../../hooks/useVirtualScroll';

import styles from './BoardView.module.css';

/**
 * Props for the BoardView component
 */
export interface BoardViewProps {
  /** Items grouped by MoSCoW priority */
  itemsByMoscow: Record<MoSCoWPriority, ProductBacklogItem[]>;
  /** Callback when an item is clicked */
  onItemClick: (item: ProductBacklogItem) => void;
  /** Callback when an item's priority is changed via drag-and-drop */
  onPriorityChange: (itemId: string, newPriority: MoSCoWPriority) => void;
}

/**
 * Estimated height of each MoscowCard in pixels
 */
const CARD_ESTIMATE_HEIGHT = 140;

/**
 * Number of items to render outside the visible area for smoother scrolling
 */
const OVERSCAN_COUNT = 3;

/**
 * Threshold for enabling virtual scrolling (items per column)
 */
const VIRTUALIZATION_THRESHOLD = 50;

/**
 * VirtualizedColumn Component
 *
 * Renders a single MoSCoW column with virtual scrolling support for large lists.
 */
interface VirtualizedColumnProps {
  priority: MoSCoWPriority;
  items: ProductBacklogItem[];
  config: (typeof MOSCOW_CONFIG)[MoSCoWPriority];
  isDraggingOver: boolean;
  itemsCountByPriority: Record<MoSCoWPriority, number>;
  draggedItem: ProductBacklogItem | null;
  onDragStart: (e: React.DragEvent, item: ProductBacklogItem) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, priority: MoSCoWPriority) => void;
  onDragOver: (e: React.DragEvent) => void;
  onItemClick: (item: ProductBacklogItem) => void;
  onPriorityChange: (itemId: string, newPriority: MoSCoWPriority) => void;
}

const VirtualizedColumn: React.FC<VirtualizedColumnProps> = ({
  priority,
  items,
  config,
  isDraggingOver,
  itemsCountByPriority,
  draggedItem,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  onItemClick,
  onPriorityChange,
}) => {
  const enableVirtualization = shouldEnableVirtualization(items.length, VIRTUALIZATION_THRESHOLD);

  const { virtualItems, totalSize, containerRef, measureElement } = useVirtualScroll(
    items,
    CARD_ESTIMATE_HEIGHT,
    OVERSCAN_COUNT,
    { enabled: enableVirtualization }
  );

  const handleDrop = (e: React.DragEvent) => {
    onDrop(e, priority);
  };

  return (
    <div
      className={`${styles['moscow-column']} ${isDraggingOver ? styles['drag-active'] : ''}`}
      onDrop={handleDrop}
      onDragOver={onDragOver}
      role="list"
      aria-label={`${config.label} column, ${items.length} items`}
      style={
        {
          '--column-color': config.color,
          '--column-bg': config.bgColor,
          '--column-gradient-from': config.gradientFrom,
          '--column-gradient-to': config.gradientTo,
          '--column-border': config.borderColor,
        } as React.CSSProperties
      }
    >
      <div className={styles['moscow-column-header']}>
        <div className={styles['moscow-column-title-row']}>
          <div className={styles['moscow-column-icon']}>
            {/* eslint-disable-next-line icon-rules/no-inline-svg -- Dynamic icon from config */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={config.icon} />
            </svg>
          </div>
          <div className={styles['moscow-column-title-info']}>
            <h3 className={styles['moscow-column-title']}>{config.label}</h3>
            <span className={styles['moscow-column-desc']}>{config.description}</span>
          </div>
        </div>
        <div className={styles['moscow-column-count']}>
          <span className={styles['count-number']}>{items.length}</span>
          <span className={styles['count-label']}>items</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`${styles['moscow-column-body']} ${enableVirtualization ? styles['virtualized'] : ''}`}
        style={
          enableVirtualization
            ? {
                position: 'relative',
                height: 'calc(100vh - 350px)',
                minHeight: '400px',
                overflow: 'auto',
              }
            : undefined
        }
      >
        {items.length === 0 ? (
          <div className={styles['moscow-empty-column']}>
            {/* eslint-disable-next-line icon-rules/no-inline-svg -- Dynamic icon from config */}
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.3"
            >
              <path d={config.icon} />
            </svg>
            <span>Drop items here</span>
          </div>
        ) : enableVirtualization ? (
          <div style={{ height: totalSize, position: 'relative', width: '100%' }}>
            {virtualItems.map(({ item, key, start, index }) => (
              <div
                key={key}
                ref={measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${start}px)`,
                }}
                data-index={index}
              >
                <MoscowCard
                  item={item}
                  onDragStart={(e) => onDragStart(e, item)}
                  onDragEnd={onDragEnd}
                  onClick={() => onItemClick(item)}
                  isDragging={draggedItem?.id === item.id}
                  onMovePriority={onPriorityChange}
                  itemsCountByPriority={itemsCountByPriority}
                />
              </div>
            ))}
          </div>
        ) : (
          items.map((item) => (
            <MoscowCard
              key={item.id}
              item={item}
              onDragStart={(e) => onDragStart(e, item)}
              onDragEnd={onDragEnd}
              onClick={() => onItemClick(item)}
              isDragging={draggedItem?.id === item.id}
              onMovePriority={onPriorityChange}
              itemsCountByPriority={itemsCountByPriority}
            />
          ))
        )}
      </div>
    </div>
  );
};

/**
 * BoardView Component
 *
 * Renders a 4-column Kanban board with:
 * - Must Have column (critical items)
 * - Should Have column (important items)
 * - Could Have column (nice-to-have items)
 * - Won't Have column (out-of-scope items)
 *
 * Each column displays:
 * - Header with icon, title, description, and item count
 * - Draggable cards for each item (with virtual scrolling for large lists)
 * - Empty state placeholder when no items
 *
 * Virtual scrolling is automatically enabled for columns with more than 50 items
 * to maintain smooth performance.
 *
 * @param props - Component props
 * @returns The rendered BoardView component
 *
 * @example
 * ```tsx
 * <BoardView
 *   itemsByMoscow={itemsByMoscow}
 *   onItemClick={(item) => openDetailModal(item)}
 *   onPriorityChange={(id, priority) => updatePriority(id, priority)}
 * />
 * ```
 */
export const BoardView: React.FC<BoardViewProps> = ({
  itemsByMoscow,
  onItemClick,
  onPriorityChange,
}) => {
  const { draggedItem, handleDragStart, handleDrop, handleDragOver, handleDragEnd } =
    useDragAndDrop({
      onDrop: onPriorityChange,
    });

  /**
   * Calculate item counts per priority for screen reader announcements
   */
  const itemsCountByPriority = useMemo(() => {
    return {
      [MoSCoWPriority.MUST_HAVE]: itemsByMoscow[MoSCoWPriority.MUST_HAVE].length,
      [MoSCoWPriority.SHOULD_HAVE]: itemsByMoscow[MoSCoWPriority.SHOULD_HAVE].length,
      [MoSCoWPriority.COULD_HAVE]: itemsByMoscow[MoSCoWPriority.COULD_HAVE].length,
      [MoSCoWPriority.WONT_HAVE]: itemsByMoscow[MoSCoWPriority.WONT_HAVE].length,
    };
  }, [itemsByMoscow]);

  return (
    <div className={styles['moscow-board-view']} role="list" aria-label="MoSCoW priority board">
      {Object.values(MoSCoWPriority).map((priority) => {
        const config = MOSCOW_CONFIG[priority];
        const items = itemsByMoscow[priority];
        const isDraggingOver = draggedItem !== null;

        return (
          <VirtualizedColumn
            key={priority}
            priority={priority}
            items={items}
            config={config}
            isDraggingOver={isDraggingOver}
            itemsCountByPriority={itemsCountByPriority}
            draggedItem={draggedItem}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onItemClick={onItemClick}
            onPriorityChange={onPriorityChange}
          />
        );
      })}
    </div>
  );
};

export default BoardView;
