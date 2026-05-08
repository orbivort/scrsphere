// Product Goal Service
import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { generateUUIDv7 } from '../utils/uuid';
import { logger } from '../utils/logger';
import type { ProductGoal } from '../generated/prisma/client';
import { workflowService } from './workflow.service';

// Product Goal with relations
export type ProductGoalWithRelations = ProductGoal & {
  creator?: { id: string; firstName: string; lastName: string } | null;
  _count?: { backlogItems: number };
};

// Create Product Goal data
export interface CreateProductGoalData {
  teamId: string;
  title: string;
  description?: string;
  targetDate?: Date;
  successMetrics?: string;
  strategicAlignment?: string;
  status?: 'NEW' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
}

// Update Product Goal data
export interface UpdateProductGoalData {
  title?: string;
  description?: string;
  targetDate?: Date;
  successMetrics?: string;
  strategicAlignment?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
}

class ProductGoalService {
  /**
   * Get product goals for a team
   */
  async getProductGoals(teamId: string): Promise<ProductGoal[]> {
    const goals = await prisma.productGoal.findMany({
      where: { teamId },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { backlogItems: true },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return goals;
  }

  /**
   * Get product goal by ID
   */
  async getProductGoalById(id: string): Promise<ProductGoal> {
    const goal = await prisma.productGoal.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { backlogItems: true },
        },
      },
    });

    if (!goal) {
      throw new NotFoundError('Product Goal');
    }

    return goal;
  }

  /**
   * Create a new product goal
   */
  async createProductGoal(userId: string, data: CreateProductGoalData): Promise<ProductGoal> {
    const { teamId, title, description, targetDate, successMetrics, strategicAlignment, status } =
      data;

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundError('Team');
    }

    // Check if user is a member of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!teamMember) {
      throw new ForbiddenError('You are not a member of this team');
    }

    // Get user roles
    const userRoles = [teamMember.role];

    // Validate status transition using workflow service
    const targetStatus = status ?? 'NEW';
    const validationResult = await workflowService.validateTransition(
      'ProductGoal',
      null, // No from status for new goals
      targetStatus,
      userId,
      userRoles
    );

    if (!validationResult.isValid) {
      throw new BadRequestError(validationResult.reason ?? 'Invalid status');
    }

    if (!validationResult.allowed) {
      throw new ForbiddenError(validationResult.reason ?? 'Status not allowed');
    }

    const goalId = generateUUIDv7();

    const goal = await prisma.productGoal.create({
      data: {
        id: goalId,
        teamId,
        title,
        description,
        targetDate,
        successMetrics,
        strategicAlignment,
        createdBy: userId,
        status: targetStatus,
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Record status change in workflow history
    try {
      await workflowService.executeStatusChange({
        entityType: 'ProductGoal',
        entityId: goalId,
        fromStatus: null,
        toStatus: targetStatus,
        userId,
        userRoles,
        changeReason: 'Initial goal creation',
        metadata: {
          teamId,
          title,
        },
      });
    } catch (error) {
      logger.error('Failed to record status change history', { error });
    }

    return goal;
  }

  /**
   * Update a product goal
   */
  async updateProductGoal(
    id: string,
    userId: string,
    data: UpdateProductGoalData
  ): Promise<ProductGoal> {
    // Check if goal exists
    const existing = await prisma.productGoal.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Product Goal');
    }

    // Check if user is a member of team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: existing.teamId,
        userId,
      },
    });

    if (!teamMember) {
      throw new ForbiddenError('You are not a member of this team');
    }

    // Get user roles
    const userRoles = [teamMember.role];

    // Validate status transition if status is being changed
    if (data.status && data.status !== existing.status) {
      const validationResult = await workflowService.validateTransition(
        'ProductGoal',
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

    const goal = await prisma.productGoal.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Record status change in workflow history if status changed
    if (data.status && data.status !== existing.status) {
      try {
        await workflowService.executeStatusChange({
          entityType: 'ProductGoal',
          entityId: id,
          fromStatus: existing.status,
          toStatus: data.status,
          userId,
          userRoles,
          changeReason: 'Goal status updated',
          metadata: {
            previousStatus: existing.status,
            newStatus: data.status,
          },
        });
      } catch (error) {
        logger.error('Failed to record status change history', { error });
      }
    }

    return goal;
  }

  /**
   * Delete a product goal
   */
  async deleteProductGoal(id: string, userId: string): Promise<void> {
    // Check if goal exists
    const goal = await prisma.productGoal.findUnique({
      where: { id },
    });

    if (!goal) {
      throw new NotFoundError('Product Goal');
    }

    // Check if user is a member of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: goal.teamId,
        userId,
      },
    });

    if (!teamMember) {
      throw new ForbiddenError('You are not a member of this team');
    }

    // Check if goal has associated backlog items
    const backlogItemsCount = await prisma.productBacklogItem.count({
      where: { goalId: id },
    });

    if (backlogItemsCount > 0) {
      throw new BadRequestError('Cannot delete product goal that has associated backlog items');
    }

    await prisma.productGoal.delete({
      where: { id },
    });
  }

  /**
   * Get active product goal for a team
   */
  async getActiveProductGoal(teamId: string): Promise<ProductGoal | null> {
    const goal = await prisma.productGoal.findFirst({
      where: {
        teamId,
        status: 'ACTIVE',
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { backlogItems: true },
        },
      },
    });

    return goal;
  }
}

export const productGoalService = new ProductGoalService();
export default productGoalService;
