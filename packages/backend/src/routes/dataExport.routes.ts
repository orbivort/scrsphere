// Data Export Routes for GDPR Article 20 Compliance

import { Router, type Router as RouterType } from 'express';
import * as dataExportController from '../controllers/dataExport.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { authRateLimit, apiRateLimit } from '../middleware/rateLimit.middleware';
import {
  initiateExportSchema,
  exportStatusSchema,
  exportDownloadSchema,
  exportCancellationSchema,
} from '../validations/dataExport.validation';

const router: RouterType = Router();

/**
 * POST /api/user/export-data
 * Initiate a new data export
 * Rate limit: 1 per hour per user
 */
router.post(
  '/export-data',
  authenticate,
  authRateLimit, // 1 per hour
  validateBody(initiateExportSchema),
  dataExportController.initiateExport
);

/**
 * GET /api/user/export-data/active
 * Get all active export jobs for the user
 */
router.get(
  '/export-data/active',
  authenticate,
  apiRateLimit,
  dataExportController.getActiveExports
);

/**
 * GET /api/user/export-data/status/:jobId
 * Check the status of an export job
 * Rate limit: 10 per minute per user
 */
router.get(
  '/export-data/status/:jobId',
  authenticate,
  apiRateLimit,
  validateParams(exportStatusSchema),
  dataExportController.getExportStatus
);

/**
 * GET /api/user/export-data/download/:jobId
 * Download a completed export file
 * Rate limit: 5 per minute per user
 */
router.get(
  '/export-data/download/:jobId',
  authenticate,
  apiRateLimit,
  validateParams(exportDownloadSchema),
  dataExportController.downloadExport
);

/**
 * DELETE /api/user/export-data/:jobId
 * Cancel and delete an export job
 */
router.delete(
  '/export-data/:jobId',
  authenticate,
  apiRateLimit,
  validateParams(exportCancellationSchema),
  dataExportController.cancelExport
);

export default router;
