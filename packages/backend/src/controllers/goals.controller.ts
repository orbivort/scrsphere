// Product Goals Controller
import { type Request, type Response } from 'express';
import { productGoalService } from '../services/goals.service';
import { workflowService } from '../services/workflow.service';
import { asyncHandler, createSuccessResponse, BadRequestError } from '../utils/errors';
import { getParamValue } from '../utils/validation';

/**
 * Get product goals for a team
 */
export const getProductGoals = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    throw new BadRequestError('teamId is required');
  }
  const goals = await productGoalService.getProductGoals(teamId);
  res.json(createSuccessResponse(goals));
});

/**
 * Get product goal by ID
 */
export const getProductGoalById = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Product goal ID is required');
  }
  const goal = await productGoalService.getProductGoalById(id);
  res.json(createSuccessResponse(goal));
});

/**
 * Create a new product goal
 */
export const createProductGoal = asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId) {
    throw new BadRequestError('User not authenticated');
  }
  const goal = await productGoalService.createProductGoal(req.userId, req.body);
  res.status(201).json(createSuccessResponse(goal));
});

/**
 * Update a product goal
 */
export const updateProductGoal = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Product goal ID is required');
  }
  if (!req.userId) {
    throw new BadRequestError('User not authenticated');
  }
  const goal = await productGoalService.updateProductGoal(id, req.userId, req.body);
  res.json(createSuccessResponse(goal));
});

/**
 * Delete a product goal
 */
export const deleteProductGoal = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Product goal ID is required');
  }
  if (!req.userId) {
    throw new BadRequestError('User not authenticated');
  }
  await productGoalService.deleteProductGoal(id, req.userId);
  res.json(createSuccessResponse({ message: 'Product goal deleted successfully' }));
});

/**
 * Get active product goal for a team
 */
export const getActiveProductGoal = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    throw new BadRequestError('teamId is required');
  }
  const goal = await productGoalService.getActiveProductGoal(teamId);
  res.json(createSuccessResponse(goal));
});

/**
 * Get status change history for a product goal
 */
export const getProductGoalStatusHistory = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Product goal ID is required');
  }

  const history = await workflowService.getStatusChangeHistory('ProductGoal', id, 50, 0);
  res.json(createSuccessResponse(history));
});
