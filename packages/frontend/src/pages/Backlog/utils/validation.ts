import { ItemStatus, type ProductBacklogItem } from '../../../types';
import type { ItemFormData, FormErrors } from '../types/backlog.types';

import { validateLabels } from './labelUtils';

/**
 * Validation context for form validation
 */
export interface ValidationContext {
  teamId: string | undefined;
  activeGoalId: string | undefined;
}

/**
 * Validation result for form validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: FormErrors;
  workflowError?: string;
}

/**
 * Status transition validation result
 */
export interface StatusTransitionValidation {
  valid: boolean;
  message?: string;
}

/**
 * Item validation result for status change
 */
export interface ItemValidationResult {
  valid: boolean;
  missingFields: string[];
  message?: string;
}

/**
 * Validates form data for backlog item creation/editing
 *
 * This function performs comprehensive validation of backlog item form data,
 * including title, description, estimate, business value, labels, and acceptance criteria.
 *
 * @param formData - The form data to validate
 * @param context - Validation context containing team and goal information
 * @param isEditMode - Whether the form is in edit mode (requires more fields)
 * @returns Validation result with errors and workflow error if any
 *
 * @example
 * ```typescript
 * const result = validateFormData(formData, { teamId: '123', activeGoalId: '456' }, true);
 * if (!result.isValid) {
 *   console.log('Validation errors:', result.errors);
 * }
 * ```
 */
export const validateFormData = (
  formData: ItemFormData,
  context: ValidationContext,
  isEditMode: boolean = false
): ValidationResult => {
  const errors: FormErrors = {};
  let workflowError: string | undefined;

  // Validate team and goal context
  if (!context.teamId) {
    workflowError = 'Team ID is required. Please select a team first.';
    return { isValid: false, errors, workflowError };
  }

  if (!context.activeGoalId) {
    workflowError = 'An active goal is required. Please set an active product goal first.';
    return { isValid: false, errors, workflowError };
  }

  // Enhanced Title Validation with specific error messages
  if (!formData.title.trim()) {
    errors.title = 'Title is required. Please enter a descriptive title for this backlog item.';
  } else if (formData.title.trim().length < 5) {
    errors.title = `Title is too short (${formData.title.trim().length} characters). Please use at least 5 characters to provide a clear description.`;
  } else if (formData.title.length > 200) {
    const overBy = formData.title.length - 200;
    errors.title = `Title exceeds maximum length by ${overBy} character${overBy > 1 ? 's' : ''}. Current: ${formData.title.length}/200 characters. Please shorten your title.`;
  }

  // Description Validation - Required for Edit mode
  if (isEditMode && !formData.description.trim()) {
    errors.description =
      'Description is required. Please provide detailed information about this backlog item.';
  }

  // MoSCoW Priority Validation - Always required
  if (!formData.moscowPriority) {
    errors.moscowPriority =
      'MoSCoW Priority is required. Please select one of the four priority levels.';
  }

  // Enhanced Estimate Validation - Required for Edit mode
  if (isEditMode) {
    if (formData.estimate === undefined || formData.estimate === null) {
      errors.estimate =
        'Estimate is required. Please select a story point value from the dropdown.';
    } else if (formData.estimate < 1) {
      errors.estimate = 'Estimate must be at least 1 story point. Please select a valid value.';
    } else if (formData.estimate > 100) {
      errors.estimate = `Estimate (${formData.estimate}) exceeds maximum of 100 story points. For larger work items, consider breaking this into smaller, more manageable backlog items.`;
    }
  } else {
    // Create mode - optional but validated if provided
    if (formData.estimate !== undefined && formData.estimate !== null) {
      if (formData.estimate < 1) {
        errors.estimate =
          'Estimate must be at least 1 story point. Please select a value from the dropdown or leave empty if not ready to estimate.';
      } else if (formData.estimate > 100) {
        errors.estimate = `Estimate (${formData.estimate}) exceeds maximum of 100 story points. For larger work items, consider breaking this into smaller, more manageable backlog items.`;
      }
    }
  }

  // Enhanced Business Value Validation - Required for Edit mode
  if (isEditMode) {
    if (formData.businessValue === undefined || formData.businessValue === null) {
      errors.businessValue =
        'Business Value is required. Please select a value that reflects the importance of this item.';
    } else if (formData.businessValue < 1) {
      errors.businessValue =
        'Business Value must be at least 1 point. Please select a valid value.';
    } else if (formData.businessValue > 100) {
      errors.businessValue = `Business Value (${formData.businessValue}) exceeds maximum of 100 points. Please select a value that fits within the standard range.`;
    }
  } else {
    // Create mode - optional but validated if provided
    if (formData.businessValue !== undefined && formData.businessValue !== null) {
      if (formData.businessValue < 1) {
        errors.businessValue =
          'Business Value must be at least 1 point. Please select a value that reflects the relative importance of this item.';
      } else if (formData.businessValue > 100) {
        errors.businessValue = `Business Value (${formData.businessValue}) exceeds maximum of 100 points. Please select a value that fits within the standard range.`;
      }
    }
  }

  // Labels Validation - Required for Edit mode
  if (isEditMode) {
    if (!formData.labels?.trim()) {
      errors.labels = 'At least one label is required. Please add a label to categorize this item.';
    } else {
      const labelErrors = validateLabels(formData.labels);
      if (labelErrors.length > 0) {
        errors.labels = labelErrors.join(' ');
      }
    }
  } else {
    // Create mode - validate format if provided
    if (formData.labels && formData.labels.trim()) {
      const labelErrors = validateLabels(formData.labels);
      if (labelErrors.length > 0) {
        errors.labels = labelErrors.join(' ');
      }
    }
  }

  // Acceptance Criteria Validation - Required for Edit mode
  if (isEditMode && !formData.acceptanceCriteria.trim()) {
    errors.acceptanceCriteria =
      'Acceptance Criteria is required. Please define specific, testable conditions for completion.';
  }

  // Status Validation - Required for Edit mode
  if (isEditMode && !formData.status) {
    errors.status = 'Status is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    workflowError,
  };
};

