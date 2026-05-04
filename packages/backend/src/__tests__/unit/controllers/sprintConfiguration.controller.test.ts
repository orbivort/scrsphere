import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSprintConfiguration,
  createSprintConfiguration,
  updateSprintConfiguration,
  generateSprintsForYear,
  getGeneratedSprints,
  deleteGeneratedSprint,
  updateGeneratedSprint,
} from '../../../controllers/sprintConfiguration.controller';
import { sprintConfigurationService } from '../../../services/sprintConfiguration.service';
import { BadRequestError } from '../../../utils/errors';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup/testSetup';

vi.mock('../../../services/sprintConfiguration.service', () => ({
  sprintConfigurationService: {
    getSprintConfiguration: vi.fn(),
    createSprintConfiguration: vi.fn(),
    updateSprintConfiguration: vi.fn(),
    generateSprintsForYear: vi.fn(),
    getGeneratedSprints: vi.fn(),
    deleteGeneratedSprint: vi.fn(),
    updateGeneratedSprint: vi.fn(),
  },
}));

describe('SprintConfiguration Controller', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('getSprintConfiguration', () => {
    it('should return sprint configuration for a team', async () => {
      mockReq.query = { teamId: 'team-123' };
      const mockConfig = {
        id: 'config-123',
        teamId: 'team-123',
        sprintDuration: 14,
        startDay: 'MONDAY',
      };

      (sprintConfigurationService.getSprintConfiguration as any).mockResolvedValue(mockConfig);

      getSprintConfiguration(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(sprintConfigurationService.getSprintConfiguration).toHaveBeenCalledWith('team-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: mockConfig,
      });
    });

    it('should throw BadRequestError when teamId is missing', async () => {
      mockReq.query = {};

      getSprintConfiguration(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('teamId is required');
    });

    it('should throw BadRequestError when teamId is not a string', async () => {
      mockReq.query = { teamId: ['team-123'] };

      getSprintConfiguration(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should handle service errors', async () => {
      mockReq.query = { teamId: 'team-123' };
      const error = new Error('Database error');

      (sprintConfigurationService.getSprintConfiguration as any).mockRejectedValue(error);

      getSprintConfiguration(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createSprintConfiguration', () => {
    it('should create a new sprint configuration', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = {
        teamId: 'team-123',
        sprintDuration: 14,
        startDay: 'MONDAY',
      };
      const mockConfig = {
        id: 'config-123',
        teamId: 'team-123',
        sprintDuration: 14,
      };

      (sprintConfigurationService.createSprintConfiguration as any).mockResolvedValue(mockConfig);

      createSprintConfiguration(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(sprintConfigurationService.createSprintConfiguration).toHaveBeenCalledWith(
        'user-123',
        mockReq.body
      );
      expect(mockRes._status).toBe(201);
      expect(mockRes._json).toEqual({
        success: true,
        data: mockConfig,
      });
    });

    it('should throw BadRequestError when user is not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.body = { teamId: 'team-123' };

      createSprintConfiguration(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('User not authenticated');
    });

    it('should handle service errors', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { teamId: 'team-123' };
      const error = new Error('Validation error');

      (sprintConfigurationService.createSprintConfiguration as any).mockRejectedValue(error);

      createSprintConfiguration(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateSprintConfiguration', () => {
    it('should update sprint configuration', async () => {
      mockReq.params = { id: 'config-123' };
      mockReq.user = { id: 'user-123' };
      mockReq.body = { sprintDuration: 21 };
      const mockConfig = {
        id: 'config-123',
        sprintDuration: 21,
      };

      (sprintConfigurationService.updateSprintConfiguration as any).mockResolvedValue(mockConfig);

      updateSprintConfiguration(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(sprintConfigurationService.updateSprintConfiguration).toHaveBeenCalledWith(
        'config-123',
        'user-123',
        mockReq.body
      );
      expect(mockRes._json).toEqual({
        success: true,
        data: mockConfig,
      });
    });

    it('should throw BadRequestError when ID is missing', async () => {
      mockReq.params = {};
      mockReq.user = { id: 'user-123' };

      updateSprintConfiguration(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Configuration ID is required');
    });

    it('should throw BadRequestError when user is not authenticated', async () => {
      mockReq.params = { id: 'config-123' };
      mockReq.user = undefined;

      updateSprintConfiguration(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('User not authenticated');
    });

    it('should handle service errors', async () => {
      mockReq.params = { id: 'config-123' };
      mockReq.user = { id: 'user-123' };
      const error = new Error('Configuration not found');

      (sprintConfigurationService.updateSprintConfiguration as any).mockRejectedValue(error);

      updateSprintConfiguration(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('generateSprintsForYear', () => {
    it('should generate sprints for a year', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = {
        teamId: 'team-123',
        year: 2024,
      };
      const mockResult = {
        generated: 26,
        sprints: [{ id: 'sprint-1', name: 'Sprint 1' }],
      };

      (sprintConfigurationService.generateSprintsForYear as any).mockResolvedValue(mockResult);

      generateSprintsForYear(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(sprintConfigurationService.generateSprintsForYear).toHaveBeenCalledWith(
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
      mockReq.body = { teamId: 'team-123' };

      generateSprintsForYear(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('User not authenticated');
    });

    it('should handle service errors', async () => {
      mockReq.user = { id: 'user-123' };
      mockReq.body = { teamId: 'team-123' };
      const error = new Error('Configuration not found');

      (sprintConfigurationService.generateSprintsForYear as any).mockRejectedValue(error);

      generateSprintsForYear(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getGeneratedSprints', () => {
    it('should return generated sprints for a team', async () => {
      mockReq.query = { teamId: 'team-123' };
      const mockSprints = [{ id: 'sprint-1', name: 'Sprint 1' }];

      (sprintConfigurationService.getGeneratedSprints as any).mockResolvedValue(mockSprints);

      getGeneratedSprints(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(sprintConfigurationService.getGeneratedSprints).toHaveBeenCalledWith(
        'team-123',
        undefined
      );
      expect(mockRes._json).toEqual({
        success: true,
        data: mockSprints,
      });
    });

    it('should return generated sprints filtered by year', async () => {
      mockReq.query = { teamId: 'team-123', year: '2024' };
      const mockSprints = [{ id: 'sprint-1', name: 'Sprint 1' }];

      (sprintConfigurationService.getGeneratedSprints as any).mockResolvedValue(mockSprints);

      getGeneratedSprints(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(sprintConfigurationService.getGeneratedSprints).toHaveBeenCalledWith('team-123', 2024);
    });

    it('should throw BadRequestError when teamId is missing', async () => {
      mockReq.query = {};

      getGeneratedSprints(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('teamId is required');
    });

    it('should handle service errors', async () => {
      mockReq.query = { teamId: 'team-123' };
      const error = new Error('Database error');

      (sprintConfigurationService.getGeneratedSprints as any).mockRejectedValue(error);

      getGeneratedSprints(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteGeneratedSprint', () => {
    it('should delete a generated sprint', async () => {
      mockReq.params = { sprintId: 'sprint-123' };

      (sprintConfigurationService.deleteGeneratedSprint as any).mockResolvedValue(undefined);

      deleteGeneratedSprint(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(sprintConfigurationService.deleteGeneratedSprint).toHaveBeenCalledWith('sprint-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: null,
      });
    });

    it('should throw BadRequestError when sprintId is missing', async () => {
      mockReq.params = {};

      deleteGeneratedSprint(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Sprint ID is required');
    });

    it('should handle service errors', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      const error = new Error('Sprint not found');

      (sprintConfigurationService.deleteGeneratedSprint as any).mockRejectedValue(error);

      deleteGeneratedSprint(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateGeneratedSprint', () => {
    it('should update a generated sprint', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.user = { id: 'user-123' };
      mockReq.body = { name: 'Updated Sprint' };
      const mockSprint = { id: 'sprint-123', name: 'Updated Sprint' };

      (sprintConfigurationService.updateGeneratedSprint as any).mockResolvedValue(mockSprint);

      updateGeneratedSprint(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(sprintConfigurationService.updateGeneratedSprint).toHaveBeenCalledWith(
        'sprint-123',
        'user-123',
        mockReq.body
      );
      expect(mockRes._json).toEqual({
        success: true,
        data: mockSprint,
      });
    });

    it('should throw BadRequestError when sprintId is missing', async () => {
      mockReq.params = {};
      mockReq.user = { id: 'user-123' };

      updateGeneratedSprint(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Sprint ID is required');
    });

    it('should throw BadRequestError when user is not authenticated', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.user = undefined;

      updateGeneratedSprint(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('User not authenticated');
    });

    it('should handle service errors', async () => {
      mockReq.params = { sprintId: 'sprint-123' };
      mockReq.user = { id: 'user-123' };
      const error = new Error('Sprint not found');

      (sprintConfigurationService.updateGeneratedSprint as any).mockRejectedValue(error);

      updateGeneratedSprint(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
