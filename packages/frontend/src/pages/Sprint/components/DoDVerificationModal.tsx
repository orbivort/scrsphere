import { useState, useEffect, useMemo, useCallback } from 'react';

import type { DoDItem, ProductBacklogItem, Task, DoDChecklistVerification } from '../../../types';
import { apiService } from '../../../services';
import { logger } from '../../../utils/logger';
import { LoadingState } from '../../../components/common/Loading';

import styles from './DoDVerificationModal.module.css';

import { CheckCircleIcon } from '@/components/common/Icons';

export interface DoDVerificationData {
  pbiId: string;
  dodItemId: string;
  isVerified: boolean;
}

interface DoDVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (verifications: DoDVerificationData[]) => void | Promise<void>;
  dodItems: DoDItem[];
  pbis: ProductBacklogItem[];
  tasks: Task[];
  isLoading?: boolean;
  existingVerifications?: DoDChecklistVerification[];
}

const getCategoryIcon = (category?: string) => {
  const icons: Record<string, string> = {
    quality: '✓',
    testing: '🧪',
    documentation: '📄',
    deployment: '🚀',
    review: '👀',
  };
  return icons[category ?? 'quality'] ?? '✓';
};

const getCategoryColor = (category?: string) => {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    quality: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
    testing: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
    documentation: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
    deployment: { bg: '#FCE7F3', border: '#EC4899', text: '#9D174D' },
    review: { bg: '#E0E7FF', border: '#6366F1', text: '#3730A3' },
  };
  return colors[category ?? 'quality'] ?? colors.quality;
};

