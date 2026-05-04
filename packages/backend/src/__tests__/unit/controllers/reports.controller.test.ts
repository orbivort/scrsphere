import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getVelocityData,
  getSprintHistory,
  getTeamMetrics,
  getInsights,
} from '../../../controllers/reports.controller';
import { reportsService } from '../../../services/reports.service';
import { createMockRequest, createMockResponse } from '../../setup/testSetup';

vi.mock('../../../services/reports.service', () => ({
  reportsService: {
    getVelocityData: vi.fn(),
    getSprintHistory: vi.fn(),
    getTeamMetrics: vi.fn(),
    getInsights: vi.fn(),
  },
}));

describe('Reports Controller', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockRequest>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = vi.fn();
  });

  describe('getVelocityData', () => {
    it('should return velocity data for a team', async () => {
      mockReq.query = { teamId: 'team-123' };
      const mockData = {
        sprints: [
          { name: 'Sprint 1', completed: 20, committed: 25 },
          { name: 'Sprint 2', completed: 22, committed: 24 },
        ],
        averageVelocity: 21,
      };

      (reportsService.getVelocityData as any).mockResolvedValue(mockData);

      getVelocityData(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(reportsService.getVelocityData).toHaveBeenCalledWith('team-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: mockData,
      });
    });

    it('should return 400 when teamId is missing', async () => {
      mockReq.query = {};

      getVelocityData(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes._status).toBe(400);
      expect(mockRes._json).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Team ID is required',
        },
      });
    });

    it('should return 400 when teamId is not a string', async () => {
      mockReq.query = { teamId: ['team-123'] };

      getVelocityData(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes._status).toBe(400);
    });

    it('should handle service errors', async () => {
      mockReq.query = { teamId: 'team-123' };
      const error = new Error('Database error');

      (reportsService.getVelocityData as any).mockRejectedValue(error);

      getVelocityData(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getSprintHistory', () => {
    it('should return sprint history for a team', async () => {
      mockReq.query = { teamId: 'team-123' };
      const mockData = {
        sprints: [
          {
            id: 'sprint-1',
            name: 'Sprint 1',
            status: 'COMPLETED',
            startDate: new Date(),
            endDate: new Date(),
          },
        ],
      };

      (reportsService.getSprintHistory as any).mockResolvedValue(mockData);

      getSprintHistory(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(reportsService.getSprintHistory).toHaveBeenCalledWith('team-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: mockData,
      });
    });

    it('should return 400 when teamId is missing', async () => {
      mockReq.query = {};

      getSprintHistory(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes._status).toBe(400);
      expect(mockRes._json.success).toBe(false);
    });

    it('should handle service errors', async () => {
      mockReq.query = { teamId: 'team-123' };
      const error = new Error('Database error');

      (reportsService.getSprintHistory as any).mockRejectedValue(error);

      getSprintHistory(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getTeamMetrics', () => {
    it('should return team metrics', async () => {
      mockReq.query = { teamId: 'team-123' };
      const mockData = {
        totalSprints: 10,
        completedSprints: 8,
        averageVelocity: 21,
        totalStoryPoints: 210,
        teamSize: 5,
      };

      (reportsService.getTeamMetrics as any).mockResolvedValue(mockData);

      getTeamMetrics(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(reportsService.getTeamMetrics).toHaveBeenCalledWith('team-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: mockData,
      });
    });

    it('should return 400 when teamId is missing', async () => {
      mockReq.query = {};

      getTeamMetrics(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes._status).toBe(400);
    });

    it('should handle service errors', async () => {
      mockReq.query = { teamId: 'team-123' };
      const error = new Error('Database error');

      (reportsService.getTeamMetrics as any).mockRejectedValue(error);

      getTeamMetrics(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getInsights', () => {
    it('should return team insights', async () => {
      mockReq.query = { teamId: 'team-123' };
      const mockData = {
        velocityTrend: 'increasing',
        completionRate: 0.88,
        recommendations: ['Consider reducing sprint commitment'],
      };

      (reportsService.getInsights as any).mockResolvedValue(mockData);

      getInsights(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(reportsService.getInsights).toHaveBeenCalledWith('team-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: mockData,
      });
    });

    it('should return 400 when teamId is missing', async () => {
      mockReq.query = {};

      getInsights(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes._status).toBe(400);
    });

    it('should handle service errors', async () => {
      mockReq.query = { teamId: 'team-123' };
      const error = new Error('Database error');

      (reportsService.getInsights as any).mockRejectedValue(error);

      getInsights(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
