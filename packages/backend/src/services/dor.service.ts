import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { generateUUIDv7 } from '../utils/uuid';
import type { DoRItem, DoRChecklistVerification } from '../generated/prisma/client';

type DefinitionOfReadyWithItems = Awaited<
  ReturnType<typeof prisma.definitionOfReady.findUnique>
> & { items: DoRItem[] };

interface DoRItemInput {
  id?: string;
  description: string;
  category?: string;
  isActive: boolean;
  order: number;
}

interface DoRVerificationInput {
  dorItemId: string;
  isVerified: boolean;
  notes?: string;
}

class DefinitionOfReadyService {
  async getDefinitionOfReady(teamId: string): Promise<DefinitionOfReadyWithItems | null> {
    const dor = await prisma.definitionOfReady.findUnique({
      where: { teamId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return dor as DefinitionOfReadyWithItems | null;
  }

  async createDefaultDefinitionOfReady(
    teamId: string,
    userId?: string
  ): Promise<DefinitionOfReadyWithItems> {
    const dorId = generateUUIDv7();
    const defaultItems: DoRItemInput[] = [
      {
        description: 'Clear title and description provided',
        category: 'documentation',
        isActive: true,
        order: 0,
      },
      {
        description: 'Acceptance criteria defined and agreed',
        category: 'documentation',
        isActive: true,
        order: 1,
      },
      {
        description: 'Story points estimated by the team',
        category: 'estimation',
        isActive: true,
        order: 2,
      },
      {
        description: 'Business value assigned',
        category: 'estimation',
        isActive: true,
        order: 3,
      },
      {
        description: 'Dependencies identified and documented',
        category: 'dependencies',
        isActive: true,
        order: 4,
      },
      {
        description: 'No blockers or impediments',
        category: 'dependencies',
        isActive: true,
        order: 5,
      },
    ];

    const dor = await prisma.definitionOfReady.create({
      data: {
        id: dorId,
        teamId,
        version: 1,
        createdBy: userId,
        items: {
          create: defaultItems.map((item, index) => ({
            id: generateUUIDv7(),
            description: item.description,
            category: item.category ?? 'documentation',
            isActive: item.isActive,
            order: index,
            createdBy: userId,
          })),
        },
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return dor as DefinitionOfReadyWithItems;
  }

  async updateDefinitionOfReady(
    teamId: string,
    items: DoRItemInput[],
    userId?: string
  ): Promise<DefinitionOfReadyWithItems> {
    const existingDor = await prisma.definitionOfReady.findUnique({
      where: { teamId },
    });

    if (!existingDor) {
      return this.createDefaultDefinitionOfReady(teamId, userId).then(() =>
        this.updateDefinitionOfReady(teamId, items, userId)
      );
    }

    await prisma.doRItem.deleteMany({
      where: { dorId: existingDor.id },
    });

    const dor = await prisma.definitionOfReady.update({
      where: { id: existingDor.id },
      data: {
        version: { increment: 1 },
        updatedBy: userId,
        items: {
          create: items.map((item, index) => ({
            id: generateUUIDv7(),
            description: item.description,
            category: item.category ?? 'documentation',
            isActive: item.isActive,
            order: index,
            createdBy: userId,
          })),
        },
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return dor as DefinitionOfReadyWithItems;
  }

  async getDoRItems(teamId: string): Promise<DoRItem[]> {
    const dor = await this.getDefinitionOfReady(teamId);
    if (!dor) {
      return [];
    }
    return dor.items;
  }

  async verifyDoRForPBI(
    pbiId: string,
    userId: string,
    verifications: DoRVerificationInput[]
  ): Promise<DoRChecklistVerification[]> {
    const pbi = await prisma.productBacklogItem.findUnique({
      where: { id: pbiId },
      include: { team: true },
    });

    if (!pbi) {
      throw new NotFoundError('Product Backlog Item');
    }

    const dor = await prisma.definitionOfReady.findUnique({
      where: { teamId: pbi.teamId },
      include: { items: true },
    });

    if (!dor) {
      throw new NotFoundError('Definition of Ready');
    }

    const validDoRItemIds = new Set(dor.items.map((item) => item.id));
    for (const v of verifications) {
      if (!validDoRItemIds.has(v.dorItemId)) {
        throw new BadRequestError(`Invalid DoR item ID: ${v.dorItemId}`);
      }
    }

    const results: DoRChecklistVerification[] = [];

    for (const v of verifications) {
      const existing = await prisma.doRChecklistVerification.findUnique({
        where: {
          pbiId_dorItemId: {
            pbiId,
            dorItemId: v.dorItemId,
          },
        },
      });

      if (existing) {
        const updated = await prisma.doRChecklistVerification.update({
          where: { id: existing.id },
          data: {
            isVerified: v.isVerified,
            verifiedBy: userId,
            verifiedAt: new Date(),
            notes: v.notes,
            updatedBy: userId,
          },
        });
        results.push(updated);
      } else {
        const created = await prisma.doRChecklistVerification.create({
          data: {
            id: generateUUIDv7(),
            pbiId,
            dorItemId: v.dorItemId,
            isVerified: v.isVerified,
            verifiedBy: userId,
            verifiedAt: new Date(),
            notes: v.notes,
            createdBy: userId,
          },
        });
        results.push(created);
      }
    }

    return results;
  }

  async getDoRVerificationsForPBI(pbiId: string): Promise<DoRChecklistVerification[]> {
    return await prisma.doRChecklistVerification.findMany({
      where: { pbiId },
      include: {
        dorItem: {
          select: {
            id: true,
            description: true,
            category: true,
          },
        },
      },
    });
  }
}

export const definitionOfReadyService = new DefinitionOfReadyService();
