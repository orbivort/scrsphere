// Product Backlog Service
import prisma from '../utils/prisma';
import { AppError, NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { generateUUIDv7 } from '../utils/uuid';
import { workflowService } from './workflow.service';
import { logger } from '../utils/logger';
import { BACKLOG_CONFIG, isBacklogLimitEnabled } from '../config/backlog.config';
import type {
  ProductBacklogItem,
  ItemStatus,
  MoSCoWPriority,
  Prisma,
} from '../generated/prisma/client';

// PBI with relations
export type PBIWithRelations = ProductBacklogItem & {
  goal?: { id: string; title: string } | null;
  creator?: { id: string; firstName: string; lastName: string } | null;
};

// Create PBI data
export interface CreatePBIData {
  teamId: string;
  goalId?: string;
  title: string;
  description?: string;
  storyPoints?: number;
  priority?: MoSCoWPriority;
  businessValue?: number;
  labels?: string[];
  acceptanceCriteria?: string;
  status?: ItemStatus;
}

// Update PBI data
export interface UpdatePBIData {
  title?: string;
  description?: string;
  storyPoints?: number;
  status?: ItemStatus;
  labels?: string[];
  acceptanceCriteria?: string;
  goalId?: string;
  priority?: MoSCoWPriority;
  businessValue?: number;
}

// Pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Bulk create error entry
export interface BulkCreateError {
  row: number;
  field: string;
  message: string;
}

// Bulk create result
export interface BulkCreateResult {
  successful: number;
  failed: number;
  errors: BulkCreateError[];
  createdItems: ProductBacklogItem[];
}

class ProductBacklogService {
  /**
   * Get product backlog for a team
   */
  async getProductBacklog(
    teamId: string,
    params?: {
      status?: ItemStatus;
      labels?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<ProductBacklogItem>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductBacklogItemWhereInput = {
      teamId,
    };

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.labels) {
      const labels = params.labels.split(',');
      where.labels = { hasSome: labels };
    }

    const [items, total] = await Promise.all([
      prisma.productBacklogItem.findMany({
        where,
        include: {
          goal: {
            select: { id: true, title: true },
          },
          creator: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.productBacklogItem.count({ where }),
    ]);

    return {
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get PBI by ID
   */
  async getPBIById(pbiId: string): Promise<PBIWithRelations> {
    const pbi = await prisma.productBacklogItem.findUnique({
      where: { id: pbiId },
      include: {
        goal: {
          select: { id: true, title: true },
        },
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!pbi) {
      throw new NotFoundError('Product Backlog Item');
    }

    return pbi;
  }

  /**
   * Create a new PBI
   */
  async createPBI(userId: string, data: CreatePBIData): Promise<ProductBacklogItem> {
    const pbiId = generateUUIDv7();
    const initialStatus = data.status ?? 'NEW';

    const pbi = await prisma.productBacklogItem.create({
      data: {
        id: pbiId,
        teamId: data.teamId,
        goalId: data.goalId,
        title: data.title,
        description: data.description,
        storyPoints: data.storyPoints,
        labels: data.labels ?? [],
        acceptanceCriteria: data.acceptanceCriteria,
        createdBy: userId,
        priority: data.priority ?? 'COULD_HAVE',
        businessValue: data.businessValue,
        status: initialStatus,
      },
    });

    // Record initial status in workflow history
    try {
      const teamMember = await prisma.teamMember.findFirst({
        where: { teamId: data.teamId, userId },
      });

      await workflowService.executeStatusChange({
        entityType: 'BacklogItem',
        entityId: pbiId,
        fromStatus: null,
        toStatus: initialStatus,
        userId,
        userRoles: teamMember ? [teamMember.role] : [],
        changeReason: 'Initial backlog item creation',
        metadata: {
          teamId: data.teamId,
          title: data.title,
        },
      });
    } catch (error) {
      logger.error('Failed to record initial status change history for backlog item', { error });
    }

    return pbi;
  }

  /**
   * Update a PBI
   */
  async updatePBI(pbiId: string, userId: string, data: UpdatePBIData): Promise<ProductBacklogItem> {
    // Check if PBI exists
    const existing = await prisma.productBacklogItem.findUnique({
      where: { id: pbiId },
    });

    if (!existing) {
      throw new NotFoundError('Product Backlog Item');
    }

    // Prevent modifications to items with 'DONE' status
    if (existing.status === 'DONE') {
      throw new BadRequestError(
        'Cannot modify backlog items that have been marked as Done. Items in Done status are locked and cannot be edited.'
      );
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: existing.teamId,
        userId,
      },
    });

    if (!teamMember) {
      throw new ForbiddenError('You are not a member of this team');
    }

    const userRoles = [teamMember.role];

    if (data.status && data.status !== existing.status) {
      const validationResult = await workflowService.validateTransition(
        'BacklogItem',
        existing.status,
        data.status,
        userId,
        userRoles
      );

      if (!validationResult.isValid) {
        throw new BadRequestError(validationResult.reason ?? 'Invalid status transition');
      }

      if (!validationResult.allowed) {
        throw new ForbiddenError(validationResult.reason ?? 'Status transition not allowed');
      }
    }

    const pbi = await prisma.productBacklogItem.update({
      where: { id: pbiId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    if (data.status && data.status !== existing.status) {
      try {
        await workflowService.executeStatusChange({
          entityType: 'BacklogItem',
          entityId: pbiId,
          fromStatus: existing.status,
          toStatus: data.status,
          userId,
          userRoles,
          changeReason: 'Backlog item status updated',
          metadata: {
            previousStatus: existing.status,
            newStatus: data.status,
          },
        });
      } catch (error) {
        logger.error('Failed to record status change history', { error });
      }
    }

    return pbi;
  }

  /**
   * Update PBI priority (MoSCoW)
   */
  async updatePriority(pbiId: string, priority: MoSCoWPriority): Promise<ProductBacklogItem> {
    const pbi = await prisma.productBacklogItem.update({
      where: { id: pbiId },
      data: { priority },
    });

    return pbi;
  }

  /**
   * Delete a PBI
   */
  async deletePBI(pbiId: string, _userId: string): Promise<void> {
    const pbi = await prisma.productBacklogItem.findUnique({
      where: { id: pbiId },
    });

    if (!pbi) {
      throw new NotFoundError('Product Backlog Item');
    }

    // Prevent deletion of items with 'IN_PROGRESS' or 'DONE' status
    if (pbi.status === 'IN_PROGRESS') {
      throw new BadRequestError(
        'Cannot delete backlog items that are currently in progress. Please move the item to a different status before deleting.'
      );
    }

    if (pbi.status === 'DONE') {
      throw new BadRequestError(
        'Cannot delete backlog items that have been marked as Done. Completed items cannot be removed from the backlog.'
      );
    }

    // Check if PBI is in an active sprint
    if (pbi.sprintId) {
      throw new BadRequestError('Cannot delete PBI that is in a sprint');
    }

    await prisma.productBacklogItem.delete({
      where: { id: pbiId },
    });
  }

  /**
   * Bulk create PBIs
   * Creates multiple backlog items in a transaction, catching per-item errors
   * to provide detailed error reporting for each failed item
   */
  async createPBIBulk(
    userId: string,
    items: Array<CreatePBIData & { _rowNumber?: number }>
  ): Promise<BulkCreateResult> {
    const result: BulkCreateResult = {
      successful: 0,
      failed: 0,
      errors: [],
      createdItems: [],
    };

    // Cache team member lookup (same user/team for all items, avoids N+1)
    const firstItem = items[0];
    const teamMember = firstItem
      ? await prisma.teamMember.findFirst({
          where: { teamId: firstItem.teamId, userId },
        })
      : null;
    const userRoles = teamMember ? [teamMember.role] : [];

    // Check for duplicate titles within the batch
    const seenTitles = new Set<string>();
    const processedItems: Array<CreatePBIData & { _rowNumber?: number }> = [];

    for (const item of items) {
      const normalizedTitle = item.title.toLowerCase().trim();
      if (seenTitles.has(normalizedTitle)) {
        result.failed++;
        result.errors.push({
          row: item._rowNumber ?? -1,
          field: 'title',
          message: 'Duplicate title within the bulk upload',
        });
      } else {
        seenTitles.add(normalizedTitle);
        processedItems.push(item);
      }
    }

    for (const item of processedItems) {
      const { _rowNumber, ...createData } = item;

      try {
        const pbi = await prisma.$transaction(async (tx) => {
          const pbiId = generateUUIDv7();
          const initialStatus = createData.status ?? 'NEW';

          const created = await tx.productBacklogItem.create({
            data: {
              id: pbiId,
              teamId: createData.teamId,
              goalId: createData.goalId,
              title: createData.title,
              description: createData.description,
              storyPoints: createData.storyPoints,
              labels: createData.labels ?? [],
              acceptanceCriteria: createData.acceptanceCriteria,
              createdBy: userId,
              priority: createData.priority ?? 'COULD_HAVE',
              businessValue: createData.businessValue,
              status: initialStatus,
            },
          });

          return created;
        });

        // Record workflow history outside the transaction to avoid coupling
        try {
          await workflowService.executeStatusChange({
            entityType: 'BacklogItem',
            entityId: pbi.id,
            fromStatus: null,
            toStatus: pbi.status,
            userId,
            userRoles,
            changeReason: 'Initial backlog item creation (bulk)',
            metadata: {
              teamId: createData.teamId,
              title: createData.title,
            },
          });
        } catch (historyError) {
          logger.error('Failed to record initial status change history for bulk backlog item', {
            error: historyError,
            pbiId: pbi.id,
          });
        }

        result.successful++;
        result.createdItems.push(pbi);
      } catch (error) {
        const rowNumber = _rowNumber ?? -1;
        result.failed++;

        if (error instanceof AppError) {
          const details = error.details;
          if (details && details.length > 0) {
            for (const detail of details) {
              result.errors.push({
                row: rowNumber,
                field: detail.field,
                message: detail.message,
              });
            }
          } else {
            result.errors.push({
              row: rowNumber,
              field: 'general',
              message: error.message,
            });
          }
        } else {
          logger.error('Unexpected error in bulk PBI creation', { error, row: rowNumber });
          result.errors.push({
            row: rowNumber,
            field: 'general',
            message: 'An unexpected error occurred while creating this item',
          });
        }
      }
    }

    return result;
  }

  /**
   * Reorder PBIs - Note: With MoSCoW priority, reordering is done within each priority category
   * This function is kept for API compatibility but does not change MoSCoW priorities
   */
  async reorderPBIs(_pbiIds: string[]): Promise<void> {
    // With MoSCoW priority system, items are grouped by priority category
    // Reordering within categories would require a separate sort order field
    // For now, this is a no-op as the priority is now categorical
  }

  /**
   * Count backlog items for a specific goal
   * @param goalId - The ID of the product goal
   * @returns The number of backlog items associated with the goal
   */
  async countItemsByGoal(goalId: string): Promise<number> {
    return prisma.productBacklogItem.count({
      where: { goalId },
    });
  }

  /**
   * Validate that adding items to a goal won't exceed the capacity limit
   * @param goalId - The ID of the product goal (undefined/null skips validation)
   * @param additionalItems - The number of items to add
   * @throws BadRequestError if capacity would be exceeded
   */
  async validateGoalCapacity(goalId: string | undefined, additionalItems: number): Promise<void> {
    // Skip validation if limit is disabled
    if (!isBacklogLimitEnabled()) {
      return;
    }

    // Skip validation if no goal specified
    if (!goalId) {
      return;
    }

    const currentCount = await this.countItemsByGoal(goalId);
    const capacity = BACKLOG_CONFIG.MAX_ITEMS_PER_GOAL;
    const projectedCount = currentCount + additionalItems;

    if (projectedCount > capacity) {
      const available = Math.max(0, capacity - currentCount);
      throw new AppError(
        `Cannot add ${additionalItems} item(s) to goal. This would exceed the maximum capacity of ${capacity} items per goal.`,
        400,
        'BACKLOG_GOAL_CAPACITY_EXCEEDED',
        [
          { field: 'goalId', message: goalId },
          { field: 'capacity', message: String(capacity) },
          { field: 'current', message: String(currentCount) },
          { field: 'available', message: String(available) },
          { field: 'requested', message: String(additionalItems) },
        ]
      );
    }
  }

  /**
   * Validate capacity for bulk import of backlog items
   * @param items - Array of items with optional goalId to validate
   * @throws BadRequestError if any goal's capacity would be exceeded
   */
  async validateBulkImportCapacity(items: Array<{ goalId?: string }>): Promise<void> {
    // Skip validation if limit is disabled
    if (!isBacklogLimitEnabled()) {
      return;
    }

    // Group items by goalId
    const itemsByGoal = new Map<string, number>();
    for (const item of items) {
      if (item.goalId) {
        const count = itemsByGoal.get(item.goalId) ?? 0;
        itemsByGoal.set(item.goalId, count + 1);
      }
    }

    // Validate each goal's capacity
    for (const [goalId, additionalItems] of itemsByGoal) {
      await this.validateGoalCapacity(goalId, additionalItems);
    }
  }
}

export const productBacklogService = new ProductBacklogService();
export default productBacklogService;
