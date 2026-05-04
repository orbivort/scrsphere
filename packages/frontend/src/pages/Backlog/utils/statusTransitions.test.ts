import { describe, it, expect } from 'vitest';

import {
  VALID_TRANSITIONS,
  getAutoValidationChecks,
  isTransitionAllowed,
  getAllowedTransitions,
  getStatusLabel,
} from './statusTransitions';
import { ItemStatus, MoSCoWPriority } from '../../../types';
import type { ProductBacklogItem } from '../../../types';

const createMockBacklogItem = (
  overrides: Partial<ProductBacklogItem> = {}
): ProductBacklogItem => ({
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
  ...overrides,
});

describe('statusTransitions', () => {
  describe('VALID_TRANSITIONS', () => {
    it('should define transitions for NEW status', () => {
      expect(VALID_TRANSITIONS[ItemStatus.NEW]).toEqual([ItemStatus.REFINED]);
    });

    it('should define transitions for REFINED status', () => {
      expect(VALID_TRANSITIONS[ItemStatus.REFINED]).toEqual([ItemStatus.READY, ItemStatus.NEW]);
    });

    it('should define transitions for READY status', () => {
      expect(VALID_TRANSITIONS[ItemStatus.READY]).toEqual([
        ItemStatus.IN_PROGRESS,
        ItemStatus.REFINED,
      ]);
    });

    it('should define transitions for IN_PROGRESS status', () => {
      expect(VALID_TRANSITIONS[ItemStatus.IN_PROGRESS]).toEqual([
        ItemStatus.DONE,
        ItemStatus.READY,
      ]);
    });

    it('should have no transitions from DONE status', () => {
      expect(VALID_TRANSITIONS[ItemStatus.DONE]).toEqual([]);
    });

    it('should have all ItemStatus values as keys', () => {
      const statuses = Object.values(ItemStatus);
      const transitionKeys = Object.keys(VALID_TRANSITIONS);

      statuses.forEach((status) => {
        expect(transitionKeys).toContain(status);
      });
    });
  });

  describe('getAutoValidationChecks', () => {
    describe('Ready Validation (DoR)', () => {
      it('should return correct checks for complete item', () => {
        const item = createMockBacklogItem({
          title: 'Feature Title',
          description: 'Feature description',
          acceptanceCriteria: 'Given-When-Then',
          storyPoints: 8,
          businessValue: 13,
        });

        const checks = getAutoValidationChecks(item, 'ready');

        expect(checks.dor_1).toBe(true);
        expect(checks.dor_2).toBe(true);
        expect(checks.dor_3).toBe(true);
        expect(checks.dor_4).toBe(true);
        expect(checks.dor_5).toBe(false);
        expect(checks.dor_6).toBe(false);
      });

      it('should return false for dor_1 when title is missing', () => {
        const item = createMockBacklogItem({
          title: '',
          description: 'Feature description',
        });

        const checks = getAutoValidationChecks(item, 'ready');

        expect(checks.dor_1).toBe(false);
      });

      it('should return false for dor_1 when description is missing', () => {
        const item = createMockBacklogItem({
          title: 'Feature Title',
          description: '',
        });

        const checks = getAutoValidationChecks(item, 'ready');

        expect(checks.dor_1).toBe(false);
      });

      it('should return false for dor_2 when acceptanceCriteria is missing', () => {
        const item = createMockBacklogItem({
          acceptanceCriteria: '',
        });

        const checks = getAutoValidationChecks(item, 'ready');

        expect(checks.dor_2).toBe(false);
      });

      it('should return false for dor_3 when storyPoints is missing', () => {
        const item = createMockBacklogItem({
          storyPoints: undefined,
        });

        const checks = getAutoValidationChecks(item, 'ready');

        expect(checks.dor_3).toBe(false);
      });

      it('should return false for dor_3 when storyPoints is 0', () => {
        const item = createMockBacklogItem({
          storyPoints: 0,
        });

        const checks = getAutoValidationChecks(item, 'ready');

        expect(checks.dor_3).toBe(false);
      });

      it('should return false for dor_4 when businessValue is missing', () => {
        const item = createMockBacklogItem({
          businessValue: undefined,
        });

        const checks = getAutoValidationChecks(item, 'ready');

        expect(checks.dor_4).toBe(false);
      });

      it('should always return false for dor_5 and dor_6 (manual checks)', () => {
        const item = createMockBacklogItem({
          title: 'Title',
          description: 'Description',
          acceptanceCriteria: 'Criteria',
          storyPoints: 5,
          businessValue: 8,
        });

        const checks = getAutoValidationChecks(item, 'ready');

        expect(checks.dor_5).toBe(false);
        expect(checks.dor_6).toBe(false);
      });
    });

    describe('Done Validation (DoD)', () => {
      it('should return correct checks for item with acceptance criteria', () => {
        const item = createMockBacklogItem({
          acceptanceCriteria: 'Given-When-Then',
        });

        const checks = getAutoValidationChecks(item, 'done');

        expect(checks.dod_1).toBe(true);
        expect(checks.dod_2).toBe(false);
        expect(checks.dod_3).toBe(false);
        expect(checks.dod_4).toBe(false);
        expect(checks.dod_5).toBe(false);
        expect(checks.dod_6).toBe(false);
      });

      it('should return false for dod_1 when acceptanceCriteria is missing', () => {
        const item = createMockBacklogItem({
          acceptanceCriteria: '',
        });

        const checks = getAutoValidationChecks(item, 'done');

        expect(checks.dod_1).toBe(false);
      });

      it('should always return false for dod_2 through dod_6 (manual checks)', () => {
        const item = createMockBacklogItem({
          acceptanceCriteria: 'Criteria',
        });

        const checks = getAutoValidationChecks(item, 'done');

        expect(checks.dod_2).toBe(false);
        expect(checks.dod_3).toBe(false);
        expect(checks.dod_4).toBe(false);
        expect(checks.dod_5).toBe(false);
        expect(checks.dod_6).toBe(false);
      });
    });
  });

  describe('isTransitionAllowed', () => {
    describe('Valid Transitions', () => {
      it('should allow NEW to REFINED', () => {
        expect(isTransitionAllowed(ItemStatus.NEW, ItemStatus.REFINED)).toBe(true);
      });

      it('should allow REFINED to READY', () => {
        expect(isTransitionAllowed(ItemStatus.REFINED, ItemStatus.READY)).toBe(true);
      });

      it('should allow REFINED to NEW', () => {
        expect(isTransitionAllowed(ItemStatus.REFINED, ItemStatus.NEW)).toBe(true);
      });

      it('should allow READY to IN_PROGRESS', () => {
        expect(isTransitionAllowed(ItemStatus.READY, ItemStatus.IN_PROGRESS)).toBe(true);
      });

      it('should allow READY to REFINED', () => {
        expect(isTransitionAllowed(ItemStatus.READY, ItemStatus.REFINED)).toBe(true);
      });

      it('should allow IN_PROGRESS to DONE', () => {
        expect(isTransitionAllowed(ItemStatus.IN_PROGRESS, ItemStatus.DONE)).toBe(true);
      });

      it('should allow IN_PROGRESS to READY', () => {
        expect(isTransitionAllowed(ItemStatus.IN_PROGRESS, ItemStatus.READY)).toBe(true);
      });
    });

    describe('Invalid Transitions', () => {
      it('should not allow NEW to READY', () => {
        expect(isTransitionAllowed(ItemStatus.NEW, ItemStatus.READY)).toBe(false);
      });

      it('should not allow NEW to IN_PROGRESS', () => {
        expect(isTransitionAllowed(ItemStatus.NEW, ItemStatus.IN_PROGRESS)).toBe(false);
      });

      it('should not allow NEW to DONE', () => {
        expect(isTransitionAllowed(ItemStatus.NEW, ItemStatus.DONE)).toBe(false);
      });

      it('should not allow REFINED to IN_PROGRESS', () => {
        expect(isTransitionAllowed(ItemStatus.REFINED, ItemStatus.IN_PROGRESS)).toBe(false);
      });

      it('should not allow REFINED to DONE', () => {
        expect(isTransitionAllowed(ItemStatus.REFINED, ItemStatus.DONE)).toBe(false);
      });

      it('should not allow READY to NEW', () => {
        expect(isTransitionAllowed(ItemStatus.READY, ItemStatus.NEW)).toBe(false);
      });

      it('should not allow READY to DONE', () => {
        expect(isTransitionAllowed(ItemStatus.READY, ItemStatus.DONE)).toBe(false);
      });

      it('should not allow IN_PROGRESS to NEW', () => {
        expect(isTransitionAllowed(ItemStatus.IN_PROGRESS, ItemStatus.NEW)).toBe(false);
      });

      it('should not allow IN_PROGRESS to REFINED', () => {
        expect(isTransitionAllowed(ItemStatus.IN_PROGRESS, ItemStatus.REFINED)).toBe(false);
      });

      it('should not allow DONE to any status', () => {
        expect(isTransitionAllowed(ItemStatus.DONE, ItemStatus.NEW)).toBe(false);
        expect(isTransitionAllowed(ItemStatus.DONE, ItemStatus.REFINED)).toBe(false);
        expect(isTransitionAllowed(ItemStatus.DONE, ItemStatus.READY)).toBe(false);
        expect(isTransitionAllowed(ItemStatus.DONE, ItemStatus.IN_PROGRESS)).toBe(false);
      });
    });

    describe('Same Status', () => {
      it('should not allow transition to same status', () => {
        Object.values(ItemStatus).forEach((status) => {
          expect(isTransitionAllowed(status, status)).toBe(false);
        });
      });
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return allowed transitions for NEW', () => {
      expect(getAllowedTransitions(ItemStatus.NEW)).toEqual([ItemStatus.REFINED]);
    });

    it('should return allowed transitions for REFINED', () => {
      expect(getAllowedTransitions(ItemStatus.REFINED)).toEqual([ItemStatus.READY, ItemStatus.NEW]);
    });

    it('should return allowed transitions for READY', () => {
      expect(getAllowedTransitions(ItemStatus.READY)).toEqual([
        ItemStatus.IN_PROGRESS,
        ItemStatus.REFINED,
      ]);
    });

    it('should return allowed transitions for IN_PROGRESS', () => {
      expect(getAllowedTransitions(ItemStatus.IN_PROGRESS)).toEqual([
        ItemStatus.DONE,
        ItemStatus.READY,
      ]);
    });

    it('should return empty array for DONE', () => {
      expect(getAllowedTransitions(ItemStatus.DONE)).toEqual([]);
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct label for NEW', () => {
      expect(getStatusLabel(ItemStatus.NEW)).toBe('NEW');
    });

    it('should return correct label for REFINED', () => {
      expect(getStatusLabel(ItemStatus.REFINED)).toBe('REFINED');
    });

    it('should return correct label for READY', () => {
      expect(getStatusLabel(ItemStatus.READY)).toBe('READY');
    });

    it('should return correct label for IN_PROGRESS', () => {
      expect(getStatusLabel(ItemStatus.IN_PROGRESS)).toBe('IN PROGRESS');
    });

    it('should return correct label for DONE', () => {
      expect(getStatusLabel(ItemStatus.DONE)).toBe('DONE');
    });
  });

  describe('Workflow Consistency', () => {
    it('should have forward progression path', () => {
      expect(isTransitionAllowed(ItemStatus.NEW, ItemStatus.REFINED)).toBe(true);
      expect(isTransitionAllowed(ItemStatus.REFINED, ItemStatus.READY)).toBe(true);
      expect(isTransitionAllowed(ItemStatus.READY, ItemStatus.IN_PROGRESS)).toBe(true);
      expect(isTransitionAllowed(ItemStatus.IN_PROGRESS, ItemStatus.DONE)).toBe(true);
    });

    it('should have backward regression path', () => {
      expect(isTransitionAllowed(ItemStatus.REFINED, ItemStatus.NEW)).toBe(true);
      expect(isTransitionAllowed(ItemStatus.READY, ItemStatus.REFINED)).toBe(true);
      expect(isTransitionAllowed(ItemStatus.IN_PROGRESS, ItemStatus.READY)).toBe(true);
    });

    it('should not allow skipping statuses forward', () => {
      expect(isTransitionAllowed(ItemStatus.NEW, ItemStatus.READY)).toBe(false);
      expect(isTransitionAllowed(ItemStatus.NEW, ItemStatus.IN_PROGRESS)).toBe(false);
      expect(isTransitionAllowed(ItemStatus.NEW, ItemStatus.DONE)).toBe(false);
      expect(isTransitionAllowed(ItemStatus.REFINED, ItemStatus.IN_PROGRESS)).toBe(false);
      expect(isTransitionAllowed(ItemStatus.REFINED, ItemStatus.DONE)).toBe(false);
      expect(isTransitionAllowed(ItemStatus.READY, ItemStatus.DONE)).toBe(false);
    });

    it('should not allow skipping statuses backward', () => {
      expect(isTransitionAllowed(ItemStatus.READY, ItemStatus.NEW)).toBe(false);
      expect(isTransitionAllowed(ItemStatus.IN_PROGRESS, ItemStatus.NEW)).toBe(false);
      expect(isTransitionAllowed(ItemStatus.IN_PROGRESS, ItemStatus.REFINED)).toBe(false);
    });
  });
});
