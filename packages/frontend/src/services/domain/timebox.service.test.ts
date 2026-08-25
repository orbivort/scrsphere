import { describe, it, expect, vi, beforeEach } from 'vitest';
import { timeboxService } from './timebox.service';
import { coreApiService } from '../core/api.core';
import type { ScrumEvent, TimeboxState } from '@scrumooth/shared';

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

const EVENT_TYPES: ScrumEvent[] = ['sprintPlanning', 'dailyScrum', 'sprintReview', 'retrospective'];

function buildTimeboxState(
  eventType: ScrumEvent,
  overrides: Partial<TimeboxState> = {}
): TimeboxState {
  return {
    teamId: 'team-1',
    eventType,
    sprintId: 'sprint-1',
    date: '2026-08-24',
    status: 'RUNNING',
    elapsedMs: 120000,
    timeboxSeconds: 900,
    version: 3,
    ...overrides,
  };
}

describe('TimeboxService', () => {
  const mockApi = coreApiService.axiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTimebox', () => {
    it('fetches the timebox state with the provided query params', async () => {
      const query = { teamId: 'team-1', sprintId: 'sprint-1', date: '2026-08-24' };
      const state = buildTimeboxState('dailyScrum');
      const mockResponse = { data: { success: true as const, data: state } };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await timeboxService.getTimebox('dailyScrum', query);

      expect(mockApi.get).toHaveBeenCalledWith('/timeboxes/dailyScrum', { params: query });
      expect(result.success).toBe(true);
      expect(result.data?.eventType).toBe('dailyScrum');
      expect(result.data?.elapsedMs).toBe(120000);
    });

    it('fetches the timebox state with an empty default query', async () => {
      const state = buildTimeboxState('sprintPlanning');
      const mockResponse = { data: { success: true as const, data: state } };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await timeboxService.getTimebox('sprintPlanning');

      expect(mockApi.get).toHaveBeenCalledWith('/timeboxes/sprintPlanning', { params: {} });
      expect(result.success).toBe(true);
    });

    it('returns the server error payload on failure response', async () => {
      const mockResponse = {
        data: {
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Timebox not found' },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await timeboxService.getTimebox('retrospective', { teamId: 'team-1' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
      expect(result.data).toBeUndefined();
    });

    it('propagates network errors thrown by the api', async () => {
      vi.mocked(mockApi.get).mockRejectedValue(new Error('Network error'));

      await expect(timeboxService.getTimebox('sprintReview')).rejects.toThrow('Network error');
    });

    it('supports every Scrum event type', async () => {
      for (const eventType of EVENT_TYPES) {
        const state = buildTimeboxState(eventType);
        vi.mocked(mockApi.get).mockResolvedValue({ data: { success: true as const, data: state } });

        const result = await timeboxService.getTimebox(eventType, { teamId: 'team-1' });

        expect(mockApi.get).toHaveBeenCalledWith(`/timeboxes/${eventType}`, {
          params: { teamId: 'team-1' },
        });
        expect(result.data?.eventType).toBe(eventType);
      }
    });
  });

  describe('startTimebox', () => {
    it('posts to the start endpoint with the provided body', async () => {
      const body = { teamId: 'team-1', sprintId: 'sprint-1' };
      const state = buildTimeboxState('dailyScrum', { status: 'RUNNING' });
      const mockResponse = { data: { success: true as const, data: state } };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await timeboxService.startTimebox('dailyScrum', body);

      expect(mockApi.post).toHaveBeenCalledWith('/timeboxes/dailyScrum/start', body);
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('RUNNING');
    });

    it('starts a timebox with an empty default body', async () => {
      const state = buildTimeboxState('sprintPlanning');
      const mockResponse = { data: { success: true as const, data: state } };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await timeboxService.startTimebox('sprintPlanning');

      expect(mockApi.post).toHaveBeenCalledWith('/timeboxes/sprintPlanning/start', {});
      expect(result.success).toBe(true);
    });

    it('propagates errors thrown while starting', async () => {
      vi.mocked(mockApi.post).mockRejectedValue(new Error('Forbidden'));

      await expect(
        timeboxService.startTimebox('retrospective', { teamId: 'team-1' })
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('pauseTimebox', () => {
    it('posts to the pause endpoint with the provided body', async () => {
      const body = { teamId: 'team-1', date: '2026-08-24' };
      const state = buildTimeboxState('dailyScrum', { status: 'PAUSED' });
      const mockResponse = { data: { success: true as const, data: state } };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await timeboxService.pauseTimebox('dailyScrum', body);

      expect(mockApi.post).toHaveBeenCalledWith('/timeboxes/dailyScrum/pause', body);
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('PAUSED');
    });

    it('pauses a timebox with an empty default body', async () => {
      const state = buildTimeboxState('sprintReview');
      const mockResponse = { data: { success: true as const, data: state } };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await timeboxService.pauseTimebox('sprintReview');

      expect(mockApi.post).toHaveBeenCalledWith('/timeboxes/sprintReview/pause', {});
      expect(result.success).toBe(true);
    });

    it('propagates errors thrown while pausing', async () => {
      vi.mocked(mockApi.post).mockRejectedValue(new Error('Conflict'));

      await expect(timeboxService.pauseTimebox('sprintPlanning')).rejects.toThrow('Conflict');
    });
  });

  describe('resetTimebox', () => {
    it('posts to the reset endpoint with the provided body', async () => {
      const body = { teamId: 'team-1' };
      const state = buildTimeboxState('dailyScrum', { status: 'IDLE', elapsedMs: 0, version: 4 });
      const mockResponse = { data: { success: true as const, data: state } };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await timeboxService.resetTimebox('dailyScrum', body);

      expect(mockApi.post).toHaveBeenCalledWith('/timeboxes/dailyScrum/reset', body);
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('IDLE');
      expect(result.data?.elapsedMs).toBe(0);
    });

    it('resets a timebox with an empty default body', async () => {
      const state = buildTimeboxState('retrospective');
      const mockResponse = { data: { success: true as const, data: state } };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await timeboxService.resetTimebox('retrospective');

      expect(mockApi.post).toHaveBeenCalledWith('/timeboxes/retrospective/reset', {});
      expect(result.success).toBe(true);
    });

    it('propagates errors thrown while resetting', async () => {
      vi.mocked(mockApi.post).mockRejectedValue(new Error('Bad request'));

      await expect(timeboxService.resetTimebox('sprintReview')).rejects.toThrow('Bad request');
    });
  });

  describe('concludeTimebox', () => {
    it('posts to the conclude endpoint with the provided body', async () => {
      const body = { teamId: 'team-1', sprintId: 'sprint-1', date: '2026-08-24' };
      const state = buildTimeboxState('dailyScrum', { status: 'IDLE', elapsedMs: 600000 });
      const mockResponse = { data: { success: true as const, data: state } };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await timeboxService.concludeTimebox('dailyScrum', body);

      expect(mockApi.post).toHaveBeenCalledWith('/timeboxes/dailyScrum/conclude', body);
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('IDLE');
    });

    it('concludes a timebox with an empty default body', async () => {
      const state = buildTimeboxState('sprintPlanning');
      const mockResponse = { data: { success: true as const, data: state } };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await timeboxService.concludeTimebox('sprintPlanning');

      expect(mockApi.post).toHaveBeenCalledWith('/timeboxes/sprintPlanning/conclude', {});
      expect(result.success).toBe(true);
    });

    it('propagates errors thrown while concluding', async () => {
      vi.mocked(mockApi.post).mockRejectedValue(new Error('Unauthorized'));

      await expect(
        timeboxService.concludeTimebox('sprintReview', { teamId: 'team-1' })
      ).rejects.toThrow('Unauthorized');
    });
  });
});
