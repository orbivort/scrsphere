import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getProductBacklog,
  getPBIById,
  createPBI,
  updatePBI,
  updatePriority,
  deletePBI,
  reorderPBIs,
  createPBIBulk,
} from '../../../controllers/backlog.controller';
import { productBacklogService } from '../../../services/backlog.service';
import { BadRequestError } from '../../../utils/errors';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup/testSetup';

vi.mock('../../../services/backlog.service', () => ({
  productBacklogService: {
    getProductBacklog: vi.fn(),
    getPBIById: vi.fn(),
    createPBI: vi.fn(),
    updatePBI: vi.fn(),
    updatePriority: vi.fn(),
    deletePBI: vi.fn(),
    reorderPBIs: vi.fn(),
    createPBIBulk: vi.fn(),
  },
}));

describe('Backlog Controller', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('getProductBacklog', () => {
    it('should return product backlog for a team', async () => {
      mockReq.query = { teamId: 'team-123' };
      const mockBacklog = {
        items: [{ id: 'pbi-1', title: 'Test PBI', status: 'NEW' }],
        total: 1,
      };

      (productBacklogService.getProductBacklog as any).mockResolvedValue(mockBacklog);

      getProductBacklog(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(productBacklogService.getProductBacklog).toHaveBeenCalledWith('team-123', {
        status: undefined,
        labels: undefined,
        page: undefined,
        limit: undefined,
      });
      expect(mockRes._json).toEqual(mockBacklog);
    });

    it('should throw BadRequestError when teamId is missing', async () => {
      mockReq.query = {};

      getProductBacklog(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('teamId is required');
    });

    it('should throw BadRequestError when teamId is not a string', async () => {
      mockReq.query = { teamId: ['team-123'] };

      getProductBacklog(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should pass filter parameters to service', async () => {
      mockReq.query = {
        teamId: 'team-123',
        status: 'IN_PROGRESS',
        labels: 'bug,urgent',
        page: '2',
        limit: '10',
      };
      const mockBacklog = { items: [], total: 0 };

      (productBacklogService.getProductBacklog as any).mockResolvedValue(mockBacklog);

      getProductBacklog(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(productBacklogService.getProductBacklog).toHaveBeenCalledWith('team-123', {
        status: 'IN_PROGRESS',
        labels: 'bug,urgent',
        page: 2,
        limit: 10,
      });
    });

    it('should handle service errors', async () => {
      mockReq.query = { teamId: 'team-123' };
      const error = new Error('Database error');

      (productBacklogService.getProductBacklog as any).mockRejectedValue(error);

      getProductBacklog(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getPBIById', () => {
    it('should return PBI by ID', async () => {
      mockReq.params = { id: 'pbi-123' };
      const mockPBI = { id: 'pbi-123', title: 'Test PBI' };

      (productBacklogService.getPBIById as any).mockResolvedValue(mockPBI);

      getPBIById(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(productBacklogService.getPBIById).toHaveBeenCalledWith('pbi-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: mockPBI,
      });
    });

    it('should throw BadRequestError when ID is missing', async () => {
      mockReq.params = {};

      getPBIById(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('PBI ID is required');
    });

    it('should handle service errors', async () => {
      mockReq.params = { id: 'pbi-123' };
      const error = new Error('PBI not found');

      (productBacklogService.getPBIById as any).mockRejectedValue(error);

      getPBIById(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createPBI', () => {
    it('should create a new PBI', async () => {
      mockReq.userId = 'user-123';
      mockReq.body = { title: 'New PBI', description: 'Test description' };
      const mockPBI = { id: 'pbi-123', title: 'New PBI' };

      (productBacklogService.createPBI as any).mockResolvedValue(mockPBI);

      createPBI(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(productBacklogService.createPBI).toHaveBeenCalledWith('user-123', mockReq.body);
      expect(mockRes._status).toBe(201);
      expect(mockRes._json).toEqual({
        success: true,
        data: mockPBI,
      });
    });

    it('should throw BadRequestError when user is not authenticated', async () => {
      mockReq.userId = undefined;
      mockReq.body = { title: 'New PBI' };

      createPBI(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('User not authenticated');
    });

    it('should handle service errors', async () => {
      mockReq.userId = 'user-123';
      mockReq.body = { title: 'New PBI' };
      const error = new Error('Validation error');

      (productBacklogService.createPBI as any).mockRejectedValue(error);

      createPBI(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updatePBI', () => {
    it('should update a PBI', async () => {
      mockReq.params = { id: 'pbi-123' };
      mockReq.userId = 'user-123';
      mockReq.body = { title: 'Updated PBI' };
      const mockPBI = { id: 'pbi-123', title: 'Updated PBI' };

      (productBacklogService.updatePBI as any).mockResolvedValue(mockPBI);

      updatePBI(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(productBacklogService.updatePBI).toHaveBeenCalledWith(
        'pbi-123',
        'user-123',
        mockReq.body
      );
      expect(mockRes._json).toEqual({
        success: true,
        data: mockPBI,
      });
    });

    it('should throw BadRequestError when ID is missing', async () => {
      mockReq.params = {};
      mockReq.userId = 'user-123';

      updatePBI(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('PBI ID is required');
    });

    it('should throw BadRequestError when user is not authenticated', async () => {
      mockReq.params = { id: 'pbi-123' };
      mockReq.userId = undefined;

      updatePBI(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('User not authenticated');
    });

    it('should handle service errors', async () => {
      mockReq.params = { id: 'pbi-123' };
      mockReq.userId = 'user-123';
      mockReq.body = { title: 'Updated PBI' };
      const error = new Error('PBI not found');

      (productBacklogService.updatePBI as any).mockRejectedValue(error);

      updatePBI(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updatePriority', () => {
    it('should update PBI priority', async () => {
      mockReq.params = { id: 'pbi-123' };
      mockReq.body = { priority: 'MUST_HAVE' };
      const mockPBI = { id: 'pbi-123', priority: 'MUST_HAVE' };

      (productBacklogService.updatePriority as any).mockResolvedValue(mockPBI);

      updatePriority(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(productBacklogService.updatePriority).toHaveBeenCalledWith('pbi-123', 'MUST_HAVE');
      expect(mockRes._json).toEqual({
        success: true,
        data: mockPBI,
      });
    });

    it('should throw BadRequestError when ID is missing', async () => {
      mockReq.params = {};

      updatePriority(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('PBI ID is required');
    });

    it('should handle service errors', async () => {
      mockReq.params = { id: 'pbi-123' };
      mockReq.body = { priority: 'INVALID' };
      const error = new Error('Invalid priority');

      (productBacklogService.updatePriority as any).mockRejectedValue(error);

      updatePriority(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deletePBI', () => {
    it('should delete a PBI', async () => {
      mockReq.params = { id: 'pbi-123' };
      mockReq.userId = 'user-123';

      (productBacklogService.deletePBI as any).mockResolvedValue(undefined);

      deletePBI(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(productBacklogService.deletePBI).toHaveBeenCalledWith('pbi-123', 'user-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: { message: 'Item deleted successfully' },
      });
    });

    it('should throw BadRequestError when ID is missing', async () => {
      mockReq.params = {};

      deletePBI(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('PBI ID is required');
    });

    it('should throw BadRequestError when user is not authenticated', async () => {
      mockReq.params = { id: 'pbi-123' };
      mockReq.userId = undefined;

      deletePBI(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('User not authenticated');
    });

    it('should handle service errors', async () => {
      mockReq.params = { id: 'pbi-123' };
      mockReq.userId = 'user-123';
      const error = new Error('PBI not found');

      (productBacklogService.deletePBI as any).mockRejectedValue(error);

      deletePBI(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('reorderPBIs', () => {
    it('should reorder PBIs', async () => {
      mockReq.body = { pbiIds: ['pbi-1', 'pbi-2', 'pbi-3'] };

      (productBacklogService.reorderPBIs as any).mockResolvedValue(undefined);

      reorderPBIs(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(productBacklogService.reorderPBIs).toHaveBeenCalledWith(['pbi-1', 'pbi-2', 'pbi-3']);
      expect(mockRes._json).toEqual({
        success: true,
        data: { message: 'Items reordered successfully' },
      });
    });

    it('should handle empty pbiIds array', async () => {
      mockReq.body = { pbiIds: [] };

      (productBacklogService.reorderPBIs as any).mockResolvedValue(undefined);

      reorderPBIs(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(productBacklogService.reorderPBIs).toHaveBeenCalledWith([]);
    });

    it('should handle service errors', async () => {
      mockReq.body = { pbiIds: ['pbi-1'] };
      const error = new Error('Invalid PBI ID');

      (productBacklogService.reorderPBIs as any).mockRejectedValue(error);

      reorderPBIs(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createPBIBulk', () => {
    it('should call service.createPBIBulk with items and userId', async () => {
      mockReq.userId = 'user-123';
      const mockItems = [
        { teamId: 'team-123', title: 'Item 1' },
        { teamId: 'team-123', title: 'Item 2' },
      ];
      mockReq.body = mockItems;
      const mockResult = {
        successful: 2,
        failed: 0,
        errors: [],
        createdItems: [
          { id: 'pbi-1', title: 'Item 1' },
          { id: 'pbi-2', title: 'Item 2' },
        ],
      };

      (productBacklogService.createPBIBulk as any).mockResolvedValue(mockResult);

      createPBIBulk(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(productBacklogService.createPBIBulk).toHaveBeenCalledWith('user-123', mockItems);
      expect(mockRes._status).toBe(201);
      expect(mockRes._json).toEqual({
        success: true,
        data: mockResult,
      });
    });

    it('should throw BadRequestError if user is not authenticated', async () => {
      mockReq.userId = undefined;
      mockReq.body = [{ teamId: 'team-123', title: 'Item 1' }];

      createPBIBulk(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('User not authenticated');
    });

    it('should return 201 with bulk result on success', async () => {
      mockReq.userId = 'user-123';
      const mockItems = [{ teamId: 'team-123', title: 'Item 1' }];
      mockReq.body = mockItems;
      const mockResult = {
        successful: 1,
        failed: 0,
        errors: [],
        createdItems: [{ id: 'pbi-1', title: 'Item 1' }],
      };

      (productBacklogService.createPBIBulk as any).mockResolvedValue(mockResult);

      createPBIBulk(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes._status).toBe(201);
      expect(mockRes._json).toEqual({
        success: true,
        data: mockResult,
      });
    });
  });
});
