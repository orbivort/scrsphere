import { ItemStatus } from '../types';
import {
  WORKFLOW_TRANSITIONS,
  WORKFLOW_DESCRIPTION_KEYS,
  canTransition,
  getValidTransitions,
  getTransitionDescription,
  requiresValidation,
  validateTransition,
  getTransitionErrorKey,
  getTransitionErrorData,
} from './workflowTransitions';

describe('workflowTransitions', () => {
  describe('WORKFLOW_TRANSITIONS', () => {
    it('should define transitions for all item statuses', () => {
      const statuses = Object.values(ItemStatus);
      statuses.forEach((status) => {
        expect(WORKFLOW_TRANSITIONS[status]).toBeDefined();
        expect(WORKFLOW_TRANSITIONS[status]).toHaveProperty('allowed');
        expect(WORKFLOW_TRANSITIONS[status]).toHaveProperty('description');
        expect(Array.isArray(WORKFLOW_TRANSITIONS[status].allowed)).toBe(true);
      });
    });

    it('should have description keys for all statuses', () => {
      const statuses = Object.values(ItemStatus);
      statuses.forEach((status) => {
        const description = WORKFLOW_TRANSITIONS[status].description;
        expect(description).toContain('workflowTransitions.');
      });
    });
  });

  describe('canTransition', () => {
    it('should return true for valid transitions', () => {
      expect(canTransition(ItemStatus.NEW, ItemStatus.REFINED)).toBe(true);
      expect(canTransition(ItemStatus.REFINED, ItemStatus.READY)).toBe(true);
      expect(canTransition(ItemStatus.READY, ItemStatus.IN_PROGRESS)).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(canTransition(ItemStatus.NEW, ItemStatus.DONE)).toBe(false);
      expect(canTransition(ItemStatus.DONE, ItemStatus.NEW)).toBe(false);
      expect(canTransition(ItemStatus.NEW, ItemStatus.IN_PROGRESS)).toBe(false);
    });

    it('should return false for same status', () => {
      expect(canTransition(ItemStatus.NEW, ItemStatus.NEW)).toBe(false);
      expect(canTransition(ItemStatus.DONE, ItemStatus.DONE)).toBe(false);
    });
  });

  describe('getValidTransitions', () => {
    it('should return correct valid transitions for NEW status', () => {
      const transitions = getValidTransitions(ItemStatus.NEW);
      expect(transitions).toEqual([ItemStatus.REFINED]);
    });

    it('should return correct valid transitions for REFINED status', () => {
      const transitions = getValidTransitions(ItemStatus.REFINED);
      expect(transitions).toEqual([ItemStatus.READY, ItemStatus.NEW]);
    });

    it('should return empty array for DONE status', () => {
      const transitions = getValidTransitions(ItemStatus.DONE);
      expect(transitions).toEqual([]);
    });
  });

  describe('getTransitionDescription', () => {
    it('should return i18n key for valid transitions', () => {
      const description = getTransitionDescription(ItemStatus.NEW, ItemStatus.REFINED);
      expect(description).toBe('workflowTransitions.newDescription');
    });

    it('should return i18n key based on source status', () => {
      const description = getTransitionDescription(ItemStatus.REFINED, ItemStatus.READY);
      expect(description).toBe('workflowTransitions.refinedDescription');
    });
  });

  describe('requiresValidation', () => {
    it('should return true for transitions that require validation', () => {
      expect(requiresValidation(ItemStatus.READY, ItemStatus.IN_PROGRESS)).toBe(true);
      expect(requiresValidation(ItemStatus.IN_PROGRESS, ItemStatus.DONE)).toBe(true);
    });

    it('should return false for transitions that do not require validation', () => {
      expect(requiresValidation(ItemStatus.NEW, ItemStatus.REFINED)).toBe(false);
      expect(requiresValidation(ItemStatus.REFINED, ItemStatus.READY)).toBe(false);
    });

    it('should return false for invalid transitions', () => {
      expect(requiresValidation(ItemStatus.NEW, ItemStatus.DONE)).toBe(false);
    });
  });

  describe('validateTransition', () => {
    it('should validate correct transitions', () => {
      const result = validateTransition(ItemStatus.NEW, ItemStatus.REFINED);
      expect(result.valid).toBe(true);
      expect(result.requiresValidation).toBe(false);
      expect(result.messageKey).toBeUndefined();
    });

    it('should reject same status transitions', () => {
      const result = validateTransition(ItemStatus.NEW, ItemStatus.NEW);
      expect(result.valid).toBe(false);
      expect(result.messageKey).toBe('validation.statusAlreadySet');
    });

    it('should reject invalid transitions', () => {
      const result = validateTransition(ItemStatus.NEW, ItemStatus.DONE);
      expect(result.valid).toBe(false);
      expect(result.messageKey).toBe('validation.invalidTransition');
    });

    it('should indicate validation requirement', () => {
      const result = validateTransition(ItemStatus.READY, ItemStatus.IN_PROGRESS);
      expect(result.valid).toBe(true);
      expect(result.requiresValidation).toBe(true);
    });
  });

  describe('WORKFLOW_DESCRIPTION_KEYS', () => {
    it('should have description keys for all statuses', () => {
      const statuses = Object.values(ItemStatus);
      statuses.forEach((status) => {
        expect(WORKFLOW_DESCRIPTION_KEYS[status]).toBeDefined();
        expect(WORKFLOW_DESCRIPTION_KEYS[status]).toContain('workflowTransitions.');
      });
    });
  });

  describe('getTransitionErrorKey', () => {
    it('should return the error key for invalid transitions', () => {
      const errorKey = getTransitionErrorKey();
      expect(errorKey).toBe('validation.invalidTransition');
    });
  });

  describe('getTransitionErrorData', () => {
    it('should return error data with allowed transitions', () => {
      const statusLabels: Record<ItemStatus, string> = {
        [ItemStatus.NEW]: 'New',
        [ItemStatus.REFINED]: 'Refined',
        [ItemStatus.READY]: 'Ready',
        [ItemStatus.IN_PROGRESS]: 'In Progress',
        [ItemStatus.DONE]: 'Done',
      };

      const result = getTransitionErrorData(ItemStatus.NEW, ItemStatus.DONE, statusLabels);

      expect(result.current).toBe('New');
      expect(result.target).toBe('Done');
      expect(result.allowed).toBe('Refined');
    });

    it('should return "None" when no allowed transitions', () => {
      const statusLabels: Record<ItemStatus, string> = {
        [ItemStatus.NEW]: 'New',
        [ItemStatus.REFINED]: 'Refined',
        [ItemStatus.READY]: 'Ready',
        [ItemStatus.IN_PROGRESS]: 'In Progress',
        [ItemStatus.DONE]: 'Done',
      };

      const result = getTransitionErrorData(ItemStatus.DONE, ItemStatus.NEW, statusLabels);

      expect(result.current).toBe('Done');
      expect(result.target).toBe('New');
      expect(result.allowed).toBe('None');
    });

    it('should return multiple allowed transitions', () => {
      const statusLabels: Record<ItemStatus, string> = {
        [ItemStatus.NEW]: 'New',
        [ItemStatus.REFINED]: 'Refined',
        [ItemStatus.READY]: 'Ready',
        [ItemStatus.IN_PROGRESS]: 'In Progress',
        [ItemStatus.DONE]: 'Done',
      };

      const result = getTransitionErrorData(ItemStatus.REFINED, ItemStatus.DONE, statusLabels);

      expect(result.current).toBe('Refined');
      expect(result.target).toBe('Done');
      expect(result.allowed).toBe('Ready, New');
    });
  });
});
