/* eslint-disable react-refresh/only-export-components -- Context, provider, hooks, and utilities are co-located */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';

import { MoSCoWPriority, ItemStatus, type ProductBacklogItem } from '../../../types';
import type { ItemFormData, FormErrors } from '../types/backlog.types';
import { MOSCOW_TO_BUSINESS_VALUE } from '../config/moscow.config';
import { logger } from '../../../utils/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Context value interface for BacklogContext
 * Contains all shared state for modal management
 */
export interface BacklogContextValue {
  // Form data state
  /** Current form data for create/edit modals */
  formData: ItemFormData;
  /** Function to update form data */
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>;

  // Form errors state
  /** Current form validation errors */
  formErrors: FormErrors;
  /** Function to update form errors */
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>;

  // Selected item state
  /** Currently selected backlog item for detail/edit/delete operations */
  selectedItem: ProductBacklogItem | null;
  /** Function to update selected item */
  setSelectedItem: React.Dispatch<React.SetStateAction<ProductBacklogItem | null>>;

  // Workflow error state
  /** Current workflow validation error message */
  workflowError: string | null;
  /** Function to update workflow error */
  setWorkflowError: React.Dispatch<React.SetStateAction<string | null>>;

  // Label tags state
  /** Array of label tags for create/edit forms */
  labelTags: string[];
  /** Function to update label tags */
  setLabelTags: React.Dispatch<React.SetStateAction<string[]>>;

  // Label input state
  /** Current value of the label input field */
  labelInputValue: string;
  /** Function to update label input value */
  setLabelInputValue: React.Dispatch<React.SetStateAction<string>>;

  // Initial form data for tracking changes
  /** Initial form data for unsaved changes detection */
  initialFormData: ItemFormData | null;
  /** Function to set initial form data */
  setInitialFormData: React.Dispatch<React.SetStateAction<ItemFormData | null>>;

  // Helper functions
  /** Check if form has unsaved changes */
  hasUnsavedChanges: () => boolean;
  /** Reset form to default state */
  resetForm: () => void;
  /** Handle form field change */
  handleFormChange: (field: keyof ItemFormData, value: string | number | undefined) => void;
  /** Handle MoSCoW priority change */
  handlePriorityChange: (priority: MoSCoWPriority) => void;
  /** Handle label input change */
  handleLabelInputChange: (value: string) => void;
  /** Handle label key down events */
  handleLabelKeyDown: (e: React.KeyboardEvent) => void;
  /** Remove a label tag */
  removeLabelTag: (tagToRemove: string) => void;
}

/**
 * Props for BacklogProvider component
 */
