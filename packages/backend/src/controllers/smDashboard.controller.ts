import { type Request, type Response } from 'express';
import { smDashboardService } from '../services/smDashboard.service';
import { smNotesService } from '../services/smNotes.service';
import { asyncHandler, createSuccessResponse, BadRequestError } from '../utils/errors';
import { getParamValue } from '../utils/validation';

export const getSmDashboard = asyncHandler(async (req: Request, res: Response) => {
  const teamId = req.currentTeamId as string;
  const sprintCount = req.query.sprintCount ? parseInt(req.query.sprintCount as string, 10) : 5;
  const dashboard = await smDashboardService.getDashboard(teamId, sprintCount);
  res.json(createSuccessResponse(dashboard));
});

export const getEventSchedule = asyncHandler(async (req: Request, res: Response) => {
  const teamId = req.currentTeamId as string;
  const schedule = await smDashboardService.getEventSchedule(teamId);
  res.json(createSuccessResponse(schedule));
});

export const updateSprintSmNotes = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Sprint ID is required');
  }
  const updated = await smNotesService.updateSprintNotes(id, req.body.smNotes, req.user?.id);
  res.json(createSuccessResponse(updated));
});

export const updateSprintReviewSmNotes = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Sprint ID is required');
  }
  const updated = await smNotesService.updateSprintReviewNotes(id, req.body.smNotes, req.user?.id);
  res.json(createSuccessResponse(updated));
});

export const updateRetrospectiveSmNotes = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Sprint ID is required');
  }
  const updated = await smNotesService.updateRetrospectiveNotes(id, req.body.smNotes, req.user?.id);
  res.json(createSuccessResponse(updated));
});
