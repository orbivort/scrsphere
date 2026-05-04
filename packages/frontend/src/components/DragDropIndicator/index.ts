/**
 * DragDropIndicator Component
 *
 * Provides visual feedback during drag and drop operations.
 * Supports three indicator types: grabbed, drop-target, and moving.
 *
 * @example
 * import { DragDropIndicator } from '@/components/DragDropIndicator';
 *
 * // Grabbed state
 * <DragDropIndicator type="grabbed" visible={isGrabbed}>
 *   <TaskCard task={task} />
 * </DragDropIndicator>
 *
 * // Drop target state
 * <DragDropIndicator type="drop-target" visible={isOver}>
 *   <DropZone />
 * </DragDropIndicator>
 *
 * // Moving state
 * <DragDropIndicator
 *   type="moving"
 *   visible={isDragging}
 *   position={{ x: cursorX, y: cursorY }}
 * >
 *   <TaskCard task={draggedTask} />
 * </DragDropIndicator>
 */

export {
  DragDropIndicator,
  type DragDropIndicatorProps,
  type DragDropIndicatorType,
  type Position,
} from './DragDropIndicator';

export { default } from './DragDropIndicator';
