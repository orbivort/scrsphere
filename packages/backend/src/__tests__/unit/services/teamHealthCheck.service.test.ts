import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../utils/prisma', () => ({
  default: {
    team: {
      findUnique: vi.fn(),
    },
    teamHealthCheck: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    teamHealthCheckResponse: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../../../utils/uuid', () => ({
  generateUUIDv7: vi.fn().mockReturnValue('test-uuid'),
}));

import { teamHealthCheckService } from '../../../services/teamHealthCheck.service';
import prisma from '../../../utils/prisma';
import { NotFoundError, BadRequestError } from '../../../utils/errors';

describe('TeamHealthCheckService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createHealthCheck', () => {
    it('should create a health check for a team', async () => {
      vi.mocked(prisma.team.findUnique).mockResolvedValue({ id: 'team-1' } as any);
      vi.mocked(prisma.teamHealthCheck.create).mockResolvedValue({
        id: 'hc-1',
        teamId: 'team-1',
        status: 'OPEN',
        responses: [],
      } as any);

      const result = await teamHealthCheckService.createHealthCheck('team-1');

      expect(result.id).toBe('hc-1');
      expect(prisma.teamHealthCheck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ teamId: 'team-1' }),
        include: { responses: true },
      });
    });

    it('should throw NotFoundError when team is missing', async () => {
      vi.mocked(prisma.team.findUnique).mockResolvedValue(null as any);

      await expect(teamHealthCheckService.createHealthCheck('missing')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('submitResponses', () => {
    it('should reject out-of-range scores', async () => {
      vi.mocked(prisma.teamHealthCheck.findUnique).mockResolvedValue({
        id: 'hc-1',
        status: 'OPEN',
      } as any);

      await expect(
        teamHealthCheckService.submitResponses('user-1', 'hc-1', {
          responses: [{ scrumValue: 'COMMITMENT', score: 6, anonymous: false }],
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should save responses for each Scrum value', async () => {
      vi.mocked(prisma.teamHealthCheck.findUnique).mockResolvedValue({
        id: 'hc-1',
        status: 'OPEN',
      } as any);
      vi.mocked(prisma.teamHealthCheckResponse.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.teamHealthCheckResponse.create).mockResolvedValue({
        id: 'r-1',
        scrumValue: 'COMMITMENT',
        score: 4,
      } as any);

      const result = await teamHealthCheckService.submitResponses('user-1', 'hc-1', {
        responses: [{ scrumValue: 'COMMITMENT', score: 4, anonymous: true }],
      });

      expect(result.saved).toHaveLength(1);
      expect(result.saved[0]).toEqual({ scrumValue: 'COMMITMENT', score: 4 });
    });
  });

  describe('getResults', () => {
    it('should compute average scores per Scrum value', async () => {
      vi.mocked(prisma.teamHealthCheck.findUnique).mockResolvedValue({
        id: 'hc-1',
        status: 'OPEN',
        createdAt: new Date(),
        responses: [
          { id: 'r1', scrumValue: 'COMMITMENT', score: 4 },
          { id: 'r2', scrumValue: 'COMMITMENT', score: 5 },
          { id: 'r3', scrumValue: 'FOCUS', score: 3 },
        ],
      } as any);

      const result = await teamHealthCheckService.getResults('hc-1');

      const commitment = result.results.find((r) => r.scrumValue === 'COMMITMENT');
      expect(commitment?.averageScore).toBe(4.5);
      expect(commitment?.responseCount).toBe(2);
      expect(result.results).toHaveLength(5);
    });
  });
});
