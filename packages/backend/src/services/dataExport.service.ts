// Data Export Service for GDPR Article 20 Compliance

import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { generateUUIDv7 } from '../utils/uuid';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import type {
  ExportJob,
  ExportStatus,
  GDPRDataExport,
  ExportMetadata,
  UserProfileExport,
  UserDataCollection,
  ValidationResult,
  ExportFile,
  ExportOptions,
  JobQueueItem,
  TeamMembershipExport,
  SessionExport,
} from '../types/dataExport.types';
import { EXPORT_SCHEMA_VERSION, DATA_CONTROLLER_INFO } from '../validations/dataExport.validation';

// In-memory job queue (can be replaced with Redis/Bull for production)
const jobQueue = new Map<string, JobQueueItem>();

// Export file storage (in-memory for demo, use filesystem/S3 in production)
const exportStorage = new Map<string, { content: Buffer; expiresAt: Date }>();

class DataExportService {
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupJob();
  }

  /**
   * Initiate a new data export for a user
   */
  async initiateExport(userId: string, options?: ExportOptions): Promise<ExportJob> {
    const jobId = generateUUIDv7();
    const now = new Date();

    // Check for existing active exports
    const existingJobs = Array.from(jobQueue.values()).filter(
      (job) => job.userId === userId && ['pending', 'processing'].includes(job.status)
    );

    if (existingJobs.length > 0) {
      throw new ConflictError('An export is already in progress. Please wait for it to complete.');
    }

    // Create job entry
    const job: JobQueueItem = {
      id: jobId,
      userId,
      status: 'pending',
      progress: 0,
      createdAt: now,
      startedAt: null,
      completedAt: null,
      error: null,
    };

    jobQueue.set(jobId, job);

    // Start processing asynchronously
    this.processExportJob(jobId, userId, options).catch((error) => {
      logger.error('Export job processing failed', { jobId, userId, error });
      const jobItem = jobQueue.get(jobId);
      if (jobItem) {
        jobItem.status = 'failed';
        jobItem.error = error instanceof Error ? error.message : 'Unknown error';
      }
    });

    logger.info('Data export initiated', { jobId, userId });

    return {
      id: jobId,
      userId,
      status: 'pending',
      filePath: null,
      fileSize: null,
      startedAt: now,
      completedAt: null,
      expiresAt: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Get the current status of an export job
   */
  async getExportStatus(jobId: string, userId: string): Promise<ExportJob> {
    const job = jobQueue.get(jobId);

    if (!job) {
      throw new NotFoundError('Export job not found');
    }

    if (job.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this export');
    }

    const fileData = exportStorage.get(jobId);

    return {
      id: jobId,
      userId,
      status: job.status as ExportStatus,
      filePath: job.status === 'completed' ? `/exports/${jobId}` : null,
      fileSize: fileData ? fileData.content.length : null,
      startedAt: job.startedAt ?? job.createdAt,
      completedAt: job.completedAt,
      expiresAt: fileData ? fileData.expiresAt : null,
      errorMessage: job.error,
      createdAt: job.createdAt,
      updatedAt: job.completedAt ?? job.createdAt,
    };
  }

  /**
   * Download a completed export file
   */
  async downloadExport(jobId: string, userId: string): Promise<ExportFile> {
    const job = jobQueue.get(jobId);

    if (!job) {
      throw new NotFoundError('Export job not found');
    }

    if (job.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this export');
    }

    if (job.status !== 'completed') {
      throw new ConflictError(`Export is not ready. Current status: ${job.status}`);
    }

    const fileData = exportStorage.get(jobId);

    if (!fileData) {
      throw new NotFoundError('Export file not found or has expired');
    }

    if (fileData.expiresAt < new Date()) {
      throw new ConflictError('Export file has expired. Please initiate a new export.');
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `scrsphere-data-export-${timestamp}.json`;

    logger.info('Export file downloaded', { jobId, userId, filename });

    return {
      content: fileData.content,
      filename,
      contentType: 'application/json',
      size: fileData.content.length,
    };
  }

  /**
   * Cancel and delete an export job
   */
  async cancelExport(jobId: string, userId: string): Promise<void> {
    const job = jobQueue.get(jobId);

    if (!job) {
      throw new NotFoundError('Export job not found');
    }

    if (job.userId !== userId) {
      throw new ForbiddenError('You do not have permission to cancel this export');
    }

    // Remove from storage if exists
    exportStorage.delete(jobId);
    jobQueue.delete(jobId);

    logger.info('Export job cancelled', { jobId, userId });
  }

  /**
   * Process an export job asynchronously
   */
  private async processExportJob(
    jobId: string,
    userId: string,
    options?: ExportOptions
  ): Promise<void> {
    const job = jobQueue.get(jobId);
    if (!job) return;

    try {
      // Update status to processing
      job.status = 'processing';
      job.startedAt = new Date();
      job.progress = 10;

      // Collect user data
      const userData = await this.collectUserData(userId);
      job.progress = 50;

      // Format data according to GDPR schema
      const exportData = await this.formatExportData(jobId, userData, options);
      job.progress = 80;

      // Validate export completeness
      const validation = this.validateExport(exportData);
      if (!validation.isValid) {
        throw new Error(`Export validation failed: ${validation.errors.join(', ')}`);
      }

      // Convert to JSON buffer
      const jsonContent = JSON.stringify(exportData, null, 2);
      const content = Buffer.from(jsonContent, 'utf-8');

      // Store with 7-day expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      exportStorage.set(jobId, { content, expiresAt });

      // Update job status
      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;

      logger.info('Export job completed successfully', { jobId, userId, fileSize: content.length });
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Export job failed', { jobId, userId, error });
      throw error;
    }
  }

  /**
   * Collect personal data from the database for GDPR export
   * Note: Activity data (daily scrum updates, task assignments, etc.) is excluded
   * as it represents business data rather than personal data under GDPR
   */
  async collectUserData(userId: string): Promise<UserDataCollection> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const [teamMemberships, sessions] = await Promise.all([
      prisma.teamMember.findMany({
        where: { userId },
        include: { team: { select: { id: true, name: true } } },
      }),
      prisma.refreshToken.findMany({
        where: { userId },
      }),
    ]);

    return {
      user,
      teamMemberships,
      dailyUpdates: [],
      assignedTasks: [],
      reportedImpediments: [],
      ownedImpediments: [],
      retrospectiveItems: [],
      actionItems: [],
      votes: [],
      dodVerifications: [],
      dorVerifications: [],
      feedback: [],
      backlogAdjustments: [],
      notifications: [],
      sessions,
      statusChanges: [],
    };
  }

  /**
   * Format collected data according to GDPR export schema
   * Note: Activity data is excluded as it represents business data
   */
  private async formatExportData(
    exportId: string,
    data: UserDataCollection,
    _options?: ExportOptions
  ): Promise<GDPRDataExport> {
    const now = new Date();

    const user = data.user;
    if (!user) {
      throw new NotFoundError('User data not found');
    }

    const metadata: ExportMetadata = {
      version: EXPORT_SCHEMA_VERSION,
      exportedAt: now.toISOString(),
      userId: user.id,
      format: DATA_CONTROLLER_INFO.format,
      dataController: DATA_CONTROLLER_INFO.name,
      contactEmail: DATA_CONTROLLER_INFO.contactEmail,
      exportId,
    };

    const userProfile: UserProfileExport = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    const teamMemberships: TeamMembershipExport[] = data.teamMemberships.map((tm) => ({
      id: tm.id,
      teamId: tm.team.id,
      teamName: tm.team.name,
      role: tm.role,
      joinedAt: tm.joinedAt.toISOString(),
    }));

    const sessionInformation: SessionExport[] = data.sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      lastActivityAt: s.lastActivityAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      revokedAt: s.revokedAt?.toISOString() ?? null,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
    }));

    return {
      exportMetadata: metadata,
      userProfile,
      teamMemberships,
      sessionInformation,
    };
  }

  /**
   * Validate export data completeness
   */
  private validateExport(data: GDPRDataExport): ValidationResult {
    const errors: string[] = [];
    const missingCategories: string[] = [];

    if (!data.exportMetadata.version) errors.push('Missing export version');
    if (!data.exportMetadata.exportedAt) errors.push('Missing export timestamp');
    if (!data.exportMetadata.userId) errors.push('Missing user ID');

    if (!data.userProfile) {
      missingCategories.push('userProfile');
    }

    if (!data.teamMemberships) {
      missingCategories.push('teamMemberships');
    }

    if (!data.sessionInformation) {
      missingCategories.push('sessionInformation');
    }

    return {
      isValid: errors.length === 0,
      missingCategories,
      errors,
    };
  }

  /**
   * Clean up expired exports periodically
   */
  private startCleanupJob(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Run cleanup every hour
    this.cleanupInterval = setInterval(
      () => {
        void this.cleanupExpiredExports();
      },
      60 * 60 * 1000
    );

    // Initial cleanup
    void this.cleanupExpiredExports();
  }

  /**
   * Remove expired export files and jobs
   */
  async cleanupExpiredExports(): Promise<{ deleted: number }> {
    const now = new Date();
    let deleted = 0;

    // Clean up expired files
    for (const [jobId, fileData] of exportStorage.entries()) {
      if (fileData.expiresAt < now) {
        exportStorage.delete(jobId);
        deleted++;

        // Update job status if exists
        const job = jobQueue.get(jobId);
        if (job) {
          job.status = 'expired';
        }
      }
    }

    // Clean up old failed/pending jobs (older than 24 hours)
    const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    for (const [jobId, job] of jobQueue.entries()) {
      if (job.createdAt < cutoffTime && ['failed', 'expired'].includes(job.status)) {
        jobQueue.delete(jobId);
      }
    }

    if (deleted > 0) {
      logger.info('Cleaned up expired exports', { deleted });
    }

    return { deleted };
  }

  /**
   * Stop the cleanup job (for graceful shutdown)
   */
  stopCleanupJob(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Export cleanup job stopped');
    }
  }

  /**
   * Get active export jobs for a user
   */
  async getActiveExports(userId: string): Promise<ExportJob[]> {
    const jobs: ExportJob[] = [];

    for (const [jobId, job] of jobQueue.entries()) {
      if (job.userId === userId && ['pending', 'processing'].includes(job.status)) {
        jobs.push({
          id: jobId,
          userId,
          status: job.status as ExportStatus,
          filePath: null,
          fileSize: null,
          startedAt: job.startedAt ?? job.createdAt,
          completedAt: job.completedAt,
          expiresAt: null,
          errorMessage: job.error,
          createdAt: job.createdAt,
          updatedAt: job.startedAt ?? job.createdAt,
        });
      }
    }

    return jobs;
  }
}

export const dataExportService = new DataExportService();
export default dataExportService;
