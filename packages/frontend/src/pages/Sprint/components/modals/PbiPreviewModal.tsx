import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '@scrumooth/shared';

import {
  ItemStatus,
  TaskStatus as TaskStatusEnum,
  type ProductBacklogItem,
  type Task,
} from '../../../../types';
import { apiService, definitionService } from '../../../../services';
import { useFocusTrap } from '../../SprintBoard.hooks';
import { getStatusConfig } from '../../../Backlog/config/status.config';
import { MoscowBadge } from '../../../Backlog/components/MoscowBadge';

import baseStyles from './base/ModalBase.module.css';
import pbiStyles from './PbiPreviewModal.module.css';

import { useI18nStore } from '@/i18n/useI18nStore';
import {
  InfoIcon,
  CloseIcon,
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
  CheckIcon,
} from '@/components/common/Icons';

const styles = { ...baseStyles, ...pbiStyles };

/** A single Definition of Done criterion presented in the checklist. */
interface DoDCheck {
  id: string;
  label: string;
  description: string;
}

export interface PbiPreviewModalProps {
  /** The PBI to preview. When null the modal is closed. */
  item: ProductBacklogItem | null;
  /** Whether the current user may mutate the Sprint Backlog (Developers-only). */
  canMutate: boolean;
  /** Current team id (used to fetch the Definition of Done). */
  teamId: string | undefined;
  /** Close the preview popup. */
  onClose: () => void;
  /** Called after a successful "mark as done" so the board can refresh its data. */
  onMarkedDone: (pbiId: string) => void;
}

