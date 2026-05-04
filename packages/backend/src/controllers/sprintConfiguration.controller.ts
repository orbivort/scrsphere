import { type Request, type Response } from 'express';
import { sprintConfigurationService } from '../services/sprintConfiguration.service';
import { asyncHandler, createSuccessResponse, BadRequestError } from '../utils/errors';
import { getParamValue } from '../utils/validation';

export const getSprintConfiguration = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    throw new BadRequestError('teamId is required');
  }
  const config = await sprintConfigurationService.getSprintConfiguration(teamId);
  res.json(createSuccessResponse(config));
});

export const createSprintConfiguration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }
  const config = await sprintConfigurationService.createSprintConfiguration(userId, req.body);
  res.status(201).json(createSuccessResponse(config));
});

export const updateSprintConfiguration = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Configuration ID is required');
  }
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }
  const config = await sprintConfigurationService.updateSprintConfiguration(id, userId, req.body);
  res.json(createSuccessResponse(config));
});

export const generateSprintsForYear = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }
  const result = await sprintConfigurationService.generateSprintsForYear(userId, req.body);
  res.status(201).json(createSuccessResponse(result));
});

export const getGeneratedSprints = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, year } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    throw new BadRequestError('teamId is required');
  }
  const sprints = await sprintConfigurationService.getGeneratedSprints(
    teamId,
    year ? parseInt(year as string) : undefined
  );
  res.json(createSuccessResponse(sprints));
});

export const deleteGeneratedSprint = asyncHandler(async (req: Request, res: Response) => {
  const sprintId = getParamValue(req.params.sprintId);
  if (!sprintId) {
    throw new BadRequestError('Sprint ID is required');
  }
  await sprintConfigurationService.deleteGeneratedSprint(sprintId);
  res.json(createSuccessResponse(null));
});

export const updateGeneratedSprint = asyncHandler(async (req: Request, res: Response) => {
  const sprintId = getParamValue(req.params.sprintId);
  if (!sprintId) {
    throw new BadRequestError('Sprint ID is required');
  }
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }
  const sprint = await sprintConfigurationService.updateGeneratedSprint(sprintId, userId, req.body);
  res.json(createSuccessResponse(sprint));
});
