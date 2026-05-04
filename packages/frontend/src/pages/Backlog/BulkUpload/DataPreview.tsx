import React from 'react';

import { MoSCoWPriority } from '../../../types';

import styles from './BulkUploadModal.module.css';
import type { BulkUploadItem } from './bulkUploadUtils';

import { FileTextIcon, CheckIcon, XIcon, AlertCircleIcon } from '@/components/common/Icons';

interface DataPreviewProps {
  items: BulkUploadItem[];
}

const PRIORITY_LABELS: Record<MoSCoWPriority, { label: string; className: string }> = {
  [MoSCoWPriority.MUST_HAVE]: { label: 'Must', className: styles['must-have'] ?? '' },
  [MoSCoWPriority.SHOULD_HAVE]: { label: 'Should', className: styles['should-have'] ?? '' },
  [MoSCoWPriority.COULD_HAVE]: { label: 'Could', className: styles['could-have'] ?? '' },
  [MoSCoWPriority.WONT_HAVE]: { label: "Won't", className: styles['wont-have'] ?? '' },
};

export const DataPreview: React.FC<DataPreviewProps> = ({ items }) => {
  const validCount = items.filter((item) => item._isValid).length;
  const invalidCount = items.filter((item) => !item._isValid).length;

  if (items.length === 0) {
    return (
      <div className={styles['empty-state']}>
        <FileTextIcon width="48" height="48" strokeWidth="1.5" />
        <p>No data to preview</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles['preview-header']}>
        <h3 className={styles['preview-title']}>Data Preview</h3>
        <div className={styles['preview-stats']}>
          <div className={`${styles['preview-stat']} ${styles.valid}`}>
            <span className={styles['preview-stat-icon']}>
              <CheckIcon width="12" height="12" strokeWidth="3" />
            </span>
            <span>{validCount} valid</span>
          </div>
          {invalidCount > 0 && (
            <div className={`${styles['preview-stat']} ${styles.invalid}`}>
              <span className={styles['preview-stat-icon']}>
                <XIcon width="12" height="12" strokeWidth="3" />
              </span>
              <span>{invalidCount} with errors</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles['preview-table-container']}>
        <table className={styles['preview-table']}>
          <thead>
            <tr>
              <th className={styles['row-number']}>#</th>
              <th className={styles['status-cell']}>Status</th>
              <th className={styles['title-cell']}>Title</th>
              <th className={styles['priority-cell']}>Priority</th>
              <th className={styles['points-cell']}>Points</th>
              <th className={styles['points-cell']}>Value</th>
              <th className={styles['labels-cell']}>Labels</th>
              <th className={styles['error-cell']}>Issues</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item._rowNumber}
                className={item._isValid ? styles['valid-row'] : styles['invalid-row']}
              >
                <td className={styles['row-number']}>{item._rowNumber}</td>
                <td className={styles['status-cell']}>
                  <span
                    className={`${styles['status-indicator']} ${
                      item._isValid ? styles.valid : styles.invalid
                    }`}
                    title={item._isValid ? 'Valid' : 'Has errors'}
                  >
                    {item._isValid ? (
                      <CheckIcon width="14" height="14" strokeWidth="3" />
                    ) : (
                      <XIcon width="14" height="14" strokeWidth="3" />
                    )}
                  </span>
                </td>
                <td className={styles['title-cell']} title={item.title}>
                  {item.title || <span className={styles['missing-title']}>Missing title</span>}
                </td>
                <td className={styles['priority-cell']}>
                  {item.priority && Object.values(MoSCoWPriority).includes(item.priority) ? (
                    <span
                      className={`${styles['priority-badge']} ${
                        PRIORITY_LABELS[item.priority as MoSCoWPriority]?.className || ''
                      }`}
                    >
                      {PRIORITY_LABELS[item.priority as MoSCoWPriority]?.label || item.priority}
                    </span>
                  ) : (
                    <span className={styles['text-tertiary']}>-</span>
                  )}
                </td>
                <td className={styles['points-cell']}>
                  {item.storyPoints !== undefined ? item.storyPoints : '-'}
                </td>
                <td className={styles['points-cell']}>
                  {item.businessValue !== undefined ? item.businessValue : '-'}
                </td>
                <td className={styles['labels-cell']}>
                  {item.labels && item.labels.length > 0 ? (
                    <div className={styles['labels-container']}>
                      {item.labels.slice(0, 2).map((label) => (
                        <span key={label} className={styles['label-chip']}>
                          {label}
                        </span>
                      ))}
                      {item.labels.length > 2 && (
                        <span className={styles['label-chip']}>+{item.labels.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    <span className={styles['text-tertiary']}>-</span>
                  )}
                </td>
                <td className={styles['error-cell']}>
                  {item._errors && item._errors.length > 0 ? (
                    <div className={styles['error-list']}>
                      {item._errors.map((error, index) => (
                        <div key={index} className={styles['error-message']}>
                          <AlertCircleIcon width="12" height="12" />
                          <span>
                            {error.field}: {error.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className={styles['text-success']}>OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
