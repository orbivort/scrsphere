import React from 'react';
import { useTranslation } from 'react-i18next';

import { MoSCoWPriority } from '../../../types';

import styles from './BulkUploadModal.module.css';
import type { BulkUploadItem } from './bulkUploadUtils';

import { FileTextIcon, CheckIcon, XIcon, AlertCircleIcon } from '@/components/common/Icons';

interface DataPreviewProps {
  items: BulkUploadItem[];
}

export const DataPreview: React.FC<DataPreviewProps> = ({ items }) => {
  const { t } = useTranslation('backlog');
  const validCount = items.filter((item) => item._isValid).length;
  const invalidCount = items.filter((item) => !item._isValid).length;

  const PRIORITY_LABELS: Record<MoSCoWPriority, { label: string; className: string }> = {
    [MoSCoWPriority.MUST_HAVE]: {
      label: t('moscow.mustShort') as string,
      className: styles['must-have'] ?? '',
    },
    [MoSCoWPriority.SHOULD_HAVE]: {
      label: t('moscow.shouldShort') as string,
      className: styles['should-have'] ?? '',
    },
    [MoSCoWPriority.COULD_HAVE]: {
      label: t('moscow.couldShort') as string,
      className: styles['could-have'] ?? '',
    },
    [MoSCoWPriority.WONT_HAVE]: {
      label: t('moscow.wontShort') as string,
      className: styles['wont-have'] ?? '',
    },
  };

  if (items.length === 0) {
    return (
      <div className={styles['empty-state']}>
        <FileTextIcon width="48" height="48" strokeWidth="1.5" />
        <p>{t('bulkUpload.preview.noData') as string}</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles['preview-header']}>
        <h3 className={styles['preview-title']}>{t('bulkUpload.preview.title') as string}</h3>
        <div className={styles['preview-stats']}>
          <div className={`${styles['preview-stat']} ${styles.valid}`}>
            <span className={styles['preview-stat-icon']}>
              <CheckIcon width="12" height="12" strokeWidth="3" />
            </span>
            <span>{t('bulkUpload.preview.validCount', { count: validCount }) as string}</span>
          </div>
          {invalidCount > 0 && (
            <div className={`${styles['preview-stat']} ${styles.invalid}`}>
              <span className={styles['preview-stat-icon']}>
                <XIcon width="12" height="12" strokeWidth="3" />
              </span>
              <span>{t('bulkUpload.preview.withErrors', { count: invalidCount }) as string}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles['preview-table-container']}>
        <table className={styles['preview-table']}>
          <thead>
            <tr>
              <th className={styles['row-number']}>
                {t('bulkUpload.preview.rowHeader') as string}
              </th>
              <th className={styles['status-cell']}>
                {t('bulkUpload.preview.statusHeader') as string}
              </th>
              <th className={styles['title-cell']}>
                {t('bulkUpload.preview.titleHeader') as string}
              </th>
              <th className={styles['priority-cell']}>
                {t('bulkUpload.preview.priorityHeader') as string}
              </th>
              <th className={styles['points-cell']}>
                {t('bulkUpload.preview.pointsHeader') as string}
              </th>
              <th className={styles['points-cell']}>
                {t('bulkUpload.preview.valueHeader') as string}
              </th>
              <th className={styles['labels-cell']}>
                {t('bulkUpload.preview.labelsHeader') as string}
              </th>
              <th className={styles['error-cell']}>
                {t('bulkUpload.preview.issuesHeader') as string}
              </th>
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
                    title={
                      item._isValid
                        ? (t('bulkUpload.preview.validTitle') as string)
                        : (t('bulkUpload.preview.hasErrorsTitle') as string)
                    }
                  >
                    {item._isValid ? (
                      <CheckIcon width="14" height="14" strokeWidth="3" />
                    ) : (
                      <XIcon width="14" height="14" strokeWidth="3" />
                    )}
                  </span>
                </td>
                <td className={styles['title-cell']} title={item.title}>
                  {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string should show Missing title */}
                  {item.title || (
                    <span className={styles['missing-title']}>
                      {t('bulkUpload.preview.missingTitle') as string}
                    </span>
                  )}
                </td>
                <td className={styles['priority-cell']}>
                  {item.priority && Object.values(MoSCoWPriority).includes(item.priority) ? (
                    <span
                      className={`${styles['priority-badge']} ${
                        PRIORITY_LABELS[item.priority as MoSCoWPriority].className || ''
                      }`}
                    >
                      {PRIORITY_LABELS[item.priority as MoSCoWPriority].label || item.priority}
                    </span>
                  ) : (
                    <span className={styles['text-tertiary']}>-</span>
                  )}
                </td>
                <td className={styles['points-cell']}>{item.storyPoints ?? '-'}</td>
                <td className={styles['points-cell']}>{item.businessValue ?? '-'}</td>
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
                    <span className={styles['text-success']}>
                      {t('bulkUpload.preview.ok') as string}
                    </span>
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
