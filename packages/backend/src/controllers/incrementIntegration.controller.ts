import { type Request, type Response } from 'express';
import { incrementIntegrationService } from '../services/incrementIntegration.service';
import { asyncHandler, createSuccessResponse, BadRequestError } from '../utils/errors';
import { getParamValue } from '../utils/validation';

export const createIntegrationTest = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Increment ID is required');
  }
  const test = await incrementIntegrationService.createTest(userId, {
    currentIncrementId: id,
    priorIncrementId: req.body.priorIncrementId,
    testResult: req.body.testResult,
    notes: req.body.notes,
  });
  res.status(201).json(createSuccessResponse(test));
});

export const getIntegrationTests = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Increment ID is required');
  }
  const tests = await incrementIntegrationService.getTestsForIncrement(id);
  res.json(createSuccessResponse(tests));
});

export const verifyIntegration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Increment ID is required');
  }
  const result = await incrementIntegrationService.verifyIntegration(userId, id);
  res.json(createSuccessResponse(result));
});

export const getIncrementChain = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Increment ID is required');
  }
  const chain = await incrementIntegrationService.getIncrementChain(id);
  res.json(createSuccessResponse(chain));
});
