// Data Export Service for GDPR Article 20 Compliance

import { apiService } from '../index';
import type {
  InitiateExportResponse,
  ExportStatusResponse,
  ActiveExportsResponse,
  ExportOptions,
} from '../../types/dataExport.types';

class DataExportService {
  private readonly baseUrl = '/user';

  async initiateExport(options?: ExportOptions): Promise<InitiateExportResponse> {
    const response = await apiService.post<{ data: InitiateExportResponse }>(
      `${this.baseUrl}/export-data`,
      { options }
    );
    return response.data.data;
  }

  async getExportStatus(jobId: string): Promise<ExportStatusResponse> {
    const response = await apiService.get<{ data: ExportStatusResponse }>(
      `${this.baseUrl}/export-data/status/${jobId}`
    );
    return response.data.data;
  }

  async downloadExport(jobId: string): Promise<Blob> {
    return apiService.downloadExport(jobId);
  }

  async cancelExport(jobId: string): Promise<void> {
    await apiService.cancelExport(jobId);
  }

  async getActiveExports(): Promise<ActiveExportsResponse> {
    const response = await apiService.get<{ data: ActiveExportsResponse }>(
      `${this.baseUrl}/export-data/active`
    );
    return response.data.data;
  }

  createDownloadUrl(blob: Blob, filename: string): string {
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return url;
  }

  revokeDownloadUrl(url: string): void {
    window.URL.revokeObjectURL(url);
  }
}

export const dataExportService = new DataExportService();
export default dataExportService;
