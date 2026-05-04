import { ItemStatus } from '../types';
import {
  WORKFLOW_TRANSITIONS,
  canTransition,
  getValidTransitions,
  getTransitionDescription,
  requiresValidation,
  validateTransition,
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
    it('should return description for valid transitions', () => {
      const description = getTransitionDescription(ItemStatus.NEW, ItemStatus.REFINED);
      expect(description).toBe('New items must be refined first');
    });

    it('should return error message for invalid transitions', () => {
      const description = getTransitionDescription(ItemStatus.NEW, ItemStatus.DONE);
      expect(description).toContain('not allowed');
      expect(description).toContain('REFINED');
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
    });

    it('should reject same status transitions', () => {
      const result = validateTransition(ItemStatus.NEW, ItemStatus.NEW);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Item is already in this status');
    });

    it('should reject invalid transitions', () => {
      const result = validateTransition(ItemStatus.NEW, ItemStatus.DONE);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('not allowed');
    });

    it('should indicate validation requirement', () => {
      const result = validateTransition(ItemStatus.READY, ItemStatus.IN_PROGRESS);
      expect(result.valid).toBe(true);
      expect(result.requiresValidation).toBe(true);
    });
  });
});
