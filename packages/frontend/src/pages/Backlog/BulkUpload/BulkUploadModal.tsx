import React, { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';

import { apiService } from '../../../services';
import { logger } from '../../../utils/logger';
import { queryKeys } from '../../../hooks/queryKeys';
import type { ProductBacklogItem } from '../../../types';
import { useTeamContext } from '../../../contexts/TeamContext';
import { useBacklogCapacityValidation } from '../hooks/useBacklogCapacityValidation';

import styles from './BulkUploadModal.module.css';
import { FileDropZone } from './FileDropZone';
import { DataPreview } from './DataPreview';
import { UploadProgress } from './UploadProgress';
import { UploadSummary } from './UploadSummary';
import {
  parseCSV,
  validateItems,
  getValidItems,
  type BulkUploadItem,
  type UploadResult,
} from './bulkUploadUtils';

import { XIcon, ArrowLeftIcon, UploadIcon, InfoIcon } from '@/components/common/Icons';

type UploadStep = 'upload' | 'preview' | 'progress' | 'summary';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  goalId: string;
  existingItems: ProductBacklogItem[];
  onUploadComplete?: () => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  teamId,
  goalId,
  existingItems,
  onUploadComplete,
}) => {
  const [step, setStep] = useState<UploadStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<BulkUploadItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, currentItem: '' });
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const { validateBulkImport } = useBacklogCapacityValidation();
  const { t } = useTranslation('backlog');

  // Only Developers are responsible for sizing; PO/SM cannot set story points.
  // The backend rejects a batch that carries story points from a non-Developer,
  // so the story points column is hidden in the preview for non-Developers.
  const { userRole } = useTeamContext();
  const isDeveloper = userRole === 'DEVELOPER';

  const resetState = useCallback(() => {
    setStep('upload');
    setSelectedFile(null);
    setParsedItems([]);
    setParseError(null);
    setUploadProgress({ current: 0, total: 0, currentItem: '' });
    setUploadResult(null);
    setIsUploading(false);
    setIsCancelling(false);
    abortControllerRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    if (isUploading && !isCancelling) {
      return;
    }
    resetState();
    onClose();
  }, [isUploading, isCancelling, resetState, onClose]);

  const handleCancelUpload = useCallback(() => {
    setIsCancelling(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setSelectedFile(file);
      setParseError(null);

      try {
        const content = await file.text();
        const result = parseCSV(content);

        if (result.errors.length > 0) {
          setParseError(result.errors[0]?.message ?? 'Unknown parse error');
          return;
        }

        if (result.items.length === 0) {
          setParseError('No valid data found in the file. Please check the format.');
          return;
        }

        const validatedItems = validateItems(result.items, existingItems);
        setParsedItems(validatedItems);
        setStep('preview');
      } catch (error) {
        logger.error('Error parsing CSV', undefined, { error });
        setParseError('Failed to parse the CSV file. Please check the file format.');
      }
    },
    [existingItems]
  );

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null);
    setParsedItems([]);
    setParseError(null);
  }, []);

  const handleBack = useCallback(() => {
    if (step === 'preview') {
      setStep('upload');
    }
  }, [step]);

  const handleImport = useCallback(async () => {
    const validItems = getValidItems(parsedItems);
    if (validItems.length === 0) {
      return;
    }

    // Validate capacity before importing
    // All items inherit the goalId from the modal props
    const itemsWithGoalId = validItems.map(() => ({ goalId }));
    const capacityResult = await validateBulkImport(itemsWithGoalId);

    if (!capacityResult.isValid) {
      // Show capacity error in summary
      const result: UploadResult = {
        total: validItems.length,
        successful: 0,
        failed: validItems.length,
        duplicates: parsedItems.length - validItems.length,
        errors: [
          {
            row: 0,
            field: 'capacity',
            message: capacityResult.error ?? 'Capacity limit exceeded',
          },
        ],
        createdItems: [],
      };
      setUploadResult(result);
      setStep('summary');
      return;
    }

    setStep('progress');
    setIsUploading(true);
    setIsCancelling(false);
    setUploadProgress({ current: 0, total: validItems.length, currentItem: '' });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let result: UploadResult;

    try {
      setUploadProgress({ current: 0, total: validItems.length, currentItem: 'Processing...' });

      const response = await apiService.bulkCreateProductBacklogItems(
        validItems,
        teamId,
        goalId,
        controller.signal
      );

      if (response.success && response.data) {
        result = {
          total: validItems.length,
          successful: response.data.successful,
          failed: response.data.failed,
          duplicates: parsedItems.length - validItems.length,
          errors: response.data.errors.map((err) => ({
            row: err.row,
            field: err.field,
            message: err.message,
          })),
          createdItems: response.data.createdItems,
        };
      } else {
        result = {
          total: validItems.length,
          successful: 0,
          failed: validItems.length,
          duplicates: parsedItems.length - validItems.length,
          errors: [
            {
              row: 0,
              field: 'general',
              message: response.error?.message ?? 'Bulk upload failed',
            },
          ],
          createdItems: [],
        };
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        result = {
          total: validItems.length,
          successful: 0,
          failed: validItems.length,
          duplicates: parsedItems.length - validItems.length,
          errors: [
            {
              row: 0,
              field: 'general',
              message: 'Upload cancelled by user',
            },
          ],
          createdItems: [],
        };
      } else {
        // Extract validation error details from Axios error response
        const axiosError = error as AxiosError<{
          error?: { message?: string; details?: Array<{ field: string; message: string }> };
        }>;
        const apiError = axiosError.response?.data.error;
        const errorMessage =
          apiError?.details?.map((d) => d.message).join('; ') ??
          apiError?.message ??
          (error instanceof Error ? error.message : 'Unknown error');
        result = {
          total: validItems.length,
          successful: 0,
          failed: validItems.length,
          duplicates: parsedItems.length - validItems.length,
          errors: [
            {
              row: 0,
              field: 'general',
              message: errorMessage,
            },
          ],
          createdItems: [],
        };
      }
    }

    abortControllerRef.current = null;
    setUploadResult(result);
    setStep('summary');
    setIsUploading(false);
    setIsCancelling(false);

    if (result.successful > 0) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productBacklog.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.productGoal.all });
      onUploadComplete?.();
    }
  }, [parsedItems, teamId, goalId, queryClient, onUploadComplete, validateBulkImport]);

  const handleViewItems = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  if (!isOpen) return null;

  const validItems = getValidItems(parsedItems);
  const canImport = validItems.length > 0;
  // Only surface the Developer-only sizing notice when the uploaded CSV actually
  // carries story points. If the column was removed, there is nothing to size and
  // the backend will accept the batch, so no hint is needed.
  const hasStoryPoints = parsedItems.some((item) => item.storyPoints !== undefined);

  return (
    <div className={styles['modal-overlay']} onClick={handleClose} role="dialog" aria-modal="true">
      <div
        className={`${styles.modal} ${styles['bulk-upload-modal']}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles['modal-header']}>
          <h2>{t('bulkUpload.modalTitle') as string}</h2>
          <button
            className={styles['modal-close']}
            onClick={handleClose}
            disabled={isUploading && !isCancelling}
            aria-label={t('bulkUpload.closeModal') as string}
          >
            <XIcon width="16" height="16" />
          </button>
        </div>

        <div className={styles['step-indicator']}>
          <div
            className={`${styles['step-dot']} ${step === 'upload' ? styles.active : ''} ${
              step !== 'upload' ? styles.completed : ''
            }`}
          />
          <div
            className={`${styles['step-dot']} ${step === 'preview' ? styles.active : ''} ${
              ['progress', 'summary'].includes(step) ? styles.completed : ''
            }`}
          />
          <div
            className={`${styles['step-dot']} ${step === 'progress' ? styles.active : ''} ${
              step === 'summary' ? styles.completed : ''
            }`}
          />
          <div className={`${styles['step-dot']} ${step === 'summary' ? styles.active : ''}`} />
        </div>

        <div className={styles['modal-body']}>
          <div className={styles['step-content']}>
            {step === 'upload' && (
              <FileDropZone
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onFileRemove={handleFileRemove}
                error={parseError ?? undefined}
              />
            )}

            {step === 'preview' && (
              <>
                {!isDeveloper && hasStoryPoints && (
                  <div className={styles['hint-banner']} role="note">
                    <span className={styles['hint-icon']} aria-hidden="true">
                      <InfoIcon width="16" height="16" />
                    </span>
                    <span>{t('bulkUpload.storyPointsDeveloperOnly') as string}</span>
                  </div>
                )}
                <DataPreview items={parsedItems} showStoryPoints={isDeveloper} />
              </>
            )}

            {step === 'progress' && (
              <UploadProgress
                current={uploadProgress.current}
                total={uploadProgress.total}
                currentItem={uploadProgress.currentItem}
                isCancelling={isCancelling}
                onCancel={handleCancelUpload}
              />
            )}

            {step === 'summary' && uploadResult && (
              <UploadSummary
                result={uploadResult}
                onClose={handleClose}
                onViewItems={handleViewItems}
              />
            )}
          </div>
        </div>

        {step !== 'summary' && (
          <div className={styles['modal-footer']}>
            <div className={styles['footer-left']}>
              {step === 'preview' && (
                <button
                  type="button"
                  className={`${styles.btn} ${styles['btn-secondary']}`}
                  onClick={handleBack}
                >
                  <ArrowLeftIcon width="16" height="16" />
                  {t('bulkUpload.back') as string}
                </button>
              )}
            </div>
            <div className={styles['footer-right']}>
              <button
                type="button"
                className={`${styles.btn} ${styles['btn-secondary']}`}
                onClick={handleClose}
                disabled={isUploading}
              >
                {t('bulkUpload.cancel') as string}
              </button>
              {step === 'preview' && (
                <button
                  type="button"
                  className={`${styles.btn} ${styles['btn-primary']}`}
                  onClick={handleImport}
                  disabled={!canImport || isUploading}
                >
                  <UploadIcon width="16" height="16" />
                  {
                    t('bulkUpload.importItems', {
                      count: validItems.length,
                      plural: validItems.length !== 1 ? 's' : '',
                    }) as string
                  }
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
