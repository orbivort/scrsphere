// Mapping Utilities Tests
import { describe, it, expect } from 'vitest';

import {
  normalizeSprintStatus,
  mapDurationToBackend,
  mapDurationToFrontend,
  mapSprintResponse,
  mapSprintsResponse,
  mapSprintConfigToBackend,
  mapSprintConfigFromBackend,
  mapSprintGenerationResponse,
} from './utils/mapping.utils';
import type { GeneratedSprint, SprintConfiguration } from '../types';

describe('Mapping Utilities', () => {
  describe('normalizeSprintStatus', () => {
    it('should convert uppercase status to lowercase', () => {
      expect(normalizeSprintStatus('PLANNED')).toBe('planned');
      expect(normalizeSprintStatus('ACTIVE')).toBe('active');
    });

    it('should return default status for undefined', () => {
      expect(normalizeSprintStatus(undefined)).toBe('planned');
    });

    it('should preserve lowercase status', () => {
      expect(normalizeSprintStatus('completed')).toBe('completed');
    });
  });

  describe('mapDurationToBackend', () => {
    it('should map 2weeks to TWO_WEEKS', () => {
      expect(mapDurationToBackend('2weeks')).toBe('TWO_WEEKS');
    });

    it('should map 4weeks to FOUR_WEEKS', () => {
      expect(mapDurationToBackend('4weeks')).toBe('FOUR_WEEKS');
    });
  });

  describe('mapDurationToFrontend', () => {
    it('should map TWO_WEEKS to 2weeks', () => {
      expect(mapDurationToFrontend('TWO_WEEKS')).toBe('2weeks');
    });

    it('should map FOUR_WEEKS to 4weeks', () => {
      expect(mapDurationToFrontend('FOUR_WEEKS')).toBe('4weeks');
    });
  });

  describe('mapSprintResponse', () => {
    it('should normalize sprint status in response', () => {
      const response = {
        success: true,
        data: {
          id: '1',
          name: 'Sprint 1',
          status: 'ACTIVE',
          startDate: '2024-01-01',
          endDate: '2024-01-14',
          teamId: 'team1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        } as GeneratedSprint,
      };

      const result = mapSprintResponse(response);
      expect(result.data.status).toBe('active');
    });

    it('should handle empty response', () => {
      const response = { success: true, data: null };
      const result = mapSprintResponse(response as any);
      expect(result.data).toBeNull();
    });
  });

  describe('mapSprintsResponse', () => {
    it('should normalize status for all sprints in array', () => {
      const response = {
        success: true,
        data: [
          { id: '1', status: 'ACTIVE' } as GeneratedSprint,
          { id: '2', status: 'PLANNED' } as GeneratedSprint,
        ],
      };

      const result = mapSprintsResponse(response);
      expect(result.data[0].status).toBe('active');
      expect(result.data[1].status).toBe('planned');
    });
  });

  describe('mapSprintConfigToBackend', () => {
    it('should map duration to backend format', () => {
      const config = { duration: '2weeks' as const, teamId: 'team1' };
      const result = mapSprintConfigToBackend(config as Partial<SprintConfiguration>);
      expect(result.duration).toBe('TWO_WEEKS');
    });

    it('should preserve other config properties', () => {
      const config = { teamId: 'team1', sprintGoal: 'Goal' };
      const result = mapSprintConfigToBackend(config as Partial<SprintConfiguration>);
      expect(result.teamId).toBe('team1');
      expect(result.sprintGoal).toBe('Goal');
    });
  });

  describe('mapSprintConfigFromBackend', () => {
    it('should map duration from backend format', () => {
      const response = {
        success: true,
        data: {
          id: '1',
          teamId: 'team1',
          duration: 'TWO_WEEKS',
        },
      };

      const result = mapSprintConfigFromBackend(response as any);
      expect(result.data.duration).toBe('2weeks');
    });

    it('should handle response without data', () => {
      const response = { success: true, data: null };
      const result = mapSprintConfigFromBackend(response as any);
      expect(result.data).toBeNull();
    });

    it('should default to TWO_WEEKS when duration is missing', () => {
      const response = {
        success: true,
        data: {
          id: '1',
          teamId: 'team1',
        },
      };

      const result = mapSprintConfigFromBackend(response as any);
      expect(result.data.duration).toBe('2weeks');
    });

    it('should map FOUR_WEEKS duration correctly', () => {
      const response = {
        success: true,
        data: {
          id: '1',
          teamId: 'team1',
          duration: 'FOUR_WEEKS',
        },
      };

      const result = mapSprintConfigFromBackend(response as any);
      expect(result.data.duration).toBe('4weeks');
    });
  });

  describe('mapSprintGenerationResponse', () => {
    it('should normalize status for all generated sprints', () => {
      const response = {
        success: true,
        data: {
          sprints: [
            { id: '1', status: 'ACTIVE' } as GeneratedSprint,
            { id: '2', status: 'PLANNED' } as GeneratedSprint,
          ],
        },
      };

      const result = mapSprintGenerationResponse(response as any);
      expect(result.data.sprints[0].status).toBe('active');
      expect(result.data.sprints[1].status).toBe('planned');
    });

    it('should handle response without sprints', () => {
      const response = {
        success: true,
        data: null,
      };

      const result = mapSprintGenerationResponse(response as any);
      expect(result.data).toBeNull();
    });

    it('should handle response with empty sprints array', () => {
      const response = {
        success: true,
        data: {
          sprints: [],
        },
      };

      const result = mapSprintGenerationResponse(response as any);
      expect(result.data.sprints).toEqual([]);
    });

    it('should preserve other data properties', () => {
      const response = {
        success: true,
        data: {
          sprints: [{ id: '1', status: 'ACTIVE' } as GeneratedSprint],
          totalCount: 1,
        },
      };

      const result = mapSprintGenerationResponse(response as any);
      expect(result.data.totalCount).toBe(1);
    });
  });

  describe('mapSprintsResponse edge cases', () => {
    it('should handle response without data', () => {
      const response = { success: true, data: null };
      const result = mapSprintsResponse(response as any);
      expect(result.data).toBeNull();
    });

    it('should handle empty sprints array', () => {
      const response = { success: true, data: [] };
      const result = mapSprintsResponse(response as any);
      expect(result.data).toEqual([]);
    });
  });

  describe('normalizeSprintStatus edge cases', () => {
    it('should handle mixed case', () => {
      expect(normalizeSprintStatus('AcTiVe')).toBe('active');
    });
  });
});
