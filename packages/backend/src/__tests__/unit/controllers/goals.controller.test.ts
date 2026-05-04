import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getProductGoals,
  getProductGoalById,
  createProductGoal,
  updateProductGoal,
  deleteProductGoal,
  getActiveProductGoal,
  getProductGoalStatusHistory,
} from '../../../controllers/goals.controller';
import { productGoalService } from '../../../services/goals.service';
import { workflowService } from '../../../services/workflow.service';
import { BadRequestError } from '../../../utils/errors';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup/testSetup';

vi.mock('../../../services/goals.service', () => ({
  productGoalService: {
    getProductGoals: vi.fn(),
    getProductGoalById: vi.fn(),
    createProductGoal: vi.fn(),
    updateProductGoal: vi.fn(),
    deleteProductGoal: vi.fn(),
    getActiveProductGoal: vi.fn(),
  },
}));

vi.mock('../../../services/workflow.service', () => ({
  workflowService: {
    getStatusChangeHistory: vi.fn(),
  },
}));

describe('Goals Controller', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('getProductGoals', () => {
    it('should return product goals for a team', async () => {
      mockReq.query = { teamId: 'team-123' };
      const mockGoals = [{ id: 'goal-1', title: 'Goal 1' }];

      (productGoalService.getProductGoals as any).mockResolvedValue(mockGoals);

      getProductGoals(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(productGoalService.getProductGoals).toHaveBeenCalledWith('team-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: mockGoals,
      });
    });

    it('should throw BadRequestError when teamId is missing', async () => {
      mockReq.query = {};

      getProductGoals(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('teamId is required');
    });

    it('should throw BadRequestError when teamId is not a string', async () => {
      mockReq.query = { teamId: ['team-123'] };

      getProductGoals(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should handle service errors', async () => {
      mockReq.query = { teamId: 'team-123' };
      const error = new Error('Database error');

      (productGoalService.getProductGoals as any).mockRejectedValue(error);

      getProductGoals(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getProductGoalById', () => {
    it('should return product goal by ID', async () => {
      mockReq.params = { id: 'goal-123' };
      const mockGoal = { id: 'goal-123', title: 'Test Goal' };

      (productGoalService.getProductGoalById as any).mockResolvedValue(mockGoal);

      getProductGoalById(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(productGoalService.getProductGoalById).toHaveBeenCalledWith('goal-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: mockGoal,
      });
    });

    it('should throw BadRequestError when ID is missing', async () => {
      mockReq.params = {};

      getProductGoalById(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Product goal ID is required');
    });

    it('should handle service errors', async () => {
      mockReq.params = { id: 'goal-123' };
      const error = new Error('Goal not found');

      (productGoalService.getProductGoalById as any).mockRejectedValue(error);

      getProductGoalById(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createProductGoal', () => {
    it('should create a new product goal', async () => {
      mockReq.userId = 'user-123';
      mockReq.body = { title: 'New Goal', description: 'Test description' };
      const mockGoal = { id: 'goal-123', title: 'New Goal' };

      (productGoalService.createProductGoal as any).mockResolvedValue(mockGoal);

      createProductGoal(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(productGoalService.createProductGoal).toHaveBeenCalledWith('user-123', mockReq.body);
      expect(mockRes._status).toBe(201);
      expect(mockRes._json).toEqual({
        success: true,
        data: mockGoal,
      });
    });

    it('should throw BadRequestError when user is not authenticated', async () => {
      mockReq.userId = undefined;
      mockReq.body = { title: 'New Goal' };

      createProductGoal(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('User not authenticated');
    });

    it('should handle service errors', async () => {
      mockReq.userId = 'user-123';
      mockReq.body = { title: 'New Goal' };
      const error = new Error('Validation error');

      (productGoalService.createProductGoal as any).mockRejectedValue(error);

      createProductGoal(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateProductGoal', () => {
    it('should update a product goal', async () => {
      mockReq.params = { id: 'goal-123' };
      mockReq.userId = 'user-123';
      mockReq.body = { title: 'Updated Goal' };
      const mockGoal = { id: 'goal-123', title: 'Updated Goal' };

      (productGoalService.updateProductGoal as any).mockResolvedValue(mockGoal);

      updateProductGoal(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(productGoalService.updateProductGoal).toHaveBeenCalledWith(
        'goal-123',
        'user-123',
        mockReq.body
      );
      expect(mockRes._json).toEqual({
        success: true,
        data: mockGoal,
      });
    });

    it('should throw BadRequestError when ID is missing', async () => {
      mockReq.params = {};
      mockReq.userId = 'user-123';

      updateProductGoal(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Product goal ID is required');
    });

    it('should throw BadRequestError when user is not authenticated', async () => {
      mockReq.params = { id: 'goal-123' };
      mockReq.userId = undefined;

      updateProductGoal(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('User not authenticated');
    });

    it('should handle service errors', async () => {
      mockReq.params = { id: 'goal-123' };
      mockReq.userId = 'user-123';
      const error = new Error('Goal not found');

      (productGoalService.updateProductGoal as any).mockRejectedValue(error);

      updateProductGoal(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteProductGoal', () => {
    it('should delete a product goal', async () => {
      mockReq.params = { id: 'goal-123' };
      mockReq.userId = 'user-123';

      (productGoalService.deleteProductGoal as any).mockResolvedValue(undefined);

      deleteProductGoal(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(productGoalService.deleteProductGoal).toHaveBeenCalledWith('goal-123', 'user-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: { message: 'Product goal deleted successfully' },
      });
    });

    it('should throw BadRequestError when ID is missing', async () => {
      mockReq.params = {};

      deleteProductGoal(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Product goal ID is required');
    });

    it('should throw BadRequestError when user is not authenticated', async () => {
      mockReq.params = { id: 'goal-123' };
      mockReq.userId = undefined;

      deleteProductGoal(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('User not authenticated');
    });

    it('should handle service errors', async () => {
      mockReq.params = { id: 'goal-123' };
      mockReq.userId = 'user-123';
      const error = new Error('Cannot delete active goal');

      (productGoalService.deleteProductGoal as any).mockRejectedValue(error);

      deleteProductGoal(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getActiveProductGoal', () => {
    it('should return active product goal for a team', async () => {
      mockReq.query = { teamId: 'team-123' };
      const mockGoal = { id: 'goal-123', title: 'Active Goal', status: 'ACTIVE' };

      (productGoalService.getActiveProductGoal as any).mockResolvedValue(mockGoal);

      getActiveProductGoal(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(productGoalService.getActiveProductGoal).toHaveBeenCalledWith('team-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: mockGoal,
      });
    });

    it('should return null when no active goal', async () => {
      mockReq.query = { teamId: 'team-123' };

      (productGoalService.getActiveProductGoal as any).mockResolvedValue(null);

      getActiveProductGoal(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes._json).toEqual({
        success: true,
        data: null,
      });
    });

    it('should throw BadRequestError when teamId is missing', async () => {
      mockReq.query = {};

      getActiveProductGoal(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should handle service errors', async () => {
      mockReq.query = { teamId: 'team-123' };
      const error = new Error('Database error');

      (productGoalService.getActiveProductGoal as any).mockRejectedValue(error);

      getActiveProductGoal(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getProductGoalStatusHistory', () => {
    it('should return status change history', async () => {
      mockReq.params = { id: 'goal-123' };
      const mockHistory = [{ id: 'history-1', fromStatus: 'DRAFT', toStatus: 'ACTIVE' }];

      (workflowService.getStatusChangeHistory as any).mockResolvedValue(mockHistory);

      getProductGoalStatusHistory(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(workflowService.getStatusChangeHistory).toHaveBeenCalledWith(
        'ProductGoal',
        'goal-123',
        50,
        0
      );
      expect(mockRes._json).toEqual({
        success: true,
        data: mockHistory,
      });
    });

    it('should throw BadRequestError when ID is missing', async () => {
      mockReq.params = {};

      getProductGoalStatusHistory(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Product goal ID is required');
    });

    it('should handle service errors', async () => {
      mockReq.params = { id: 'goal-123' };
      const error = new Error('Database error');

      (workflowService.getStatusChangeHistory as any).mockRejectedValue(error);

      getProductGoalStatusHistory(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
