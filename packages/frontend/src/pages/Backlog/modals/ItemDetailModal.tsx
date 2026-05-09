import React, { useRef, useCallback } from 'react';

import { ItemStatus } from '../../../types';
import { useBacklogContext } from '../context/BacklogContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { STATUS_CONFIG } from '../config/status.config';
import { MoscowBadge } from '../components/MoscowBadge';

import styles from './ItemDetailModal.module.css';

import { StatusSelector } from '@/components/StatusSelector';
import { StatusHistorySection } from '@/components/StatusHistorySection';
import {
  InfoIcon,
  CloseIcon,
  CopyIcon,
  AlertTriangleIcon,
  ShieldIcon,
  CheckCircleIcon,
  StarIcon,
  DollarSignIcon,
  ClockIcon,
  FileTextIcon,
  TagIcon,
  CheckSquareIcon,
  CalendarIcon,
  EditIcon,
  TrashIcon,
} from '@/components/common/Icons';

export interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (newStatus: ItemStatus) => void;
  isUpdating: boolean;
  isLoadingChildTasks: boolean;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  isUpdating,
  isLoadingChildTasks,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const { selectedItem, workflowError, setWorkflowError } = useBacklogContext();

  useFocusTrap(isOpen, modalRef);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen || !selectedItem) return null;

  const isDone = selectedItem.status === ItemStatus.DONE;
  const isInProgress = selectedItem.status === ItemStatus.IN_PROGRESS;

  return (
    <div className={styles['modal-overlay']} onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
      >
        {/* Decorative gradient orb */}
        <div className={styles['gradient-orb']} aria-hidden="true" />

        {/* Header */}
        <div className={styles['modal-header']}>
          <div className={styles['header-content']}>
            <div className={styles['icon-wrapper']} aria-hidden="true">
              <InfoIcon size={28} />
            </div>
            <div className={styles['header-text']}>
              <div className={styles['item-id-row']}>
                <span className={styles['item-id']}>#{selectedItem.id.slice(-4)}</span>
                <button
                  className={styles['copy-id-btn']}
                  onClick={() => {
                    void navigator.clipboard.writeText(selectedItem.id);
                  }}
                  title="Copy full ID"
                  aria-label="Copy item ID to clipboard"
                >
                  <CopyIcon size={14} />
                </button>
              </div>
              <h2 id="detail-modal-title" className={styles['modal-title']}>
                {selectedItem.title}
              </h2>
            </div>
          </div>
          <button
            className={styles['close-button']}
            onClick={onClose}
            data-modal-close
            aria-label="Close modal"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles['modal-body']}>
          {/* Error Banner */}
          {workflowError && (
            <div className={styles['error-banner']} role="alert">
              <div className={styles['error-content']}>
                <AlertTriangleIcon size={20} className={styles['error-icon']} />
                <span className={styles['error-text']}>{workflowError}</span>
                <button
                  className={styles['error-close']}
                  onClick={() => setWorkflowError(null)}
                  aria-label="Close error message"
                >
                  <CloseIcon size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Done Item Notice */}
          {isDone && (
            <div className={styles['done-notice']}>
              <ShieldIcon size={20} />
              <span>
                This item is completed and locked. Status and content changes are not permitted.
              </span>
            </div>
          )}

          {/* Info Cards Grid */}
          <div className={styles['info-grid']}>
            <div className={styles['info-card']}>
              <div className={styles['info-label']}>
                <CheckCircleIcon size={16} />
                Status
              </div>
              <div className={styles['status-container']}>
                <StatusSelector
                  currentStatus={selectedItem.status}
                  statuses={Object.values(ItemStatus)}
                  statusConfig={STATUS_CONFIG}
                  onStatusChange={onStatusChange}
                  isLoading={isUpdating || isLoadingChildTasks}
                  disabled={isDone}
                />
              </div>
            </div>

            <div className={styles['info-card']}>
              <div className={styles['info-label']}>
                <StarIcon size={16} />
                MoSCoW Priority
              </div>
              <div className={styles['info-value']}>
                <MoscowBadge priority={selectedItem.priority} />
              </div>
            </div>

            <div className={styles['info-card']}>
              <div className={styles['info-label']}>
                <DollarSignIcon size={16} />
                Business Value
              </div>
              <div
                className={`${styles['info-value']} ${!selectedItem.businessValue ? styles['info-value-muted'] : ''}`}
              >
                {selectedItem.businessValue ? `${selectedItem.businessValue} pts` : 'Not estimated'}
              </div>
            </div>

            <div className={styles['info-card']}>
              <div className={styles['info-label']}>
                <ClockIcon size={16} />
                Estimate
              </div>
              <div
                className={`${styles['info-value']} ${!selectedItem.storyPoints ? styles['info-value-muted'] : ''}`}
              >
                {selectedItem.storyPoints ? `${selectedItem.storyPoints} pts` : 'Not estimated'}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className={styles['section-card']}>
            <div className={styles['section-header']}>
              <FileTextIcon size={20} className={styles['section-icon']} />
              <h3 className={styles['section-title']}>Description</h3>
            </div>
            {selectedItem.description ? (
              <p className={styles['section-content']}>{selectedItem.description}</p>
            ) : (
              <div className={styles['empty-state']}>
                <FileTextIcon size={20} />
                <span>No description provided</span>
              </div>
            )}
          </div>

          {/* Labels Section */}
          <div className={styles['section-card']}>
            <div className={styles['section-header']}>
              <TagIcon size={20} className={styles['section-icon']} />
              <h3 className={styles['section-title']}>Labels</h3>
            </div>
            {selectedItem.labels.length > 0 ? (
              <div className={styles['labels-container']}>
                {selectedItem.labels.map((label) => (
                  <span key={label} className={styles['label-tag']}>
                    {label}
                  </span>
                ))}
              </div>
            ) : (
              <div className={styles['empty-state']}>
                <TagIcon size={20} />
                <span>No labels assigned</span>
              </div>
            )}
          </div>

          {/* Acceptance Criteria Section */}
          <div className={styles['section-card']}>
            <div className={styles['section-header']}>
              <CheckSquareIcon size={20} className={styles['section-icon']} />
              <h3 className={styles['section-title']}>Acceptance Criteria</h3>
            </div>
            {selectedItem.acceptanceCriteria ? (
              <p className={styles['section-content']}>{selectedItem.acceptanceCriteria}</p>
            ) : (
              <div className={styles['empty-state']}>
                <CheckSquareIcon size={20} />
                <span>No acceptance criteria defined</span>
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div className={styles['section-card']}>
            <div className={styles['section-header']}>
              <CalendarIcon size={16} className={styles['section-icon']} />
              <h3 className={styles['section-title']}>Metadata</h3>
            </div>
            <div className={styles['metadata-grid']}>
              <div className={styles['metadata-item']}>
                <CalendarIcon size={16} className={styles['metadata-icon']} />
                <div className={styles['metadata-content']}>
                  <span className={styles['metadata-label']}>Created</span>
                  <span className={styles['metadata-value']}>
                    {new Date(selectedItem.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className={styles['metadata-item']}>
                <ClockIcon size={16} className={styles['metadata-icon']} />
                <div className={styles['metadata-content']}>
                  <span className={styles['metadata-label']}>Updated</span>
                  <span className={styles['metadata-value']}>
                    {new Date(selectedItem.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Change History */}
          <StatusHistorySection entityId={selectedItem.id} entityType="BacklogItem" />
        </div>

        {/* Footer */}
        <div className={styles['modal-footer']}>
          <button
            className={`${styles.button} ${styles['button-danger']}`}
            onClick={onDelete}
            disabled={isDone || isInProgress}
            aria-label="Delete item"
          >
            <TrashIcon size={16} />
            Delete Item
          </button>
          <div className={styles['footer-actions']}>
            <button
              className={`${styles.button} ${styles['button-secondary']}`}
              onClick={onClose}
              aria-label="Close modal"
            >
              Close
            </button>
            <button
              className={`${styles.button} ${styles['button-primary']}`}
              onClick={onEdit}
              disabled={isDone}
              aria-label={isDone ? 'Item is view only' : 'Edit item'}
            >
              <EditIcon size={16} />
              {isDone ? 'View Only' : 'Edit Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
