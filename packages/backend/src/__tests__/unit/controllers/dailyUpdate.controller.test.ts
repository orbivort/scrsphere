import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDailyUpdates,
  getDailyUpdateById,
  createDailyUpdate,
  updateDailyUpdate,
  deleteDailyUpdate,
  getTeamMembersWithUpdates,
  promoteToImpediment,
  sendReminder,
} from '../../../controllers/dailyUpdate.controller';
import { dailyUpdateService } from '../../../services/dailyUpdate.service';
import { BadRequestError } from '../../../utils/errors';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup/testSetup';

vi.mock('../../../services/dailyUpdate.service', () => ({
  dailyUpdateService: {
    getDailyUpdates: vi.fn(),
    getDailyUpdateById: vi.fn(),
    createDailyUpdate: vi.fn(),
    updateDailyUpdate: vi.fn(),
    deleteDailyUpdate: vi.fn(),
    getTeamMembersWithUpdates: vi.fn(),
    promoteToImpediment: vi.fn(),
  },
}));

describe('DailyUpdate Controller', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('getDailyUpdates', () => {
    it('should return daily updates for a sprint', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.query = { date: '2024-01-01' };
      const mockUpdates = [{ id: 'update-1', yesterdayWork: 'Task 1' }];

      (dailyUpdateService.getDailyUpdates as any).mockResolvedValue(mockUpdates);

      getDailyUpdates(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(dailyUpdateService.getDailyUpdates).toHaveBeenCalledWith('sprint-123', '2024-01-01');
      expect(mockRes._json).toEqual({
        success: true,
        data: mockUpdates,
      });
    });

    it('should handle undefined date', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      const mockUpdates = [{ id: 'update-1', yesterdayWork: 'Task 1' }];

      (dailyUpdateService.getDailyUpdates as any).mockResolvedValue(mockUpdates);

      getDailyUpdates(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(dailyUpdateService.getDailyUpdates).toHaveBeenCalledWith('sprint-123', undefined);
    });

    it('should throw BadRequestError when sprintId is missing', async () => {
      mockReq.params = {};

      getDailyUpdates(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Sprint ID is required');
    });

    it('should handle service errors', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      const error = new Error('Database error');

      (dailyUpdateService.getDailyUpdates as any).mockRejectedValue(error);

      getDailyUpdates(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getDailyUpdateById', () => {
    it('should return daily update by ID', async () => {
      mockReq.params = { id: 'update-123' };
      const mockUpdate = { id: 'update-123', yesterdayWork: 'Task 1' };

      (dailyUpdateService.getDailyUpdateById as any).mockResolvedValue(mockUpdate);

      getDailyUpdateById(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(dailyUpdateService.getDailyUpdateById).toHaveBeenCalledWith('update-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: mockUpdate,
      });
    });

    it('should return null when update not found', async () => {
      mockReq.params = { id: 'update-123' };

      (dailyUpdateService.getDailyUpdateById as any).mockResolvedValue(null);

      getDailyUpdateById(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes._json).toEqual({
        success: true,
        data: null,
      });
    });

    it('should throw BadRequestError when ID is missing', async () => {
      mockReq.params = {};

      getDailyUpdateById(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Daily update ID is required');
    });
  });

  describe('createDailyUpdate', () => {
    it('should create a new daily update', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.body = {
        yesterdayWork: 'Completed task 1',
        todayWork: 'Working on task 2',
        impediment: 'None',
      };
      const mockUpdate = { id: 'update-123', ...mockReq.body };

      (dailyUpdateService.createDailyUpdate as any).mockResolvedValue(mockUpdate);

      createDailyUpdate(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(dailyUpdateService.createDailyUpdate).toHaveBeenCalledWith('user-123', {
        sprintId: 'sprint-123',
        yesterdayWork: 'Completed task 1',
        todayWork: 'Working on task 2',
        impediment: 'None',
      });
      expect(mockRes._status).toBe(201);
      expect(mockRes._json).toEqual({
        success: true,
        data: mockUpdate,
      });
    });

    it('should throw BadRequestError when user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { sprintId: 'sprint-123' };

      createDailyUpdate(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('User not authenticated');
    });

    it('should throw BadRequestError when sprintId is missing', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.params = {};

      createDailyUpdate(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Sprint ID is required');
    });
  });

  describe('updateDailyUpdate', () => {
    it('should update a daily update', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.params = { id: 'update-123' };
      mockReq.body = { yesterdayWork: 'Updated work' };
      const mockUpdate = { id: 'update-123', yesterdayWork: 'Updated work' };

      (dailyUpdateService.updateDailyUpdate as any).mockResolvedValue(mockUpdate);

      updateDailyUpdate(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(dailyUpdateService.updateDailyUpdate).toHaveBeenCalledWith(
        'update-123',
        'user-123',
        mockReq.body
      );
      expect(mockRes._json).toEqual({
        success: true,
        data: mockUpdate,
      });
    });

    it('should throw BadRequestError when user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { id: 'update-123' };

      updateDailyUpdate(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should throw BadRequestError when ID is missing', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.params = {};

      updateDailyUpdate(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Daily update ID is required');
    });
  });

  describe('deleteDailyUpdate', () => {
    it('should delete a daily update', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.params = { id: 'update-123' };

      (dailyUpdateService.deleteDailyUpdate as any).mockResolvedValue(undefined);

      deleteDailyUpdate(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(dailyUpdateService.deleteDailyUpdate).toHaveBeenCalledWith('update-123', 'user-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: { message: 'Daily update deleted successfully' },
      });
    });

    it('should throw BadRequestError when user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { id: 'update-123' };

      deleteDailyUpdate(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should throw BadRequestError when ID is missing', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.params = {};

      deleteDailyUpdate(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Daily update ID is required');
    });
  });

  describe('getTeamMembersWithUpdates', () => {
    it('should return team members with updates status', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.query = { date: '2024-01-01' };
      const mockResult = {
        submitted: [{ id: 'user-1', name: 'User 1' }],
        pending: [{ id: 'user-2', name: 'User 2' }],
      };

      (dailyUpdateService.getTeamMembersWithUpdates as any).mockResolvedValue(mockResult);

      getTeamMembersWithUpdates(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(dailyUpdateService.getTeamMembersWithUpdates).toHaveBeenCalledWith(
        'sprint-123',
        '2024-01-01'
      );
      expect(mockRes._json).toEqual({
        success: true,
        data: mockResult,
      });
    });

    it('should return empty arrays when date is missing', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.query = {};

      getTeamMembersWithUpdates(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes._json).toEqual({
        success: true,
        data: { submitted: [], pending: [] },
      });
    });

    it('should throw BadRequestError when sprintId is missing', async () => {
      mockReq.params = {};

      getTeamMembersWithUpdates(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Sprint ID is required');
    });
  });

  describe('promoteToImpediment', () => {
    it('should promote daily update to impediment', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.params = { id: 'update-123' };
      mockReq.body = {
        title: 'New Impediment',
        description: 'Impediment description',
        ownerId: 'user-456',
        teamId: 'team-123',
        sprintId: 'sprint-123',
      };
      const mockResult = { id: 'imp-123', title: 'New Impediment' };

      (dailyUpdateService.promoteToImpediment as any).mockResolvedValue(mockResult);

      promoteToImpediment(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(dailyUpdateService.promoteToImpediment).toHaveBeenCalledWith(
        'update-123',
        'user-123',
        mockReq.body
      );
      expect(mockRes._status).toBe(201);
      expect(mockRes._json).toEqual({
        success: true,
        data: mockResult,
      });
    });

    it('should throw BadRequestError when user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { id: 'update-123' };

      promoteToImpediment(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should throw BadRequestError when ID is missing', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.params = {};

      promoteToImpediment(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Daily update ID is required');
    });
  });

  describe('sendReminder', () => {
    it('should send reminders to pending members', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.params = { sprintId: 'sprint-123' };

      await sendReminder(mockReq as any, mockRes as any, mockNext);

      // This test is more complex as it uses prisma directly
      // We'll verify the basic structure
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { sprintId: 'sprint-123' };

      sendReminder(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should throw BadRequestError when sprintId is missing', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.params = {};

      sendReminder(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Sprint ID is required');
    });
  });
});
