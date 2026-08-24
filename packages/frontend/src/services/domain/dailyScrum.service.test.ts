import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dailyScrumService } from './dailyScrum.service';
import { coreApiService } from '../core/api.core';

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

describe('DailyScrumService', () => {
  const mockApi = coreApiService.axiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDailyScrum', () => {
    it('gets the team-level Daily Scrum for a sprint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'scrum-1',
            sprintId: 'sprint-1',
            scrumDate: '2026-08-23',
            progressNotes: 'On track',
            adaptationsNotes: null,
            planForNextDay: 'Pair on X',
            participants: [],
            backlogAdjustments: [],
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await dailyScrumService.getDailyScrum('sprint-1', '2026-08-23');

      expect(mockApi.get).toHaveBeenCalledWith('/daily-scrums/sprint-1/today', {
        params: { date: '2026-08-23' },
      });
      expect(result.data?.id).toBe('scrum-1');
    });
  });

  describe('createDailyScrum', () => {
    it('creates a team-level Daily Scrum with goal-focused fields', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: 'scrum-1', sprintId: 'sprint-1' },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      await dailyScrumService.createDailyScrum('sprint-1', {
        progressNotes: 'Progress',
        backlogAdjustments: [{ sprintBacklogItemId: 'item-1', action: 'flagged' }],
      });

      expect(mockApi.post).toHaveBeenCalledWith('/daily-scrums/sprint-1', {
        progressNotes: 'Progress',
        backlogAdjustments: [{ sprintBacklogItemId: 'item-1', action: 'flagged' }],
      });
    });
  });

  describe('updateDailyScrum', () => {
    it('updates the team-level Daily Scrum by id', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: 'scrum-1', planForNextDay: 'Updated' },
        },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      await dailyScrumService.updateDailyScrum('scrum-1', { planForNextDay: 'Updated' });

      expect(mockApi.put).toHaveBeenCalledWith('/daily-scrums/record/scrum-1', {
        planForNextDay: 'Updated',
      });
    });
  });

  describe('recordParticipation', () => {
    it('records participation for a Daily Scrum', async () => {
      const mockResponse = {
        data: { success: true, data: { id: 'scrum-1' } },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      await dailyScrumService.recordParticipation('scrum-1');

      expect(mockApi.post).toHaveBeenCalledWith('/daily-scrums/record/scrum-1/participate');
    });
  });

  describe('getParticipation', () => {
    it('gets participation for a sprint on a date', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            dailyScrum: { id: 'scrum-1' },
            participants: [],
            nonParticipants: [{ userId: 'user-2', userName: 'Jane' }],
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      await dailyScrumService.getParticipation('sprint-1', '2026-08-23');

      expect(mockApi.get).toHaveBeenCalledWith('/daily-scrums/sprint-1/participation', {
        params: { date: '2026-08-23' },
      });
    });
  });

  describe('sendTeamSignal', () => {
    it('sends a team-wide Daily Scrum signal', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { sentCount: 3, message: 'Signal sent' },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      await dailyScrumService.sendTeamSignal('sprint-1');

      expect(mockApi.post).toHaveBeenCalledWith('/daily-scrums/sprint-1/team-signal');
    });
  });
});
