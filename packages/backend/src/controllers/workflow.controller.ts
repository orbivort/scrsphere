// Workflow Controller
import { type Request, type Response } from 'express';
import { workflowService } from '../services/workflow.service';
import { logger } from '../utils/logger';
import { getParamValue } from '../utils/validation';

/**
 * Get workflow configuration for an entity type
 */
export const getWorkflowByEntityType = async (req: Request, res: Response): Promise<void> => {
  try {
    const entityType = getParamValue(req.params.entityType);
    if (!entityType) {
      res.status(400).json({
        success: false,
        error: 'Entity type is required',
      });
      return;
    }
    const workflow = await workflowService.getWorkflowByEntityType(entityType, req.user?.id);

    if (!workflow) {
      res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
      return;
    }

    res.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    logger.error('Error fetching workflow', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow',
    });
  }
};

/**
 * Get workflow states for an entity type
 */
export const getWorkflowStates = async (req: Request, res: Response): Promise<void> => {
  try {
    const entityType = getParamValue(req.params.entityType);
    if (!entityType) {
      res.status(400).json({
        success: false,
        error: 'Entity type is required',
      });
      return;
    }
    const states = await workflowService.getWorkflowStates(entityType);

    res.json({
      success: true,
      data: states,
    });
  } catch (error) {
    logger.error('Error fetching workflow states', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow states',
    });
  }
};

/**
 * Get workflow transitions for an entity type
 */
export const getWorkflowTransitions = async (req: Request, res: Response): Promise<void> => {
  try {
    const entityType = getParamValue(req.params.entityType);
    if (!entityType) {
      res.status(400).json({
        success: false,
        error: 'Entity type is required',
      });
      return;
    }
    const transitions = await workflowService.getWorkflowTransitions(entityType);

    res.json({
      success: true,
      data: transitions,
    });
  } catch (error) {
    logger.error('Error fetching workflow transitions', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow transitions',
    });
  }
};

/**
 * Validate if a status transition is allowed
 */
export const validateTransition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityType, fromStatus, toStatus } = req.body;
    const userId = req.user?.id;

    let userRoles: string[] = [];
    const teamId = getParamValue(req.params.teamId) ?? req.body.teamId;

    if (teamId && req.prisma && req.user?.id) {
      const teamMember = await req.prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: req.user.id,
          },
        },
      });

      if (teamMember) {
        userRoles = [teamMember.role];
      }
    }

    const result = await workflowService.validateTransition(
      entityType,
      fromStatus,
      toStatus,
      userId,
      userRoles
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    logger.error('Error validating transition', { error });

    const err = error as Error & { statusCode?: number; code?: string };
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Failed to validate transition',
      code: err.code,
    });
  }
};

/**
 * Execute a status change with validation and history tracking
 */
export const executeStatusChange = async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityType, entityId, fromStatus, toStatus, changeReason, changeNotes, metadata } =
      req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    let userRoles: string[] = [];
    const teamId = getParamValue(req.params.teamId) ?? req.body.teamId;

    if (teamId && req.prisma && req.user?.id) {
      const teamMember = await req.prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: req.user.id,
          },
        },
      });

      if (teamMember) {
        userRoles = [teamMember.role];
      }
    }

    const history = await workflowService.executeStatusChange({
      entityType,
      entityId,
      fromStatus,
      toStatus,
      userId,
      userRoles,
      changeReason,
      changeNotes,
      metadata,
    });

    res.status(201).json({
      success: true,
      data: history,
    });
  } catch (error: unknown) {
    logger.error('Error executing status change', { error });

    const err = error as Error & { statusCode?: number; code?: string };
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Failed to execute status change',
      code: err.code,
    });
  }
};

/**
 * Get status change history for an entity
 */
export const getStatusChangeHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const entityType = getParamValue(req.params.entityType);
    const entityId = getParamValue(req.params.entityId);
    if (!entityType || !entityId) {
      res.status(400).json({
        success: false,
        error: 'Entity type and entity ID are required',
      });
      return;
    }
    const limit = parseInt(req.query.limit as string) ?? 50;
    const offset = parseInt(req.query.offset as string) ?? 0;

    const history = await workflowService.getStatusChangeHistory(
      entityType,
      entityId,
      limit,
      offset
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('Error fetching status change history', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status change history',
    });
  }
};

/**
 * Get allowed transitions from a given state
 */
export const getAllowedTransitions = async (req: Request, res: Response): Promise<void> => {
  try {
    const entityType = getParamValue(req.params.entityType);
    const fromStatus = getParamValue(req.params.fromStatus);
    if (!entityType || !fromStatus) {
      res.status(400).json({
        success: false,
        error: 'Entity type and from status are required',
      });
      return;
    }
    const userId = req.user?.id;
    const userRoles: string[] = [];

    const transitions = await workflowService.getAllowedTransitions(
      entityType,
      fromStatus,
      userId,
      userRoles
    );

    res.json({
      success: true,
      data: transitions,
    });
  } catch (error) {
    logger.error('Error fetching allowed transitions', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch allowed transitions',
    });
  }
};

/**
 * Create a new workflow (admin only)
 */
export const createWorkflow = async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityType, name, description, defaultStatus } = req.body;
    const createdBy = req.user?.id;

    if (!createdBy) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const workflow = await workflowService.createWorkflow(
      entityType,
      name,
      description || null,
      defaultStatus,
      createdBy
    );

    res.status(201).json({
      success: true,
      data: workflow,
    });
  } catch (error: unknown) {
    logger.error('Error creating workflow', { error });

    const err = error as Error & { statusCode?: number; code?: string };
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Failed to create workflow',
      code: err.code,
    });
  }
};

/**
 * Add a state to a workflow (admin only)
 */
export const addWorkflowState = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workflowId, name, displayName, description, color, icon, isFinal, orderIndex } =
      req.body;

    const state = await workflowService.addWorkflowState(
      workflowId,
      name,
      displayName,
      description || null,
      color || null,
      icon || null,
      isFinal,
      orderIndex
    );

    res.status(201).json({
      success: true,
      data: state,
    });
  } catch (error: unknown) {
    logger.error('Error adding workflow state', { error });

    const err = error as Error & { statusCode?: number; code?: string };
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Failed to add workflow state',
      code: err.code,
    });
  }
};

/**
 * Add a transition to a workflow (admin only)
 */
export const addWorkflowTransition = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      workflowId,
      fromStateName,
      toStateName,
      requiresApproval,
      allowedRoles,
      allowedUserIds,
    } = req.body;

    const transition = await workflowService.addWorkflowTransition(
      workflowId,
      fromStateName,
      toStateName,
      requiresApproval,
      allowedRoles || [],
      allowedUserIds || []
    );

    res.status(201).json({
      success: true,
      data: transition,
    });
  } catch (error: unknown) {
    logger.error('Error adding workflow transition', { error });

    const err = error as Error & { statusCode?: number; code?: string };
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Failed to add workflow transition',
      code: err.code,
    });
  }
};
