import { describe, it, expect } from 'vitest';
import {
  hasSubstantiveString,
  hasSubstantiveNumber,
  hasSubstantiveInput,
  hasUnsavedChangesForCreate,
  hasUnsavedChangesForEdit,
  DEFAULT_FORM_DATA,
} from './formChangeDetection';
import type { TaskFormData } from '../SprintBoard.types';

describe('hasSubstantiveString', () => {
  it('should return false for empty string', () => {
    expect(hasSubstantiveString('')).toBe(false);
  });

  it('should return false for whitespace-only string', () => {
    expect(hasSubstantiveString('   ')).toBe(false);
    expect(hasSubstantiveString('\t\n\r')).toBe(false);
    expect(hasSubstantiveString('     ')).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(hasSubstantiveString(undefined)).toBe(false);
  });

  it('should return false for null', () => {
    expect(hasSubstantiveString(null)).toBe(false);
  });

  it('should return true for non-empty string', () => {
    expect(hasSubstantiveString('Hello')).toBe(true);
  });

  it('should return true for string with leading/trailing whitespace but substantive content', () => {
    expect(hasSubstantiveString('  Hello  ')).toBe(true);
    expect(hasSubstantiveString('\tHello\n')).toBe(true);
  });

  it('should return true for single character string', () => {
    expect(hasSubstantiveString('a')).toBe(true);
  });
});

describe('hasSubstantiveNumber', () => {
  it('should return false for zero', () => {
    expect(hasSubstantiveNumber(0)).toBe(false);
  });

  it('should return false for negative number', () => {
    expect(hasSubstantiveNumber(-1)).toBe(false);
    expect(hasSubstantiveNumber(-100)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(hasSubstantiveNumber(undefined)).toBe(false);
  });

  it('should return false for null', () => {
    expect(hasSubstantiveNumber(null)).toBe(false);
  });

  it('should return true for positive number', () => {
    expect(hasSubstantiveNumber(1)).toBe(true);
    expect(hasSubstantiveNumber(0.5)).toBe(true);
    expect(hasSubstantiveNumber(100)).toBe(true);
  });

  it('should return true for decimal greater than 0', () => {
    expect(hasSubstantiveNumber(0.1)).toBe(true);
    expect(hasSubstantiveNumber(0.01)).toBe(true);
  });
});

describe('hasSubstantiveInput', () => {
  it('should return false for empty form data', () => {
    const formData: Partial<TaskFormData> = {};
    expect(hasSubstantiveInput(formData)).toBe(false);
  });

  it('should return false when all fields are empty/default', () => {
    const formData: Partial<TaskFormData> = {
      title: '',
      description: '',
      pbiId: '',
      assigneeId: '',
      estimatedHours: 0,
      remainingHours: 0,
    };
    expect(hasSubstantiveInput(formData)).toBe(false);
  });

  it('should return false when only whitespace in string fields', () => {
    const formData: Partial<TaskFormData> = {
      title: '   ',
      description: '\t\n',
    };
    expect(hasSubstantiveInput(formData)).toBe(false);
  });

  it('should return true when title has content', () => {
    const formData: Partial<TaskFormData> = {
      title: 'New Task',
    };
    expect(hasSubstantiveInput(formData)).toBe(true);
  });

  it('should return true when description has content', () => {
    const formData: Partial<TaskFormData> = {
      description: 'Task description',
    };
    expect(hasSubstantiveInput(formData)).toBe(true);
  });

  it('should return true when estimatedHours is greater than 0', () => {
    const formData: Partial<TaskFormData> = {
      estimatedHours: 8,
    };
    expect(hasSubstantiveInput(formData)).toBe(true);
  });

  it('should return true when remainingHours is greater than 0', () => {
    const formData: Partial<TaskFormData> = {
      remainingHours: 5,
    };
    expect(hasSubstantiveInput(formData)).toBe(true);
  });

  it('should return true when assigneeId is selected', () => {
    const formData: Partial<TaskFormData> = {
      assigneeId: 'user-123',
    };
    expect(hasSubstantiveInput(formData)).toBe(true);
  });

  it('should return true when pbiId is selected (though this is auto-selected)', () => {
    // Note: pbiId is not checked in hasSubstantiveInput as it can be auto-selected
    const formData: Partial<TaskFormData> = {
      pbiId: 'pbi-123',
    };
    expect(hasSubstantiveInput(formData)).toBe(false);
  });

  it('should handle mixed fields - some substantive, some not', () => {
    const formData: Partial<TaskFormData> = {
      title: '',
      description: 'Valid description',
      estimatedHours: 0,
      remainingHours: 0,
    };
    expect(hasSubstantiveInput(formData)).toBe(true);
  });
});

describe('hasUnsavedChangesForCreate', () => {
  it('should return false for default form data', () => {
    expect(hasUnsavedChangesForCreate(DEFAULT_FORM_DATA)).toBe(false);
  });

  it('should return false when only pbiId is set (auto-selected case)', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      pbiId: 'pbi-123',
    };
    expect(hasUnsavedChangesForCreate(formData)).toBe(false);
  });

  it('should return false when only whitespace in title', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      title: '   ',
    };
    expect(hasUnsavedChangesForCreate(formData)).toBe(false);
  });

  it('should return false when only whitespace in description', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      description: '\t\n  ',
    };
    expect(hasUnsavedChangesForCreate(formData)).toBe(false);
  });

  it('should return false when estimatedHours is 0', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      estimatedHours: 0,
    };
    expect(hasUnsavedChangesForCreate(formData)).toBe(false);
  });

  it('should return true when title has substantive content', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      title: 'New Task',
    };
    expect(hasUnsavedChangesForCreate(formData)).toBe(true);
  });

  it('should return true when description has substantive content', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      description: 'Task description',
    };
    expect(hasUnsavedChangesForCreate(formData)).toBe(true);
  });

  it('should return true when estimatedHours is greater than 0', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      estimatedHours: 8,
    };
    expect(hasUnsavedChangesForCreate(formData)).toBe(true);
  });

  it('should return true when remainingHours is greater than 0', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      remainingHours: 5,
    };
    expect(hasUnsavedChangesForCreate(formData)).toBe(true);
  });

  it('should return true when assigneeId is selected', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      assigneeId: 'user-123',
    };
    expect(hasUnsavedChangesForCreate(formData)).toBe(true);
  });

  it('should handle decimal hours correctly', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      estimatedHours: 0.5,
    };
    expect(hasUnsavedChangesForCreate(formData)).toBe(true);
  });

  it('should handle title with leading/trailing whitespace but substantive content', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      title: '  New Task  ',
    };
    expect(hasUnsavedChangesForCreate(formData)).toBe(true);
  });
});

