// Data Export Service for GDPR Article 20 Compliance

import { coreApiService } from '../core/api.core';
import type {
  InitiateExportRequest,
  InitiateExportResponse,
  ExportStatusResponse,
  ActiveExportsResponse,
  ExportOptions,
} from '../../types/dataExport.types';

/**
 * Service for handling GDPR data export operations
 */
class DataExportService {
  private readonly baseUrl = '/user';

  /**
   * Initiate a new data export
   */
  async initiateExport(options?: ExportOptions): Promise<InitiateExportResponse> {
    const request: InitiateExportRequest = { options };
    const response = await coreApiService.axiosInstance.post(
      `${this.baseUrl}/export-data`,
      request
    );
    return response.data.data;
  }

  /**
   * Check the status of an export job
   */
  async getExportStatus(jobId: string): Promise<ExportStatusResponse> {
    const response = await coreApiService.axiosInstance.get(
      `${this.baseUrl}/export-data/status/${jobId}`
    );
    return response.data.data;
  }

  /**
   * Download a completed export file
   * Returns a blob URL that can be used for download
   */
  async downloadExport(jobId: string): Promise<Blob> {
    const response = await coreApiService.axiosInstance.get(
      `${this.baseUrl}/export-data/download/${jobId}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  /**
   * Cancel an active export job
   */
  async cancelExport(jobId: string): Promise<void> {
    await coreApiService.axiosInstance.delete(`${this.baseUrl}/export-data/${jobId}`);
  }

  /**
   * Get all active export jobs for the current user
   */
  async getActiveExports(): Promise<ActiveExportsResponse> {
    const response = await coreApiService.axiosInstance.get(`${this.baseUrl}/export-data/active`);
    return response.data.data;
  }

  /**
   * Create a download URL from a blob
   * Remember to revoke the URL when done!
   */
  createDownloadUrl(blob: Blob, filename: string): string {
    const url = window.URL.createObjectURL(blob);

    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return url;
  }

  /**
   * Revoke a blob URL to free memory
   */
  revokeDownloadUrl(url: string): void {
    window.URL.revokeObjectURL(url);
  }
}

export const dataExportService = new DataExportService();
export default dataExportService;
