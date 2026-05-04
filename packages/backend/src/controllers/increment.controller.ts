import { type Request, type Response } from 'express';
import { incrementService } from '../services/increment.service';
import { asyncHandler, createSuccessResponse } from '../utils/errors';
import { getParamValue } from '../utils/validation';

export const getIncrements = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, sprintId } = req.query;
  const increments = await incrementService.getIncrements(
    teamId as string,
    sprintId as string | undefined
  );
  res.json(createSuccessResponse(increments));
});

export const getIncrementById = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new Error('Increment ID is required');
  }
  const increment = await incrementService.getIncrementById(id);
  res.json(createSuccessResponse(increment));
});

export const createIncrement = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }
  const increment = await incrementService.createIncrement(userId, req.body);
  res.status(201).json(createSuccessResponse(increment));
});

export const updateIncrement = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new Error('Increment ID is required');
  }
  const increment = await incrementService.updateIncrement(id, req.body);
  res.json(createSuccessResponse(increment));
});

export const deliverIncrement = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new Error('Increment ID is required');
  }
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }
  const { deliveryMethod, notes } = req.body;
  const increment = await incrementService.deliverIncrement(id, deliveryMethod, notes, userId);
  res.json(createSuccessResponse(increment));
});

export const getIncrementMetrics = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.query;
  const metrics = await incrementService.getIncrementMetrics(teamId as string);
  res.json(createSuccessResponse(metrics));
});
