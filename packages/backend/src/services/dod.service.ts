import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError, InternalServerError } from '../utils/errors';
import { generateUUIDv7 } from '../utils/uuid';
import type { DoDItem, DoDChecklistVerification } from '../generated/prisma/client';

type DefinitionOfDoneWithItems = Awaited<ReturnType<typeof prisma.definitionOfDone.findUnique>> & {
  items: DoDItem[];
};

interface DoDItemInput {
  id?: string;
  description: string;
  category?: string;
  isActive: boolean;
  order: number;
}

interface DoDVerificationInput {
  dodItemId: string;
  isVerified: boolean;
  notes?: string;
}

interface DoDComplianceVerification {
  id: string;
  pbiId: string;
  dodItemId: string;
  isVerified: boolean;
  verifiedBy: string;
  verifiedAt: Date;
  notes: string | null;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
  dodItem: {
    id: string;
    description: string;
    category: string;
  };
}

interface DoDCompliancePBI {
  pbiId: string;
  pbiTitle: string;
  status: string;
  dodItemsTotal: number;
  dodItemsVerified: number;
  compliancePercentage: number;
  verifications: DoDComplianceVerification[];
}

interface DoDComplianceReport {
  sprintId: string;
  totalPBIs: number;
  dodCompliantPBIs: number;
  pendingVerification: number;
  failedCompliance: number;
  complianceRate: number;
  pbiDetails: DoDCompliancePBI[];
}

