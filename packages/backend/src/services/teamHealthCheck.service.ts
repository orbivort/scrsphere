// Team Health Check Service
// Periodic anonymous surveys measuring adherence to the five Scrum Values
// (Commitment, Focus, Openness, Respect, Courage) on a 1-5 scale.
import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { generateUUIDv7 } from '../utils/uuid';
import { ScrumValue } from '../generated/prisma/client';

const SCRUM_VALUES = [
  ScrumValue.COMMITMENT,
  ScrumValue.FOCUS,
  ScrumValue.OPENNESS,
  ScrumValue.RESPECT,
  ScrumValue.COURAGE,
];

interface SubmitResponseData {
  responses: Array<{
    scrumValue: ScrumValue;
    score: number;
    anonymous: boolean;
  }>;
}

export const teamHealthCheckService = {
  /**
   * Create a new health check for a team (optionally tied to a Sprint).
   */
  async createHealthCheck(teamId: string, sprintId?: string, createdBy?: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundError('Team');
    }

    return prisma.teamHealthCheck.create({
      data: {
        id: generateUUIDv7(),
        teamId,
        sprintId,
        createdBy,
        updatedBy: createdBy,
      },
      include: { responses: true },
    });
  },

  /**
   * Submit responses for a health check. Prevents duplicate submissions for
   * the same (healthCheckId, userId, scrumValue) combination.
   */
  async submitResponses(userId: string, healthCheckId: string, data: SubmitResponseData) {
    const healthCheck = await prisma.teamHealthCheck.findUnique({
      where: { id: healthCheckId },
    });
    if (!healthCheck) {
      throw new NotFoundError('Health Check');
    }

    if (data.responses.length > SCRUM_VALUES.length) {
      throw new BadRequestError('Too many responses submitted');
    }

    // Enforce the 1-5 scale and valid Scrum values.
    for (const r of data.responses) {
      if (r.score < 1 || r.score > 5) {
        throw new BadRequestError('Score must be between 1 and 5');
      }
      if (!SCRUM_VALUES.includes(r.scrumValue)) {
        throw new BadRequestError('Invalid Scrum value');
      }
    }

    // Upsert each response (unique on healthCheckId, userId, scrumValue).
    const saved: Array<{ scrumValue: ScrumValue; score: number }> = [];
    for (const r of data.responses) {
      const existing = await prisma.teamHealthCheckResponse.findUnique({
        where: {
          healthCheckId_userId_scrumValue: {
            healthCheckId,
            userId,
            scrumValue: r.scrumValue,
          },
        },
      });

      if (existing) {
        const updated = await prisma.teamHealthCheckResponse.update({
          where: { id: existing.id },
          data: { score: r.score, anonymous: r.anonymous, updatedBy: userId },
        });
        saved.push({ scrumValue: updated.scrumValue, score: updated.score });
      } else {
        const created = await prisma.teamHealthCheckResponse.create({
          data: {
            id: generateUUIDv7(),
            healthCheckId,
            userId,
            scrumValue: r.scrumValue,
            score: r.score,
            anonymous: r.anonymous,
            createdBy: userId,
            updatedBy: userId,
          },
        });
        saved.push({ scrumValue: created.scrumValue, score: created.score });
      }
    }

    return { healthCheckId, saved };
  },

  /**
   * Get aggregated results for a health check, grouped by Scrum Value.
   */
  async getResults(healthCheckId: string) {
    const healthCheck = await prisma.teamHealthCheck.findUnique({
      where: { id: healthCheckId },
      include: { responses: true },
    });
    if (!healthCheck) {
      throw new NotFoundError('Health Check');
    }

    const results = SCRUM_VALUES.map((value) => {
      const valueResponses = healthCheck.responses.filter((r) => r.scrumValue === value);
      const averageScore =
        valueResponses.length > 0
          ? Math.round(
              (valueResponses.reduce((sum, r) => sum + r.score, 0) / valueResponses.length) * 10
            ) / 10
          : 0;
      return {
        scrumValue: value,
        averageScore,
        responseCount: valueResponses.length,
      };
    });

    const overallAverage =
      results.reduce((sum, r) => sum + r.averageScore, 0) / Math.max(results.length, 1);

    return {
      healthCheckId,
      status: healthCheck.status,
      createdAt: healthCheck.createdAt.toISOString(),
      results,
      overallAverage: Math.round(overallAverage * 10) / 10,
    };
  },

  /**
   * Get the trend of health check averages over time for a team.
   */
  async getTrend(teamId: string) {
    const healthChecks = await prisma.teamHealthCheck.findMany({
      where: { teamId },
      include: { responses: true },
      orderBy: { createdAt: 'asc' },
    });

    return healthChecks.map((hc) => {
      const byValue = SCRUM_VALUES.map((value) => {
        const responses = hc.responses.filter((r) => r.scrumValue === value);
        return responses.length > 0
          ? responses.reduce((sum, r) => sum + r.score, 0) / responses.length
          : 0;
      });
      const overall =
        byValue.filter((v) => v > 0).length > 0
          ? byValue.reduce((sum, v) => sum + v, 0) /
            Math.max(byValue.filter((v) => v > 0).length, 1)
          : 0;

      return {
        healthCheckId: hc.id,
        createdAt: hc.createdAt.toISOString(),
        overallAverage: Math.round(overall * 10) / 10,
        values: SCRUM_VALUES.map((value, i) => ({
          scrumValue: value,
          averageScore: Math.round((byValue[i] ?? 0) * 10) / 10,
        })),
      };
    });
  },

  /**
   * Latest health check results for a team (for SM dashboard).
   */
  async getLatestForTeam(teamId: string) {
    const latest = await prisma.teamHealthCheck.findFirst({
      where: { teamId },
      include: { responses: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      return null;
    }

    return this.getResults(latest.id);
  },
};
