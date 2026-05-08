// Sprint Controller
import { type Request, type Response } from 'express';
import { sprintService, sprintBacklogManagerService } from '../services/sprint.service';
import { definitionOfDoneService } from '../services/dod.service';
import { asyncHandler, createSuccessResponse, BadRequestError } from '../utils/errors';
import { getParamValue } from '../utils/validation';

/**
 * Get all sprints for a team
 */
export const getSprints = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    throw new BadRequestError('teamId is required');
  }
  const sprints = await sprintService.getSprints(teamId);
  res.json(createSuccessResponse(sprints));
});

/**
 * Get active sprint for a team
 */
export const getActiveSprint = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    throw new BadRequestError('teamId is required');
  }
  const sprint = await sprintService.getActiveSprint(teamId);

  if (!sprint) {
    res.json(createSuccessResponse(null));
    return;
  }

  res.json(createSuccessResponse(sprint));
});

/**
 * Get sprint by ID
 */
export const getSprintById = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Sprint ID is required');
  }
  const sprint = await sprintService.getSprintById(id);
  res.json(createSuccessResponse(sprint));
});

/**
 * Create a new sprint
 */
export const createSprint = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }
  const sprint = await sprintService.createSprint(userId, req.body);
  res.status(201).json(createSuccessResponse(sprint));
});

/**
 * Start sprint
 */
export const startSprint = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Sprint ID is required');
  }
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }
  const sprint = await sprintService.startSprint(id, userId, req.body);
  res.json(createSuccessResponse(sprint));
});

/**
 * Rollback sprint start
 * Used when sprint start fails after partial database updates
 */
export const rollbackSprintStart = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Sprint ID is required');
  }
  const { previousPbiStatuses, createdSprintBacklogItemIds, createdTaskIds } = req.body;

  const rollbackData = {
    previousPbiStatuses: new Map<string, string>(Object.entries(previousPbiStatuses ?? {})),
    createdSprintBacklogItemIds: createdSprintBacklogItemIds ?? [],
    createdTaskIds: createdTaskIds ?? [],
  };

  await sprintService.rollbackSprintStart(id, rollbackData);
  res.json(
    createSuccessResponse({
      message: 'Sprint start rolled back successfully',
    })
  );
});

/**
 * Complete sprint
 */
export const completeSprint = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Sprint ID is required');
  }
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }
  const sprint = await sprintService.completeSprint(id, userId);
  res.json(createSuccessResponse(sprint));
});

/**
 * Cancel sprint
 */
export const cancelSprint = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Sprint ID is required');
  }
  const { reason } = req.body;
  const sprint = await sprintService.cancelSprint(id, reason);
  res.json(createSuccessResponse(sprint));
});

/**
 * Get burndown data
 */
export const getBurndownData = asyncHandler(async (req: Request, res: Response) => {
  const sprintId = getParamValue(req.params.sprintId);
  if (!sprintId) {
    throw new BadRequestError('Sprint ID is required');
  }
  const data = await sprintService.getBurndownData(sprintId);
  res.json(createSuccessResponse(data));
});

/**
 * Get sprint tasks
 */
export const getSprintTasks = asyncHandler(async (req: Request, res: Response) => {
  const sprintId = getParamValue(req.params.sprintId);
  if (!sprintId) {
    throw new BadRequestError('Sprint ID is required');
  }
  const tasks = await sprintService.getSprintTasks(sprintId);
  res.json(createSuccessResponse(tasks));
});

/**
 * Get tasks by PBI ID
 */
export const getTasksByPbiId = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('PBI ID is required');
  }
  const tasks = await sprintService.getTasksByPbiId(id);
  res.json(createSuccessResponse(tasks));
});

/**
 * Create task
 */
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }
  const sprintId = getParamValue(req.params.sprintId);
  if (!sprintId) {
    throw new BadRequestError('Sprint ID is required');
  }
  const task = await sprintService.createTask(userId, {
    ...req.body,
    sprintId,
  });
  res.status(201).json(createSuccessResponse(task));
});

/**
 * Update task
 */
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const sprintId = getParamValue(req.params.sprintId);
  const taskId = getParamValue(req.params.taskId);
  if (!sprintId) {
    throw new BadRequestError('Sprint ID is required');
  }
  if (!taskId) {
    throw new BadRequestError('Task ID is required');
  }
  const userId = req.user?.id;
  const task = await sprintService.updateTask(sprintId, taskId, req.body, userId);
  res.json(createSuccessResponse(task));
});

/**
 * Delete task
 */
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const sprintId = getParamValue(req.params.sprintId);
  const taskId = getParamValue(req.params.taskId);
  if (!sprintId) {
    throw new BadRequestError('Sprint ID is required');
  }
  if (!taskId) {
    throw new BadRequestError('Task ID is required');
  }
  await sprintService.deleteTask(sprintId, taskId);
  res.json(createSuccessResponse(null));
});

export const addPBIToSprint = asyncHandler(async (req: Request, res: Response) => {
  const sprintId = getParamValue(req.params.sprintId);
  if (!sprintId) {
    throw new BadRequestError('Sprint ID is required');
  }
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }
  const result = await sprintBacklogManagerService.addPBIToActiveSprint(sprintId, userId, req.body);
  res.status(201).json(createSuccessResponse(result));
});

export const removePBIFromSprint = asyncHandler(async (req: Request, res: Response) => {
  const sprintId = getParamValue(req.params.sprintId);
  const pbiId = getParamValue(req.params.pbiId);
  if (!sprintId) {
    throw new BadRequestError('Sprint ID is required');
  }
  if (!pbiId) {
    throw new BadRequestError('PBI ID is required');
  }
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }
  const result = await sprintBacklogManagerService.removePBIFromActiveSprint(
    sprintId,
    pbiId,
    userId,
    req.body
  );
  res.json(createSuccessResponse(result));
});

export const getSprintBacklogChanges = asyncHandler(async (req: Request, res: Response) => {
  const sprintId = getParamValue(req.params.sprintId);
  if (!sprintId) {
    throw new BadRequestError('Sprint ID is required');
  }
  const limit = parseInt(req.query.limit as string) || 20;
  const changes = await sprintBacklogManagerService.getSprintBacklogChanges(sprintId, limit);
  res.json(createSuccessResponse(changes));
});

export const getAvailablePBIs = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    throw new BadRequestError('Team ID is required');
  }
  const pbis = await sprintBacklogManagerService.getAvailablePBIsForSprint(teamId);
  res.json(createSuccessResponse(pbis));
});

/**
 * Get DoD compliance report for a sprint
 */
export const getDoDComplianceReport = asyncHandler(async (req: Request, res: Response) => {
  const sprintId = getParamValue(req.params.sprintId);
  if (!sprintId) {
    throw new BadRequestError('Sprint ID is required');
  }
  const report = await definitionOfDoneService.getDoDComplianceReport(sprintId);
  res.json(createSuccessResponse(report));
});