class DefinitionOfDoneService {
  async getDefinitionOfDone(teamId: string): Promise<DefinitionOfDoneWithItems | null> {
    const dod = await prisma.definitionOfDone.findUnique({
      where: { teamId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return dod as DefinitionOfDoneWithItems | null;
  }

  async createDefaultDefinitionOfDone(
    teamId: string,
    userId?: string
  ): Promise<DefinitionOfDoneWithItems> {
    const dodId = generateUUIDv7();
    const defaultItems: DoDItemInput[] = [
      {
        description: 'Code is peer-reviewed and approved',
        category: 'review',
        isActive: true,
        order: 0,
      },
      {
        description: 'Unit tests written and passing (minimum 80% coverage)',
        category: 'testing',
        isActive: true,
        order: 1,
      },
      {
        description: 'Integration tests passing',
        category: 'testing',
        isActive: true,
        order: 2,
      },
      {
        description: 'Code is properly documented',
        category: 'documentation',
        isActive: true,
        order: 3,
      },
      {
        description: 'No critical or high-severity bugs',
        category: 'quality',
        isActive: true,
        order: 4,
      },
    ];

    const dod = await prisma.definitionOfDone.create({
      data: {
        id: dodId,
        teamId,
        version: 1,
        createdBy: userId,
        items: {
          create: defaultItems.map((item, index) => ({
            id: generateUUIDv7(),
            description: item.description,
            category: item.category ?? 'quality',
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

    return dod as DefinitionOfDoneWithItems;
  }

  async updateDefinitionOfDone(
    teamId: string,
    items: DoDItemInput[],
    userId?: string
  ): Promise<DefinitionOfDoneWithItems> {
    const existingDod = await prisma.definitionOfDone.findUnique({
      where: { teamId },
    });

    if (!existingDod) {
      return this.createDefaultDefinitionOfDone(teamId, userId).then(() =>
        this.updateDefinitionOfDone(teamId, items, userId)
      );
    }

    await prisma.doDItem.deleteMany({
      where: { dodId: existingDod.id },
    });

    const dod = await prisma.definitionOfDone.update({
      where: { id: existingDod.id },
      data: {
        version: { increment: 1 },
        updatedBy: userId,
        items: {
          create: items.map((item, index) => ({
            id: generateUUIDv7(),
            description: item.description,
            category: item.category ?? 'quality',
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

    return dod as DefinitionOfDoneWithItems;
  }

  async getDoDItems(teamId: string): Promise<DoDItem[]> {
    const dod = await this.getDefinitionOfDone(teamId);
    if (!dod) {
      return [];
    }
    return dod.items;
  }

  async verifyDoDForPBI(
    pbiId: string,
    userId: string,
    verifications: DoDVerificationInput[]
  ): Promise<DoDChecklistVerification[]> {
    const pbi = await prisma.productBacklogItem.findUnique({
      where: { id: pbiId },
      include: { team: true },
    });

    if (!pbi) {
      throw new NotFoundError('Product Backlog Item');
    }

    const dod = await prisma.definitionOfDone.findUnique({
      where: { teamId: pbi.teamId },
      include: { items: true },
    });

    if (!dod) {
      throw new NotFoundError('Definition of Done');
    }

    const validDoDItemIds = new Set(dod.items.map((item) => item.id));
    for (const v of verifications) {
      if (!validDoDItemIds.has(v.dodItemId)) {
        throw new BadRequestError(`Invalid DoD item ID: ${v.dodItemId}`);
      }
    }

    const results: DoDChecklistVerification[] = [];

    for (const v of verifications) {
      const existing = await prisma.doDChecklistVerification.findUnique({
        where: {
          pbiId_dodItemId: {
            pbiId,
            dodItemId: v.dodItemId,
          },
        },
      });

      if (existing) {
        const updated = await prisma.doDChecklistVerification.update({
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
        const created = await prisma.doDChecklistVerification.create({
          data: {
            id: generateUUIDv7(),
            pbiId,
            dodItemId: v.dodItemId,
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

  async getDoDVerificationsForPBI(pbiId: string): Promise<DoDChecklistVerification[]> {
    return await prisma.doDChecklistVerification.findMany({
      where: { pbiId },
      include: {
        dodItem: {
          select: {
            id: true,
            description: true,
            category: true,
          },
        },
      },
    });
  }

  async getDoDComplianceReport(sprintId: string): Promise<DoDComplianceReport> {
    try {
      // Get sprint with its PBIs
      const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
        include: {
          sprintBacklogItems: {
            include: {
              pbi: true,
            },
          },
        },
      });

      if (!sprint) {
        throw new NotFoundError('Sprint');
      }

      // Get team's DoD items
      const dod = await prisma.definitionOfDone.findUnique({
        where: { teamId: sprint.teamId },
        include: {
          items: {
            where: { isActive: true },
          },
        },
      });

      const dodItems = dod?.items ?? [];
      const totalDoDItems = dodItems.length;

      // Create lookup map for efficient DoD item access
      const dodItemMap = new Map(dodItems.map((item) => [item.id, item]));

      // Get all PBIs in the sprint
      const pbis = sprint.sprintBacklogItems.map((item) => item.pbi);

      const pbiDetails = await Promise.all(
        pbis.map(async (pbi) => {
          const verifications = await this.getDoDVerificationsForPBI(pbi.id);

          // Map verifications to include full dodItem info
          const verificationsWithItems = verifications.map((v) => {
            const dodItem = dodItemMap.get(v.dodItemId);
            return {
              id: v.id,
              pbiId: v.pbiId,
              dodItemId: v.dodItemId,
              isVerified: v.isVerified,
              verifiedBy: v.verifiedBy,
              verifiedAt: v.verifiedAt,
              notes: v.notes,
              createdAt: v.createdAt,
              createdBy: v.createdBy,
              updatedAt: v.updatedAt,
              updatedBy: v.updatedBy,
              dodItem: {
                id: v.dodItemId,
                description: dodItem?.description ?? '',
                category: dodItem?.category ?? 'quality',
              },
            };
          });

          const verifiedCount = verifications.filter((v) => v.isVerified).length;
          const compliancePercentage =
            totalDoDItems > 0 ? Math.round((verifiedCount / totalDoDItems) * 100) : 0;

          return {
            pbiId: pbi.id,
            pbiTitle: pbi.title,
            status: pbi.status,
            dodItemsTotal: totalDoDItems,
            dodItemsVerified: verifiedCount,
            compliancePercentage,
            verifications: verificationsWithItems,
          };
        })
      );

      const totalPBIs = pbis.length;
      const dodCompliantPBIs = pbiDetails.filter((pbi) => pbi.compliancePercentage === 100).length;
      const pendingVerification = pbiDetails.filter((pbi) => pbi.dodItemsVerified === 0).length;
      const failedCompliance = totalPBIs - dodCompliantPBIs;
      const complianceRate = totalPBIs > 0 ? Math.round((dodCompliantPBIs / totalPBIs) * 100) : 0;

      return {
        sprintId,
        totalPBIs,
        dodCompliantPBIs,
        pendingVerification,
        failedCompliance,
        complianceRate,
        pbiDetails,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to generate DoD compliance report');
    }
  }
}

export const definitionOfDoneService = new DefinitionOfDoneService();