export interface BacklogProviderProps {
  /** Child components that will have access to the context */
  children: React.ReactNode;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

/**
 * BacklogContext for shared modal state management
 *
 * This context provides centralized state management for:
 * - Form data and validation errors
 * - Selected item for operations
 * - Workflow errors
 * - Label tags management
 *
 * @example
 * ```tsx
 * const { formData, setFormData, formErrors } = useBacklogContext();
 * ```
 */
const BacklogContext = createContext<BacklogContextValue | undefined>(undefined);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default form data with initial values
 */
const getDefaultFormData = (): ItemFormData => ({
  title: '',
  description: '',
  estimate: undefined,
  moscowPriority: MoSCoWPriority.COULD_HAVE,
  businessValue: MOSCOW_TO_BUSINESS_VALUE[MoSCoWPriority.COULD_HAVE],
  labels: '',
  acceptanceCriteria: '',
  status: ItemStatus.NEW,
});

/**
 * Validate label format and constraints
 * @param labelsString - Comma-separated labels string
 * @returns Array of validation error messages
 */
export const validateLabels = (labelsString: string): string[] => {
  const errors: string[] = [];
  const labels = labelsString
    .split(',')
    .map((l) => l.trim())
    .filter((l) => l);

  // Check for empty labels after splitting
  const emptyLabels = labelsString.split(',').filter((l) => !l.trim() && l.includes(','));
  if (emptyLabels.length > 0) {
    errors.push('Remove empty labels between commas.');
  }

  // Check each label
  labels.forEach((label) => {
    // Check length
    if (label.length > 30) {
      errors.push(`Label "${label.substring(0, 20)}..." exceeds 30 character limit.`);
    }

    // Check for invalid characters
    const invalidChars = label.match(/[^a-zA-Z0-9-_\s]/g);
    if (invalidChars) {
      const uniqueInvalid = [...new Set(invalidChars)].join(', ');
      errors.push(
        `Label "${label}" contains invalid characters: ${uniqueInvalid}. Use only letters, numbers, hyphens, and underscores.`
      );
    }

    // Check for leading/trailing spaces
    if (label !== label.trim()) {
      errors.push(`Label "${label}" has extra spaces. Labels are trimmed automatically.`);
    }
  });

  // Check for duplicates
  const uniqueLabels = new Set(labels.map((l) => l.toLowerCase()));
  if (uniqueLabels.size !== labels.length) {
    errors.push('Duplicate labels detected. Each label should be unique.');
  }

  // Check total label count
  if (labels.length > 10) {
    errors.push(`Too many labels (${labels.length}). Maximum allowed is 10 labels.`);
  }

  return errors;
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * BacklogProvider Component
 *
 * Provides centralized state management for backlog modals.
 * Wraps the component tree to make context available to all children.
 *
 * @param props - Component props containing children
 * @returns Provider component with context value
 *
 * @example
 * ```tsx
 * <BacklogProvider>
 *   <BacklogModals />
 * </BacklogProvider>
 * ```
 */
export const BacklogProvider: React.FC<BacklogProviderProps> = ({ children }) => {
  // Form data state
  const [formData, setFormData] = useState<ItemFormData>(getDefaultFormData());

  // Form errors state
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Initial form data for tracking changes
  const [initialFormData, setInitialFormData] = useState<ItemFormData | null>(null);

  // Selected item state
  const [selectedItem, setSelectedItem] = useState<ProductBacklogItem | null>(null);

  // Workflow error state
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  // Label tags state
  const [labelTags, setLabelTags] = useState<string[]>([]);
  const [labelInputValue, setLabelInputValue] = useState('');

  // Refs to track current form data for stable callback references
  const formDataRef = useRef(formData);
  const initialFormDataRef = useRef(initialFormData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    initialFormDataRef.current = initialFormData;
  }, [initialFormData]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Check if form has unsaved changes
   * Compares current form data with initial form data
   */
  const hasUnsavedChanges = useCallback((): boolean => {
    const current = formDataRef.current;
    const initial = initialFormDataRef.current;
    if (!initial) return false;

    return (
      current.title !== initial.title ||
      current.description !== initial.description ||
      current.estimate !== initial.estimate ||
      current.moscowPriority !== initial.moscowPriority ||
      current.businessValue !== initial.businessValue ||
      current.labels !== initial.labels ||
      current.acceptanceCriteria !== initial.acceptanceCriteria ||
      current.status !== initial.status
    );
  }, []);

  /**
   * Reset form to default state
   * Clears all form data, errors, and label tags
   */
  const resetForm = useCallback(() => {
    const defaultFormData = getDefaultFormData();
    setFormData(defaultFormData);
    setInitialFormData(null);
    setFormErrors({});
    setLabelTags([]);
    setLabelInputValue('');
  }, []);

  /**
   * Handle form field change
   * Clears error for the changed field
   */
  const handleFormChange = useCallback(
    (field: keyof ItemFormData, value: string | number | undefined) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (formErrors[field as keyof FormErrors]) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [formErrors]
  );

  /**
   * Handle MoSCoW priority change
   * Updates both priority and corresponding business value
   */
  const handlePriorityChange = useCallback((priority: MoSCoWPriority) => {
    // Validate that the priority is a valid MoSCoW priority
    if (!Object.values(MoSCoWPriority).includes(priority)) {
      logger.error('Invalid MoSCoW priority selected', undefined, { priority });
      setFormErrors((prev) => ({ ...prev, moscowPriority: 'Invalid priority selection' }));
      return;
    }

    // Get the corresponding business value from the mapping
    const businessValue = MOSCOW_TO_BUSINESS_VALUE[priority];

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (businessValue === undefined) {
      logger.error('No business value mapping found for priority', undefined, { priority });
      setFormErrors((prev) => ({
        ...prev,
        moscowPriority: 'Failed to set business value for selected priority',
      }));
      return;
    }

    // Update both priority and business value in a single state update
    setFormData((prev) => ({
      ...prev,
      moscowPriority: priority,
      businessValue,
    }));

    // Clear any existing errors for these fields
    setFormErrors((prev) => ({
      ...prev,
      moscowPriority: undefined,
      businessValue: undefined,
    }));
  }, []);

  /**
   * Handle label input change
   * Manages label tag creation and updates form data
   */
  const handleLabelInputChange = useCallback(
    (value: string) => {
      setLabelInputValue(value);

      // Update the form data labels string
      if (value.trim() && !value.includes(',')) {
        // Single tag being typed
        const updatedLabels = [...labelTags, value.trim()].filter((v, i, a) => a.indexOf(v) === i);
        setFormData((prev) => ({ ...prev, labels: updatedLabels.join(', ') }));
      } else if (value.includes(',')) {
        // Multiple tags being added
        const newTags = value
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t);
        const updatedLabels = [...labelTags, ...newTags].filter((v, i, a) => a.indexOf(v) === i);
        setLabelTags(updatedLabels.slice(0, 10)); // Max 10 labels
        setLabelInputValue('');
        setFormData((prev) => ({ ...prev, labels: updatedLabels.slice(0, 10).join(', ') }));
      }
    },
    [labelTags]
  );

  /**
   * Handle label key down events
   * Supports Enter to add tag and Backspace to remove last tag
   */
  const handleLabelKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = labelInputValue.trim();
        if (value && labelTags.length < 10) {
          // Validate label before adding
          const validationErrors = validateLabels(value);
          if (validationErrors.length === 0) {
            const newTags = [...labelTags, value].filter((v, i, a) => a.indexOf(v) === i);
            setLabelTags(newTags);
            setLabelInputValue('');
            setFormData((prev) => ({ ...prev, labels: newTags.join(', ') }));
            // Clear any label errors
            if (formErrors.labels) {
              setFormErrors((prev) => ({ ...prev, labels: undefined }));
            }
          }
        }
      } else if (e.key === 'Backspace' && !labelInputValue && labelTags.length > 0) {
        // Remove last tag on backspace when input is empty
        const newTags = labelTags.slice(0, -1);
        setLabelTags(newTags);
        setFormData((prev) => ({ ...prev, labels: newTags.join(', ') }));
      }
    },
    [labelInputValue, labelTags, formErrors.labels]
  );

  /**
   * Remove a label tag
   */
  const removeLabelTag = useCallback(
    (tagToRemove: string) => {
      const newTags = labelTags.filter((tag) => tag !== tagToRemove);
      setLabelTags(newTags);
      setFormData((prev) => ({ ...prev, labels: newTags.join(', ') }));
    },
    [labelTags]
  );

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  /**
   * Memoized context value to prevent unnecessary re-renders
   */
  const contextValue = useMemo<BacklogContextValue>(
    () => ({
      // Form data state
      formData,
      setFormData,

      // Form errors state
      formErrors,
      setFormErrors,

      // Selected item state
      selectedItem,
      setSelectedItem,

      // Workflow error state
      workflowError,
      setWorkflowError,

      // Label tags state
      labelTags,
      setLabelTags,

      // Label input state
      labelInputValue,
      setLabelInputValue,

      // Initial form data
      initialFormData,
      setInitialFormData,

      // Helper functions
      hasUnsavedChanges,
      resetForm,
      handleFormChange,
      handlePriorityChange,
      handleLabelInputChange,
      handleLabelKeyDown,
      removeLabelTag,
    }),
    [
      formData,
      formErrors,
      selectedItem,
      workflowError,
      labelTags,
      labelInputValue,
      initialFormData,
      hasUnsavedChanges,
      resetForm,
      handleFormChange,
      handlePriorityChange,
      handleLabelInputChange,
      handleLabelKeyDown,
      removeLabelTag,
    ]
  );

  return <BacklogContext.Provider value={contextValue}>{children}</BacklogContext.Provider>;
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Custom hook for consuming BacklogContext
 *
 * Provides access to all shared modal state and helper functions.
 * Must be used within a BacklogProvider.
 *
 * @returns BacklogContextValue containing all state and functions
 * @throws Error if used outside of BacklogProvider
 *
 * @example
 * ```tsx
 * const {
 *   formData,
 *   setFormData,
 *   formErrors,
 *   selectedItem,
 *   workflowError,
 *   labelTags,
 * } = useBacklogContext();
 * ```
 */
export const useBacklogContext = (): BacklogContextValue => {
  const context = useContext(BacklogContext);

  if (context === undefined) {
    throw new Error(
      'useBacklogContext must be used within a BacklogProvider. ' +
        'Make sure to wrap your component tree with <BacklogProvider>.'
    );
  }

  return context;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default BacklogContext;
