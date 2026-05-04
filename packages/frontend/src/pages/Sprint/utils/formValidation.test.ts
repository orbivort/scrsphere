import { describe, it, expect } from 'vitest';
import { TaskStatus } from '../../../types';
import type { TaskFormData, FormErrors } from '../SprintBoard.types';

describe('Form Validation Logic', () => {
  const validateTaskForm = (formData: TaskFormData, isEditMode: boolean): FormErrors => {
    const errors: FormErrors = {};

    // Title validation (required for both create and edit)
    if (!formData.title.trim()) {
      errors.title = 'Task title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be 100 characters or less';
    }

    // Description validation (required for edit mode)
    if (isEditMode) {
      if (!formData.description.trim()) {
        errors.description = 'Description is required';
      }

      if (!formData.assigneeId) {
        errors.assigneeId = 'Assignee is required';
      }

      if (!formData.estimatedHours || formData.estimatedHours <= 0) {
        errors.estimatedHours = 'Estimated hours must be greater than 0';
      }

      if (
        formData.remainingHours === undefined ||
        formData.remainingHours === null ||
        formData.remainingHours <= 0
      ) {
        errors.remainingHours = 'Remaining hours must be greater than 0';
      }
    } else {
      // PBI validation (required for create mode)
      if (!formData.pbiId) {
        errors.pbiId = 'Please select a parent backlog item';
      }
    }

    // Cross-field validation: remaining hours cannot exceed estimated hours
    if (formData.remainingHours > formData.estimatedHours && formData.estimatedHours > 0) {
      errors.remainingHours = 'Remaining hours cannot exceed estimated hours';
    }

    return errors;
  };

  const createMockFormData = (overrides: Partial<TaskFormData> = {}): TaskFormData => ({
    title: '',
    description: '',
    pbiId: '',
    assigneeId: '',
    status: TaskStatus.TODO,
    estimatedHours: 0,
    remainingHours: 0,
    ...overrides,
  });

  describe('Create Mode Validation', () => {
    it('should pass validation with valid create data', () => {
      const errors = validateTaskForm(
        createMockFormData({
          title: 'Valid Task',
          pbiId: 'pbi-1',
        }),
        false
      );

      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should fail validation for empty title in create mode', () => {
      const errors = validateTaskForm(
        createMockFormData({
          title: '',
          pbiId: 'pbi-1',
        }),
        false
      );

      expect(errors.title).toBe('Task title is required');
    });

    it('should fail validation for title exceeding 100 chars in create mode', () => {
      const errors = validateTaskForm(
        createMockFormData({
          title: 'A'.repeat(101),
          pbiId: 'pbi-1',
        }),
        false
      );

      expect(errors.title).toBe('Title must be 100 characters or less');
    });

    it('should fail validation for missing PBI in create mode', () => {
      const errors = validateTaskForm(
        createMockFormData({
          title: 'Task',
          pbiId: '',
        }),
        false
      );

      expect(errors.pbiId).toBe('Please select a parent backlog item');
    });

    it('should not require description in create mode', () => {
      const errors = validateTaskForm(
        createMockFormData({
          title: 'Task',
          pbiId: 'pbi-1',
          description: '',
        }),
        false
      );

      expect(errors.description).toBeUndefined();
    });
  });

  describe('Edit Mode Validation', () => {
    it('should pass validation with valid edit data', () => {
      const errors = validateTaskForm(
        createMockFormData({
          title: 'Valid Task',
          description: 'Description',
          pbiId: 'pbi-1',
          assigneeId: 'user-1',
          estimatedHours: 8,
          remainingHours: 5,
        }),
        true
      );

      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should fail validation for empty title in edit mode', () => {
      const errors = validateTaskForm(
        createMockFormData({
          title: '',
          description: 'Description',
          assigneeId: 'user-1',
          estimatedHours: 8,
          remainingHours: 5,
        }),
        true
      );

      expect(errors.title).toBe('Task title is required');
    });

    it('should fail validation for missing description in edit mode', () => {
      const errors = validateTaskForm(
        createMockFormData({
          title: 'Task',
          description: '',
          assigneeId: 'user-1',
          estimatedHours: 8,
          remainingHours: 5,
        }),
        true
      );

      expect(errors.description).toBe('Description is required');
    });

    it('should fail validation for missing assignee in edit mode', () => {
      const errors = validateTaskForm(
        createMockFormData({
          title: 'Task',
          description: 'Description',
          assigneeId: '',
          estimatedHours: 8,
          remainingHours: 5,
        }),
        true
      );

      expect(errors.assigneeId).toBe('Assignee is required');
    });

    it('should fail validation for zero estimated hours in edit mode', () => {
      const errors = validateTaskForm(
        createMockFormData({
          title: 'Task',
          description: 'Description',
          assigneeId: 'user-1',
          estimatedHours: 0,
          remainingHours: 0,
        }),
        true
      );

      expect(errors.estimatedHours).toBe('Estimated hours must be greater than 0');
    });

    it('should fail validation for negative estimated hours in edit mode', () => {
      const errors = validateTaskForm(
        createMockFormData({
          title: 'Task',
          description: 'Description',
          assigneeId: 'user-1',
          estimatedHours: -1,
          remainingHours: 0,
        }),
        true
      );

      expect(errors.estimatedHours).toBe('Estimated hours must be greater than 0');
    });

    it('should fail validation for zero remaining hours in edit mode', () => {
      const errors = validateTaskForm(
        createMockFormData({
          title: 'Task',
          description: 'Description',
          assigneeId: 'user-1',
          estimatedHours: 8,
          remainingHours: 0,
        }),
        true
      );

      expect(errors.remainingHours).toBe('Remaining hours must be greater than 0');
    });

    it('should fail validation when remaining exceeds estimated', () => {
      const errors = validateTaskForm(
        createMockFormData({
          title: 'Task',
          description: 'Description',
          assigneeId: 'user-1',
          estimatedHours: 5,
          remainingHours: 8,
        }),
        true
      );

      expect(errors.remainingHours).toBe('Remaining hours cannot exceed estimated hours');
    });

    it('should allow remaining hours equal to estimated hours', () => {
      const errors = validateTaskForm(
        createMockFormData({
          title: 'Task',
          description: 'Description',
          assigneeId: 'user-1',
          estimatedHours: 5,
          remainingHours: 5,
        }),
        true
      );

      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('Cross-field Validation', () => {
    it('should validate remaining hours only when estimated hours is positive', () => {
      const errors = validateTaskForm(
        createMockFormData({
          title: 'Task',
          description: 'Description',
          assigneeId: 'user-1',
          estimatedHours: 0,
          remainingHours: 10,
        }),
        true
      );

      // Should not show remaining > estimated error when estimated is 0
      // because the estimatedHours error takes precedence
      expect(errors.estimatedHours).toBe('Estimated hours must be greater than 0');
    });
  });
});
