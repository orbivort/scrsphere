import type { TaskFormData } from '../SprintBoard.types';
import { TaskStatus } from '../../../types';

/**
 * Default values for a new task form
 */
export const DEFAULT_FORM_DATA: TaskFormData = {
  title: '',
  description: '',
  pbiId: '',
  assigneeId: '',
  status: TaskStatus.TODO,
  estimatedHours: 0,
  remainingHours: 0,
};

/**
 * Checks if a string field has substantive content (not empty or whitespace-only)
 */
export function hasSubstantiveString(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Checks if a numeric field has substantive content (greater than 0)
 */
export function hasSubstantiveNumber(value: number | undefined | null): boolean {
  return typeof value === 'number' && value > 0;
}

/**
 * Checks if a form field has substantive user input
 * This is used to determine if the unsaved changes warning should be shown
 */
export function hasSubstantiveInput(formData: Partial<TaskFormData>): boolean {
  // Check string fields for non-empty, non-whitespace content
  if (hasSubstantiveString(formData.title)) return true;
  if (hasSubstantiveString(formData.description)) return true;

  // Check numeric fields for values greater than 0
  if (hasSubstantiveNumber(formData.estimatedHours)) return true;
  if (hasSubstantiveNumber(formData.remainingHours)) return true;

  // Check dropdown/select fields for non-empty selection
  if (hasSubstantiveString(formData.assigneeId)) return true;

  return false;
}

/**
 * Checks if the create task form has unsaved changes that should trigger a warning
 * This ignores whitespace-only strings and zero values
 */
export function hasUnsavedChangesForCreate(formData: TaskFormData): boolean {
  // For create mode, we only care about substantive user input
  // Auto-selected PBI (when there's only one) should not count as a change
  return hasSubstantiveInput(formData);
}

/**
 * Interface for original task data used in edit mode comparison
 */
export interface OriginalTaskData {
  title: string;
  description: string;
  assigneeId: string;
  estimatedHours: number;
  remainingHours: number;
}

/**
 * Checks if the edit task form has unsaved changes compared to the original task
 * This trims whitespace for string comparison to avoid false positives
 */
export function hasUnsavedChangesForEdit(
  formData: TaskFormData,
  originalData: OriginalTaskData
): boolean {
  // Compare strings with trimming to handle whitespace-only changes
  const titleChanged = formData.title.trim() !== originalData.title.trim();
  const descriptionChanged = formData.description.trim() !== originalData.description.trim();
  const assigneeChanged = formData.assigneeId !== originalData.assigneeId;
  const estimatedChanged = formData.estimatedHours !== originalData.estimatedHours;
  const remainingChanged = formData.remainingHours !== originalData.remainingHours;

  return (
    titleChanged || descriptionChanged || assigneeChanged || estimatedChanged || remainingChanged
  );
}
