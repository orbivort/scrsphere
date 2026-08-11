import { type Request, type Response } from 'express';
import { teamHealthCheckService } from '../services/teamHealthCheck.service';
import { asyncHandler, createSuccessResponse, BadRequestError } from '../utils/errors';
import { getParamValue } from '../utils/validation';

export const createHealthCheck = asyncHandler(async (req: Request, res: Response) => {
  const teamId = getParamValue(req.params.teamId ?? req.params.id);
  if (!teamId) {
    throw new BadRequestError('Team ID is required');
  }
  const healthCheck = await teamHealthCheckService.createHealthCheck(
    teamId,
    req.body.sprintId,
    req.user?.id
  );
  res.status(201).json(createSuccessResponse(healthCheck));
});

export const submitResponses = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Health check ID is required');
  }
  const result = await teamHealthCheckService.submitResponses(req.user?.id ?? '', id, req.body);
  res.status(201).json(createSuccessResponse(result));
});

export const getResults = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Health check ID is required');
  }
  const results = await teamHealthCheckService.getResults(id);
  res.json(createSuccessResponse(results));
});

export const getTrend = asyncHandler(async (req: Request, res: Response) => {
  const teamId = getParamValue(req.params.teamId ?? req.params.id);
  if (!teamId) {
    throw new BadRequestError('Team ID is required');
  }
  const trend = await teamHealthCheckService.getTrend(teamId);
  res.json(createSuccessResponse(trend));
});
