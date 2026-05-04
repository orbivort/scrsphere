import { type Request, type Response } from 'express';
import { impedimentService } from '../services/impediment.service';
import { asyncHandler, createSuccessResponse, BadRequestError } from '../utils/errors';
import { getParamValue } from '../utils/validation';

export const getImpediments = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    throw new BadRequestError('teamId is required');
  }
  const impediments = await impedimentService.getImpedimentsByTeam(teamId);
  return res.json(createSuccessResponse(impediments));
});

export const getImpedimentById = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Impediment ID is required');
  }
  const { teamId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    throw new BadRequestError('teamId is required');
  }
  const impediment = await impedimentService.getImpedimentById(id, teamId);
  if (!impediment) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Impediment not found',
      },
    });
  }
  return res.json(createSuccessResponse(impediment));
});

export const createImpediment = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, sprintId, title, description, ownerId } = req.body;

  if (!teamId || !title || !description) {
    throw new BadRequestError('teamId, title, and description are required');
  }

  if (!req.userId) {
    throw new BadRequestError('User not authenticated');
  }

  const impediment = await impedimentService.createImpediment({
    teamId,
    sprintId,
    title,
    description,
    ownerId,
    reportedById: req.userId,
  });

  return res.status(201).json(createSuccessResponse(impediment));
});

export const updateImpediment = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Impediment ID is required');
  }
  const { teamId, status, resolution, ownerId } = req.body;

  if (!teamId) {
    throw new BadRequestError('teamId is required');
  }

  const impediment = await impedimentService.updateImpediment(id, teamId, {
    status,
    resolution,
    ownerId,
  });

  return res.json(createSuccessResponse(impediment));
});

export const deleteImpediment = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Impediment ID is required');
  }
  const { teamId } = req.query;

  if (!teamId || typeof teamId !== 'string') {
    throw new BadRequestError('teamId is required');
  }

  await impedimentService.deleteImpediment(id, teamId);
  return res.json(createSuccessResponse({ message: 'Impediment deleted successfully' }));
});

export const getImpedimentStats = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    throw new BadRequestError('teamId is required');
  }
  const stats = await impedimentService.getImpedimentStats(teamId);
  return res.json(createSuccessResponse(stats));
});
