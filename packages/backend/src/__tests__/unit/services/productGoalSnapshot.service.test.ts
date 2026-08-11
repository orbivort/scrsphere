import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../utils/prisma', () => ({
  default: {
    sprintReview: {
      findUnique: vi.fn(),
    },
    productBacklogItem: {
      findMany: vi.fn(),
    },
    productGoalSnapshot: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    productGoal: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../../utils/uuid', () => ({
  generateUUIDv7: vi.fn().mockReturnValue('test-uuid'),
}));

import { productGoalSnapshotService } from '../../../services/productGoalSnapshot.service';
import prisma from '../../../utils/prisma';
import { NotFoundError, BadRequestError } from '../../../utils/errors';

describe('ProductGoalSnapshotService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProductGoalForReview', () => {
    it('should return the product goal linked to the review sprint', async () => {
      vi.mocked(prisma.sprintReview.findUnique).mockResolvedValue({
        id: 'rev-1',
        reviewDate: new Date(),
        sprint: {
          id: 'sprint-1',
          name: 'Sprint 1',
          goalId: 'goal-1',
          goal: { id: 'goal-1', title: 'Launch', status: 'ACTIVE' },
        },
      } as any);

      const result = await productGoalSnapshotService.getProductGoalForReview('rev-1');

      expect(result.productGoal).not.toBeNull();
      expect(result.productGoal?.title).toBe('Launch');
    });

    it('should throw NotFoundError when review is missing', async () => {
      vi.mocked(prisma.sprintReview.findUnique).mockResolvedValue(null as any);

      await expect(productGoalSnapshotService.getProductGoalForReview('missing')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('createSnapshot', () => {
    it('should create a snapshot with computed PBI progress', async () => {
      vi.mocked(prisma.sprintReview.findUnique).mockResolvedValue({
        id: 'rev-1',
        sprint: { id: 'sprint-1', goalId: 'goal-1', teamId: 'team-1' },
      } as any);
      vi.mocked(prisma.productBacklogItem.findMany).mockResolvedValue([
        { id: 'p1', status: 'DONE', storyPoints: 5 },
        { id: 'p2', status: 'DONE', storyPoints: 3 },
        { id: 'p3', status: 'TO_DO', storyPoints: 2 },
      ] as any);
      vi.mocked(prisma.productGoalSnapshot.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.productGoalSnapshot.create).mockResolvedValue({
        id: 'snap-1',
        goalId: 'goal-1',
        sprintReviewId: 'rev-1',
      } as any);

      const result = await productGoalSnapshotService.createSnapshot('user-1', 'rev-1', {
        assessment: 'On track',
      });

      expect(result.id).toBe('snap-1');
      expect(prisma.productGoalSnapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          goalId: 'goal-1',
          sprintReviewId: 'rev-1',
          completedPbiCount: 2,
          completedStoryPoints: 8,
          assessment: 'On track',
        }),
      });
    });

    it('should throw BadRequestError when sprint has no product goal', async () => {
      vi.mocked(prisma.sprintReview.findUnique).mockResolvedValue({
        id: 'rev-1',
        sprint: { id: 'sprint-1', goalId: null, teamId: 'team-1' },
      } as any);

      await expect(
        productGoalSnapshotService.createSnapshot('user-1', 'rev-1', {})
      ).rejects.toThrow(BadRequestError);
    });
  });
});
