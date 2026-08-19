import { describe, it, expect } from 'vitest';

import {
  validateFormData,
  validateStatusTransition,
  validateItemForStatusChange,
} from './validation';
import { ItemStatus, MoSCoWPriority, type ProductBacklogItem } from '../../../types';
import type { ItemFormData } from '../types/backlog.types';

// Mock translation function that returns the key for testing i18n-based validation
const mockT = (key: string, options?: Record<string, unknown>): string => {
  // Return human-readable messages based on translation keys for test assertions
  const translations: Record<string, string> = {
    'validation.teamIdRequired': 'Team ID is required',
    'validation.activeGoalRequired': 'An active goal is required',
    'validation.titleRequired': 'Title is required',
    'validation.titleTooShort': 'Title is too short (minimum 5 characters)',
    'validation.titleTooLong': 'Title exceeds maximum length by {{overBy}} character{{plural}}',
    'validation.descriptionRequired': 'Description is required',
    'validation.moscowPriorityRequired': 'MoSCoW Priority is required',
    'validation.estimateRequired': 'Estimate is required',
    'validation.estimateMinimum': 'Estimate must be at least 1 story point',
    'validation.estimateTooLarge': 'Estimate exceeds maximum of 100 ({{estimate}})',
    'validation.businessValueRequired': 'Business Value is required',
    'validation.businessValueMinimum': 'Business Value must be at least 1 point',
    'validation.businessValueTooLarge': 'Business Value exceeds maximum of 100 ({{value}})',
    'validation.labelsRequired': 'At least one label is required',
    'validation.acceptanceCriteriaRequired': 'Acceptance Criteria is required',
    'validation.statusRequired': 'Status is required',
    'validation.statusAlreadySet': 'Item is already in this status',
    'validation.invalidTransition':
      'Transition from {{current}} to {{target}} is not allowed. Allowed: {{allowed}}',
    'validation.none': 'None',
    'validation.fieldTitle': 'Title (minimum 5 characters)',
    'validation.fieldDescription': 'Description',
    'validation.fieldMoscowPriority': 'MoSCoW Priority',
    'validation.fieldBusinessValue': 'Business Value',
    'validation.fieldEstimate': 'Estimate (Story Points)',
    'validation.fieldLabels': 'Labels (at least one)',
    'validation.fieldAcceptanceCriteria': 'Acceptance Criteria',
    'validation.cannotChangeStatus':
      'Cannot change status to {{status}}. Missing fields: {{fields}}',
    'status.new': 'NEW',
    'status.refined': 'REFINED',
    'status.ready': 'READY',
    'status.inprogress': 'IN_PROGRESS',
    'status.done': 'DONE',
  };

  let result = translations[key] ?? key;
  if (options) {
    Object.entries(options).forEach(([k, v]) => {
      result = result.replace(`{{${k}}}`, String(v));
    });
  }
  return result;
};

