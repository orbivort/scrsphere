import { type Request, type Response } from 'express';
import { reportsService } from '../services/reports.service';
import { asyncHandler, createSuccessResponse } from '../utils/errors';

export const getVelocityData = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.query;

  if (!teamId || typeof teamId !== 'string') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Team ID is required',
      },
    });
    return;
  }

  const data = await reportsService.getVelocityData(teamId);
  res.json(createSuccessResponse(data));
});

export const getSprintHistory = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.query;

  if (!teamId || typeof teamId !== 'string') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Team ID is required',
      },
    });
    return;
  }

  const data = await reportsService.getSprintHistory(teamId);
  res.json(createSuccessResponse(data));
});

export const getTeamMetrics = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.query;

  if (!teamId || typeof teamId !== 'string') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Team ID is required',
      },
    });
    return;
  }

  const data = await reportsService.getTeamMetrics(teamId);
  res.json(createSuccessResponse(data));
});

export const getInsights = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.query;

  if (!teamId || typeof teamId !== 'string') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Team ID is required',
      },
    });
    return;
  }

  const data = await reportsService.getInsights(teamId);
  res.json(createSuccessResponse(data));
});