/**
 * Validates if a status transition is allowed
 *
 * This function checks if transitioning from one status to another is valid
 * according to the defined workflow rules.
 *
 * @param currentStatus - The current status of the item
 * @param newStatus - The target status to transition to
 * @returns Validation result indicating if the transition is valid
 *
 * @example
 * ```typescript
 * const result = validateStatusTransition(ItemStatus.NEW, ItemStatus.REFINED);
 * if (!result.valid) {
 *   console.log('Invalid transition:', result.message);
 * }
 * ```
 */
export const validateStatusTransition = (
  currentStatus: ItemStatus,
  newStatus: ItemStatus
): StatusTransitionValidation => {
  const validTransitions: Record<ItemStatus, ItemStatus[]> = {
    [ItemStatus.NEW]: [ItemStatus.REFINED],
    [ItemStatus.REFINED]: [ItemStatus.READY, ItemStatus.NEW],
    [ItemStatus.READY]: [ItemStatus.IN_PROGRESS, ItemStatus.REFINED],
    [ItemStatus.IN_PROGRESS]: [ItemStatus.DONE, ItemStatus.READY],
    [ItemStatus.DONE]: [],
  };

  if (currentStatus === newStatus) {
    return { valid: false, message: 'Item is already in this status' };
  }

  if (!validTransitions[currentStatus].includes(newStatus)) {
    const allowedStatuses = validTransitions[currentStatus]
      .map((s) => s.replace('_', ' '))
      .join(', ');
    return {
      valid: false,
      message: `Transition from ${currentStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')} is not allowed. Allowed transitions: ${allowedStatuses || 'None'}`,
    };
  }

  return { valid: true };
};

/**
 * Validates if an item has all required fields for a status change
 *
 * This function checks if a backlog item has all mandatory fields completed
 * before allowing a status transition to a more advanced state.
 *
 * @param item - The backlog item to validate
 * @param targetStatus - The target status to transition to
 * @returns Validation result with missing fields if any
 *
 * @example
 * ```typescript
 * const result = validateItemForStatusChange(item, ItemStatus.READY);
 * if (!result.valid) {
 *   console.log('Missing fields:', result.missingFields);
 * }
 * ```
 */
export const validateItemForStatusChange = (
  item: ProductBacklogItem,
  targetStatus: ItemStatus
): ItemValidationResult => {
  const missingFields: string[] = [];
  const requiresFullValidation = targetStatus !== ItemStatus.NEW;

  if (!requiresFullValidation) {
    return { valid: true, missingFields: [] };
  }

  if (!item.title || item.title.trim().length < 5) {
    missingFields.push('Title (minimum 5 characters)');
  }

  if (!item.description || item.description.trim().length === 0) {
    missingFields.push('Description');
  }

  if (!item.priority) {
    missingFields.push('MoSCoW Priority');
  }

  if (!item.businessValue || item.businessValue < 1) {
    missingFields.push('Business Value');
  }

  if (!item.storyPoints || item.storyPoints < 1) {
    missingFields.push('Estimate (Story Points)');
  }

  if (!item.labels || item.labels.length === 0) {
    missingFields.push('Labels (at least one)');
  }

  if (!item.acceptanceCriteria || item.acceptanceCriteria.trim().length === 0) {
    missingFields.push('Acceptance Criteria');
  }

  if (missingFields.length > 0) {
    const fieldList = missingFields.map((f) => `"${f}"`).join(', ');
    const message = `Cannot change status to "${targetStatus.replace('_', ' ')}". The following mandatory fields must be completed first: ${fieldList}. Please click "Edit Item" to update this backlog item.`;
    return { valid: false, missingFields, message };
  }

  return { valid: true, missingFields: [] };
};
