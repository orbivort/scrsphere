// Data Export Button Component

import React, { useCallback } from 'react';

import { useDataExport } from '../../../../hooks/useDataExport';
import type { DataExportButtonProps } from '../../../../types/dataExport.types';

import { DataExportModal } from './DataExportModal';
import styles from './DataExport.module.css';

/**
 * Button component for initiating GDPR data export
 */
export const DataExportButton: React.FC<DataExportButtonProps> = ({
  onExportStart,
  onExportComplete,
  onExportError,
  disabled = false,
  className = '',
}) => {
  const {
    state,
    initiateExport,
    downloadExport,
    cancelExport,
    reset,
    isActive,
    canDownload,
    hasError,
  } = useDataExport();

  const handleClick = useCallback(async () => {
    onExportStart?.();
    await initiateExport();
  }, [initiateExport, onExportStart]);

  const handleDownload = useCallback(async () => {
    if (state.currentJobId) {
      await downloadExport(state.currentJobId);
      onExportComplete?.();
    }
  }, [downloadExport, state.currentJobId, onExportComplete]);

  const handleClose = useCallback(() => {
    if (state.currentJobId && (state.status === 'pending' || state.status === 'processing')) {
      void cancelExport(state.currentJobId);
    }
    reset();
  }, [cancelExport, reset, state.currentJobId, state.status]);

  // Handle errors
  React.useEffect(() => {
    if (hasError && state.error) {
      onExportError?.(new Error(state.error));
    }
  }, [hasError, state.error, onExportError]);

  const isDisabled = disabled || isActive || state.isLoading;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={`${styles['export-button']} ${className}`}
        aria-label="Export your personal data"
        aria-busy={isActive}
      >
        {isActive ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            Exporting...
          </>
        ) : canDownload ? (
          <>
            <span className={styles.icon} aria-hidden="true">
              ↓
            </span>
            Download Export
          </>
        ) : (
          <>
            <span className={styles.icon} aria-hidden="true">
              📥
            </span>
            Export My Data
          </>
        )}
      </button>

      <DataExportModal
        isOpen={state.currentJobId !== null}
        onClose={handleClose}
        jobId={state.currentJobId}
        status={state.status}
        progress={state.progress}
        error={state.error}
        canDownload={canDownload}
        onDownload={handleDownload}
        isPolling={state.isPolling}
      />
    </>
  );
};

export default DataExportButton;
