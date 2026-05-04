import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dailyUpdatesService } from './dailyUpdates.service';
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

describe('DailyUpdatesService', () => {
  const mockApi = coreApiService.axiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDailyUpdates', () => {
    it('should get daily updates for a sprint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'update-1',
              sprintId: 'sprint-1',
              userId: 'user-1',
              updateDate: '2024-01-15',
              yesterdayWork: 'Completed task A',
              todayWork: 'Working on task B',
              impediment: 'None',
              createdAt: '2024-01-15T09:00:00Z',
            },
            {
              id: 'update-2',
              sprintId: 'sprint-1',
              userId: 'user-2',
              updateDate: '2024-01-15',
              yesterdayWork: 'Reviewed PRs',
              todayWork: 'Testing feature X',
              createdAt: '2024-01-15T09:30:00Z',
            },
          ],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await dailyUpdatesService.getDailyUpdates('sprint-1');

      expect(mockApi.get).toHaveBeenCalledWith('/daily-updates/sprint-1', {
        params: { date: undefined },
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should get daily updates for a specific date', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await dailyUpdatesService.getDailyUpdates('sprint-1', '2024-01-15');

      expect(mockApi.get).toHaveBeenCalledWith('/daily-updates/sprint-1', {
        params: { date: '2024-01-15' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createDailyUpdate', () => {
    it('should create a new daily update', async () => {
      const updateData = {
        yesterdayWork: 'Completed task A',
        todayWork: 'Working on task B',
        impediment: 'Waiting for API access',
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'update-3',
            sprintId: 'sprint-1',
            userId: 'user-3',
            updateDate: '2024-01-15',
            ...updateData,
            createdAt: '2024-01-15T10:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await dailyUpdatesService.createDailyUpdate('sprint-1', updateData);

      expect(mockApi.post).toHaveBeenCalledWith('/daily-updates/sprint-1', updateData);
      expect(result.success).toBe(true);
      expect(result.data?.yesterdayWork).toBe('Completed task A');
      expect(result.data?.impediment).toBe('Waiting for API access');
    });

    it('should create a daily update without impediment', async () => {
      const updateData = {
        yesterdayWork: 'Fixed bugs',
        todayWork: 'Continue development',
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'update-4',
            sprintId: 'sprint-1',
            userId: 'user-4',
            updateDate: '2024-01-15',
            ...updateData,
            createdAt: '2024-01-15T10:30:00Z',
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await dailyUpdatesService.createDailyUpdate('sprint-1', updateData);

      expect(result.success).toBe(true);
      expect(result.data?.yesterdayWork).toBe('Fixed bugs');
    });
  });

  describe('getTeamMembersWithUpdates', () => {
    it('should get team members with their update status', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            submitted: [
              {
                id: 'update-1',
                sprintId: 'sprint-1',
                userId: 'user-1',
                updateDate: '2024-01-15',
                yesterdayWork: 'Completed task',
                todayWork: 'New task',
                createdAt: '2024-01-15T09:00:00Z',
              },
            ],
            pending: [
              { userId: 'user-2', userName: 'Jane Smith' },
              { userId: 'user-3', userName: 'Bob Johnson' },
            ],
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await dailyUpdatesService.getTeamMembersWithUpdates('sprint-1', '2024-01-15');

      expect(mockApi.get).toHaveBeenCalledWith('/daily-updates/sprint-1/team-status', {
        params: { date: '2024-01-15' },
      });
      expect(result.success).toBe(true);
      expect(result.data?.submitted).toHaveLength(1);
      expect(result.data?.pending).toHaveLength(2);
    });

    it('should return empty arrays when all members submitted', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            submitted: [
              {
                id: 'update-1',
                sprintId: 'sprint-1',
                userId: 'user-1',
                updateDate: '2024-01-15',
                createdAt: '2024-01-15T09:00:00Z',
              },
            ],
            pending: [],
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await dailyUpdatesService.getTeamMembersWithUpdates('sprint-1', '2024-01-15');

      expect(result.success).toBe(true);
      expect(result.data?.pending).toHaveLength(0);
    });
  });

  describe('sendDailyUpdateReminder', () => {
    it('should send reminders to pending members', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            sentCount: 3,
            totalPending: 3,
            message: 'Reminders sent successfully',
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await dailyUpdatesService.sendDailyUpdateReminder('sprint-1');

      expect(mockApi.post).toHaveBeenCalledWith('/daily-updates/sprint-1/send-reminder');
      expect(result.success).toBe(true);
      expect(result.data?.sentCount).toBe(3);
      expect(result.data?.totalPending).toBe(3);
    });

    it('should handle partial reminder sends', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            sentCount: 2,
            totalPending: 3,
            message: 'Partial reminders sent',
            errors: ['user-2@example.com failed'],
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await dailyUpdatesService.sendDailyUpdateReminder('sprint-1');

      expect(result.success).toBe(true);
      expect(result.data?.sentCount).toBe(2);
      expect(result.data?.errors).toContain('user-2@example.com failed');
    });
  });

  describe('promoteToImpediment', () => {
    it('should promote a daily update impediment to formal impediment', async () => {
      const impedimentData = {
        title: 'API Access Issue',
        description: 'Still waiting for API credentials',
        ownerId: 'user-2',
        priority: 'HIGH',
        teamId: 'team-1',
        sprintId: 'sprint-1',
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            dailyUpdate: {
              id: 'update-1',
              sprintId: 'sprint-1',
              impediment: 'Promoted to formal impediment',
            },
            impediment: {
              id: 'impediment-1',
              teamId: 'team-1',
              sprintId: 'sprint-1',
              dailyUpdateId: 'update-1',
              title: 'API Access Issue',
              description: 'Still waiting for API credentials',
              reportedById: 'user-1',
              ownerId: 'user-2',
              status: 'OPEN',
              createdAt: '2024-01-15T10:00:00Z',
              updatedAt: '2024-01-15T10:00:00Z',
            },
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await dailyUpdatesService.promoteToImpediment('update-1', impedimentData);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/daily-updates/update-1/promote-impediment',
        impedimentData
      );
      expect(result.success).toBe(true);
      expect(result.data?.impediment.title).toBe('API Access Issue');
      expect(result.data?.impediment.status).toBe('OPEN');
    });

    it('should promote with minimal data', async () => {
      const impedimentData = {
        title: 'Blocker',
        teamId: 'team-1',
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            dailyUpdate: { id: 'update-1' },
            impediment: {
              id: 'impediment-2',
              teamId: 'team-1',
              title: 'Blocker',
              status: 'OPEN',
            },
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await dailyUpdatesService.promoteToImpediment('update-1', impedimentData);

      expect(result.success).toBe(true);
      expect(result.data?.impediment.title).toBe('Blocker');
    });
  });

  describe('getImpedimentByDailyUpdate', () => {
    it('should get impediment linked to a daily update', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'impediment-1',
            teamId: 'team-1',
            sprintId: 'sprint-1',
            dailyUpdateId: 'update-1',
            title: 'API Access Issue',
            description: 'Waiting for credentials',
            reportedById: 'user-1',
            status: 'OPEN',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await dailyUpdatesService.getImpedimentByDailyUpdate('update-1');

      expect(mockApi.get).toHaveBeenCalledWith('/daily-updates/update-1/impediment');
      expect(result.success).toBe(true);
      expect(result.data?.dailyUpdateId).toBe('update-1');
      expect(result.data?.title).toBe('API Access Issue');
    });

    it('should return null when no impediment linked', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: null,
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await dailyUpdatesService.getImpedimentByDailyUpdate('update-2');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });
});
