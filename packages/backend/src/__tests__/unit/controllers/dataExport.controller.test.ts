import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initiateExport,
  getExportStatus,
  downloadExport,
  cancelExport,
  getActiveExports,
} from '../../../controllers/dataExport.controller';
import { dataExportService } from '../../../services/dataExport.service';
import { BadRequestError } from '../../../utils/errors';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup/testSetup';

vi.mock('../../../services/dataExport.service', () => ({
  dataExportService: {
    initiateExport: vi.fn(),
    getExportStatus: vi.fn(),
    downloadExport: vi.fn(),
    cancelExport: vi.fn(),
    getActiveExports: vi.fn(),
  },
}));

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('DataExport Controller', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('initiateExport', () => {
    it('should initiate export successfully', async () => {
      mockReq.userId = 'user-123';
      mockReq.body = {
        options: {
          includeTeams: true,
          includeSprints: true,
        },
      };

      const mockJob = {
        id: 'job-123',
        status: 'pending',
      };

      (dataExportService.initiateExport as any).mockResolvedValue(mockJob);

      initiateExport(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(dataExportService.initiateExport).toHaveBeenCalledWith('user-123', {
        includeTeams: true,
        includeSprints: true,
      });
      expect(mockRes._status).toBe(202);
      expect(mockRes._json.success).toBe(true);
      expect(mockRes._json.data.jobId).toBe('job-123');
      expect(mockRes._json.data.status).toBe('pending');
      expect(mockRes._json.data.message).toContain('Data export initiated');
    });

    it('should include estimated completion time', async () => {
      mockReq.userId = 'user-123';
      mockReq.body = { options: {} };

      const beforeTime = Date.now();

      (dataExportService.initiateExport as any).mockResolvedValue({
        id: 'job-123',
        status: 'pending',
      });

      initiateExport(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const response = mockRes._json;
      expect(response.data.estimatedCompletionTime).toBeDefined();

      const estimatedTime = new Date(response.data.estimatedCompletionTime).getTime();
      expect(estimatedTime).toBeGreaterThanOrEqual(beforeTime + 25000);
      expect(estimatedTime).toBeLessThanOrEqual(Date.now() + 35000);
    });

    it('should handle service errors', async () => {
      mockReq.userId = 'user-123';
      mockReq.body = { options: {} };
      const error = new Error('Export failed');

      (dataExportService.initiateExport as any).mockRejectedValue(error);

      initiateExport(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getExportStatus', () => {
    it('should return export status for pending job', async () => {
      mockReq.userId = 'user-123';
      mockReq.params = { jobId: 'job-123' };

      const mockJob = {
        id: 'job-123',
        status: 'pending',
        fileSize: null,
        completedAt: null,
        expiresAt: null,
        errorMessage: null,
      };

      (dataExportService.getExportStatus as any).mockResolvedValue(mockJob);

      getExportStatus(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(dataExportService.getExportStatus).toHaveBeenCalledWith('job-123', 'user-123');
      expect(mockRes._json.success).toBe(true);
      expect(mockRes._json.data.progress).toBe(0);
      expect(mockRes._json.data.status).toBe('pending');
    });

    it('should return export status for processing job', async () => {
      mockReq.userId = 'user-123';
      mockReq.params = { jobId: 'job-123' };

      const mockJob = {
        id: 'job-123',
        status: 'processing',
        fileSize: null,
        completedAt: null,
        expiresAt: null,
        errorMessage: null,
      };

      (dataExportService.getExportStatus as any).mockResolvedValue(mockJob);

      getExportStatus(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes._json.data.progress).toBe(50);
    });

    it('should return export status for completed job', async () => {
      mockReq.userId = 'user-123';
      mockReq.params = { jobId: 'job-123' };

      const completedAt = new Date();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const mockJob = {
        id: 'job-123',
        status: 'completed',
        fileSize: 1024,
        completedAt,
        expiresAt,
        errorMessage: null,
      };

      (dataExportService.getExportStatus as any).mockResolvedValue(mockJob);

      getExportStatus(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes._json.data.progress).toBe(100);
      expect(mockRes._json.data.fileSize).toBe(1024);
      expect(mockRes._json.data.completedAt).toBe(completedAt.toISOString());
      expect(mockRes._json.data.expiresAt).toBe(expiresAt.toISOString());
    });

    it('should return export status for failed job', async () => {
      mockReq.userId = 'user-123';
      mockReq.params = { jobId: 'job-123' };

      const mockJob = {
        id: 'job-123',
        status: 'failed',
        fileSize: null,
        completedAt: null,
        expiresAt: null,
        errorMessage: 'Export failed due to timeout',
      };

      (dataExportService.getExportStatus as any).mockResolvedValue(mockJob);

      getExportStatus(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes._json.data.progress).toBe(0);
      expect(mockRes._json.data.errorMessage).toBe('Export failed due to timeout');
    });

    it('should return export status for expired job', async () => {
      mockReq.userId = 'user-123';
      mockReq.params = { jobId: 'job-123' };

      const mockJob = {
        id: 'job-123',
        status: 'expired',
        fileSize: null,
        completedAt: null,
        expiresAt: null,
        errorMessage: null,
      };

      (dataExportService.getExportStatus as any).mockResolvedValue(mockJob);

      getExportStatus(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes._json.data.progress).toBe(0);
    });

    it('should throw BadRequestError when jobId is missing', async () => {
      mockReq.userId = 'user-123';
      mockReq.params = {};

      getExportStatus(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Job ID is required');
    });

    it('should handle service errors', async () => {
      mockReq.userId = 'user-123';
      mockReq.params = { jobId: 'job-123' };
      const error = new Error('Job not found');

      (dataExportService.getExportStatus as any).mockRejectedValue(error);

      getExportStatus(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('downloadExport', () => {
    it('should download export file', async () => {
      mockReq.userId = 'user-123';
      mockReq.params = { jobId: 'job-123' };

      const mockFile = {
        content: Buffer.from('test data'),
        filename: 'export-user-123.json',
        contentType: 'application/json',
        size: 9,
      };

      (dataExportService.downloadExport as any).mockResolvedValue(mockFile);

      downloadExport(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(dataExportService.downloadExport).toHaveBeenCalledWith('job-123', 'user-123');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="export-user-123.json"'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Length', '9');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'private, no-cache, no-store'
      );
      expect(mockRes.send).toHaveBeenCalledWith(mockFile.content);
    });

    it('should throw BadRequestError when jobId is missing', async () => {
      mockReq.userId = 'user-123';
      mockReq.params = {};

      downloadExport(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Job ID is required');
    });

    it('should handle service errors', async () => {
      mockReq.userId = 'user-123';
      mockReq.params = { jobId: 'job-123' };
      const error = new Error('Export not ready');

      (dataExportService.downloadExport as any).mockRejectedValue(error);

      downloadExport(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('cancelExport', () => {
    it('should cancel export successfully', async () => {
      mockReq.userId = 'user-123';
      mockReq.params = { jobId: 'job-123' };

      (dataExportService.cancelExport as any).mockResolvedValue(undefined);

      cancelExport(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(dataExportService.cancelExport).toHaveBeenCalledWith('job-123', 'user-123');
      expect(mockRes._json).toEqual({
        success: true,
        data: {
          message: 'Export cancelled successfully',
          jobId: 'job-123',
        },
      });
    });

    it('should throw BadRequestError when jobId is missing', async () => {
      mockReq.userId = 'user-123';
      mockReq.params = {};

      cancelExport(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect((mockNext.mock.calls[0] as any)[0].message).toBe('Job ID is required');
    });

    it('should handle service errors', async () => {
      mockReq.userId = 'user-123';
      mockReq.params = { jobId: 'job-123' };
      const error = new Error('Cannot cancel completed export');

      (dataExportService.cancelExport as any).mockRejectedValue(error);

      cancelExport(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getActiveExports', () => {
    it('should return active exports', async () => {
      mockReq.userId = 'user-123';

      const mockExports = [
        {
          id: 'job-1',
          status: 'pending',
          startedAt: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'job-2',
          status: 'processing',
          startedAt: new Date('2024-01-02'),
          createdAt: new Date('2024-01-02'),
        },
      ];

      (dataExportService.getActiveExports as any).mockResolvedValue(mockExports);

      getActiveExports(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).not.toHaveBeenCalled();
      expect(dataExportService.getActiveExports).toHaveBeenCalledWith('user-123');
      expect(mockRes._json.success).toBe(true);
      expect(mockRes._json.data.exports).toHaveLength(2);
      expect(mockRes._json.data.count).toBe(2);
    });

    it('should handle empty active exports', async () => {
      mockReq.userId = 'user-123';

      (dataExportService.getActiveExports as any).mockResolvedValue([]);

      getActiveExports(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRes._json.data.exports).toEqual([]);
      expect(mockRes._json.data.count).toBe(0);
    });

    it('should handle service errors', async () => {
      mockReq.userId = 'user-123';
      const error = new Error('Database error');

      (dataExportService.getActiveExports as any).mockRejectedValue(error);

      getActiveExports(mockReq as any, mockRes as any, mockNext);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