export const DoDVerificationModal: React.FC<DoDVerificationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  dodItems,
  pbis,
  tasks,
  isLoading = false,
  existingVerifications = [],
}) => {
  const [pbiVerifications, setPbiVerifications] = useState<Map<string, Map<string, boolean>>>(
    new Map()
  );
  const [existingVerifiedItems, setExistingVerifiedItems] = useState<Set<string>>(new Set());
  const [expandedPbi, setExpandedPbi] = useState<string | null>(null);
  const [isLoadingVerifications, setIsLoadingVerifications] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [_loadedVerifications, setLoadedVerifications] =
    useState<DoDChecklistVerification[]>(existingVerifications);

  const activeDodItems = useMemo(
    () => dodItems.filter((item) => item.isActive).sort((a, b) => a.order - b.order),
    [dodItems]
  );

  const pbisWithAllTasksDone = useMemo(() => {
    return pbis.filter((pbi) => {
      const pbiTasks = tasks.filter((t) => t.pbiId === pbi.id);
      return pbiTasks.length > 0 && pbiTasks.every((t) => t.status === 'DONE');
    });
  }, [pbis, tasks]);

  const fetchVerificationsForPbis = useCallback(async (pbiIds: string[]) => {
    setIsLoadingVerifications(true);
    setVerificationError(null);

    try {
      const fetchPromises = pbiIds.map((pbiId) =>
        apiService
          .getDoDVerificationsForPBI(pbiId)
          .catch(() => ({ data: [] as DoDChecklistVerification[] }))
      );

      const results = await Promise.all(fetchPromises);
      const allVerifications: DoDChecklistVerification[] = [];

      results.forEach((result: { data?: DoDChecklistVerification[] }) => {
        if (result.data && Array.isArray(result.data)) {
          allVerifications.push(...result.data);
        }
      });

      setLoadedVerifications(allVerifications);
      return allVerifications;
    } catch (error) {
      logger.error('Failed to fetch DoD verifications', undefined, { error });
      setVerificationError(
        'Failed to load existing verifications. You can still verify items manually.'
      );
      return [];
    } finally {
      setIsLoadingVerifications(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && pbisWithAllTasksDone.length > 0) {
      const pbiIds = pbisWithAllTasksDone.map((pbi) => pbi.id);

      const initVerifications = (verifications: DoDChecklistVerification[]) => {
        const newVerifications = new Map<string, Map<string, boolean>>();
        const newExistingVerifiedItems = new Set<string>();

        pbisWithAllTasksDone.forEach((pbi) => {
          const pbiVerificationMap = new Map<string, boolean>();

          activeDodItems.forEach((item) => {
            const existingVerification = verifications.find(
              (v) => v.pbiId === pbi.id && v.dodItemId === item.id
            );
            const isVerified = existingVerification?.isVerified ?? false;
            pbiVerificationMap.set(item.id, isVerified);

            if (existingVerification?.isVerified) {
              newExistingVerifiedItems.add(`${pbi.id}:${item.id}`);
            }
          });

          newVerifications.set(pbi.id, pbiVerificationMap);
        });

        setPbiVerifications(newVerifications);
        setExistingVerifiedItems(newExistingVerifiedItems);
        setExpandedPbi(pbisWithAllTasksDone[0]?.id ?? null);
      };

      if (existingVerifications.length > 0) {
        initVerifications(existingVerifications);
      } else {
        void fetchVerificationsForPbis(pbiIds).then((verifications) => {
          initVerifications(verifications);
        });
      }
    }
  }, [
    isOpen,
    pbisWithAllTasksDone,
    activeDodItems,
    existingVerifications,
    fetchVerificationsForPbis,
  ]);

  const isItemReadOnly = useCallback(
    (pbiId: string, dodItemId: string): boolean => {
      return existingVerifiedItems.has(`${pbiId}:${dodItemId}`);
    },
    [existingVerifiedItems]
  );

  const handleToggleVerification = (pbiId: string, dodItemId: string) => {
    if (isItemReadOnly(pbiId, dodItemId)) {
      return;
    }

    setPbiVerifications((prev) => {
      const newMap = new Map(prev);
      const pbiMap = new Map(newMap.get(pbiId) ?? new Map());
      pbiMap.set(dodItemId, !pbiMap.get(dodItemId));
      newMap.set(pbiId, pbiMap);
      return newMap;
    });
  };

  const handleVerifyAllForPbi = (pbiId: string) => {
    const pbiMap = pbiVerifications.get(pbiId);
    if (!pbiMap) return;

    const nonReadOnlyItems = activeDodItems.filter((item) => !isItemReadOnly(pbiId, item.id));
    if (nonReadOnlyItems.length === 0) return;

    const allNonReadOnlyVerified = nonReadOnlyItems.every((item) => pbiMap.get(item.id));

    setPbiVerifications((prev) => {
      const newMap = new Map(prev);
      const newPbiMap = new Map(newMap.get(pbiId) ?? new Map());

      nonReadOnlyItems.forEach((item) => {
        newPbiMap.set(item.id, !allNonReadOnlyVerified);
      });

      newMap.set(pbiId, newPbiMap);
      return newMap;
    });
  };

  const getPbiVerificationStatus = useCallback(
    (pbiId: string) => {
      const pbiMap = pbiVerifications.get(pbiId);
      if (!pbiMap)
        return { verified: 0, total: activeDodItems.length, percentage: 0, readOnlyCount: 0 };
      const verified = Array.from(pbiMap.values()).filter((v) => v).length;
      const total = pbiMap.size;
      const readOnlyCount = activeDodItems.filter((item) => isItemReadOnly(pbiId, item.id)).length;
      return {
        verified,
        total,
        percentage: total > 0 ? (verified / total) * 100 : 0,
        readOnlyCount,
      };
    },
    [pbiVerifications, activeDodItems, isItemReadOnly]
  );

  const allPbisFullyVerified = useMemo(() => {
    return pbisWithAllTasksDone.every((pbi) => {
      const status = getPbiVerificationStatus(pbi.id);
      return status.percentage === 100;
    });
  }, [pbisWithAllTasksDone, getPbiVerificationStatus]);

  const totalVerified = useMemo(() => {
    let verified = 0;
    let total = 0;
    let readOnlyCount = 0;
    pbiVerifications.forEach((pbiMap, pbiId) => {
      pbiMap.forEach((v, dodItemId) => {
        total++;
        if (v) verified++;
        if (isItemReadOnly(pbiId, dodItemId)) readOnlyCount++;
      });
    });
    return { verified, total, percentage: total > 0 ? (verified / total) * 100 : 0, readOnlyCount };
  }, [pbiVerifications, isItemReadOnly]);

  const collectVerificationData = (): DoDVerificationData[] => {
    const verifications: DoDVerificationData[] = [];
    pbiVerifications.forEach((pbiMap, pbiId) => {
      pbiMap.forEach((isVerified, dodItemId) => {
        if (!isItemReadOnly(pbiId, dodItemId)) {
          verifications.push({ pbiId, dodItemId, isVerified });
        }
      });
    });
    return verifications;
  };

  const handleConfirm = () => {
    const verifications = collectVerificationData();
    void onConfirm(verifications);
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles['modal-overlay']}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dod-verification-title"
    >
      <div className={styles['modal-container']}>
        <div className={styles['modal-header']}>
          <div className={styles['header-content']}>
            <h2 id="dod-verification-title">
              <span className={styles['header-icon']}>✅</span>
              Definition of Done Verification
            </h2>
            <p className={styles['header-subtitle']}>
              Verify all DoD criteria before completing the sprint
            </p>
          </div>
          <button className={styles['close-button']} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles['modal-body']}>
          {verificationError && (
            <div className={styles['info-banner']} role="alert">
              <span className={styles['info-icon']}>⚠️</span>
              <div className={styles['info-content']}>
                <strong>Warning</strong>
                <p>{verificationError}</p>
              </div>
            </div>
          )}

          <div className={styles['overall-progress']}>
            <div className={styles['progress-header']}>
              <span className={styles['progress-label']}>Overall Progress</span>
              <span className={styles['progress-value']}>
                {isLoadingVerifications
                  ? 'Loading...'
                  : `${totalVerified.verified} / ${totalVerified.total} criteria verified`}
              </span>
            </div>
            <div className={styles['progress-bar-container']}>
              <div
                className={styles['progress-bar-fill']}
                style={{ width: `${totalVerified.percentage}%` }}
              />
            </div>
            <span className={styles['progress-percentage']}>
              {isLoadingVerifications ? '...' : `${Math.round(totalVerified.percentage)}%`}
            </span>
          </div>

          {isLoadingVerifications ? (
            <LoadingState variant="spinner" size="sm" label="Loading verification status" />
          ) : pbisWithAllTasksDone.length === 0 ? (
            <div className={styles['empty-state']}>
              <span className={styles['empty-icon']}>📭</span>
              <p>No PBIs ready for verification</p>
              <p className={styles['empty-hint']}>
                All tasks must be completed before verifying DoD
              </p>
            </div>
          ) : (
            <div className={styles['pbi-list']}>
              <div className={styles['pbi-list-header']}>
                <span>Backlog Items to Verify ({pbisWithAllTasksDone.length})</span>
                {totalVerified.readOnlyCount > 0 && (
                  <span className={styles['readonly-info']}>
                    🔒 {totalVerified.readOnlyCount} already verified
                  </span>
                )}
              </div>

              {pbisWithAllTasksDone.map((pbi) => {
                const status = getPbiVerificationStatus(pbi.id);
                const isExpanded = expandedPbi === pbi.id;
                const pbiTasks = tasks.filter((t) => t.pbiId === pbi.id);
                const nonReadOnlyItems = activeDodItems.filter(
                  (item) => !isItemReadOnly(pbi.id, item.id)
                );
                const allNonReadOnlyVerified =
                  nonReadOnlyItems.length > 0 &&
                  nonReadOnlyItems.every((item) => pbiVerifications.get(pbi.id)?.get(item.id));

                return (
                  <div
                    key={pbi.id}
                    className={`${styles['pbi-card']} ${status.percentage === 100 ? styles['pbi-card-verified'] : ''}`}
                  >
                    <div
                      className={styles['pbi-card-header']}
                      onClick={() => setExpandedPbi(isExpanded ? null : pbi.id)}
                    >
                      <div className={styles['pbi-info']}>
                        <span className={styles['expand-icon']}>{isExpanded ? '▼' : '▶'}</span>
                        <span className={styles['pbi-title']}>{pbi.title}</span>
                        <span className={styles['task-count']}>
                          {pbiTasks.length} task{pbiTasks.length !== 1 ? 's' : ''}
                        </span>
                        {status.readOnlyCount > 0 && (
                          <span className={styles['readonly-badge']}>
                            🔒 {status.readOnlyCount}
                          </span>
                        )}
                      </div>
                      <div className={styles['pbi-status']}>
                        <div className={styles['mini-progress']}>
                          <div
                            className={styles['mini-progress-fill']}
                            style={{ width: `${status.percentage}%` }}
                          />
                        </div>
                        <span
                          className={styles['status-badge']}
                          data-status={status.percentage === 100 ? 'verified' : 'pending'}
                        >
                          {status.percentage === 100
                            ? '✓ Verified'
                            : `${status.verified}/${status.total}`}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={styles['pbi-card-content']}>
                        <div className={styles['dod-items-header']}>
                          <span>Definition of Done Criteria</span>
                          {nonReadOnlyItems.length > 0 && (
                            <button
                              className={styles['verify-all-button']}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerifyAllForPbi(pbi.id);
                              }}
                            >
                              {allNonReadOnlyVerified ? 'Uncheck New' : 'Verify All New'}
                            </button>
                          )}
                        </div>

                        <div className={styles['dod-items-list']}>
                          {activeDodItems.map((item) => {
                            const isVerified = pbiVerifications.get(pbi.id)?.get(item.id) ?? false;
                            const isReadOnly = isItemReadOnly(pbi.id, item.id);
                            const color = getCategoryColor(item.category);

                            const safeColor = color ?? {
                              bg: '#D1FAE5',
                              border: '#10B981',
                              text: '#065F46',
                            };
                            return (
                              <div
                                key={item.id}
                                className={`${styles['dod-item']} ${isVerified ? styles['dod-item-verified'] : ''} ${isReadOnly ? styles['dod-item-readonly'] : ''}`}
                                onClick={() => handleToggleVerification(pbi.id, item.id)}
                                style={{ borderLeftColor: safeColor.border }}
                                role={isReadOnly ? 'status' : 'button'}
                                aria-disabled={isReadOnly}
                                title={
                                  isReadOnly ? 'Already verified - cannot be changed' : undefined
                                }
                              >
                                <div
                                  className={styles['dod-checkbox']}
                                  style={{
                                    backgroundColor: isVerified ? safeColor.bg : 'white',
                                    borderColor: isVerified ? safeColor.border : '#D1D5DB',
                                  }}
                                >
                                  {isVerified && <span style={{ color: safeColor.text }}>✓</span>}
                                </div>
                                <span
                                  className={styles['dod-category']}
                                  style={{ backgroundColor: safeColor.bg }}
                                >
                                  {getCategoryIcon(item.category)}
                                </span>
                                <span className={styles['dod-description']}>
                                  {item.description}
                                </span>
                                {isReadOnly && (
                                  <span
                                    className={styles['readonly-indicator']}
                                    title="Already verified"
                                  >
                                    🔒
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles['modal-footer']}>
          <div className={styles['footer-info']}>
            {!allPbisFullyVerified && pbisWithAllTasksDone.length > 0 && (
              <span className={styles['warning-text']}>
                ⚠️ All DoD criteria must be verified to complete the sprint
              </span>
            )}
            {allPbisFullyVerified && pbisWithAllTasksDone.length > 0 && (
              <span className={styles['success-text']}>
                ✓ All DoD criteria verified. Ready to complete sprint.
              </span>
            )}
          </div>
          <div className={styles['footer-actions']}>
            <button
              className={`${styles.button} ${styles['button-secondary']}`}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className={`${styles.button} ${styles['button-primary']}`}
              onClick={handleConfirm}
              disabled={!allPbisFullyVerified || isLoading || pbisWithAllTasksDone.length === 0}
            >
              {isLoading ? (
                'Completing...'
              ) : (
                <>
                  <CheckCircleIcon size={16} />
                  Complete Sprint
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
