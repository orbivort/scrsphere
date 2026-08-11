import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../utils/prisma', () => ({
  default: {
    increment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    incrementIntegrationTest: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('../../../utils/uuid', () => ({
  generateUUIDv7: vi.fn().mockReturnValue('test-uuid'),
}));

import { incrementIntegrationService } from '../../../services/incrementIntegration.service';
import prisma from '../../../utils/prisma';
import { NotFoundError, BadRequestError } from '../../../utils/errors';

describe('IncrementIntegrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTest', () => {
    it('should create a new integration test', async () => {
      const currentIncrementId = 'inc-current';
      const priorIncrementId = 'inc-prior';
      const currentIncrement = {
        id: currentIncrementId,
        teamId: 'team-1',
        status: 'DRAFT',
        name: 'Current',
      };
      const priorIncrement = {
        id: priorIncrementId,
        teamId: 'team-1',
        status: 'DELIVERED',
        name: 'Prior',
      };

      vi.mocked(prisma.increment.findUnique).mockResolvedValueOnce(currentIncrement as any);
      vi.mocked(prisma.increment.findUnique).mockResolvedValueOnce(priorIncrement as any);
      vi.mocked(prisma.incrementIntegrationTest.findUnique).mockResolvedValueOnce(null as any);
      vi.mocked(prisma.incrementIntegrationTest.create).mockResolvedValue({
        id: 'test-uuid',
        currentIncrementId,
        priorIncrementId,
        testResult: 'PASSED',
        testedById: 'user-1',
        testedAt: new Date(),
        notes: null,
        currentIncrement: { id: currentIncrementId, name: 'Current' },
        priorIncrement: { id: priorIncrementId, name: 'Prior' },
        testedBy: { id: 'user-1', firstName: 'Jane', lastName: 'Doe' },
      } as any);
      vi.mocked(prisma.increment.update).mockResolvedValue({} as any);

      const result = await incrementIntegrationService.createTest('user-1', {
        currentIncrementId,
        priorIncrementId,
        testResult: 'PASSED',
      });

      expect(result.testResult).toBe('PASSED');
      expect(result.priorIncrementName).toBe('Prior');

      const createCall = vi.mocked(prisma.incrementIntegrationTest.create).mock.calls[0]?.[0];
      expect(createCall).toBeDefined();
      if (createCall && 'data' in createCall) {
        expect(createCall.data).toMatchObject({
          currentIncrementId,
          priorIncrementId,
          testResult: 'PASSED',
          testedById: 'user-1',
        });
      }
    });

    it('should throw NotFoundError when current increment is missing', async () => {
      vi.mocked(prisma.increment.findUnique).mockResolvedValueOnce(null as any);

      await expect(
        incrementIntegrationService.createTest('user-1', {
          currentIncrementId: 'missing',
          priorIncrementId: 'prior',
          testResult: 'PASSED',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when increments belong to different teams', async () => {
      vi.mocked(prisma.increment.findUnique).mockResolvedValueOnce({
        id: 'inc-current',
        teamId: 'team-1',
      } as any);
      vi.mocked(prisma.increment.findUnique).mockResolvedValueOnce({
        id: 'inc-prior',
        teamId: 'team-2',
      } as any);

      await expect(
        incrementIntegrationService.createTest('user-1', {
          currentIncrementId: 'inc-current',
          priorIncrementId: 'inc-prior',
          testResult: 'PASSED',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('verifyIntegration', () => {
    it('should mark first increment as verified (no prior increments)', async () => {
      vi.mocked(prisma.increment.findUnique).mockResolvedValueOnce({
        id: 'inc-1',
        teamId: 'team-1',
        status: 'DRAFT',
      } as any);
      vi.mocked(prisma.increment.findMany).mockResolvedValueOnce([] as any);
      vi.mocked(prisma.increment.update).mockResolvedValue({} as any);

      const result = await incrementIntegrationService.verifyIntegration('user-1', 'inc-1');

      expect(result.integrationVerified).toBe(true);
      expect(result.priorCount).toBe(0);
      expect(prisma.increment.update).toHaveBeenCalledWith({
        where: { id: 'inc-1' },
        data: expect.objectContaining({ integrationVerified: true }),
      });
    });

    it('should set verified=false when a prior increment has a FAILED test', async () => {
      vi.mocked(prisma.increment.findUnique).mockResolvedValueOnce({
        id: 'inc-current',
        teamId: 'team-1',
        status: 'DRAFT',
      } as any);
      vi.mocked(prisma.increment.findMany).mockResolvedValueOnce([
        { id: 'inc-prior', name: 'Prior', status: 'DELIVERED' },
      ] as any);
      vi.mocked(prisma.incrementIntegrationTest.findMany).mockResolvedValueOnce([
        { priorIncrementId: 'inc-prior', testResult: 'FAILED' },
      ] as any);
      vi.mocked(prisma.increment.update).mockResolvedValue({} as any);

      const result = await incrementIntegrationService.verifyIntegration('user-1', 'inc-current');

      expect(result.integrationVerified).toBe(false);
      expect(result.failedTests).toEqual(['Prior']);
      expect(prisma.increment.update).toHaveBeenCalledWith({
        where: { id: 'inc-current' },
        data: expect.objectContaining({ integrationVerified: false }),
      });
    });
  });
});
