import React from 'react';

import styles from './DragDropIndicator.module.css';

/**
 * Types of drag and drop indicators
 */
export type DragDropIndicatorType = 'grabbed' | 'drop-target' | 'moving';

/**
 * Position for moving indicator
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Props for the DragDropIndicator component
 */
export interface DragDropIndicatorProps {
  /** Type of indicator to display */
  type: DragDropIndicatorType;
  /** Whether the indicator is visible */
  visible: boolean;
  /** Optional label for ARIA (announcements handled separately) */
  label?: string;
  /** Position for moving indicator (cursor position) */
  position?: Position;
  /** Children to wrap with the indicator */
  children?: React.ReactNode;
}

/**
 * DragDropIndicator provides visual feedback during drag operations.
 *
 * This component is purely visual and uses aria-hidden="true" since
 * drag and drop announcements are handled separately by the parent
 * drag and drop implementation.
 *
 * @example
 * // Grabbed state - wraps the element being dragged
 * <DragDropIndicator type="grabbed" visible={isGrabbed}>
 *   <TaskCard task={task} />
 * </DragDropIndicator>
 *
 * @example
 * // Drop target state - highlights valid drop zones
 * <DragDropIndicator type="drop-target" visible={isOver}>
 *   <DropZone />
 * </DragDropIndicator>
 *
 * @example
 * // Moving state - follows cursor during drag
 * <DragDropIndicator
 *   type="moving"
 *   visible={isDragging}
 *   position={{ x: cursorX, y: cursorY }}
 * >
 *   <TaskCard task={draggedTask} />
 * </DragDropIndicator>
 */
export const DragDropIndicator: React.FC<DragDropIndicatorProps> = ({
  type,
  visible,
  label,
  position,
  children,
}) => {
  // For moving type, render a fixed position ghost element
  if (type === 'moving') {
    if (!visible || !position) {
      return null;
    }

    return (
      <div
        className={styles['moving-indicator']}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
        aria-hidden="true"
        role="presentation"
        data-testid="drag-drop-moving"
      >
        {children}
        {label && <span className="sr-only">{label}</span>}
      </div>
    );
  }

  // For grabbed and drop-target types, wrap children
  const indicatorClass =
    type === 'grabbed' ? styles['grabbed-indicator'] : styles['drop-target-indicator'];

  const visibilityClass = visible ? styles.visible : styles.hidden;

  return (
    <div
      className={`${indicatorClass} ${visibilityClass}`}
      aria-hidden="true"
      role="presentation"
      data-testid={`drag-drop-${type}`}
    >
      {children}
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
};

export default DragDropIndicator;
