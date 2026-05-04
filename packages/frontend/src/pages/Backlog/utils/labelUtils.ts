/**
 * Label validation and utility functions for backlog items
 *
 * This module provides utilities for managing and validating labels/tags
 * on backlog items, including format validation, length checks, and uniqueness.
 */

/**
 * Maximum number of labels allowed per item
 */
const MAX_LABELS = 10;

/**
 * Maximum length for a single label
 */
const MAX_LABEL_LENGTH = 30;

/**
 * Validates label format, length, and uniqueness
 *
 * This function performs comprehensive validation of label strings,
 * checking for:
 * - Empty labels between commas
 * - Label length (max 30 characters)
 * - Invalid characters (only letters, numbers, hyphens, underscores, spaces allowed)
 * - Leading/trailing spaces
 * - Duplicate labels (case-insensitive)
 * - Total label count (max 10)
 *
 * @param labelsString - Comma-separated string of labels
 * @returns Array of validation error messages (empty if valid)
 *
 * @example
 * ```typescript
 * const errors = validateLabels('frontend, backend, api');
 * if (errors.length > 0) {
 *   console.log('Label validation errors:', errors);
 * }
 * ```
 */
export const validateLabels = (labelsString: string): string[] => {
  const errors: string[] = [];
  const labels = labelsString
    .split(',')
    .map((l) => l.trim())
    .filter((l) => l);

  const emptyLabels = labelsString.split(',').filter((l) => !l.trim() && l.includes(','));
  if (emptyLabels.length > 0) {
    errors.push('Remove empty labels between commas.');
  }

  labels.forEach((label) => {
    if (label.length > MAX_LABEL_LENGTH) {
      errors.push(
        `Label "${label.substring(0, 20)}..." exceeds ${MAX_LABEL_LENGTH} character limit.`
      );
    }

    const invalidChars = label.match(/[^a-zA-Z0-9-_\s]/g);
    if (invalidChars) {
      const uniqueInvalid = Array.from(new Set(invalidChars)).join(', ');
      errors.push(
        `Label "${label}" contains invalid characters: ${uniqueInvalid}. Use only letters, numbers, hyphens, and underscores.`
      );
    }

    if (label !== label.trim()) {
      errors.push(`Label "${label}" has extra spaces. Labels are trimmed automatically.`);
    }
  });

  const uniqueLabels = new Set(labels.map((l) => l.toLowerCase()));
  if (uniqueLabels.size !== labels.length) {
    errors.push('Duplicate labels detected. Each label should be unique.');
  }

  if (labels.length > MAX_LABELS) {
    errors.push(`Too many labels (${labels.length}). Maximum allowed is ${MAX_LABELS} labels.`);
  }

  return errors;
};
