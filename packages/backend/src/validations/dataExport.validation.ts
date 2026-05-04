// Data Export Validation Schemas

import { z } from 'zod';

// Export initiation schema
export const initiateExportSchema = z.object({
  options: z
    .object({
      includeSessions: z.boolean().optional().default(true),
      includeNotifications: z.boolean().optional().default(true),
      dataCategories: z.array(z.string()).optional(),
    })
    .optional(),
});

// Export status query schema
export const exportStatusSchema = z.object({
  jobId: z.string().uuid('Invalid job ID format'),
});

// Export download schema
export const exportDownloadSchema = z.object({
  jobId: z.string().uuid('Invalid job ID format'),
});

// Export cancellation schema
export const exportCancellationSchema = z.object({
  jobId: z.string().uuid('Invalid job ID format'),
});

// Type exports
export type InitiateExportInput = z.infer<typeof initiateExportSchema>;
export type ExportStatusInput = z.infer<typeof exportStatusSchema>;
export type ExportDownloadInput = z.infer<typeof exportDownloadSchema>;
export type ExportCancellationInput = z.infer<typeof exportCancellationSchema>;

// Constants for validation
export const EXPORT_CONSTANTS = {
  // Rate limiting
  MAX_EXPORTS_PER_HOUR: 1,
  MAX_STATUS_CHECKS_PER_MINUTE: 10,
  MAX_DOWNLOADS_PER_MINUTE: 5,

  // File constraints
  MAX_FILE_SIZE_MB: 100,
  EXPORT_RETENTION_DAYS: 7,

  // Processing
  MAX_PROCESSING_TIME_MS: 5 * 60 * 1000, // 5 minutes
  POLLING_INTERVAL_MS: 2000, // 2 seconds

  // Data categories
  VALID_DATA_CATEGORIES: [
    'userProfile',
    'teamMemberships',
    'dailyUpdates',
    'assignedTasks',
    'reportedImpediments',
    'ownedImpediments',
    'retrospectiveItems',
    'actionItems',
    'votes',
    'dodVerifications',
    'dorVerifications',
    'feedback',
    'backlogAdjustments',
    'notifications',
    'sessionHistory',
    'statusChanges',
  ] as const,
} as const;

// Schema version
export const EXPORT_SCHEMA_VERSION = '1.0.0';

// Data controller info
export const DATA_CONTROLLER_INFO = {
  name: 'ScrSphere',
  contactEmail: 'privacy@example.com',
  format: 'GDPR-PORTABLE-JSON' as const,
};
