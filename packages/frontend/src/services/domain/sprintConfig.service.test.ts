import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sprintConfigService } from './sprintConfig.service';
import { coreApiService } from '../core/api.core';
import {
  mapSprintConfigToBackend,
  mapSprintConfigFromBackend,
  mapSprintGenerationResponse,
  mapSprintResponse,
  mapSprintsResponse,
  mapDurationToBackend,
} from '../utils/mapping.utils';

vi.mock('../core/api.core', () => ({
  coreApiService: {
    axiosInstance: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../utils/mapping.utils', () => ({
  mapSprintConfigToBackend: vi.fn((data) => data),
  mapSprintConfigFromBackend: vi.fn((data) => data),
  mapSprintGenerationResponse: vi.fn((data) => data),
  mapSprintResponse: vi.fn((data) => data),
  mapSprintsResponse: vi.fn((data) => data),
  mapDurationToBackend: vi.fn((duration) => duration),
}));

describe('SprintConfigService', () => {
  const mockApi = coreApiService.axiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSprintConfiguration', () => {
    it('should get sprint configuration for a team', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'config-1',
            teamId: 'team-1',
            duration: '2weeks',
            year: 2024,
            sprintStartDay: 1,
            generatedAt: '2024-01-01T00:00:00Z',
            updatedBy: 'user-1',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await sprintConfigService.getSprintConfiguration('team-1');

      expect(mockApi.get).toHaveBeenCalledWith('/sprint-configuration', {
        params: { teamId: 'team-1' },
      });
      expect(mapSprintConfigFromBackend).toHaveBeenCalledWith(mockResponse.data);
      expect(result.success).toBe(true);
    });
  });

  describe('createSprintConfiguration', () => {
    it('should create a new sprint configuration', async () => {
      const config = {
        teamId: 'team-1',
        duration: '2weeks' as const,
        year: 2024,
        sprintStartDay: 1,
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'config-1',
            ...config,
            generatedAt: '2024-01-01T00:00:00Z',
            updatedBy: 'user-1',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await sprintConfigService.createSprintConfiguration(config);

      expect(mapSprintConfigToBackend).toHaveBeenCalledWith(config);
      expect(mockApi.post).toHaveBeenCalledWith('/sprint-configuration', config);
      expect(mapSprintConfigFromBackend).toHaveBeenCalledWith(mockResponse.data);
      expect(result.success).toBe(true);
    });
  });

  describe('updateSprintConfiguration', () => {
    it('should update a sprint configuration', async () => {
      const updates = {
        duration: '4weeks' as const,
        sprintStartDay: 0,
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'config-1',
            teamId: 'team-1',
            ...updates,
            year: 2024,
            generatedAt: '2024-01-01T00:00:00Z',
            updatedBy: 'user-1',
            updatedAt: '2024-01-15T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      const result = await sprintConfigService.updateSprintConfiguration('config-1', updates);

      expect(mapSprintConfigToBackend).toHaveBeenCalledWith(updates);
      expect(mockApi.put).toHaveBeenCalledWith('/sprint-configuration/config-1', updates);
      expect(mapSprintConfigFromBackend).toHaveBeenCalledWith(mockResponse.data);
      expect(result.success).toBe(true);
    });
  });

  describe('generateSprintsForYear', () => {
    it('should generate sprints for a year', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            success: true,
            generatedCount: 26,
            sprints: [
              {
                id: 'sprint-1',
                teamId: 'team-1',
                name: 'Sprint-2401 (2024/1/1-2024/1/14)',
                sprintNumber: 1,
                year: 2024,
                startDate: '2024-01-01T00:00:00Z',
                endDate: '2024-01-14T00:00:00Z',
                status: 'planned',
                createdAt: '2024-01-01T00:00:00Z',
              },
            ],
            message: 'Generated 26 sprints for 2024',
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await sprintConfigService.generateSprintsForYear('team-1', '2weeks', 2024);

      expect(mapDurationToBackend).toHaveBeenCalledWith('2weeks');
      expect(mockApi.post).toHaveBeenCalledWith('/sprint-configuration/generate', {
        teamId: 'team-1',
        duration: '2weeks',
        year: 2024,
      });
      expect(mapSprintGenerationResponse).toHaveBeenCalledWith(mockResponse.data);
      expect(result.success).toBe(true);
      expect(result.data?.generatedCount).toBe(26);
    });
  });

  describe('getGeneratedSprints', () => {
    it('should get generated sprints for a team', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'sprint-1',
              teamId: 'team-1',
              name: 'Sprint-2401 (2024/1/1-2024/1/14)',
              sprintNumber: 1,
              year: 2024,
              startDate: '2024-01-01T00:00:00Z',
              endDate: '2024-01-14T00:00:00Z',
              status: 'planned',
              createdAt: '2024-01-01T00:00:00Z',
            },
            {
              id: 'sprint-2',
              teamId: 'team-1',
              name: 'Sprint-2402 (2024/1/15-2024/1/28)',
              sprintNumber: 2,
              year: 2024,
              startDate: '2024-01-15T00:00:00Z',
              endDate: '2024-01-28T00:00:00Z',
              status: 'planned',
              createdAt: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await sprintConfigService.getGeneratedSprints('team-1');

      expect(mockApi.get).toHaveBeenCalledWith('/sprint-configuration/sprints', {
        params: { teamId: 'team-1', year: undefined },
      });
      expect(mapSprintsResponse).toHaveBeenCalledWith(mockResponse.data);
      expect(result.success).toBe(true);
    });

    it('should get generated sprints for a specific year', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await sprintConfigService.getGeneratedSprints('team-1', 2024);

      expect(mockApi.get).toHaveBeenCalledWith('/sprint-configuration/sprints', {
        params: { teamId: 'team-1', year: 2024 },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('deleteGeneratedSprint', () => {
    it('should delete a generated sprint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: undefined,
        },
      };
      vi.mocked(mockApi.delete).mockResolvedValue(mockResponse);

      const result = await sprintConfigService.deleteGeneratedSprint('sprint-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/sprint-configuration/sprints/sprint-1');
      expect(result.success).toBe(true);
    });
  });

  describe('updateGeneratedSprint', () => {
    it('should update a generated sprint', async () => {
      const updates = { sprintGoal: 'Complete feature X' };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'sprint-1',
            teamId: 'team-1',
            name: 'Sprint-2401 (2024/1/1-2024/1/14)',
            sprintNumber: 1,
            year: 2024,
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-01-14T00:00:00Z',
            status: 'planned',
            sprintGoal: 'Complete feature X',
            createdAt: '2024-01-01T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      const result = await sprintConfigService.updateGeneratedSprint('sprint-1', updates);

      expect(mockApi.put).toHaveBeenCalledWith('/sprint-configuration/sprints/sprint-1', updates);
      expect(mapSprintResponse).toHaveBeenCalledWith(mockResponse.data);
      expect(result.success).toBe(true);
      expect(result.data?.sprintGoal).toBe('Complete feature X');
    });
  });
});
