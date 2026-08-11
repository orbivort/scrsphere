// Increment Integration Service
// Ensures each Increment is additive and compatible with all prior Increments.
import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { generateUUIDv7 } from '../utils/uuid';
import type { IntegrationTestResult } from '../generated/prisma/client';

interface CreateIntegrationTestData {
  currentIncrementId: string;
  priorIncrementId: string;
  testResult: IntegrationTestResult;
  notes?: string;
}

export const incrementIntegrationService = {
  /**
   * Create (or update) an integration test between a current and a prior Increment.
   * A unique constraint on (currentIncrementId, priorIncrementId) means a re-run
   * overwrites the previous result rather than creating duplicates.
   */
  async createTest(userId: string, data: CreateIntegrationTestData) {
    const current = await prisma.increment.findUnique({
      where: { id: data.currentIncrementId },
    });
    if (!current) {
      throw new NotFoundError('Increment');
    }

    const prior = await prisma.increment.findUnique({
      where: { id: data.priorIncrementId },
    });
    if (!prior) {
      throw new NotFoundError('Prior Increment');
    }

    if (data.currentIncrementId === data.priorIncrementId) {
      throw new BadRequestError('Current and prior increment must be different');
    }

    if (prior.teamId !== current.teamId) {
      throw new BadRequestError('Prior increment must belong to the same team');
    }

    const existing = await prisma.incrementIntegrationTest.findUnique({
      where: {
        currentIncrementId_priorIncrementId: {
          currentIncrementId: data.currentIncrementId,
          priorIncrementId: data.priorIncrementId,
        },
      },
    });

    if (existing) {
      const updated = await prisma.incrementIntegrationTest.update({
        where: { id: existing.id },
        data: {
          testResult: data.testResult,
          testedById: userId,
          testedAt: new Date(),
          notes: data.notes ?? undefined,
          updatedBy: userId,
          updatedAt: new Date(),
        },
        include: {
          currentIncrement: { select: { id: true, name: true } },
          priorIncrement: { select: { id: true, name: true } },
          testedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      await this.refreshVerificationStatus(data.currentIncrementId);
      return this.serializeTest(updated);
    }

    const test = await prisma.incrementIntegrationTest.create({
      data: {
        id: generateUUIDv7(),
        currentIncrementId: data.currentIncrementId,
        priorIncrementId: data.priorIncrementId,
        testResult: data.testResult,
        testedById: userId,
        testedAt: new Date(),
        notes: data.notes,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        currentIncrement: { select: { id: true, name: true } },
        priorIncrement: { select: { id: true, name: true } },
        testedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.refreshVerificationStatus(data.currentIncrementId);
    return this.serializeTest(test);
  },

  async getTestsForIncrement(incrementId: string) {
    const increment = await prisma.increment.findUnique({ where: { id: incrementId } });
    if (!increment) {
      throw new NotFoundError('Increment');
    }

    const tests = await prisma.incrementIntegrationTest.findMany({
      where: { currentIncrementId: incrementId },
      include: {
        currentIncrement: { select: { id: true, name: true } },
        priorIncrement: { select: { id: true, name: true } },
        testedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { testedAt: 'desc' },
    });

    return tests.map((t) => this.serializeTest(t));
  },

  /**
   * Explicitly verify an Increment's integration status. All prior Increments in
   * the team must have PASSED integration tests against the current Increment
   * before integrationVerified becomes true.
   */
  async verifyIntegration(userId: string, incrementId: string) {
    const increment = await prisma.increment.findUnique({ where: { id: incrementId } });
    if (!increment) {
      throw new NotFoundError('Increment');
    }

    const priorIncrements = await prisma.increment.findMany({
      where: {
        teamId: increment.teamId,
        status: { in: ['VERIFIED', 'DELIVERED', 'ARCHIVED'] },
        NOT: { id: incrementId },
      },
      orderBy: { createdAt: 'asc' },
    });

    // First increment exemption: no prior increments to test against.
    if (priorIncrements.length === 0) {
      await this.setVerified(incrementId, true, userId);
      return { integrationVerified: true, priorCount: 0, allPassed: true };
    }

    const tests = await prisma.incrementIntegrationTest.findMany({
      where: { currentIncrementId: incrementId },
    });

    // Build a map of priorIncrementId -> result for quick lookup.
    const resultByPrior = new Map(tests.map((t) => [t.priorIncrementId, t.testResult]));
    const missing: string[] = [];
    const failed: string[] = [];

    for (const prior of priorIncrements) {
      const result = resultByPrior.get(prior.id);
      if (!result || result === 'PENDING') {
        missing.push(prior.name);
      } else if (result === 'FAILED') {
        failed.push(prior.name);
      }
    }

    const allPassed = missing.length === 0 && failed.length === 0;
    await this.setVerified(incrementId, allPassed, userId);

    return {
      integrationVerified: allPassed,
      priorCount: priorIncrements.length,
      allPassed,
      missingTests: missing,
      failedTests: failed,
    };
  },

  /**
   * Get the dependency chain of Increments for a team, newest first.
   */
  async getIncrementChain(incrementId: string) {
    const increment = await prisma.increment.findUnique({ where: { id: incrementId } });
    if (!increment) {
      throw new NotFoundError('Increment');
    }

    const increments = await prisma.increment.findMany({
      where: { teamId: increment.teamId },
      orderBy: { createdAt: 'asc' },
      include: {
        sprint: { select: { id: true, name: true } },
      },
    });

    const testCounts = await prisma.incrementIntegrationTest.groupBy({
      by: ['currentIncrementId'],
      _count: { _all: true },
    });
    const testCountMap = new Map(testCounts.map((t) => [t.currentIncrementId, t._count._all]));

    return increments
      .map((inc) => ({
        id: inc.id,
        name: inc.name,
        status: inc.status,
        integrationVerified: inc.integrationVerified,
        deliveredAt: inc.deliveredAt,
        sprintName: inc.sprint.name,
        hasTests: (testCountMap.get(inc.id) ?? 0) > 0,
        isCurrent: inc.id === incrementId,
      }))
      .reverse();
  },

  /**
   * Recompute and persist the integrationVerified flag for an Increment.
   */
  async refreshVerificationStatus(incrementId: string) {
    const increment = await prisma.increment.findUnique({ where: { id: incrementId } });
    if (!increment) {
      return;
    }

    const priorIncrements = await prisma.increment.findMany({
      where: {
        teamId: increment.teamId,
        status: { in: ['VERIFIED', 'DELIVERED', 'ARCHIVED'] },
        NOT: { id: incrementId },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (priorIncrements.length === 0) {
      await this.setVerified(incrementId, true, undefined);
      return;
    }

    const tests = await prisma.incrementIntegrationTest.findMany({
      where: { currentIncrementId: incrementId },
    });
    const resultByPrior = new Map(tests.map((t) => [t.priorIncrementId, t.testResult]));

    const allPassed = priorIncrements.every((prior) => resultByPrior.get(prior.id) === 'PASSED');
    await this.setVerified(incrementId, allPassed, undefined);
  },

  async setVerified(incrementId: string, value: boolean, userId?: string) {
    await prisma.increment.update({
      where: { id: incrementId },
      data: {
        integrationVerified: value,
        ...(userId ? { updatedBy: userId } : {}),
        updatedAt: new Date(),
      },
    });
  },

  serializeTest(test: {
    id: string;
    currentIncrementId: string;
    priorIncrementId: string;
    testResult: IntegrationTestResult;
    testedById: string;
    testedAt: Date;
    notes?: string | null;
    priorIncrement?: { id: string; name: string } | null;
    testedBy?: { id: string; firstName: string; lastName: string } | null;
  }) {
    return {
      id: test.id,
      currentIncrementId: test.currentIncrementId,
      priorIncrementId: test.priorIncrementId,
      testResult: test.testResult,
      testedById: test.testedById,
      testedAt: test.testedAt.toISOString(),
      notes: test.notes ?? null,
      priorIncrementName: test.priorIncrement?.name ?? null,
      testerName: test.testedBy ? `${test.testedBy.firstName} ${test.testedBy.lastName}` : null,
    };
  },
};