describe('hasUnsavedChangesForEdit', () => {
  const originalData = {
    title: 'Original Task',
    description: 'Original description',
    assigneeId: 'user-1',
    estimatedHours: 8,
    remainingHours: 5,
  };

  it('should return false when form data matches original exactly', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      ...originalData,
    };
    expect(hasUnsavedChangesForEdit(formData, originalData)).toBe(false);
  });

  it('should return true when title is changed', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      ...originalData,
      title: 'Modified Task',
    };
    expect(hasUnsavedChangesForEdit(formData, originalData)).toBe(true);
  });

  it('should return true when description is changed', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      ...originalData,
      description: 'Modified description',
    };
    expect(hasUnsavedChangesForEdit(formData, originalData)).toBe(true);
  });

  it('should return true when assigneeId is changed', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      ...originalData,
      assigneeId: 'user-2',
    };
    expect(hasUnsavedChangesForEdit(formData, originalData)).toBe(true);
  });

  it('should return true when estimatedHours is changed', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      ...originalData,
      estimatedHours: 10,
    };
    expect(hasUnsavedChangesForEdit(formData, originalData)).toBe(true);
  });

  it('should return true when remainingHours is changed', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      ...originalData,
      remainingHours: 3,
    };
    expect(hasUnsavedChangesForEdit(formData, originalData)).toBe(true);
  });

  it('should trim whitespace when comparing strings', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      ...originalData,
      title: '  Original Task  ', // Same content, different whitespace
    };
    expect(hasUnsavedChangesForEdit(formData, originalData)).toBe(false);
  });

  it('should detect change when whitespace-only content replaces substantive content', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      ...originalData,
      title: '   ',
    };
    expect(hasUnsavedChangesForEdit(formData, originalData)).toBe(true);
  });

  it('should handle empty original description', () => {
    const originalWithEmptyDesc = {
      ...originalData,
      description: '',
    };
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      ...originalWithEmptyDesc,
    };
    expect(hasUnsavedChangesForEdit(formData, originalWithEmptyDesc)).toBe(false);
  });

  it('should handle numeric changes to zero', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      ...originalData,
      remainingHours: 0,
    };
    expect(hasUnsavedChangesForEdit(formData, originalData)).toBe(true);
  });
});

describe('Edge cases for unsaved changes detection', () => {
  it('should handle create form with only status changed (not substantive)', () => {
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      status: 'IN_PROGRESS',
    };
    expect(hasUnsavedChangesForCreate(formData)).toBe(false);
  });

  it('should handle form with all fields having substantive content', () => {
    const formData: TaskFormData = {
      title: 'Complete Task',
      description: 'Full description',
      pbiId: 'pbi-123',
      assigneeId: 'user-123',
      status: 'TODO',
      estimatedHours: 8,
      remainingHours: 8,
    };
    expect(hasUnsavedChangesForCreate(formData)).toBe(true);
  });

  it('should handle edit form with all fields unchanged', () => {
    const originalData = {
      title: 'Task',
      description: 'Description',
      assigneeId: 'user-1',
      estimatedHours: 8,
      remainingHours: 8,
    };
    const formData: TaskFormData = {
      ...DEFAULT_FORM_DATA,
      ...originalData,
    };
    expect(hasUnsavedChangesForEdit(formData, originalData)).toBe(false);
  });
});
