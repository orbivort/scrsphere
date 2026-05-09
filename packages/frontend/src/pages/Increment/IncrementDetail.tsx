import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import { apiService } from '../../services';
import { IncrementStatus, DeliveryMethod, type DoDChecklistVerification } from '../../types';
import { useModalFocus } from '../../hooks/useModalFocus';
import { useToast } from '../../hooks/useToast';
import { queryKeys } from '../../hooks/queryKeys';
import { LoadingState } from '../../components/common/Loading';
import { ToastContainer } from '../../components/common/ToastContainer';

import styles from './IncrementDetail.module.css';

import {
  AlertCircleIcon,
  ArrowLeftIcon,
  RocketIcon,
  CheckIcon,
  ClockIcon,
  FileTextIcon,
  ClipboardIcon,
  CalendarIcon,
  ZapIcon,
  CloseIcon,
  PackageIcon,
} from '@/components/common/Icons';

// CSS-based loading spinner (not an SVG icon)
const LoadingSpinnerIcon = () => <div className={styles['loading-spinner']} />;

export const IncrementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    DeliveryMethod.SPRINT_REVIEW
  );
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [confirmDelivery, setConfirmDelivery] = useState(false);

  const fromSprintComplete = searchParams.get('fromSprintComplete') === 'true';
  const sprintId = searchParams.get('sprintId');

  const { modalRef } = useModalFocus({
    isOpen: showDeliverModal,
    onClose: () => setShowDeliverModal(false),
  });

  const {
    data: incrementData,
    isLoading: isLoadingIncrement,
    isError: isIncrementError,
    error: incrementError,
  } = useQuery({
    queryKey: ['increment', id],
    queryFn: () => apiService.getIncrement(id ?? ''),
    enabled: !!id,
  });

  const increment = incrementData?.data;

  const { data: eligiblePBIsData } = useQuery({
    queryKey: ['eligible-pbis', increment?.sprintId],
    queryFn: () => apiService.getEligiblePBIsForIncrement(increment?.sprintId ?? ''),
    enabled: !!increment?.sprintId,
  });

  const deliverMutation = useMutation({
    mutationFn: () => apiService.deliverIncrement(id ?? '', deliveryMethod, deliveryNotes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.increment.detail(id ?? '') });
      void queryClient.invalidateQueries({ queryKey: queryKeys.increment.all });
      setShowDeliverModal(false);
      success('Increment delivered successfully!');

      if (fromSprintComplete && sprintId) {
        setTimeout(() => {
          void navigate(`/sprint-review/${sprintId}`);
        }, 1500);
      }
    },
    onError: () => {
      showError('Failed to deliver increment. Please try again.');
    },
  });

  const getStatusColor = (status: IncrementStatus) => {
    const colors: Record<IncrementStatus, { bg: string; text: string }> = {
      [IncrementStatus.DRAFT]: { bg: '#F3F4F6', text: '#6B7280' },
      [IncrementStatus.VERIFIED]: { bg: '#DBEAFE', text: '#1E40AF' },
      [IncrementStatus.DELIVERED]: { bg: '#D1FAE5', text: '#065F46' },
      [IncrementStatus.ARCHIVED]: { bg: '#F9FAFB', text: '#9CA3AF' },
    };
    return colors[status];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDeliver = () => {
    deliverMutation.mutate();
  };

  const handleBack = () => {
    if (fromSprintComplete && sprintId) {
      void navigate(`/sprint-review/${sprintId}`);
    } else {
      void navigate('/increments');
    }
  };

  const includedPBIs = useMemo(() => {
    if (!increment?.includedPBIs || !eligiblePBIsData?.data) return [];
    return eligiblePBIsData.data.filter((pbi) => increment.includedPBIs.includes(pbi.id));
  }, [increment, eligiblePBIsData]);

  const verificationStats = useMemo(() => {
    if (!increment?.dodVerifications)
      return { total: 0, verified: 0, percentage: 0, byCategory: {}, byPbi: {} };
    const verifications = increment.dodVerifications as DoDChecklistVerification[];
    const total = verifications.length;
    const verified = verifications.filter((v) => v.isVerified).length;
    const percentage = total > 0 ? Math.round((verified / total) * 100) : 0;

    const byCategory: Record<string, { total: number; verified: number }> = {};
    const byPbi: Record<string, { total: number; verified: number; pbiTitle: string }> = {};

    verifications.forEach((v) => {
      const category = v.dodItemCategory ?? 'general';
      byCategory[category] ??= { total: 0, verified: 0 };
      byCategory[category].total++;
      if (v.isVerified) {
        byCategory[category].verified++;
      }

      const pbiId = v.pbiId;
      if (!byPbi[pbiId]) {
        const pbi = includedPBIs.find((p) => p.id === pbiId);
        byPbi[pbiId] = { total: 0, verified: 0, pbiTitle: pbi?.title ?? 'Unknown PBI' };
      }
      byPbi[pbiId].total++;
      if (v.isVerified) {
        byPbi[pbiId].verified++;
      }
    });

    return { total, verified, percentage, byCategory, byPbi };
  }, [increment, includedPBIs]);

  if (isLoadingIncrement) {
    return (
      <div className={styles['increment-loading']}>
        <LoadingSpinnerIcon />
        <p>Loading increment...</p>
      </div>
    );
  }

  if (isIncrementError || !increment) {
    return (
      <div className={styles['increment-loading']}>
        <AlertCircleIcon className={styles['error-icon']} />
        <p>Failed to load increment</p>
        <p className={styles['error-details']}>
          {incrementError instanceof Error ? incrementError.message : 'Unknown error'}
        </p>
        <button
          className={`${styles.button} ${styles['button-primary']}`}
          onClick={() => navigate('/increments')}
          style={{ marginTop: '16px' }}
        >
          Back to Increments
        </button>
      </div>
    );
  }

  const statusColor = getStatusColor(increment.status);
  const canDeliver =
    increment.status === IncrementStatus.VERIFIED || increment.status === IncrementStatus.DRAFT;

  return (
    <div className={styles['increment-detail-page']} data-testid="increment-detail">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className={styles['detail-header']}>
        <button className={styles['back-button']} onClick={handleBack}>
          <ArrowLeftIcon />
          <span>{fromSprintComplete ? 'Skip to Sprint Review' : 'Back to Increments'}</span>
        </button>
        <div className={styles['header-content']}>
          <div className={styles['header-left']}>
            <h1 className={styles['page-title']}>
              <span className={styles['page-title-icon']}>
                <PackageIcon size={28} aria-hidden="true" />
              </span>
              {increment.name}
            </h1>
            <span
              className={styles['status-badge']}
              style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
            >
              {increment.status}
            </span>
          </div>
          {fromSprintComplete && (
            <div className={styles['workflow-indicator']}>
              <span className={styles['workflow-badge']}>Sprint Completion Workflow</span>
              <span className={styles['workflow-step']}>Step 3 of 4: Deliver Increment</span>
            </div>
          )}
          {canDeliver && (
            <button
              className={`${styles.button} ${styles['button-primary']}`}
              onClick={() => setShowDeliverModal(true)}
            >
              <RocketIcon size={16} />
              <span>Deliver Increment</span>
            </button>
          )}
        </div>
      </div>

      {fromSprintComplete && (
        <div className={styles['workflow-progress']}>
          <div className={styles['progress-steps']}>
            <div className={`${styles['progress-step']} ${styles.completed}`}>
              <span className={styles['step-number']}>
                <CheckIcon size={12} />
              </span>
              <span className={styles['step-label']}>Sprint Completed</span>
            </div>
            <div className={`${styles['progress-step']} ${styles.completed}`}>
              <span className={styles['step-number']}>
                <CheckIcon size={12} />
              </span>
              <span className={styles['step-label']}>Create Increment</span>
            </div>
            <div className={`${styles['progress-step']} ${styles.active}`}>
              <span className={styles['step-number']}>
                <ClockIcon size={12} />
              </span>
              <span className={styles['step-label']}>Deliver Increment</span>
            </div>
            <div className={`${styles['progress-step']}`}>
              <span className={styles['step-number']}>4</span>
              <span className={styles['step-label']}>Sprint Review</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles['detail-grid']}>
        <div className={styles['left-column']}>
          <div className={styles['detail-card']}>
            <h3>Overview</h3>
            <div className={styles['info-grid']}>
              <div className={styles['info-item']}>
                <span className={styles.label}>Description</span>
                <span className={styles.value}>{increment.description ?? 'No description'}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles.label}>Sprint</span>
                <span className={styles.value}>{increment.sprint?.name ?? increment.sprintId}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles.label}>Created</span>
                <span className={styles.value}>{formatDate(increment.createdAt)}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles.label}>Story Points</span>
                <span className={styles.value}>{increment.totalStoryPoints || 0}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles.label}>PBIs Included</span>
                <span className={styles.value}>{increment.includedPBIs.length || 0}</span>
              </div>
              {increment.deliveredAt && (
                <div className={styles['info-item']}>
                  <span className={styles.label}>Delivered</span>
                  <span className={styles.value}>{formatDate(increment.deliveredAt)}</span>
                </div>
              )}
              {increment.deliveryMethod && (
                <div className={styles['info-item']}>
                  <span className={styles.label}>Delivery Method</span>
                  <span className={styles.value}>
                    {increment.deliveryMethod.toLowerCase() ===
                    DeliveryMethod.SPRINT_REVIEW.toLowerCase()
                      ? 'Sprint Review'
                      : 'Early Release'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles['detail-card']}>
            <h3>Included Product Backlog Items</h3>
            {includedPBIs.length === 0 ? (
              <p className={styles['empty-message']}>No PBIs included in this increment.</p>
            ) : (
              <div className={styles['pbi-list']}>
                {includedPBIs.map((pbi) => (
                  <div key={pbi.id} className={styles['pbi-item']}>
                    <div className={styles['pbi-header']}>
                      <span className={styles['pbi-title']}>{pbi.title}</span>
                      <span className={styles['pbi-points']}>{pbi.storyPoints ?? 0} pts</span>
                    </div>
                    {pbi.labels.length > 0 && (
                      <div className={styles['pbi-labels']}>
                        {pbi.labels.map((label) => (
                          <span key={label} className={styles['label-tag']}>
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles['right-column']}>
          <div className={styles['detail-card']}>
            <h3>Definition of Done Verification</h3>
            <div className={styles['verification-summary']}>
              <div className={styles['progress-circle']}>
                {/* eslint-disable-next-line icon-rules/no-inline-svg -- Progress ring visualization, not an icon */}
                <svg viewBox="0 0 36 36">
                  <path
                    className={styles['circle-bg']}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={styles['circle-progress']}
                    strokeDasharray={`${verificationStats.percentage}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className={styles['progress-text']}>{verificationStats.percentage}%</span>
              </div>
              <div className={styles['verification-stats']}>
                <div className={styles['stat-row']}>
                  <span className={styles['stat-label']}>Total Verifications</span>
                  <span className={styles['stat-value']}>{verificationStats.total}</span>
                </div>
                <div className={styles['stat-row']}>
                  <span className={styles['stat-label']}>Verified</span>
                  <span className={`${styles['stat-value']} ${styles.verified}`}>
                    {verificationStats.verified}
                  </span>
                </div>
              </div>
            </div>

            {verificationStats.total > 0 && (
              <>
                <div className={styles['verification-breakdown']}>
                  <h4>Verification by Category</h4>
                  <div className={styles['category-breakdown']}>
                    {Object.entries(verificationStats.byCategory).map(([category, stats]) => (
                      <div key={category} className={styles['category-item']}>
                        <div className={styles['category-header']}>
                          <span className={styles['category-name']}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </span>
                          <span className={styles['category-count']}>
                            {stats.verified}/{stats.total}
                          </span>
                        </div>
                        <div className={styles['category-progress']}>
                          <div
                            className={styles['category-progress-fill']}
                            style={{
                              width: `${stats.total > 0 ? (stats.verified / stats.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles['verification-breakdown']}>
                  <h4>Verification by PBI</h4>
                  <div className={styles['pbi-breakdown']}>
                    {Object.entries(verificationStats.byPbi).map(([pbiId, stats]) => (
                      <div key={pbiId} className={styles['pbi-verification-item']}>
                        <div className={styles['pbi-verification-header']}>
                          <span className={styles['pbi-verification-title']}>{stats.pbiTitle}</span>
                          <span className={styles['pbi-verification-count']}>
                            {stats.verified}/{stats.total}
                          </span>
                        </div>
                        <div className={styles['pbi-verification-progress']}>
                          <div
                            className={styles['pbi-verification-progress-fill']}
                            style={{
                              width: `${stats.total > 0 ? (stats.verified / stats.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {verificationStats.total === 0 && (
              <div className={styles['no-verifications']}>
                <span className={styles['no-verification-icon']}>
                  <ClipboardIcon size={48} strokeWidth={1.5} />
                </span>
                <p>No DoD verifications recorded for this increment.</p>
                <p className={styles['no-verification-hint']}>
                  Verifications are captured when completing a sprint.
                </p>
              </div>
            )}
          </div>

          <div className={styles['detail-card']}>
            <h3>Timeline</h3>
            <div className={styles.timeline}>
              <div className={styles['timeline-item']}>
                <div className={`${styles['timeline-icon']} ${styles.created}`}>
                  <FileTextIcon size={20} />
                </div>
                <div className={styles['timeline-content']}>
                  <span className={styles['timeline-label']}>Increment Created</span>
                  <span className={styles['timeline-date']}>{formatDate(increment.createdAt)}</span>
                </div>
              </div>
              {increment.deliveredAt && (
                <div className={styles['timeline-item']}>
                  <div className={`${styles['timeline-icon']} ${styles.delivered}`}>
                    <RocketIcon size={20} />
                  </div>
                  <div className={styles['timeline-content']}>
                    <span className={styles['timeline-label']}>
                      Delivered via{' '}
                      {increment.deliveryMethod?.toLowerCase() ===
                      DeliveryMethod.SPRINT_REVIEW.toLowerCase()
                        ? 'Sprint Review'
                        : 'Early Release'}
                    </span>
                    <span className={styles['timeline-date']}>
                      {formatDate(increment.deliveredAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeliverModal && (
        <div
          className={styles['modal-overlay']}
          onClick={() => setShowDeliverModal(false)}
          role="presentation"
        >
          <div
            ref={modalRef}
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="deliver-modal-title"
            aria-describedby="deliver-modal-description"
          >
            <div className={styles['modal-header']}>
              <h3 id="deliver-modal-title">
                <RocketIcon size={20} />
                <span>Deliver Increment</span>
              </h3>
              <button
                className={styles['close-button']}
                onClick={() => setShowDeliverModal(false)}
                aria-label="Close dialog"
              >
                <CloseIcon size={16} />
              </button>
            </div>
            <div className={styles['modal-content']}>
              <p id="deliver-modal-description" className={styles['modal-description']}>
                Mark this Increment as delivered to stakeholders. This action cannot be undone.
              </p>

              <div className={styles['form-group']}>
                <label>Delivery Method</label>
                <div className={styles['delivery-options']}>
                  <label
                    className={`${styles['radio-option']} ${deliveryMethod === DeliveryMethod.SPRINT_REVIEW ? styles.selected : ''}`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value={DeliveryMethod.SPRINT_REVIEW}
                      checked={deliveryMethod === DeliveryMethod.SPRINT_REVIEW}
                      onChange={() => setDeliveryMethod(DeliveryMethod.SPRINT_REVIEW)}
                    />
                    <div className={styles['option-content']}>
                      <span className={styles['option-icon']}>
                        <CalendarIcon size={24} />
                      </span>
                      <span className={styles['option-label']}>Sprint Review</span>
                      <span className={styles['option-desc']}>
                        Presented at the Sprint Review meeting
                      </span>
                    </div>
                  </label>
                  <label
                    className={`${styles['radio-option']} ${deliveryMethod === DeliveryMethod.EARLY_RELEASE ? styles.selected : ''}`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value={DeliveryMethod.EARLY_RELEASE}
                      checked={deliveryMethod === DeliveryMethod.EARLY_RELEASE}
                      onChange={() => setDeliveryMethod(DeliveryMethod.EARLY_RELEASE)}
                    />
                    <div className={styles['option-content']}>
                      <span className={styles['option-icon']}>
                        <ZapIcon size={24} />
                      </span>
                      <span className={styles['option-label']}>Early Release</span>
                      <span className={styles['option-desc']}>
                        Delivered before the end of the Sprint
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className={styles['form-group']}>
                <label>Notes (Optional)</label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Add any notes about this delivery..."
                  rows={3}
                />
              </div>

              <div className={styles['form-group']}>
                <label className={styles['checkbox-label']}>
                  <input
                    type="checkbox"
                    checked={confirmDelivery}
                    onChange={(e) => setConfirmDelivery(e.target.checked)}
                    aria-label="Confirm delivery action"
                  />
                  <span className={styles['checkbox-text']}>
                    I understand this action is irreversible and the increment will be marked as
                    delivered to stakeholders.
                  </span>
                </label>
              </div>
            </div>
            <div className={styles['modal-actions']}>
              <button
                className={`${styles.button} ${styles['button-secondary']}`}
                onClick={() => {
                  setShowDeliverModal(false);
                  setConfirmDelivery(false);
                }}
              >
                Cancel
              </button>
              <button
                className={`${styles.button} ${styles['button-primary']}`}
                onClick={handleDeliver}
                disabled={deliverMutation.isPending || !confirmDelivery}
                data-disabled-reason={
                  !confirmDelivery ? 'Please confirm the delivery checkbox' : undefined
                }
              >
                {deliverMutation.isPending ? (
                  <>
                    <LoadingState variant="spinner" size="sm" label="Delivering increment" />
                    <span>Delivering...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon size={16} />
                    <span>Confirm Delivery</span>
                  </>
                )}
              </button>
            </div>
            {deliverMutation.isError && (
              <div className={styles['modal-error']}>
                Failed to deliver increment. Please try again.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
