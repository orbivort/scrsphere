import React, { useCallback, useState } from 'react';

import styles from './BulkUploadModal.module.css';
import { isValidFileType, formatFileSize, downloadTemplate } from './bulkUploadUtils';

import {
  CheckCircleIcon,
  UploadIcon,
  FileTextIcon,
  XIcon,
  AlertCircleIcon,
  DownloadIcon,
} from '@/components/common/Icons';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onFileRemove: () => void;
  error?: string;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFileSelect,
  selectedFile,
  onFileRemove,
  error,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file && isValidFileType(file)) {
          onFileSelect(file);
        } else {
          alert('Please upload a CSV file');
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file && isValidFileType(file)) {
          onFileSelect(file);
        } else {
          alert('Please upload a CSV file');
        }
      }
    },
    [onFileSelect]
  );

  const handleClick = useCallback(() => {
    if (!selectedFile) {
      fileInputRef.current?.click();
    }
  }, [selectedFile]);

  const handleRemoveFile = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onFileRemove();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onFileRemove]
  );

  const handleDownloadTemplate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    downloadTemplate();
  }, []);

  return (
    <div>
      <div
        className={`${styles['drop-zone']} ${isDragActive ? styles['drag-active'] : ''} ${
          selectedFile ? styles['has-file'] : ''
        } ${error ? styles['has-error'] : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Upload CSV file"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className={styles['file-input']}
          aria-hidden="true"
        />

        <div className={styles['drop-zone-icon']}>
          {selectedFile ? <CheckCircleIcon size={32} /> : <UploadIcon size={32} />}
        </div>

        {selectedFile ? (
          <>
            <h3 className={styles['drop-zone-title']}>File Ready</h3>
            <p className={styles['drop-zone-subtitle']}>Click to change or drag a new file</p>
            <div className={styles['file-info']}>
              <div className={styles['file-icon']}>
                <FileTextIcon size={20} />
              </div>
              <div className={styles['file-details']}>
                <span className={styles['file-name']}>{selectedFile.name}</span>
                <span className={styles['file-size']}>{formatFileSize(selectedFile.size)}</span>
              </div>
              <button
                type="button"
                className={styles['file-remove']}
                onClick={handleRemoveFile}
                aria-label="Remove file"
              >
                <XIcon size={16} />
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className={styles['drop-zone-title']}>Drop your CSV file here</h3>
            <p className={styles['drop-zone-subtitle']}>or click to browse</p>
            <p className={styles['drop-zone-hint']}>Supports CSV files up to 5MB</p>
          </>
        )}
      </div>

      {error && (
        <div className={styles['upload-error']}>
          <AlertCircleIcon size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className={styles['template-section']}>
        <h4>Need a template?</h4>
        <p>Download our CSV template to get started with the correct format.</p>
        <button type="button" className={styles['template-btn']} onClick={handleDownloadTemplate}>
          <DownloadIcon size={16} />
          Download CSV Template
        </button>
      </div>
    </div>
  );
};
