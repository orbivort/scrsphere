// React Hook for GDPR Data Export functionality

import { useState, useCallback, useRef, useEffect } from 'react';

import { dataExportService } from '../services/domain/dataExport.service';
import type {
  DataExportState,
  UseDataExportReturn,
  ExportOptions,
} from '../types/dataExport.types';

const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_ATTEMPTS = 150; // 5 minutes max

const initialState: DataExportState = {
  isLoading: false,
  isPolling: false,
  currentJobId: null,
  status: null,
  progress: 0,
  error: null,
  downloadUrl: null,
  expiresAt: null,
};

/**
 * React hook for managing GDPR data export operations
 */
export function useDataExport(): UseDataExportReturn {
  const [state, setState] = useState<DataExportState>(initialState);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  /**
   * Start polling for export status
   */
  const startPolling = useCallback((jobId: string) => {
    attemptsRef.current = 0;

    setState((prev) => ({ ...prev, isPolling: true }));

    pollingRef.current = setInterval(async () => {
      attemptsRef.current++;

      // Stop polling after max attempts
      if (attemptsRef.current > MAX_POLLING_ATTEMPTS) {
        stopPolling();
        setState((prev) => ({
          ...prev,
          isPolling: false,
          error: 'Export is taking longer than expected. Please check back later.',
        }));
        return;
      }

      try {
        const status = await dataExportService.getExportStatus(jobId);

        setState((prev) => ({
          ...prev,
          status: status.status,
          progress: status.progress,
          expiresAt: status.expiresAt,
        }));

        // Stop polling if completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          stopPolling();

          if (status.status === 'failed') {
            setState((prev) => ({
              ...prev,
              isPolling: false,
              error: status.errorMessage || 'Export failed. Please try again.',
            }));
          } else {
            setState((prev) => ({
              ...prev,
              isPolling: false,
            }));
          }
        }
      } catch (error) {
        stopPolling();
        setState((prev) => ({
          ...prev,
          isPolling: false,
          error: error instanceof Error ? error.message : 'Failed to check export status',
        }));
      }
    }, POLLING_INTERVAL);
  }, []);

  /**
   * Stop polling for export status
   */
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  /**
   * Initiate a new data export
   */
  const initiateExport = useCallback(
    async (options?: ExportOptions) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await dataExportService.initiateExport(options);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          currentJobId: response.jobId,
          status: response.status,
          progress: 0,
        }));

        // Start polling for status
        startPolling(response.jobId);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initiate export',
        }));
      }
    },
    [startPolling]
  );

  /**
   * Manually check the status of an export job
   */
  const checkStatus = useCallback(async (jobId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const status = await dataExportService.getExportStatus(jobId);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        currentJobId: jobId,
        status: status.status,
        progress: status.progress,
        expiresAt: status.expiresAt,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check status',
      }));
    }
  }, []);

  /**
   * Download a completed export file
   */
  const downloadExport = useCallback(async (jobId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const blob = await dataExportService.downloadExport(jobId);

      // Create filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `scrsphere-data-export-${timestamp}.json`;

      // Create download URL and trigger download
      const url = dataExportService.createDownloadUrl(blob, filename);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        downloadUrl: url,
      }));

      // Revoke the URL after a short delay to free memory
      setTimeout(() => {
        dataExportService.revokeDownloadUrl(url);
        setState((prev) => ({ ...prev, downloadUrl: null }));
      }, 5000);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to download export',
      }));
    }
  }, []);

  /**
   * Cancel an active export job
   */
  const cancelExport = useCallback(
    async (jobId: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await dataExportService.cancelExport(jobId);
        stopPolling();

        setState((prev) => ({
          ...prev,
          isLoading: false,
          currentJobId: null,
          status: null,
          progress: 0,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to cancel export',
        }));
      }
    },
    [stopPolling]
  );

  /**
   * Reset the export state
   */
  const reset = useCallback(() => {
    stopPolling();
    setState(initialState);
  }, [stopPolling]);

  // Computed properties
  const isActive = state.status === 'pending' || state.status === 'processing' || state.isPolling;
  const canDownload = state.status === 'completed' && !state.isLoading;
  const hasError = state.error !== null;

  return {
    state,
    initiateExport,
    checkStatus,
    downloadExport,
    cancelExport,
    reset,
    isActive,
    canDownload,
    hasError,
  };
}

export default useDataExport;
