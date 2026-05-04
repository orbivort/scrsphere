// Unit Tests for useDataExport Hook

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataExport } from './useDataExport';
import { dataExportService } from '../services/domain/dataExport.service';

// Mock the data export service
vi.mock('../services/domain/dataExport.service', () => ({
  dataExportService: {
    initiateExport: vi.fn(),
    getExportStatus: vi.fn(),
    downloadExport: vi.fn(),
    cancelExport: vi.fn(),
    createDownloadUrl: vi.fn(),
    revokeDownloadUrl: vi.fn(),
  },
}));

describe('useDataExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initiateExport', () => {
    it('should initiate export successfully', async () => {
      const mockResponse = {
        jobId: 'test-job-id',
        status: 'pending' as const,
        estimatedCompletionTime: new Date().toISOString(),
        message: 'Export initiated',
      };

      vi.mocked(dataExportService.initiateExport).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDataExport());

      await act(async () => {
        await result.current.initiateExport();
      });

      expect(result.current.state.currentJobId).toBe('test-job-id');
      expect(result.current.state.status).toBe('pending');
      expect(result.current.isActive).toBe(true);
    });

    it('should handle export initiation error', async () => {
      vi.mocked(dataExportService.initiateExport).mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      const { result } = renderHook(() => useDataExport());

      await act(async () => {
        await result.current.initiateExport();
      });

      expect(result.current.state.error).toBe('Rate limit exceeded');
      expect(result.current.hasError).toBe(true);
    });
  });

  describe('checkStatus', () => {
    it('should check export status', async () => {
      const mockStatus = {
        jobId: 'test-job-id',
        status: 'completed' as const,
        progress: 100,
        fileSize: 1024,
        completedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        errorMessage: null,
      };

      vi.mocked(dataExportService.getExportStatus).mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useDataExport());

      await act(async () => {
        await result.current.checkStatus('test-job-id');
      });

      expect(result.current.state.status).toBe('completed');
      expect(result.current.state.progress).toBe(100);
    });
  });

  describe('downloadExport', () => {
    it('should download export file', async () => {
      const mockBlob = new Blob(['test content'], { type: 'application/json' });
      vi.mocked(dataExportService.downloadExport).mockResolvedValue(mockBlob);
      vi.mocked(dataExportService.createDownloadUrl).mockReturnValue('blob:test-url');

      const { result } = renderHook(() => useDataExport());

      // First initiate an export to set up state
      const mockResponse = {
        jobId: 'test-job-id',
        status: 'completed' as const,
        estimatedCompletionTime: new Date().toISOString(),
        message: 'Export completed',
      };
      vi.mocked(dataExportService.initiateExport).mockResolvedValue(mockResponse);
      vi.mocked(dataExportService.getExportStatus).mockResolvedValue({
        jobId: 'test-job-id',
        status: 'completed' as const,
        progress: 100,
        fileSize: 1024,
        completedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        errorMessage: null,
      });

      await act(async () => {
        await result.current.initiateExport();
      });

      await act(async () => {
        await result.current.downloadExport('test-job-id');
      });

      expect(dataExportService.downloadExport).toHaveBeenCalledWith('test-job-id');
      expect(dataExportService.createDownloadUrl).toHaveBeenCalled();
    });
  });

  describe('cancelExport', () => {
    it('should cancel active export', async () => {
      vi.mocked(dataExportService.cancelExport).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDataExport());

      // First initiate an export to set up state
      const mockResponse = {
        jobId: 'test-job-id',
        status: 'processing' as const,
        estimatedCompletionTime: new Date().toISOString(),
        message: 'Export processing',
      };
      vi.mocked(dataExportService.initiateExport).mockResolvedValue(mockResponse);

      await act(async () => {
        await result.current.initiateExport();
      });

      expect(result.current.state.currentJobId).toBe('test-job-id');

      await act(async () => {
        await result.current.cancelExport('test-job-id');
      });

      expect(dataExportService.cancelExport).toHaveBeenCalledWith('test-job-id');
      expect(result.current.state.currentJobId).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      const { result } = renderHook(() => useDataExport());

      // First initiate an export to set some state
      const mockResponse = {
        jobId: 'test-job-id',
        status: 'completed' as const,
        estimatedCompletionTime: new Date().toISOString(),
        message: 'Export completed',
      };
      vi.mocked(dataExportService.initiateExport).mockResolvedValue(mockResponse);
      vi.mocked(dataExportService.getExportStatus).mockResolvedValue({
        jobId: 'test-job-id',
        status: 'completed' as const,
        progress: 100,
        fileSize: 1024,
        completedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        errorMessage: null,
      });

      await act(async () => {
        await result.current.initiateExport();
      });

      // Verify state was set
      expect(result.current.state.currentJobId).toBe('test-job-id');
      expect(result.current.state.status).toBe('completed');
      expect(result.current.state.progress).toBe(0);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.state.currentJobId).toBeNull();
      expect(result.current.state.status).toBeNull();
      expect(result.current.state.progress).toBe(0);
    });
  });

  describe('computed properties', () => {
    it('should correctly determine isActive state', async () => {
      const { result } = renderHook(() => useDataExport());

      // Initially not active
      expect(result.current.isActive).toBe(false);

      // Initiate export to become active
      const mockResponse = {
        jobId: 'test-job-id',
        status: 'pending' as const,
        estimatedCompletionTime: new Date().toISOString(),
        message: 'Export initiated',
      };
      vi.mocked(dataExportService.initiateExport).mockResolvedValue(mockResponse);

      await act(async () => {
        await result.current.initiateExport();
      });

      expect(result.current.isActive).toBe(true);

      // Reset to clear polling state
      act(() => {
        result.current.reset();
      });

      // Now check status for a completed export (without polling)
      vi.mocked(dataExportService.getExportStatus).mockResolvedValue({
        jobId: 'test-job-id',
        status: 'completed' as const,
        progress: 100,
        fileSize: 1024,
        completedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        errorMessage: null,
      });

      await act(async () => {
        await result.current.checkStatus('test-job-id');
      });

      // After reset and checking completed status, isActive should be false
      expect(result.current.isActive).toBe(false);
    });

    it('should correctly determine canDownload state', async () => {
      const { result } = renderHook(() => useDataExport());

      // Initially cannot download
      expect(result.current.canDownload).toBe(false);

      // Initiate and complete export
      const mockResponse = {
        jobId: 'test-job-id',
        status: 'completed' as const,
        estimatedCompletionTime: new Date().toISOString(),
        message: 'Export completed',
      };
      vi.mocked(dataExportService.initiateExport).mockResolvedValue(mockResponse);

      await act(async () => {
        await result.current.initiateExport();
      });

      expect(result.current.canDownload).toBe(true);
    });

    it('should correctly determine hasError state', async () => {
      const { result } = renderHook(() => useDataExport());

      // Initially no error
      expect(result.current.hasError).toBe(false);

      // Trigger an error
      vi.mocked(dataExportService.initiateExport).mockRejectedValue(
        new Error('Something went wrong')
      );

      await act(async () => {
        await result.current.initiateExport();
      });

      expect(result.current.hasError).toBe(true);
    });
  });

  describe('polling', () => {
    it('should handle polling with failed status', async () => {
      const mockResponse = {
        jobId: 'test-job-id',
        status: 'pending' as const,
        estimatedCompletionTime: new Date().toISOString(),
        message: 'Export initiated',
      };
      vi.mocked(dataExportService.initiateExport).mockResolvedValue(mockResponse);

      vi.mocked(dataExportService.getExportStatus)
        .mockResolvedValueOnce({
          jobId: 'test-job-id',
          status: 'processing' as const,
          progress: 50,
          fileSize: 0,
          completedAt: null,
          expiresAt: new Date().toISOString(),
          errorMessage: null,
        })
        .mockResolvedValueOnce({
          jobId: 'test-job-id',
          status: 'failed' as const,
          progress: 50,
          fileSize: 0,
          completedAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
          errorMessage: 'Export failed due to server error',
        });

      const { result } = renderHook(() => useDataExport());

      await act(async () => {
        await result.current.initiateExport();
      });

      expect(result.current.state.status).toBe('pending');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(result.current.state.status).toBe('processing');
      expect(result.current.state.progress).toBe(50);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(result.current.state.status).toBe('failed');
      expect(result.current.state.error).toBe('Export failed due to server error');
    });

    it('should handle polling with completed status', async () => {
      const mockResponse = {
        jobId: 'test-job-id',
        status: 'pending' as const,
        estimatedCompletionTime: new Date().toISOString(),
        message: 'Export initiated',
      };
      vi.mocked(dataExportService.initiateExport).mockResolvedValue(mockResponse);

      vi.mocked(dataExportService.getExportStatus).mockResolvedValue({
        jobId: 'test-job-id',
        status: 'completed' as const,
        progress: 100,
        fileSize: 1024,
        completedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        errorMessage: null,
      });

      const { result } = renderHook(() => useDataExport());

      await act(async () => {
        await result.current.initiateExport();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(result.current.state.status).toBe('completed');
      expect(result.current.state.progress).toBe(100);
      expect(result.current.state.isPolling).toBe(false);
    });

    it('should handle polling error', async () => {
      const mockResponse = {
        jobId: 'test-job-id',
        status: 'pending' as const,
        estimatedCompletionTime: new Date().toISOString(),
        message: 'Export initiated',
      };
      vi.mocked(dataExportService.initiateExport).mockResolvedValue(mockResponse);

      vi.mocked(dataExportService.getExportStatus).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useDataExport());

      await act(async () => {
        await result.current.initiateExport();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(result.current.state.error).toBe('Network error');
      expect(result.current.state.isPolling).toBe(false);
    });

    it('should handle polling error with non-Error object', async () => {
      const mockResponse = {
        jobId: 'test-job-id',
        status: 'pending' as const,
        estimatedCompletionTime: new Date().toISOString(),
        message: 'Export initiated',
      };
      vi.mocked(dataExportService.initiateExport).mockResolvedValue(mockResponse);

      vi.mocked(dataExportService.getExportStatus).mockRejectedValue('string error');

      const { result } = renderHook(() => useDataExport());

      await act(async () => {
        await result.current.initiateExport();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(result.current.state.error).toBe('Failed to check export status');
    });

    it('should handle failed status without error message', async () => {
      const mockResponse = {
        jobId: 'test-job-id',
        status: 'pending' as const,
        estimatedCompletionTime: new Date().toISOString(),
        message: 'Export initiated',
      };
      vi.mocked(dataExportService.initiateExport).mockResolvedValue(mockResponse);

      vi.mocked(dataExportService.getExportStatus).mockResolvedValue({
        jobId: 'test-job-id',
        status: 'failed' as const,
        progress: 0,
        fileSize: 0,
        completedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        errorMessage: null,
      });

      const { result } = renderHook(() => useDataExport());

      await act(async () => {
        await result.current.initiateExport();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(result.current.state.error).toBe('Export failed. Please try again.');
    });
  });

  describe('error handling', () => {
    it('should handle non-Error exceptions in initiateExport', async () => {
      vi.mocked(dataExportService.initiateExport).mockRejectedValue('string error');

      const { result } = renderHook(() => useDataExport());

      await act(async () => {
        await result.current.initiateExport();
      });

      expect(result.current.state.error).toBe('Failed to initiate export');
    });

    it('should handle non-Error exceptions in checkStatus', async () => {
      vi.mocked(dataExportService.getExportStatus).mockRejectedValue('string error');

      const { result } = renderHook(() => useDataExport());

      await act(async () => {
        await result.current.checkStatus('test-job-id');
      });

      expect(result.current.state.error).toBe('Failed to check status');
    });

    it('should handle non-Error exceptions in downloadExport', async () => {
      vi.mocked(dataExportService.downloadExport).mockRejectedValue('string error');

      const { result } = renderHook(() => useDataExport());

      await act(async () => {
        await result.current.downloadExport('test-job-id');
      });

      expect(result.current.state.error).toBe('Failed to download export');
    });

    it('should handle non-Error exceptions in cancelExport', async () => {
      vi.mocked(dataExportService.cancelExport).mockRejectedValue('string error');

      const { result } = renderHook(() => useDataExport());

      await act(async () => {
        await result.current.cancelExport('test-job-id');
      });

      expect(result.current.state.error).toBe('Failed to cancel export');
    });
  });

  describe('isActive computed property', () => {
    it('should be true when status is processing', async () => {
      vi.mocked(dataExportService.getExportStatus).mockResolvedValue({
        jobId: 'test-job-id',
        status: 'processing' as const,
        progress: 50,
        fileSize: 0,
        completedAt: null,
        expiresAt: new Date().toISOString(),
        errorMessage: null,
      });

      const { result } = renderHook(() => useDataExport());

      await act(async () => {
        await result.current.checkStatus('test-job-id');
      });

      expect(result.current.isActive).toBe(true);
    });
  });
});
