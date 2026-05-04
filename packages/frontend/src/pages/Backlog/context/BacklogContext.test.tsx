import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

import { BacklogProvider, useBacklogContext, validateLabels } from '../context/BacklogContext';
import { MoSCoWPriority, ItemStatus } from '../../../types';

vi.mock('../../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
  setStoreProvider: vi.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BacklogProvider>{children}</BacklogProvider>
);

describe('BacklogContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useBacklogContext', () => {
    it('should throw error when used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useBacklogContext());
      }).toThrow('useBacklogContext must be used within a BacklogProvider');

      consoleError.mockRestore();
    });

    it('should return context value when used within provider', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.formData).toBeDefined();
      expect(result.current.formErrors).toBeDefined();
      expect(result.current.selectedItem).toBeNull();
      expect(result.current.workflowError).toBeNull();
    });
  });

  describe('Initial State', () => {
    it('should have default form data', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      expect(result.current.formData.title).toBe('');
      expect(result.current.formData.description).toBe('');
      expect(result.current.formData.estimate).toBeUndefined();
      expect(result.current.formData.moscowPriority).toBe(MoSCoWPriority.COULD_HAVE);
      expect(result.current.formData.businessValue).toBe(3);
      expect(result.current.formData.labels).toBe('');
      expect(result.current.formData.acceptanceCriteria).toBe('');
      expect(result.current.formData.status).toBe(ItemStatus.NEW);
    });

    it('should have empty form errors', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      expect(result.current.formErrors).toEqual({});
    });

    it('should have null selected item', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      expect(result.current.selectedItem).toBeNull();
    });

    it('should have null workflow error', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      expect(result.current.workflowError).toBeNull();
    });

    it('should have empty label tags', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      expect(result.current.labelTags).toEqual([]);
    });

    it('should have empty label input value', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      expect(result.current.labelInputValue).toBe('');
    });

    it('should have null initial form data', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      expect(result.current.initialFormData).toBeNull();
    });
  });

  describe('setFormData', () => {
    it('should update form data', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          title: 'New Title',
        }));
      });

      expect(result.current.formData.title).toBe('New Title');
    });
  });

  describe('setFormErrors', () => {
    it('should update form errors', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.setFormErrors({ title: 'Title is required' });
      });

      expect(result.current.formErrors.title).toBe('Title is required');
    });
  });

  describe('setSelectedItem', () => {
    it('should update selected item', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      const mockItem = {
        id: 'pbi-1',
        teamId: 'team-1',
        title: 'Test Item',
        description: 'Test description',
        status: ItemStatus.NEW,
        priority: MoSCoWPriority.MUST_HAVE,
        storyPoints: 8,
        businessValue: 10,
        labels: ['frontend'],
        acceptanceCriteria: 'Test criteria',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user-1',
      };

      act(() => {
        result.current.setSelectedItem(mockItem);
      });

      expect(result.current.selectedItem).toEqual(mockItem);
    });
  });

  describe('setWorkflowError', () => {
    it('should update workflow error', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.setWorkflowError('Invalid transition');
      });

      expect(result.current.workflowError).toBe('Invalid transition');
    });
  });

  describe('handleFormChange', () => {
    it('should update form field value', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.handleFormChange('title', 'New Title');
      });

      expect(result.current.formData.title).toBe('New Title');
    });

    it('should clear error for changed field', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.setFormErrors({ title: 'Title is required' });
      });

      expect(result.current.formErrors.title).toBe('Title is required');

      act(() => {
        result.current.handleFormChange('title', 'New Title');
      });

      expect(result.current.formErrors.title).toBeUndefined();
    });

    it('should handle numeric values', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.handleFormChange('estimate', 8);
      });

      expect(result.current.formData.estimate).toBe(8);
    });

    it('should handle undefined values', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.handleFormChange('estimate', 8);
      });

      expect(result.current.formData.estimate).toBe(8);

      act(() => {
        result.current.handleFormChange('estimate', undefined);
      });

      expect(result.current.formData.estimate).toBeUndefined();
    });
  });

  describe('handlePriorityChange', () => {
    it('should update priority and business value for MUST_HAVE', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.handlePriorityChange(MoSCoWPriority.MUST_HAVE);
      });

      expect(result.current.formData.moscowPriority).toBe(MoSCoWPriority.MUST_HAVE);
      expect(result.current.formData.businessValue).toBe(13);
    });

    it('should update priority and business value for SHOULD_HAVE', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.handlePriorityChange(MoSCoWPriority.SHOULD_HAVE);
      });

      expect(result.current.formData.moscowPriority).toBe(MoSCoWPriority.SHOULD_HAVE);
      expect(result.current.formData.businessValue).toBe(5);
    });

    it('should update priority and business value for COULD_HAVE', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.handlePriorityChange(MoSCoWPriority.COULD_HAVE);
      });

      expect(result.current.formData.moscowPriority).toBe(MoSCoWPriority.COULD_HAVE);
      expect(result.current.formData.businessValue).toBe(3);
    });

    it('should update priority and business value for WONT_HAVE', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.handlePriorityChange(MoSCoWPriority.WONT_HAVE);
      });

      expect(result.current.formData.moscowPriority).toBe(MoSCoWPriority.WONT_HAVE);
      expect(result.current.formData.businessValue).toBe(1);
    });

    it('should clear priority errors on change', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.setFormErrors({ moscowPriority: 'Invalid priority' });
      });

      act(() => {
        result.current.handlePriorityChange(MoSCoWPriority.MUST_HAVE);
      });

      expect(result.current.formErrors.moscowPriority).toBeUndefined();
    });
  });

  describe('resetForm', () => {
    it('should reset form to default values', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          title: 'Test Title',
          description: 'Test Description',
          estimate: 13,
        }));
        result.current.setFormErrors({ title: 'Error' });
        result.current.setLabelTags(['tag1', 'tag2']);
        result.current.setLabelInputValue('tag3');
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData.title).toBe('');
      expect(result.current.formData.description).toBe('');
      expect(result.current.formData.estimate).toBeUndefined();
      expect(result.current.formErrors).toEqual({});
      expect(result.current.labelTags).toEqual([]);
      expect(result.current.labelInputValue).toBe('');
    });
  });

  describe('hasUnsavedChanges', () => {
    it('should return false when no initial form data', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      expect(result.current.hasUnsavedChanges()).toBe(false);
    });

    it('should return false when form data matches initial', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.setInitialFormData(result.current.formData);
      });

      expect(result.current.hasUnsavedChanges()).toBe(false);
    });

    it('should return true when title changed', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.setInitialFormData(result.current.formData);
        result.current.setFormData((prev) => ({ ...prev, title: 'New Title' }));
      });

      expect(result.current.hasUnsavedChanges()).toBe(true);
    });

    it('should return true when description changed', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.setInitialFormData(result.current.formData);
        result.current.setFormData((prev) => ({
          ...prev,
          description: 'New Description',
        }));
      });

      expect(result.current.hasUnsavedChanges()).toBe(true);
    });

    it('should return true when estimate changed', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.setInitialFormData(result.current.formData);
        result.current.setFormData((prev) => ({ ...prev, estimate: 8 }));
      });

      expect(result.current.hasUnsavedChanges()).toBe(true);
    });

    it('should return true when priority changed', () => {
      const { result } = renderHook(() => useBacklogContext(), { wrapper });

      act(() => {
        result.current.setInitialFormData(result.current.formData);
        result.current.setFormData((prev) => ({
          ...prev,
          moscowPriority: MoSCoWPriority.MUST_HAVE,
        }));
      });

      expect(result.current.hasUnsavedChanges()).toBe(true);
    });
  });

  describe('Label Management', () => {
    describe('handleLabelInputChange', () => {
      it('should update label input value', () => {
        const { result } = renderHook(() => useBacklogContext(), { wrapper });

        act(() => {
          result.current.handleLabelInputChange('frontend');
        });

        expect(result.current.labelInputValue).toBe('frontend');
      });

      it('should add single tag when typing without comma', () => {
        const { result } = renderHook(() => useBacklogContext(), { wrapper });

        act(() => {
          result.current.handleLabelInputChange('frontend');
        });

        expect(result.current.formData.labels).toBe('frontend');
      });

      it('should add multiple tags when comma is entered', () => {
        const { result } = renderHook(() => useBacklogContext(), { wrapper });

        act(() => {
          result.current.handleLabelInputChange('frontend, backend');
        });

        expect(result.current.labelTags).toEqual(['frontend', 'backend']);
        expect(result.current.labelInputValue).toBe('');
        expect(result.current.formData.labels).toBe('frontend, backend');
      });

      it('should limit to 10 labels', () => {
        const { result } = renderHook(() => useBacklogContext(), { wrapper });

        const labels = Array.from({ length: 12 }, (_, i) => `label${i + 1}`);

        act(() => {
          result.current.handleLabelInputChange(labels.join(', '));
        });

        expect(result.current.labelTags.length).toBe(10);
      });

      it('should not add duplicate labels', () => {
        const { result } = renderHook(() => useBacklogContext(), { wrapper });

        act(() => {
          result.current.handleLabelInputChange('frontend, frontend, backend');
        });

        expect(result.current.labelTags).toEqual(['frontend', 'backend']);
      });
    });

    describe('handleLabelKeyDown', () => {
      it('should add tag on Enter', () => {
        const { result } = renderHook(() => useBacklogContext(), { wrapper });

        act(() => {
          result.current.handleLabelInputChange('frontend');
        });

        const mockEvent = {
          key: 'Enter',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent;

        act(() => {
          result.current.handleLabelKeyDown(mockEvent);
        });

        expect(result.current.labelTags).toContain('frontend');
        expect(result.current.labelInputValue).toBe('');
      });

      it('should prevent default on Enter', () => {
        const { result } = renderHook(() => useBacklogContext(), { wrapper });

        act(() => {
          result.current.handleLabelInputChange('frontend');
        });

        const mockEvent = {
          key: 'Enter',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent;

        act(() => {
          result.current.handleLabelKeyDown(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
      });

      it('should remove last tag on Backspace when input is empty', () => {
        const { result } = renderHook(() => useBacklogContext(), { wrapper });

        act(() => {
          result.current.handleLabelInputChange('frontend, backend');
        });

        expect(result.current.labelTags).toEqual(['frontend', 'backend']);

        const mockEvent = {
          key: 'Backspace',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent;

        act(() => {
          result.current.handleLabelKeyDown(mockEvent);
        });

        expect(result.current.labelTags).toEqual(['frontend']);
      });

      it('should not remove tag on Backspace when input has value', () => {
        const { result } = renderHook(() => useBacklogContext(), { wrapper });

        act(() => {
          result.current.handleLabelInputChange('frontend, backend');
          result.current.setLabelInputValue('test');
        });

        const mockEvent = {
          key: 'Backspace',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent;

        act(() => {
          result.current.handleLabelKeyDown(mockEvent);
        });

        expect(result.current.labelTags).toEqual(['frontend', 'backend']);
      });

      it('should not add empty tag on Enter', () => {
        const { result } = renderHook(() => useBacklogContext(), { wrapper });

        const mockEvent = {
          key: 'Enter',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent;

        act(() => {
          result.current.handleLabelKeyDown(mockEvent);
        });

        expect(result.current.labelTags).toEqual([]);
      });
    });

    describe('removeLabelTag', () => {
      it('should remove specified tag', () => {
        const { result } = renderHook(() => useBacklogContext(), { wrapper });

        act(() => {
          result.current.handleLabelInputChange('frontend, backend, testing');
        });

        expect(result.current.labelTags).toEqual(['frontend', 'backend', 'testing']);

        act(() => {
          result.current.removeLabelTag('backend');
        });

        expect(result.current.labelTags).toEqual(['frontend', 'testing']);
        expect(result.current.formData.labels).toBe('frontend, testing');
      });

      it('should not affect other tags when removing non-existent tag', () => {
        const { result } = renderHook(() => useBacklogContext(), { wrapper });

        act(() => {
          result.current.handleLabelInputChange('frontend, backend');
        });

        act(() => {
          result.current.removeLabelTag('nonexistent');
        });

        expect(result.current.labelTags).toEqual(['frontend', 'backend']);
      });
    });
  });

  describe('validateLabels', () => {
    it('should return empty array for valid labels', () => {
      const errors = validateLabels('frontend, backend, testing');
      expect(errors).toEqual([]);
    });

    it('should return error for label exceeding 30 characters', () => {
      const longLabel = 'a'.repeat(31);
      const errors = validateLabels(longLabel);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('exceeds 30 character limit');
    });

    it('should return error for invalid characters', () => {
      const errors = validateLabels('frontend@, backend#');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('invalid characters');
    });

    it('should return error for duplicate labels', () => {
      const errors = validateLabels('frontend, frontend, backend');
      expect(errors.some((e) => e.includes('Duplicate'))).toBe(true);
    });

    it('should return error for too many labels', () => {
      const labels = Array.from({ length: 11 }, (_, i) => `label${i + 1}`).join(', ');
      const errors = validateLabels(labels);
      expect(errors.some((e) => e.includes('Too many labels'))).toBe(true);
    });

    it('should return empty array for empty string', () => {
      const errors = validateLabels('');
      expect(errors).toEqual([]);
    });

    it('should accept valid special characters', () => {
      const errors = validateLabels('front-end, back_end, test123');
      expect(errors).toEqual([]);
    });
  });
});