export const PbiPreviewModal: React.FC<PbiPreviewModalProps> = ({
  item,
  canMutate,
  teamId,
  onClose,
  onMarkedDone,
}) => {
  const { t } = useTranslation('sprint');
  const { locale } = useI18nStore();
  const ref = useRef<HTMLDivElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const dodRef = useRef<HTMLDivElement>(null);

  useFocusTrap(!!item, ref);

  const [isCheckingTasks, setIsCheckingTasks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [showDod, setShowDod] = useState(false);
  const [dodChecks, setDodChecks] = useState<DoDCheck[]>([]);
  const [checkValues, setCheckValues] = useState<Record<string, boolean>>({});
  /** Whether all child tasks of the previewed PBI are DONE (null while not yet checked). */
  const [allTasksDone, setAllTasksDone] = useState<boolean | null>(null);

  // When the inline DoD checklist appears, scroll it into view so the user can
  // immediately see the criteria they must verify (the checklist is rendered at
  // the bottom of a scrollable body, out of sight by default).
  useEffect(() => {
    if (!showDod) return;
    const scrollBody = scrollBodyRef.current;
    const dodSection = dodRef.current;
    if (!scrollBody || !dodSection || typeof scrollBody.scrollTo !== 'function') return;
    scrollBody.scrollTo({
      top: dodSection.offsetTop - scrollBody.offsetTop,
      behavior: 'smooth',
    });
  }, [showDod]);

  // Status labels live in the "backlog" namespace (e.g. status.inProgress), so resolve them
  // explicitly via the namespace prefix rather than relying on the sprint default namespace.
  const statusT = (key: string) => (t as (k: string) => string)(`backlog:${key}`);
  const STATUS_CONFIG = getStatusConfig(statusT);

  // Reset internal state and (re)load child task completion whenever the target item changes.
  const itemId = item?.id;
  useEffect(() => {
    setShowDod(false);
    setWorkflowError(null);
    setCheckValues({});
    setDodChecks([]);
    setIsCheckingTasks(false);
    setIsSubmitting(false);
    setAllTasksDone(null);

    if (!itemId) return;
    let cancelled = false;
    void apiService
      .getTasksByPbiId(itemId)
      .then((response) => {
        if (cancelled) return;
        const tasks: Task[] = response.data ?? [];
        setAllTasksDone(
          tasks.length > 0 && tasks.every((task) => task.status === TaskStatusEnum.DONE)
        );
      })
      .catch(() => {
        if (!cancelled) setAllTasksDone(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  if (!item) return null;

  const isDone = item.status === ItemStatus.DONE;
  // The PBI is a "ready to done" candidate only when it is being worked (READY/IN_PROGRESS)
  // and every child task is actually DONE.
  const isReadyToDone =
    !isDone &&
    (item.status === ItemStatus.READY || item.status === ItemStatus.IN_PROGRESS) &&
    allTasksDone === true;
  const statusConfig = STATUS_CONFIG[item.status];
  const isDodComplete = dodChecks.length > 0 && dodChecks.every((c) => checkValues[c.id]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleOpenDod = async () => {
    setWorkflowError(null);

    // 1. Ensure all child tasks are DONE before allowing the PBI to be marked done.
    setIsCheckingTasks(true);
    try {
      const response = await apiService.getTasksByPbiId(item.id);
      const tasks: Task[] = response.data ?? [];
      const incompleteTasks = tasks.filter((task) => task.status !== TaskStatusEnum.DONE);

      if (incompleteTasks.length > 0) {
        const taskNames = incompleteTasks
          .slice(0, 3)
          .map((task) => `"${task.title}"`)
          .join(', ');
        const moreCount =
          incompleteTasks.length > 3 ? ` and ${incompleteTasks.length - 3} more` : '';
        setWorkflowError(
          t('pbiPreview.cannotMarkAsDone', {
            taskNames,
            moreCount,
            incompleteCount: incompleteTasks.length,
          })
        );
        return;
      }
    } catch (_error) {
      setWorkflowError(t('pbiPreview.failedToCheckTasks'));
      return;
    } finally {
      setIsCheckingTasks(false);
    }

    // 2. Load the Definition of Done checklist.
    if (!teamId) {
      setWorkflowError(t('pbiPreview.noTeam'));
      return;
    }

    try {
      const dodResponse = await definitionService.getDefinitionOfDone(teamId);
      const items =
        dodResponse.success && dodResponse.data
          ? dodResponse.data.items
              .filter((check) => check.isActive)
              .sort((a, b) => a.order - b.order)
              .map((check) => ({
                id: check.id,
                label: check.description,
                description: check.category ?? 'Required criterion',
              }))
          : [];
      setDodChecks(items);
      setCheckValues({});
      setShowDod(true);
    } catch (_error) {
      setWorkflowError(t('pbiPreview.failedToLoadDod'));
    }
  };

  const handleCheckChange = (checkId: string, checked: boolean) => {
    setCheckValues((prev) => ({ ...prev, [checkId]: checked }));
  };

  const handleConfirmDone = async () => {
    if (!isDodComplete || isSubmitting) return;

    setWorkflowError(null);
    setIsSubmitting(true);
    try {
      // 1. Persist the DoD verifications.
      const verifications = dodChecks.map((check) => ({
        dodItemId: check.id,
        isVerified: checkValues[check.id] ?? false,
      }));
      await definitionService.verifyDoDForPBI(item.id, verifications);

      // 2. Update the PBI status to DONE.
      await apiService.updateProductBacklogItem(item.id, { status: ItemStatus.DONE });

      onMarkedDone(item.id);
      onClose();
    } catch (_error) {
      setWorkflowError(t('pbiPreview.markDoneFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles['modal-overlay']} onClick={handleOverlayClick}>
      <div
        ref={ref}
        className={`${styles.modal} ${styles['pbi-modal']}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pbi-preview-title"
      >
        {/* Decorative gradient orb */}
        <div className={styles['gradient-orb']} aria-hidden="true" />

        {/* Header */}
        <div className={styles['modal-header']}>
          <div className={styles['modal-header-content']}>
            <div className={styles['modal-icon-wrapper']}>
              <InfoIcon size={24} />
            </div>
            <div className={styles['modal-title-group']}>
              <div className={styles['item-id-row']}>
                <span className={styles['item-id']}>#{item.id.slice(-4)}</span>
              </div>
              <h2 id="pbi-preview-title" className={styles['modal-title']}>
                {item.title}
              </h2>
            </div>
          </div>
          <button
            className={styles['modal-close']}
            onClick={onClose}
            data-modal-close
            aria-label={t('pbiPreview.close')}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles['modal-body-scrollable']} ref={scrollBodyRef}>
          {/* Error Banner */}
          {workflowError && (
            <div className={styles['modal-error-banner']} role="alert">
              <div className={styles['modal-error-content']}>
                <span className={styles['modal-error-icon']}>
                  <AlertTriangleIcon size={20} />
                </span>
                <span className={styles['modal-error-text']}>{workflowError}</span>
                <button
                  className={styles['modal-error-close']}
                  onClick={() => setWorkflowError(null)}
                  aria-label={t('pbiPreview.closeError')}
                >
                  <CloseIcon size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Status banner */}
          {isDone ? (
            <div className={styles['done-notice']}>
              <ShieldIcon size={20} />
              <span>{t('pbiPreview.doneNotice')}</span>
            </div>
          ) : isReadyToDone ? (
            <div className={styles['ready-banner']}>
              <CheckCircleIcon size={20} />
              <span>{t('pbiPreview.readyToDoneBanner')}</span>
            </div>
          ) : allTasksDone === false ? (
            <div className={styles['pending-banner']}>
              <AlertTriangleIcon size={20} />
              <span>{t('pbiPreview.tasksRemainingHint')}</span>
            </div>
          ) : null}

          {/* Info Cards Grid */}
          <div className={styles['info-grid']}>
            <div className={styles['info-card']}>
              <div className={styles['info-label']}>
                <CheckCircleIcon size={16} />
                {t('pbiPreview.status')}
              </div>
              <span
                className={styles['status-pill']}
                style={{
                  color: statusConfig.color,
                  backgroundColor: statusConfig.bgColor,
                  border: `1px solid ${statusConfig.borderColor}`,
                }}
              >
                {statusConfig.label}
              </span>
            </div>

            <div className={styles['info-card']}>
              <div className={styles['info-label']}>
                <StarIcon size={16} />
                {t('pbiPreview.priority')}
              </div>
              <div className={styles['info-value']}>
                <MoscowBadge priority={item.priority} />
              </div>
            </div>

            <div className={styles['info-card']}>
              <div className={styles['info-label']}>
                <DollarSignIcon size={16} />
                {t('pbiPreview.businessValue')}
              </div>
              <div
                className={`${styles['info-value']} ${!item.businessValue ? styles['info-value-muted'] : ''}`}
              >
                {item.businessValue ? `${item.businessValue} pts` : t('pbiPreview.notEstimated')}
              </div>
            </div>

            <div className={styles['info-card']}>
              <div className={styles['info-label']}>
                <ClockIcon size={16} />
                {t('pbiPreview.estimate')}
              </div>
              <div
                className={`${styles['info-value']} ${!item.storyPoints ? styles['info-value-muted'] : ''}`}
              >
                {item.storyPoints ? `${item.storyPoints} pts` : t('pbiPreview.notEstimated')}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className={styles['section-card']}>
            <div className={styles['section-header']}>
              <span className={styles['section-title']}>
                <FileTextIcon size={16} className={styles['section-icon']} />
                {t('pbiPreview.description')}
              </span>
            </div>
            {item.description ? (
              <p className={styles['section-content']}>{item.description}</p>
            ) : (
              <div className={styles['empty-state']}>
                <FileTextIcon size={16} />
                <span>{t('pbiPreview.noDescription')}</span>
              </div>
            )}
          </div>

          {/* Acceptance Criteria Section */}
          <div className={styles['section-card']}>
            <div className={styles['section-header']}>
              <span className={styles['section-title']}>
                <CheckSquareIcon size={16} className={styles['section-icon']} />
                {t('pbiPreview.acceptanceCriteria')}
              </span>
            </div>
            {item.acceptanceCriteria ? (
              <p className={styles['section-content']}>{item.acceptanceCriteria}</p>
            ) : (
              <div className={styles['empty-state']}>
                <CheckSquareIcon size={16} />
                <span>{t('pbiPreview.noAcceptanceCriteria')}</span>
              </div>
            )}
          </div>

          {/* Labels Section */}
          {item.labels.length > 0 && (
            <div className={styles['section-card']}>
              <div className={styles['section-header']}>
                <span className={styles['section-title']}>
                  <TagIcon size={16} className={styles['section-icon']} />
                  {t('pbiPreview.labels')}
                </span>
              </div>
              <div className={styles['labels-container']}>
                {item.labels.map((label) => (
                  <span key={label} className={styles['label-tag']}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Section */}
          <div className={styles['section-card']}>
            <div className={styles['section-header']}>
              <span className={styles['section-title']}>
                <CalendarIcon size={16} className={styles['section-icon']} />
                {t('pbiPreview.metadata')}
              </span>
            </div>
            <div className={styles['metadata-grid']}>
              <div className={styles['metadata-item']}>
                <CalendarIcon size={16} className={styles['metadata-icon']} />
                <span>
                  {t('pbiPreview.created')}: {formatLocaleDate(item.createdAt, locale)}
                </span>
              </div>
              <div className={styles['metadata-item']}>
                <ClockIcon size={16} className={styles['metadata-icon']} />
                <span>
                  {t('pbiPreview.updated')}: {formatLocaleDate(item.updatedAt, locale)}
                </span>
              </div>
            </div>
          </div>

          {/* Inline DoD checklist (mark-as-done flow) */}
          {showDod && !isDone && (
            <div className={styles['dod-section']} ref={dodRef}>
              <div className={styles['dod-section-title']}>
                <ShieldIcon size={16} className={styles['section-icon']} />
                {t('pbiPreview.dodTitle')}
              </div>
              <p className={styles['dod-hint']}>{t('pbiPreview.dodHint')}</p>

              {dodChecks.length === 0 ? (
                <div className={styles['empty-state']}>
                  <ShieldIcon size={16} />
                  <span>{t('pbiPreview.noDodItems')}</span>
                </div>
              ) : (
                <>
                  <div className={styles['validation-checklist']}>
                    {dodChecks.map((check) => (
                      <label
                        key={check.id}
                        className={`${styles['validation-check-item']} ${checkValues[check.id] ? styles.checked : ''}`}
                      >
                        <div className={styles['check-checkbox']}>
                          <input
                            type="checkbox"
                            checked={checkValues[check.id] ?? false}
                            onChange={(e) => handleCheckChange(check.id, e.target.checked)}
                          />
                          <span className={styles['check-custom']}>
                            {checkValues[check.id] && <CheckIcon size={12} />}
                          </span>
                        </div>
                        <div className={styles['check-content']}>
                          <span className={styles['check-label']}>{check.label}</span>
                          <span className={styles['check-desc']}>{check.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {!isDodComplete && (
                    <div className={styles['validation-warning']}>
                      <AlertTriangleIcon size={16} />
                      <span>{t('pbiPreview.allMustBeVerified')}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles['modal-footer']}>
          {isReadyToDone && canMutate && (
            <>
              {!showDod ? (
                <button
                  className={`${styles.button} ${styles['button-primary']}`}
                  onClick={() => void handleOpenDod()}
                  disabled={isCheckingTasks}
                  aria-label={t('pbiPreview.markDoneAria')}
                >
                  <CheckCircleIcon size={16} />
                  {isCheckingTasks ? t('pbiPreview.checkingTasks') : t('pbiPreview.markDone')}
                </button>
              ) : (
                <button
                  className={`${styles.button} ${styles['button-primary']}`}
                  onClick={() => void handleConfirmDone()}
                  disabled={isSubmitting || !isDodComplete}
                  aria-label={t('pbiPreview.confirmDoneAria')}
                >
                  <CheckIcon size={16} />
                  {isSubmitting ? t('pbiPreview.updating') : t('pbiPreview.confirmDone')}
                </button>
              )}
            </>
          )}
          <button
            className={`${styles.button} ${styles['button-secondary']}`}
            onClick={onClose}
            aria-label={t('pbiPreview.close')}
          >
            {t('pbiPreview.closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
};
