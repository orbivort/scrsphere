/**
 * ListView Component
 *
 * A table-based list view for displaying product backlog items.
 * Provides a compact, scannable view of all items with key attributes.
 * Uses virtual scrolling for performance with large lists (>50 items).
 *
 * @module pages/Backlog/views/ListView
 */

import { memo, useCallback, useRef } from 'react';

import { type ProductBacklogItem } from '../../../types';
import { MoscowBadge } from '../components/MoscowBadge';
import { useVirtualScroll, shouldEnableVirtualization } from '../../../hooks/useVirtualScroll';

import styles from './ListView.module.css';

/**
 * Props for the ListView component
 */
export interface ListViewProps {
  /** Array of product backlog items to display */
  items: ProductBacklogItem[];
  /** Callback when an item row is clicked */
  onItemClick: (item: ProductBacklogItem) => void;
}

/**
 * Estimated height of each table row in pixels
 */
const ROW_ESTIMATE_HEIGHT = 64;

/**
 * Number of items to render outside the visible area for smoother scrolling
 */
const OVERSCAN_COUNT = 5;

/**
 * Threshold for enabling virtual scrolling
 */
const VIRTUALIZATION_THRESHOLD = 50;

/**
 * TableRow Component
 *
 * Renders a single table row for a backlog item (non-virtualized mode).
 */
interface TableRowProps {
  item: ProductBacklogItem;
  onItemClick: (item: ProductBacklogItem) => void;
}

