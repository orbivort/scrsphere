// Data Export Controller for GDPR Article 20 Compliance

import { type Request, type Response } from 'express';
import { dataExportService } from '../services/dataExport.service';
import {
  asyncHandler,
  createSuccessResponse,
  BadRequestError,
  UnauthorizedError,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { getParamValue } from '../utils/validation';
import type { InitiateExportInput } from '../validations/dataExport.validation';

/**
 * Initiate a new data export for the authenticated user
 */
export const initiateExport = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  const data = req.body as InitiateExportInput;

  logger.info('Initiating data export', { userId });

  const job = await dataExportService.initiateExport(userId, data.options);

  // Calculate estimated completion time (typically 5-30 seconds)
  const estimatedCompletionTime = new Date();
  estimatedCompletionTime.setSeconds(estimatedCompletionTime.getSeconds() + 30);

  res.status(202).json(
    createSuccessResponse({
      jobId: job.id,
      status: job.status,
      estimatedCompletionTime: estimatedCompletionTime.toISOString(),
      message: 'Data export initiated. You can check the status using the job ID.',
    })
  );
});

/**
 * Get the status of a data export job
 */
export const getExportStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  const jobId = getParamValue(req.params.jobId);

  if (!jobId) {
    throw new BadRequestError('Job ID is required');
  }

  const job = await dataExportService.getExportStatus(jobId, userId);

  // Calculate progress percentage based on status
  let progress = 0;
  switch (job.status) {
    case 'pending':
      progress = 0;
      break;
    case 'processing':
      progress = 50;
      break;
    case 'completed':
      progress = 100;
      break;
    case 'failed':
      progress = 0;
      break;
    case 'expired':
      progress = 0;
      break;
  }

  res.json(
    createSuccessResponse({
      jobId: job.id,
      status: job.status,
      progress,
      fileSize: job.fileSize,
      completedAt: job.completedAt?.toISOString() ?? null,
      expiresAt: job.expiresAt?.toISOString() ?? null,
      errorMessage: job.errorMessage,
    })
  );
});

/**
 * Download a completed data export file
 */
export const downloadExport = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  const jobId = getParamValue(req.params.jobId);

  if (!jobId) {
    throw new BadRequestError('Job ID is required');
  }

  logger.info('Downloading data export', { jobId, userId });

  const exportFile = await dataExportService.downloadExport(jobId, userId);

  // Set appropriate headers for file download
  res.setHeader('Content-Type', exportFile.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${exportFile.filename}"`);
  res.setHeader('Content-Length', exportFile.size.toString());
  res.setHeader('Cache-Control', 'private, no-cache, no-store');

  // Send the file content
  res.send(exportFile.content);
});

/**
 * Cancel and delete an export job
 */
export const cancelExport = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  const jobId = getParamValue(req.params.jobId);

  if (!jobId) {
    throw new BadRequestError('Job ID is required');
  }

  await dataExportService.cancelExport(jobId, userId);

  logger.info('Data export cancelled', { jobId, userId });

  res.json(
    createSuccessResponse({
      message: 'Export cancelled successfully',
      jobId,
    })
  );
});

/**
 * Get all active export jobs for the user
 */
export const getActiveExports = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const activeExports = await dataExportService.getActiveExports(userId);

  res.json(
    createSuccessResponse({
      exports: activeExports.map((job) => ({
        jobId: job.id,
        status: job.status,
        startedAt: job.startedAt.toISOString(),
        createdAt: job.createdAt.toISOString(),
      })),
      count: activeExports.length,
    })
  );
});
