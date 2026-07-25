import { SprintDuration } from '../../types';
import {
  mapDurationToFrontend,
  mapDurationToBackend,
  normalizeSprintStatus,
} from './mapping.utils';

describe('mapping.utils', () => {
  describe('normalizeSprintStatus', () => {
    it('should normalize undefined status to planned', () => {
      expect(normalizeSprintStatus(undefined)).toBe('planned');
    });

    it('should normalize status to lowercase', () => {
      expect(normalizeSprintStatus('ACTIVE')).toBe('active');
      expect(normalizeSprintStatus('COMPLETED')).toBe('completed');
    });
  });

  describe('mapDurationToBackend', () => {
    it('should map ONE_WEEK to backend format', () => {
      expect(mapDurationToBackend(SprintDuration.ONE_WEEK)).toBe('ONE_WEEK');
    });

    it('should map TWO_WEEKS to backend format', () => {
      expect(mapDurationToBackend(SprintDuration.TWO_WEEKS)).toBe('TWO_WEEKS');
    });

    it('should map THREE_WEEKS to backend format', () => {
      expect(mapDurationToBackend(SprintDuration.THREE_WEEKS)).toBe('THREE_WEEKS');
    });

    it('should map FOUR_WEEKS to backend format', () => {
      expect(mapDurationToBackend(SprintDuration.FOUR_WEEKS)).toBe('FOUR_WEEKS');
    });
  });

  describe('mapDurationToFrontend', () => {
    it('should map ONE_WEEK to frontend format', () => {
      expect(mapDurationToFrontend('ONE_WEEK')).toBe(SprintDuration.ONE_WEEK);
    });

    it('should map TWO_WEEKS to frontend format', () => {
      expect(mapDurationToFrontend('TWO_WEEKS')).toBe(SprintDuration.TWO_WEEKS);
    });

    it('should map THREE_WEEKS to frontend format', () => {
      expect(mapDurationToFrontend('THREE_WEEKS')).toBe(SprintDuration.THREE_WEEKS);
    });

    it('should map FOUR_WEEKS to frontend format', () => {
      expect(mapDurationToFrontend('FOUR_WEEKS')).toBe(SprintDuration.FOUR_WEEKS);
    });

    it('should return TWO_WEEKS as default for unknown duration', () => {
      expect(mapDurationToFrontend('UNKNOWN')).toBe(SprintDuration.TWO_WEEKS);
    });

    it('should return TWO_WEEKS as default for invalid duration', () => {
      expect(mapDurationToFrontend('INVALID_DURATION')).toBe(SprintDuration.TWO_WEEKS);
    });
  });
});