describe('validation', () => {
  describe('validateFormData', () => {
    const validFormData: ItemFormData = {
      title: 'Test Feature',
      description: 'Test description',
      estimate: 8,
      moscowPriority: MoSCoWPriority.MUST_HAVE,
      businessValue: 13,
      labels: 'frontend, backend',
      acceptanceCriteria: 'Test criteria',
      status: ItemStatus.NEW,
    };

    const validContext = {
      teamId: 'team-1',
      activeGoalId: 'goal-1',
    };

    describe('Context Validation', () => {
      it('should fail when teamId is missing', () => {
        const result = validateFormData(
          validFormData,
          {
            teamId: undefined,
            activeGoalId: 'goal-1',
          },
          mockT
        );

        expect(result.isValid).toBe(false);
        expect(result.workflowError).toContain('Team ID is required');
      });

      it('should fail when activeGoalId is missing', () => {
        const result = validateFormData(
          validFormData,
          {
            teamId: 'team-1',
            activeGoalId: undefined,
          },
          mockT
        );

        expect(result.isValid).toBe(false);
        expect(result.workflowError).toContain('active goal is required');
      });
    });

    describe('Title Validation', () => {
      it('should fail for empty title', () => {
        const result = validateFormData({ ...validFormData, title: '' }, validContext, mockT);

        expect(result.errors.title).toContain('Title is required');
      });

      it('should fail for whitespace-only title', () => {
        const result = validateFormData({ ...validFormData, title: '   ' }, validContext, mockT);

        expect(result.errors.title).toContain('Title is required');
      });

      it('should fail for title shorter than 5 characters', () => {
        const result = validateFormData({ ...validFormData, title: 'Test' }, validContext, mockT);

        expect(result.errors.title).toContain('Title is too short');
      });

      it('should fail for title longer than 200 characters', () => {
        const result = validateFormData(
          { ...validFormData, title: 'a'.repeat(201) },
          validContext,
          mockT
        );

        expect(result.errors.title).toContain('exceeds maximum length');
      });

      it('should pass for valid title', () => {
        const result = validateFormData(validFormData, validContext, mockT);

        expect(result.errors.title).toBeUndefined();
      });
    });

    describe('Description Validation', () => {
      it('should require description in edit mode', () => {
        const result = validateFormData(
          { ...validFormData, description: '' },
          validContext,
          mockT,
          true
        );

        expect(result.errors.description).toContain('Description is required');
      });

      it('should not require description in create mode', () => {
        const result = validateFormData(
          { ...validFormData, description: '' },
          validContext,
          mockT,
          false
        );

        expect(result.errors.description).toBeUndefined();
      });
    });

    describe('MoSCoW Priority Validation', () => {
      it('should fail for missing priority', () => {
        const result = validateFormData(
          { ...validFormData, moscowPriority: undefined as unknown as MoSCoWPriority },
          validContext,
          mockT
        );

        expect(result.errors.moscowPriority).toContain('MoSCoW Priority is required');
      });
    });

    describe('Estimate Validation', () => {
      it('should require estimate in edit mode', () => {
        const result = validateFormData(
          { ...validFormData, estimate: undefined },
          validContext,
          mockT,
          true
        );

        expect(result.errors.estimate).toContain('Estimate is required');
      });

      it('should fail for estimate less than 1 in edit mode', () => {
        const result = validateFormData(
          { ...validFormData, estimate: 0 },
          validContext,
          mockT,
          true
        );

        expect(result.errors.estimate).toContain('at least 1 story point');
      });

      it('should fail for estimate greater than 100', () => {
        const result = validateFormData(
          { ...validFormData, estimate: 101 },
          validContext,
          mockT,
          true
        );

        expect(result.errors.estimate).toContain('exceeds maximum of 100');
      });

      it('should NOT require estimate for non-Developers in edit mode', () => {
        // PO/SM cannot size; the estimate field is disabled and must be optional so
        // they can still submit the edit form.
        const result = validateFormData(
          { ...validFormData, estimate: undefined },
          validContext,
          mockT,
          true,
          false
        );

        expect(result.errors.estimate).toBeUndefined();
        expect(result.isValid).toBe(true);
      });
    });

    describe('Business Value Validation', () => {
      it('should require business value in edit mode', () => {
        const result = validateFormData(
          { ...validFormData, businessValue: undefined },
          validContext,
          mockT,
          true
        );

        expect(result.errors.businessValue).toContain('Business Value is required');
      });

      it('should fail for business value less than 1 in edit mode', () => {
        const result = validateFormData(
          { ...validFormData, businessValue: 0 },
          validContext,
          mockT,
          true
        );

        expect(result.errors.businessValue).toContain('at least 1 point');
      });

      it('should fail for business value greater than 100', () => {
        const result = validateFormData(
          { ...validFormData, businessValue: 101 },
          validContext,
          mockT,
          true
        );

        expect(result.errors.businessValue).toContain('exceeds maximum of 100');
      });
    });

    describe('Labels Validation', () => {
      it('should require labels in edit mode', () => {
        const result = validateFormData(
          { ...validFormData, labels: '' },
          validContext,
          mockT,
          true
        );

        expect(result.errors.labels).toContain('At least one label is required');
      });
    });

    describe('Acceptance Criteria Validation', () => {
      it('should require acceptance criteria in edit mode', () => {
        const result = validateFormData(
          { ...validFormData, acceptanceCriteria: '' },
          validContext,
          mockT,
          true
        );

        expect(result.errors.acceptanceCriteria).toContain('Acceptance Criteria is required');
      });
    });

    describe('Valid Form', () => {
      it('should pass for valid form data', () => {
        const result = validateFormData(validFormData, validContext, mockT);

        expect(result.isValid).toBe(true);
        expect(Object.keys(result.errors)).toHaveLength(0);
      });
    });
  });

  describe('validateStatusTransition', () => {
    describe('Valid Transitions', () => {
      it('should allow NEW to REFINED', () => {
        const result = validateStatusTransition(ItemStatus.NEW, ItemStatus.REFINED, mockT);
        expect(result.valid).toBe(true);
      });

      it('should allow REFINED to READY', () => {
        const result = validateStatusTransition(ItemStatus.REFINED, ItemStatus.READY, mockT);
        expect(result.valid).toBe(true);
      });

      it('should allow REFINED to NEW', () => {
        const result = validateStatusTransition(ItemStatus.REFINED, ItemStatus.NEW, mockT);
        expect(result.valid).toBe(true);
      });

      it('should allow READY to IN_PROGRESS', () => {
        const result = validateStatusTransition(ItemStatus.READY, ItemStatus.IN_PROGRESS, mockT);
        expect(result.valid).toBe(true);
      });

      it('should allow IN_PROGRESS to DONE', () => {
        const result = validateStatusTransition(ItemStatus.IN_PROGRESS, ItemStatus.DONE, mockT);
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid Transitions', () => {
      it('should not allow NEW to DONE', () => {
        const result = validateStatusTransition(ItemStatus.NEW, ItemStatus.DONE, mockT);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('not allowed');
      });

      it('should not allow DONE to any status', () => {
        const result = validateStatusTransition(ItemStatus.DONE, ItemStatus.NEW, mockT);
        expect(result.valid).toBe(false);
      });

      it('should not allow same status transition', () => {
        const result = validateStatusTransition(ItemStatus.NEW, ItemStatus.NEW, mockT);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('already in this status');
      });
    });
  });

  describe('validateItemForStatusChange', () => {
    const createMockItem = (overrides: Partial<ProductBacklogItem> = {}): ProductBacklogItem => ({
      id: 'item-1',
      title: 'Test Item',
      description: 'Test description',
      status: ItemStatus.NEW,
      priority: MoSCoWPriority.MUST_HAVE,
      storyPoints: 8,
      businessValue: 13,
      labels: ['frontend'],
      acceptanceCriteria: 'Test criteria',
      teamId: 'team-1',
      goalId: 'goal-1',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      ...overrides,
    });

    describe('NEW Status', () => {
      it('should pass for any item transitioning to NEW', () => {
        const item = createMockItem({ title: '' });
        const result = validateItemForStatusChange(item, ItemStatus.NEW, mockT);

        expect(result.valid).toBe(true);
        expect(result.missingFields).toHaveLength(0);
      });
    });

    describe('Other Statuses', () => {
      it('should require title with minimum 5 characters', () => {
        const item = createMockItem({ title: 'Test' });
        const result = validateItemForStatusChange(item, ItemStatus.REFINED, mockT);

        expect(result.valid).toBe(false);
        expect(result.missingFields).toContain('Title (minimum 5 characters)');
      });

      it('should require description', () => {
        const item = createMockItem({ description: '' });
        const result = validateItemForStatusChange(item, ItemStatus.READY, mockT);

        expect(result.valid).toBe(false);
        expect(result.missingFields).toContain('Description');
      });

      it('should require priority', () => {
        const item = createMockItem({ priority: undefined as unknown as MoSCoWPriority });
        const result = validateItemForStatusChange(item, ItemStatus.REFINED, mockT);

        expect(result.valid).toBe(false);
        expect(result.missingFields).toContain('MoSCoW Priority');
      });

      it('should require business value', () => {
        const item = createMockItem({ businessValue: undefined });
        const result = validateItemForStatusChange(item, ItemStatus.REFINED, mockT);

        expect(result.valid).toBe(false);
        expect(result.missingFields).toContain('Business Value');
      });

      it('should require story points', () => {
        const item = createMockItem({ storyPoints: undefined });
        const result = validateItemForStatusChange(item, ItemStatus.REFINED, mockT);

        expect(result.valid).toBe(false);
        expect(result.missingFields).toContain('Estimate (Story Points)');
      });

      it('should require labels', () => {
        const item = createMockItem({ labels: [] });
        const result = validateItemForStatusChange(item, ItemStatus.REFINED, mockT);

        expect(result.valid).toBe(false);
        expect(result.missingFields).toContain('Labels (at least one)');
      });

      it('should require acceptance criteria', () => {
        const item = createMockItem({ acceptanceCriteria: '' });
        const result = validateItemForStatusChange(item, ItemStatus.REFINED, mockT);

        expect(result.valid).toBe(false);
        expect(result.missingFields).toContain('Acceptance Criteria');
      });

      it('should pass for complete item', () => {
        const item = createMockItem();
        const result = validateItemForStatusChange(item, ItemStatus.REFINED, mockT);

        expect(result.valid).toBe(true);
        expect(result.missingFields).toHaveLength(0);
      });
    });
  });
});
