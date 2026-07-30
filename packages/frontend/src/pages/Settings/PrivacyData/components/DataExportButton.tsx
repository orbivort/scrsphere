// Data Export Button Component

import React, { useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('settings');

  // Use refs for callback props to avoid unstable references causing infinite re-render loops.
  // Parent components typically pass inline arrow functions which create new references on
  // every render — including them in effect/callback deps would trigger cascading re-renders.
  const onExportStartRef = useRef(onExportStart);
  onExportStartRef.current = onExportStart;

  const onExportCompleteRef = useRef(onExportComplete);
  onExportCompleteRef.current = onExportComplete;

  const onExportErrorRef = useRef(onExportError);
  onExportErrorRef.current = onExportError;

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
    onExportStartRef.current?.();
    await initiateExport();
  }, [initiateExport]);

  const handleDownload = useCallback(async () => {
    if (state.currentJobId) {
      await downloadExport(state.currentJobId);
      onExportCompleteRef.current?.();
    }
  }, [downloadExport, state.currentJobId]);

  const handleClose = useCallback(() => {
    if (state.currentJobId && (state.status === 'pending' || state.status === 'processing')) {
      void cancelExport(state.currentJobId);
    }
    reset();
  }, [cancelExport, reset, state.currentJobId, state.status]);

  // Handle errors — use ref for the callback to prevent infinite re-render loops.
  // Previously, having `onExportError` (an unstable inline function) in the dependency
  // array caused: effect fires → callback triggers re-render → new function ref →
  // effect fires again → Maximum call stack size exceeded.
  useEffect(() => {
    if (hasError && state.error) {
      onExportErrorRef.current?.(new Error(state.error));
    }
  }, [hasError, state.error]);

  const isDisabled = disabled || isActive || state.isLoading;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={`${styles['export-button']} ${className}`}
        aria-label={t('privacyData.dataExport.ariaLabel')}
        aria-busy={isActive}
      >
        {isActive ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            {t('privacyData.dataExport.exporting')}
          </>
        ) : canDownload ? (
          <>
            <span className={styles.icon} aria-hidden="true">
              ↓
            </span>
            {t('privacyData.dataExport.downloadExport')}
          </>
        ) : (
          <>
            <span className={styles.icon} aria-hidden="true">
              📥
            </span>
            {t('privacyData.dataExport.exportButton')}
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
