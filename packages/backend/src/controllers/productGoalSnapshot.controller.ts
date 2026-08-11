import { type Request, type Response } from 'express';
import { productGoalSnapshotService } from '../services/productGoalSnapshot.service';
import { asyncHandler, createSuccessResponse, BadRequestError } from '../utils/errors';
import { getParamValue } from '../utils/validation';
import type { Prisma } from '../generated/prisma/client';

export const getProductGoalForReview = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Product Goal ID is required');
  }
  const result = await productGoalSnapshotService.getProductGoalForReview(id);
  res.json(createSuccessResponse(result));
});

export const submitProductGoalAssessment = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Product Goal ID is required');
  }
  const snapshot = await productGoalSnapshotService.createSnapshot(req.user?.id ?? '', id, {
    assessment: req.body.assessment,
    successMetricValues: req.body.successMetricValues as Prisma.InputJsonValue | undefined,
  });
  res.status(201).json(createSuccessResponse(snapshot));
});

export const getGoalSnapshots = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Product Goal ID is required');
  }
  const snapshots = await productGoalSnapshotService.getSnapshotsForGoal(id);
  res.json(createSuccessResponse(snapshots));
});
