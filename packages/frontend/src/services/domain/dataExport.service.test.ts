import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dataExportService } from './dataExport.service';
import { apiService } from '../index';

vi.mock('../index', () => ({
  apiService: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    downloadExport: vi.fn(),
    cancelExport: vi.fn(),
  },
}));

describe('DataExportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initiateExport', () => {
    it('should initiate a new data export', async () => {
      const mockResponse = {
        data: {
          data: {
            jobId: 'export-123',
            status: 'pending',
            estimatedCompletionTime: '2024-01-15T12:00:00Z',
            message: 'Export job started successfully',
          },
        },
      };
      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      const result = await dataExportService.initiateExport();

      expect(apiService.post).toHaveBeenCalledWith('/user/export-data', { options: undefined });
      expect(result.jobId).toBe('export-123');
      expect(result.status).toBe('pending');
    });

    it('should initiate export with options', async () => {
      const options = {
        includeSessions: true,
        includeNotifications: false,
        dataCategories: ['profile', 'activity'],
      };
      const mockResponse = {
        data: {
          data: {
            jobId: 'export-456',
            status: 'pending',
            estimatedCompletionTime: '2024-01-15T12:00:00Z',
            message: 'Export job started',
          },
        },
      };
      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      const result = await dataExportService.initiateExport(options);

      expect(apiService.post).toHaveBeenCalledWith('/user/export-data', { options });
      expect(result.jobId).toBe('export-456');
    });

    it('should handle initiation errors', async () => {
      vi.mocked(apiService.post).mockRejectedValue(new Error('Export limit reached'));

      await expect(dataExportService.initiateExport()).rejects.toThrow('Export limit reached');
    });
  });

  describe('getExportStatus', () => {
    it('should get export job status', async () => {
      const mockResponse = {
        data: {
          data: {
            jobId: 'export-123',
            status: 'processing',
            progress: 50,
            fileSize: null,
            completedAt: null,
            expiresAt: null,
            errorMessage: null,
          },
        },
      };
      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await dataExportService.getExportStatus('export-123');

      expect(apiService.get).toHaveBeenCalledWith('/user/export-data/status/export-123');
      expect(result.jobId).toBe('export-123');
      expect(result.status).toBe('processing');
      expect(result.progress).toBe(50);
    });

    it('should get completed export status', async () => {
      const mockResponse = {
        data: {
          data: {
            jobId: 'export-123',
            status: 'completed',
            progress: 100,
            fileSize: 1024000,
            completedAt: '2024-01-15T11:30:00Z',
            expiresAt: '2024-01-22T11:30:00Z',
            errorMessage: null,
          },
        },
      };
      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await dataExportService.getExportStatus('export-123');

      expect(result.status).toBe('completed');
      expect(result.progress).toBe(100);
      expect(result.fileSize).toBe(1024000);
    });

    it('should handle failed export status', async () => {
      const mockResponse = {
        data: {
          data: {
            jobId: 'export-123',
            status: 'failed',
            progress: 75,
            fileSize: null,
            completedAt: null,
            expiresAt: null,
            errorMessage: 'Database connection error',
          },
        },
      };
      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await dataExportService.getExportStatus('export-123');

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('Database connection error');
    });
  });

  describe('downloadExport', () => {
    it('should download export file as blob', async () => {
      const mockBlob = new Blob(['export data'], { type: 'application/json' });
      vi.mocked(apiService.downloadExport).mockResolvedValue(mockBlob);

      const result = await dataExportService.downloadExport('export-123');

      expect(apiService.downloadExport).toHaveBeenCalledWith('export-123');
      expect(result).toBe(mockBlob);
    });

    it('should handle download errors', async () => {
      vi.mocked(apiService.downloadExport).mockRejectedValue(new Error('File not found'));

      await expect(dataExportService.downloadExport('invalid-id')).rejects.toThrow(
        'File not found'
      );
    });
  });

  describe('cancelExport', () => {
    it('should cancel an active export', async () => {
      vi.mocked(apiService.cancelExport).mockResolvedValue(undefined);

      await dataExportService.cancelExport('export-123');

      expect(apiService.cancelExport).toHaveBeenCalledWith('export-123');
    });

    it('should handle cancel errors', async () => {
      vi.mocked(apiService.cancelExport).mockRejectedValue(new Error('Export already completed'));

      await expect(dataExportService.cancelExport('export-123')).rejects.toThrow(
        'Export already completed'
      );
    });
  });

  describe('getActiveExports', () => {
    it('should get all active exports', async () => {
      const mockResponse = {
        data: {
          data: {
            exports: [
              {
                jobId: 'export-123',
                status: 'processing',
                startedAt: '2024-01-15T10:00:00Z',
                createdAt: '2024-01-15T10:00:00Z',
              },
              {
                jobId: 'export-124',
                status: 'pending',
                startedAt: '2024-01-15T10:05:00Z',
                createdAt: '2024-01-15T10:05:00Z',
              },
            ],
            count: 2,
          },
        },
      };
      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await dataExportService.getActiveExports();

      expect(apiService.get).toHaveBeenCalledWith('/user/export-data/active');
      expect(result.exports).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('should return empty array when no active exports', async () => {
      const mockResponse = {
        data: {
          data: {
            exports: [],
            count: 0,
          },
        },
      };
      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await dataExportService.getActiveExports();

      expect(result.exports).toHaveLength(0);
      expect(result.count).toBe(0);
    });
  });

  describe('createDownloadUrl', () => {
    it('should create a download URL and trigger download', () => {
      const mockBlob = new Blob(['test data'], { type: 'application/json' });
      const filename = 'my-data-export.json';

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      const appendChildSpy = vi
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => mockLink as unknown as Node);
      const removeChildSpy = vi
        .spyOn(document.body, 'removeChild')
        .mockImplementation(() => mockLink as unknown as Node);

      const url = dataExportService.createDownloadUrl(mockBlob, filename);

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockLink.download).toBe(filename);
      expect(mockLink.click).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
      expect(url).toBe('blob:mock-url');

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('revokeDownloadUrl', () => {
    it('should revoke a blob URL', () => {
      const url = 'blob:mock-url-to-revoke';

      dataExportService.revokeDownloadUrl(url);

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(url);
    });
  });
});
