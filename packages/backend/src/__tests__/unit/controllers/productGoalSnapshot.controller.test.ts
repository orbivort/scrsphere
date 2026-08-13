import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getProductGoalForReview,
  submitProductGoalAssessment,
  getGoalSnapshots,
} from '../../../controllers/productGoalSnapshot.controller';
import { productGoalSnapshotService } from '../../../services/productGoalSnapshot.service';
import { BadRequestError } from '../../../utils/errors';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup/testSetup';

vi.mock('../../../services/productGoalSnapshot.service', () => ({
  productGoalSnapshotService: {
    getProductGoalForReview: vi.fn(),
    createSnapshot: vi.fn(),
    getSnapshotsForGoal: vi.fn(),
  },
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('ProductGoalSnapshot Controller', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('getProductGoalForReview', () => {
    it('should return the product goal linked to a sprint review', async () => {
      mockReq.params = { id: 'review-123' };
      const mockResult = {
        reviewId: 'review-123',
        reviewDate: new Date(),
        sprintId: 'sprint-1',
        sprintName: 'Sprint 1',
        productGoal: { id: 'goal-1', title: 'Goal 1' },
      };

      vi.spyOn(productGoalSnapshotService, 'getProductGoalForReview').mockResolvedValue(
        mockResult as any
      );

      getProductGoalForReview(mockReq as any, mockRes as any, mockNext);
      await flush();

      expect(mockNext).not.toHaveBeenCalled();
      expect(productGoalSnapshotService.getProductGoalForReview).toHaveBeenCalledWith('review-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: mockResult,
      });
    });

    it('should throw BadRequestError when id is missing', async () => {
      mockReq.params = {};

      getProductGoalForReview(mockReq as any, mockRes as any, mockNext);
      await flush();

      // BadRequestError is raised before the service is ever reached, so the
      // guard short-circuits. No service interaction should occur.
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Product Goal ID is required');
    });

    it('should throw BadRequestError when id is an empty string', async () => {
      mockReq.params = { id: '' };

      getProductGoalForReview(mockReq as any, mockRes as any, mockNext);
      await flush();

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should pass through service errors', async () => {
      mockReq.params = { id: 'review-123' };
      const error = new Error('Database error');

      vi.spyOn(productGoalSnapshotService, 'getProductGoalForReview').mockRejectedValue(error);

      getProductGoalForReview(mockReq as any, mockRes as any, mockNext);
      await flush();

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('submitProductGoalAssessment', () => {
    it('should create a snapshot with the authenticated user id and return 201', async () => {
      mockReq.params = { id: 'review-456' };
      mockReq.user = { id: 'user-1' };
      mockReq.body = {
        assessment: 'On track',
        successMetricValues: { coverage: 80 },
      };
      const mockSnapshot = { id: 'snap-1', assessment: 'On track' };

      vi.spyOn(productGoalSnapshotService, 'createSnapshot').mockResolvedValue(mockSnapshot as any);

      submitProductGoalAssessment(mockReq as any, mockRes as any, mockNext);
      await flush();

      expect(mockNext).not.toHaveBeenCalled();
      expect(productGoalSnapshotService.createSnapshot).toHaveBeenCalledWith(
        'user-1',
        'review-456',
        {
          assessment: 'On track',
          successMetricValues: { coverage: 80 },
        }
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes._json).toEqual({
        success: true,
        data: mockSnapshot,
      });
    });

    it('should fall back to empty string userId when req.user is undefined', async () => {
      mockReq.params = { id: 'review-456' };
      mockReq.user = undefined;
      mockReq.body = { assessment: 'Done' };
      const mockSnapshot = { id: 'snap-2' };

      vi.spyOn(productGoalSnapshotService, 'createSnapshot').mockResolvedValue(mockSnapshot as any);

      submitProductGoalAssessment(mockReq as any, mockRes as any, mockNext);
      await flush();

      expect(productGoalSnapshotService.createSnapshot).toHaveBeenCalledWith('', 'review-456', {
        assessment: 'Done',
        successMetricValues: undefined,
      });
    });

    it('should throw BadRequestError when id is missing', async () => {
      mockReq.params = {};
      mockReq.user = { id: 'user-1' };
      mockReq.body = { assessment: 'Done' };

      submitProductGoalAssessment(mockReq as any, mockRes as any, mockNext);
      await flush();

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Product Goal ID is required');
    });

    it('should pass through service errors', async () => {
      mockReq.params = { id: 'review-456' };
      mockReq.user = { id: 'user-1' };
      mockReq.body = { assessment: 'Done' };
      const error = new Error('Not found');

      vi.spyOn(productGoalSnapshotService, 'createSnapshot').mockRejectedValue(error);

      submitProductGoalAssessment(mockReq as any, mockRes as any, mockNext);
      await flush();

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle undefined successMetricValues in body', async () => {
      mockReq.params = { id: 'review-456' };
      mockReq.user = { id: 'user-1' };
      mockReq.body = { assessment: 'Done' };
      const mockSnapshot = { id: 'snap-3' };

      vi.spyOn(productGoalSnapshotService, 'createSnapshot').mockResolvedValue(mockSnapshot as any);

      submitProductGoalAssessment(mockReq as any, mockRes as any, mockNext);
      await flush();

      expect(productGoalSnapshotService.createSnapshot).toHaveBeenCalledWith(
        'user-1',
        'review-456',
        {
          assessment: 'Done',
          successMetricValues: undefined,
        }
      );
    });
  });

  describe('getGoalSnapshots', () => {
    it('should return all snapshots for a product goal', async () => {
      mockReq.params = { id: 'goal-789' };
      const mockSnapshots = [
        { id: 'snap-1', goalId: 'goal-789', sprintName: 'Sprint 1' },
        { id: 'snap-2', goalId: 'goal-789', sprintName: 'Sprint 2' },
      ];

      vi.spyOn(productGoalSnapshotService, 'getSnapshotsForGoal').mockResolvedValue(
        mockSnapshots as any
      );

      getGoalSnapshots(mockReq as any, mockRes as any, mockNext);
      await flush();

      expect(mockNext).not.toHaveBeenCalled();
      expect(productGoalSnapshotService.getSnapshotsForGoal).toHaveBeenCalledWith('goal-789');
      expect(mockRes._json).toEqual({
        success: true,
        data: mockSnapshots,
      });
    });

    it('should return an empty list when there are no snapshots', async () => {
      mockReq.params = { id: 'goal-789' };

      vi.spyOn(productGoalSnapshotService, 'getSnapshotsForGoal').mockResolvedValue([]);

      getGoalSnapshots(mockReq as any, mockRes as any, mockNext);
      await flush();

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes._json).toEqual({
        success: true,
        data: [],
      });
    });

    it('should throw BadRequestError when id is missing', async () => {
      mockReq.params = {};

      getGoalSnapshots(mockReq as any, mockRes as any, mockNext);
      await flush();

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Product Goal ID is required');
    });

    it('should pass through service errors', async () => {
      mockReq.params = { id: 'goal-789' };
      const error = new Error('Database error');

      vi.spyOn(productGoalSnapshotService, 'getSnapshotsForGoal').mockRejectedValue(error);

      getGoalSnapshots(mockReq as any, mockRes as any, mockNext);
      await flush();

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
