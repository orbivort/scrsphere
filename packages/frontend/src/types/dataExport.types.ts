// Data Export Types for GDPR Article 20 Compliance

// Export Job Status
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

// Export Options
export interface ExportOptions {
  includeSessions?: boolean;
  includeNotifications?: boolean;
  dataCategories?: string[];
}

// Export Initiation Request
export interface InitiateExportRequest {
  options?: ExportOptions;
}

// Export Initiation Response
export interface InitiateExportResponse {
  jobId: string;
  status: ExportStatus;
  estimatedCompletionTime: string;
  message: string;
}

// Export Status Response
export interface ExportStatusResponse {
  jobId: string;
  status: ExportStatus;
  progress: number;
  fileSize: number | null;
  completedAt: string | null;
  expiresAt: string | null;
  errorMessage: string | null;
}

// Active Export Item
export interface ActiveExport {
  jobId: string;
  status: ExportStatus;
  startedAt: string;
  createdAt: string;
}

// Active Exports Response
export interface ActiveExportsResponse {
  exports: ActiveExport[];
  count: number;
}

// Export File Info
export interface ExportFileInfo {
  filename: string;
  contentType: string;
  size: number;
}

// Data Export State for React Hook
export interface DataExportState {
  isLoading: boolean;
  isPolling: boolean;
  currentJobId: string | null;
  status: ExportStatus | null;
  progress: number;
  error: string | null;
  downloadUrl: string | null;
  expiresAt: string | null;
}

// Data Export Hook Return Type
export interface UseDataExportReturn {
  // State
  state: DataExportState;

  // Actions
  initiateExport: (options?: ExportOptions) => Promise<void>;
  checkStatus: (jobId: string) => Promise<void>;
  downloadExport: (jobId: string) => Promise<void>;
  cancelExport: (jobId: string) => Promise<void>;
  reset: () => void;

  // Helpers
  isActive: boolean;
  canDownload: boolean;
  hasError: boolean;
}

// GDPR Data Export Schema (simplified for frontend display)
export interface GDPRDataExportPreview {
  exportMetadata: {
    version: string;
    exportedAt: string;
    userId: string;
    format: string;
    dataController: string;
    contactEmail: string;
    exportId: string;
  };
  dataCategories: string[];
  recordCounts: Record<string, number>;
}

// UI Component Props
export interface DataExportButtonProps {
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
}

export interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  onDownload?: () => void;
}

export interface DataExportProgressProps {
  status: ExportStatus;
  progress: number;
  errorMessage?: string | null;
}

// Error Types
export interface ExportError {
  code: string;
  message: string;
  retryAfter?: number;
}
