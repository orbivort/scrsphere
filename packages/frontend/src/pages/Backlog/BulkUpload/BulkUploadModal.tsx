import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { apiService } from '../../../services';
import { logger } from '../../../utils/logger';
import { queryKeys } from '../../../hooks/queryKeys';
import type { ProductBacklogItem } from '../../../types';

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

import { XIcon, ArrowLeftIcon, UploadIcon } from '@/components/common/Icons';

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
  const queryClient = useQueryClient();

  const resetState = useCallback(() => {
    setStep('upload');
    setSelectedFile(null);
    setParsedItems([]);
    setParseError(null);
    setUploadProgress({ current: 0, total: 0, currentItem: '' });
    setUploadResult(null);
    setIsUploading(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isUploading) {
      return;
    }
    resetState();
    onClose();
  }, [isUploading, resetState, onClose]);

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

    setStep('progress');
    setIsUploading(true);
    setUploadProgress({ current: 0, total: validItems.length, currentItem: '' });

    let result: UploadResult;

    try {
      // Show brief processing state while the bulk request is in flight
      setUploadProgress({ current: 0, total: validItems.length, currentItem: 'Processing...' });

      const response = await apiService.bulkCreateProductBacklogItems(validItems, teamId, goalId);

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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

    setUploadResult(result);
    setStep('summary');
    setIsUploading(false);

    if (result.successful > 0) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productBacklog.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.productGoal.all });
      onUploadComplete?.();
    }
  }, [parsedItems, teamId, goalId, queryClient, onUploadComplete]);

  const handleViewItems = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  if (!isOpen) return null;

  const validItems = getValidItems(parsedItems);
  const canImport = validItems.length > 0;

  return (
    <div className={styles['modal-overlay']} onClick={handleClose} role="dialog" aria-modal="true">
      <div
        className={`${styles.modal} ${styles['bulk-upload-modal']}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles['modal-header']}>
          <h2>Bulk Import Backlog Items</h2>
          <button
            className={styles['modal-close']}
            onClick={handleClose}
            disabled={isUploading}
            aria-label="Close modal"
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

            {step === 'preview' && <DataPreview items={parsedItems} />}

            {step === 'progress' && (
              <UploadProgress
                current={uploadProgress.current}
                total={uploadProgress.total}
                currentItem={uploadProgress.currentItem}
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
                  Back
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
                Cancel
              </button>
              {step === 'preview' && (
                <button
                  type="button"
                  className={`${styles.btn} ${styles['btn-primary']}`}
                  onClick={handleImport}
                  disabled={!canImport || isUploading}
                >
                  <UploadIcon width="16" height="16" />
                  Import {validItems.length} Item{validItems.length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
