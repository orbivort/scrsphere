import { ItemStatus, type ProductBacklogItem } from '../../../types';
import type { ItemFormData, FormErrors } from '../types/backlog.types';

import { validateLabels } from './labelUtils';

/**
 * Generic translation function type that accepts any string key
 * This is used to avoid TypeScript strict key checking issues
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslateFunction = (key: string, options?: Record<string, unknown>) => any;

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
 * @param t - Translation function for i18n
 * @param isEditMode - Whether the form is in edit mode (requires more fields)
 * @returns Validation result with errors and workflow error if any
 *
 * @example
 * ```typescript
 * const result = validateFormData(formData, { teamId: '123', activeGoalId: '456' }, t, true);
 * if (!result.isValid) {
 *   console.log('Validation errors:', result.errors);
 * }
 * ```
 */
export const validateFormData = (
  formData: ItemFormData,
  context: ValidationContext,
  t: TranslateFunction,
  isEditMode: boolean = false
): ValidationResult => {
  const errors: FormErrors = {};
  let workflowError: string | undefined;

  // Validate team and goal context
  if (!context.teamId) {
    workflowError = t('validation.teamIdRequired');
    return { isValid: false, errors, workflowError };
  }

  if (!context.activeGoalId) {
    workflowError = t('validation.activeGoalRequired');
    return { isValid: false, errors, workflowError };
  }

  // Enhanced Title Validation with specific error messages
  if (!formData.title.trim()) {
    errors.title = t('validation.titleRequired');
  } else if (formData.title.trim().length < 5) {
    errors.title = t('validation.titleTooShort', { length: formData.title.trim().length });
  } else if (formData.title.length > 200) {
    const overBy = formData.title.length - 200;
    errors.title = t('validation.titleTooLong', {
      overBy,
      current: formData.title.length,
      plural: overBy > 1 ? 's' : '',
    });
  }

  // Description Validation - Required for Edit mode
  if (isEditMode && !formData.description.trim()) {
    errors.description = t('validation.descriptionRequired');
  }

  // MoSCoW Priority Validation - Always required
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!formData.moscowPriority) {
    errors.moscowPriority = t('validation.moscowPriorityRequired');
  }

  // Enhanced Estimate Validation - Required for Edit mode
  if (isEditMode) {
    if (formData.estimate === undefined) {
      errors.estimate = t('validation.estimateRequired');
    } else if (formData.estimate < 1) {
      errors.estimate = t('validation.estimateMinimum');
    } else if (formData.estimate > 100) {
      errors.estimate = t('validation.estimateTooLarge', { estimate: formData.estimate });
    }
  } else {
    // Create mode - optional but validated if provided
    if (formData.estimate !== undefined) {
      if (formData.estimate < 1) {
        errors.estimate = t('validation.estimateMinimumOptional');
      } else if (formData.estimate > 100) {
        errors.estimate = t('validation.estimateTooLarge', { estimate: formData.estimate });
      }
    }
  }

  // Enhanced Business Value Validation - Required for Edit mode
  if (isEditMode) {
    if (formData.businessValue === undefined) {
      errors.businessValue = t('validation.businessValueRequired');
    } else if (formData.businessValue < 1) {
      errors.businessValue = t('validation.businessValueMinimum');
    } else if (formData.businessValue > 100) {
      errors.businessValue = t('validation.businessValueTooLarge', {
        value: formData.businessValue,
      });
    }
  } else {
    // Create mode - optional but validated if provided
    if (formData.businessValue !== undefined) {
      if (formData.businessValue < 1) {
        errors.businessValue = t('validation.businessValueMinimumOptional');
      } else if (formData.businessValue > 100) {
        errors.businessValue = t('validation.businessValueTooLarge', {
          value: formData.businessValue,
        });
      }
    }
  }

  // Labels Validation - Required for Edit mode
  if (isEditMode) {
    if (!formData.labels.trim()) {
      errors.labels = t('validation.labelsRequired');
    } else {
      const labelErrors = validateLabels(formData.labels);
      if (labelErrors.length > 0) {
        errors.labels = labelErrors.join(' ');
      }
    }
  } else {
    // Create mode - validate format if provided
    if (formData.labels.trim()) {
      const labelErrors = validateLabels(formData.labels);
      if (labelErrors.length > 0) {
        errors.labels = labelErrors.join(' ');
      }
    }
  }

  // Acceptance Criteria Validation - Required for Edit mode
  if (isEditMode && !formData.acceptanceCriteria.trim()) {
    errors.acceptanceCriteria = t('validation.acceptanceCriteriaRequired');
  }

  // Status Validation - Required for Edit mode
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (isEditMode && !formData.status) {
    errors.status = t('validation.statusRequired');
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
 * @param t - Translation function for i18n
 * @returns Validation result indicating if the transition is valid
 *
 * @example
 * ```typescript
 * const result = validateStatusTransition(ItemStatus.NEW, ItemStatus.REFINED, t);
 * if (!result.valid) {
 *   console.log('Invalid transition:', result.message);
 * }
 * ```
 */
export const validateStatusTransition = (
  currentStatus: ItemStatus,
  newStatus: ItemStatus,
  t: TranslateFunction
): StatusTransitionValidation => {
  const validTransitions: Record<ItemStatus, ItemStatus[]> = {
    [ItemStatus.NEW]: [ItemStatus.REFINED],
    [ItemStatus.REFINED]: [ItemStatus.READY, ItemStatus.NEW],
    [ItemStatus.READY]: [ItemStatus.IN_PROGRESS, ItemStatus.REFINED],
    [ItemStatus.IN_PROGRESS]: [ItemStatus.DONE, ItemStatus.READY],
    [ItemStatus.DONE]: [],
  };

  if (currentStatus === newStatus) {
    return { valid: false, message: t('validation.statusAlreadySet') };
  }

  if (!validTransitions[currentStatus].includes(newStatus)) {
    const allowedStatuses = validTransitions[currentStatus]
      .map((s) => t(`status.${s.toLowerCase().replace('_', '')}`))
      .join(', ');
    return {
      valid: false,
      message: t('validation.invalidTransition', {
        current: t(`status.${currentStatus.toLowerCase().replace('_', '')}`),
        target: t(`status.${newStatus.toLowerCase().replace('_', '')}`),
        allowed: allowedStatuses || t('validation.none'),
      }),
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
 * @param t - Translation function for i18n
 * @returns Validation result with missing fields if any
 *
 * @example
 * ```typescript
 * const result = validateItemForStatusChange(item, ItemStatus.READY, t);
 * if (!result.valid) {
 *   console.log('Missing fields:', result.missingFields);
 * }
 * ```
 */
export const validateItemForStatusChange = (
  item: ProductBacklogItem,
  targetStatus: ItemStatus,
  t: TranslateFunction
): ItemValidationResult => {
  const missingFields: string[] = [];
  const requiresFullValidation = targetStatus !== ItemStatus.NEW;

  if (!requiresFullValidation) {
    return { valid: true, missingFields: [] };
  }

  if (!item.title || item.title.trim().length < 5) {
    missingFields.push(t('validation.fieldTitle'));
  }

  if (!item.description || item.description.trim().length === 0) {
    missingFields.push(t('validation.fieldDescription'));
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!item.priority) {
    missingFields.push(t('validation.fieldMoscowPriority'));
  }

  if (!item.businessValue || item.businessValue < 1) {
    missingFields.push(t('validation.fieldBusinessValue'));
  }

  if (!item.storyPoints || item.storyPoints < 1) {
    missingFields.push(t('validation.fieldEstimate'));
  }

  if (item.labels.length === 0) {
    missingFields.push(t('validation.fieldLabels'));
  }

  if (!item.acceptanceCriteria || item.acceptanceCriteria.trim().length === 0) {
    missingFields.push(t('validation.fieldAcceptanceCriteria'));
  }

  if (missingFields.length > 0) {
    const fieldList = missingFields.map((f) => `"${f}"`).join(', ');
    const targetStatusLabel = t(`status.${targetStatus.toLowerCase().replace('_', '')}`);
    const message = t('validation.cannotChangeStatus', {
      status: targetStatusLabel,
      fields: fieldList,
    });
    return { valid: false, missingFields, message };
  }

  return { valid: true, missingFields: [] };
};