const TableRow: React.FC<TableRowProps> = ({ item, onItemClick }) => {
  const handleClick = useCallback(() => {
    onItemClick(item);
  }, [item, onItemClick]);

  return (
    <tr onClick={handleClick}>
      <td>#{item.id.slice(-4)}</td>
      <td className={styles['title-cell']}>{item.title}</td>
      <td>
        <MoscowBadge priority={item.priority} />
      </td>
      <td>
        <span className={`${styles['status-badge']} ${styles[item.status]}`}>
          {item.status.replace('_', ' ')}
        </span>
      </td>
      <td>{item.businessValue ? `${item.businessValue} pts` : '-'}</td>
      <td>{item.storyPoints ? `${item.storyPoints} pts` : '-'}</td>
      <td>
        <div className={styles['label-tags']}>
          {item.labels.slice(0, 2).map((label) => (
            <span key={label} className={styles['label-tag']}>
              {label}
            </span>
          ))}
          {item.labels.length > 2 && (
            <span className={`${styles['label-tag']} ${styles.more}`}>
              +{item.labels.length - 2}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
};

/**
 * VirtualizedRow Component
 *
 * Renders a single row for a backlog item using CSS Grid (virtualized mode).
 * Uses div-based layout to avoid table + absolute positioning issues.
 */
interface VirtualizedRowProps {
  item: ProductBacklogItem;
  index: number;
  onItemClick: (item: ProductBacklogItem) => void;
  style: React.CSSProperties;
  measureRef?: (element: HTMLElement | null) => void;
}

const VirtualizedRow: React.FC<VirtualizedRowProps> = ({
  item,
  index,
  onItemClick,
  style,
  measureRef,
}) => {
  const handleClick = useCallback(() => {
    onItemClick(item);
  }, [item, onItemClick]);

  return (
    <div
      ref={measureRef}
      className={styles['virtualized-row']}
      onClick={handleClick}
      style={style}
      role="row"
      data-index={index}
    >
      <div className={styles['virtualized-cell']} role="cell">
        #{item.id.slice(-4)}
      </div>
      <div className={`${styles['virtualized-cell']} ${styles['title-cell']}`} role="cell">
        {item.title}
      </div>
      <div className={styles['virtualized-cell']} role="cell">
        <MoscowBadge priority={item.priority} />
      </div>
      <div className={styles['virtualized-cell']} role="cell">
        <span className={`${styles['status-badge']} ${styles[item.status]}`}>
          {item.status.replace('_', ' ')}
        </span>
      </div>
      <div className={styles['virtualized-cell']} role="cell">
        {item.businessValue ? `${item.businessValue} pts` : '-'}
      </div>
      <div className={styles['virtualized-cell']} role="cell">
        {item.storyPoints ? `${item.storyPoints} pts` : '-'}
      </div>
      <div className={styles['virtualized-cell']} role="cell">
        <div className={styles['label-tags']}>
          {item.labels.slice(0, 2).map((label) => (
            <span key={label} className={styles['label-tag']}>
              {label}
            </span>
          ))}
          {item.labels.length > 2 && (
            <span className={`${styles['label-tag']} ${styles.more}`}>
              +{item.labels.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * ListView Component
 *
 * Renders a table with columns for:
 * - ID (last 4 characters)
 * - Title
 * - MoSCoW Priority (badge)
 * - Status (badge)
 * - Business Value (points)
 * - Estimate (story points)
 * - Labels (up to 2 visible, with overflow indicator)
 *
 * Each row is clickable to open item details.
 *
 * Virtual scrolling is automatically enabled for lists with more than 50 items
 * to maintain smooth performance.
 *
 * @param props - Component props
 * @returns The rendered ListView component
 *
 * @example
 * ```tsx
 * <ListView
 *   items={filteredItems}
 *   onItemClick={(item) => openDetailModal(item)}
 * />
 * ```
 */
export const ListView = memo<ListViewProps>(({ items, onItemClick }) => {
  const enableVirtualization = shouldEnableVirtualization(items.length, VIRTUALIZATION_THRESHOLD);
  const headerRef = useRef<HTMLDivElement>(null);

  const { virtualItems, totalSize, containerRef, measureElement } = useVirtualScroll(
    items,
    ROW_ESTIMATE_HEIGHT,
    OVERSCAN_COUNT,
    { enabled: enableVirtualization }
  );

  return (
    <div className={`${styles['list-view']} ${enableVirtualization ? styles['virtualized'] : ''}`}>
      {/* Header - Table for non-virtualized, Grid for virtualized */}
      {enableVirtualization ? (
        <div ref={headerRef} className={styles['virtualized-header']} role="row">
          <div className={styles['virtualized-header-cell']} role="columnheader">
            ID
          </div>
          <div className={styles['virtualized-header-cell']} role="columnheader">
            Title
          </div>
          <div className={styles['virtualized-header-cell']} role="columnheader">
            MoSCoW
          </div>
          <div className={styles['virtualized-header-cell']} role="columnheader">
            Status
          </div>
          <div className={styles['virtualized-header-cell']} role="columnheader">
            Business Value
          </div>
          <div className={styles['virtualized-header-cell']} role="columnheader">
            Estimate
          </div>
          <div className={styles['virtualized-header-cell']} role="columnheader">
            Labels
          </div>
        </div>
      ) : (
        <table className={styles['backlog-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>MoSCoW</th>
              <th>Status</th>
              <th>Business Value</th>
              <th>Estimate</th>
              <th>Labels</th>
            </tr>
          </thead>
        </table>
      )}

      {/* Body */}
      <div ref={containerRef} className={styles['table-body-container']} role="rowgroup">
        {enableVirtualization ? (
          <div
            className={styles['virtualized-body']}
            style={{ height: totalSize, position: 'relative' }}
            role="rowgroup"
          >
            {virtualItems.map(({ item, key, start, index }) => (
              <VirtualizedRow
                key={key}
                item={item}
                index={index}
                onItemClick={onItemClick}
                style={{
                  position: 'absolute',
                  top: 0,
                  transform: `translateY(${start}px)`,
                  width: '100%',
                }}
                measureRef={measureElement}
              />
            ))}
          </div>
        ) : (
          <table className={styles['backlog-table']}>
            <tbody>
              {items.map((item) => (
                <TableRow key={item.id} item={item} onItemClick={onItemClick} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
});

ListView.displayName = 'ListView';

export default ListView;
