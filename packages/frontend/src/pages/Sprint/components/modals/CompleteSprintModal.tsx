import React from 'react';
import { useTranslation } from 'react-i18next';

import { TaskStatus as TaskStatusEnum, type Impediment } from '../../../../types';

import baseStyles from './base/ModalBase.module.css';
import styles from './CompleteSprintModal.module.css';

import {
  FlagIcon,
  CloseIcon,
  AlertTriangleIcon,
  CircleIcon,
  ClipboardIcon,
  RefreshCwIcon,
  EyeIcon,
  XCircleIcon,
  CheckCircleIcon,
} from '@/components/common/Icons';

interface IncompleteTask {
  id: string;
  title: string;
  status: string;
  pbiTitle: string;
  assigneeId?: string;
}

export interface CompleteSprintModalProps {
  sprintName: string;
  daysRemaining: number;
  sprintStats: {
    totalTasks: number;
    doneTasks: number;
    completedStoryPoints: number;
    totalStoryPoints: number;
    progressPercentage: number;
  };
  incompleteTasks: IncompleteTask[];
  incompleteTasksCount: number;
  incompletePbisCount: number;
  outstandingImpediments: Impediment[];
  outstandingImpedimentsCount: number;
  isReviewCompleted: boolean;
  isRetrospectiveCompleted: boolean;
  completeSprintError: string | null;
  onClose: () => void;
  onProceedToDodVerification: () => void;
  onManageBacklog: () => void;
  onViewImpediments: () => void;
  onViewSprintReview: () => void;
  onViewRetrospective: () => void;
  isCompleting: boolean;
  modalRef: React.RefObject<HTMLDivElement | null>;
}

export const CompleteSprintModal: React.FC<CompleteSprintModalProps> = ({
  sprintName,
  daysRemaining,
  sprintStats,
  incompleteTasks,
  incompleteTasksCount,
  incompletePbisCount,
  outstandingImpediments,
  outstandingImpedimentsCount,
  isReviewCompleted,
  isRetrospectiveCompleted,
  completeSprintError,
  onClose,
  onProceedToDodVerification,
  onManageBacklog,
  onViewImpediments,
  onViewSprintReview,
  onViewRetrospective,
  isCompleting,
  modalRef,
}) => {
  const { t } = useTranslation('sprint');
  const hasIncompleteTasks = incompleteTasksCount > 0;
  const hasOutstandingImpediments = outstandingImpedimentsCount > 0;
  const hasIncompleteReview = !isReviewCompleted;
  const hasIncompleteRetrospective = !isRetrospectiveCompleted;
  const hasBlockingPrerequisites =
    hasIncompleteTasks ||
    hasOutstandingImpediments ||
    hasIncompleteReview ||
    hasIncompleteRetrospective;

  return (
    <div
      className={baseStyles['modal-overlay']}
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-sprint-title"
    >
      <div
        ref={modalRef}
        className={`${baseStyles.modal} ${styles['complete-sprint-modal']}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={baseStyles['modal-header']}>
          <h2 id="complete-sprint-title" className={baseStyles['modal-title']}>
            <FlagIcon size={24} aria-hidden="true" className={baseStyles['icon-success']} />{' '}
            {t('completeSprint.title')}
          </h2>
          <button
            className={baseStyles['modal-close']}
            onClick={onClose}
            aria-label={t('completeSprint.closeModal')}
            data-modal-close
          >
            <CloseIcon size={14} aria-hidden="true" />
          </button>
        </div>
        <div className={baseStyles['modal-body']}>
          {completeSprintError && (
            <div className={`${styles['error-message']} ${styles['detailed-error']}`} role="alert">
              <span className={styles['error-icon']} aria-hidden="true">
                <AlertTriangleIcon size={18} />
              </span>
              <div className={styles['error-content']}>
                {completeSprintError.split('\n\n').map((part, index) => (
                  <p
                    key={index}
                    className={index === 0 ? styles['error-title'] : styles['error-details']}
                  >
                    {part}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className={styles['sprint-summary']}>
            <h3 className={styles['sprint-summary-title']}>{t('completeSprint.sprintSummary')}</h3>
            <div className={styles['summary-grid']}>
              <div className={styles['summary-item']}>
                <span className={styles['summary-label']}>{t('completeSprint.sprint')}</span>
                <span className={styles['summary-value']}>{sprintName}</span>
              </div>
              <div className={styles['summary-item']}>
                <span className={styles['summary-label']}>{t('completeSprint.duration')}</span>
                <span className={styles['summary-value']}>
                  {daysRemaining > 0
                    ? t('completeSprint.daysRemaining', { count: daysRemaining })
                    : t('completeSprint.timeboxEnded')}
                </span>
              </div>
              <div className={styles['summary-item']}>
                <span className={styles['summary-label']}>{t('completeSprint.totalTasks')}</span>
                <span className={styles['summary-value']}>{sprintStats.totalTasks}</span>
              </div>
              <div className={styles['summary-item']}>
                <span className={styles['summary-label']}>
                  {t('completeSprint.completedTasks')}
                </span>
                <span className={`${styles['summary-value']} ${styles['summary-value-success']}`}>
                  {sprintStats.doneTasks}
                </span>
              </div>
              <div className={styles['summary-item']}>
                <span className={styles['summary-label']}>{t('completeSprint.storyPoints')}</span>
                <span className={styles['summary-value']}>
                  {sprintStats.completedStoryPoints} / {sprintStats.totalStoryPoints}
                </span>
              </div>
              <div className={styles['summary-item']}>
                <span className={styles['summary-label']}>{t('completeSprint.progress')}</span>
                <span className={styles['summary-value']}>{sprintStats.progressPercentage}%</span>
              </div>
            </div>
          </div>

          {hasOutstandingImpediments && (
            <div
              className={styles['outstanding-impediments-warning']}
              role="alert"
              aria-live="polite"
            >
              <div className={styles['impediments-warning-header']}>
                <span className={styles['warning-icon']} aria-hidden="true">
                  <AlertTriangleIcon size={20} />
                </span>
                <strong>{t('completeSprint.outstandingImpediments')}</strong>
              </div>
              <p className={styles['impediments-warning-details']}>
                {t('completeSprint.outstandingImpedimentsDetails', {
                  count: outstandingImpedimentsCount,
                })}
              </p>

              <div className={styles['outstanding-impediments-list']}>
                <h4 className={styles['outstanding-impediments-list-title']}>
                  {t('completeSprint.outstandingImpedimentsList')}
                </h4>
                <ul className={styles['outstanding-impediments-items']}>
                  {outstandingImpediments.slice(0, 5).map((impediment) => (
                    <li key={impediment.id} className={styles['outstanding-impediment-item']}>
                      <div className={styles['impediment-status-badge']}>
                        {impediment.status === 'OPEN' && (
                          <>
                            <CircleIcon
                              size={8}
                              style={{ color: 'var(--color-error-500)' }}
                              aria-hidden="true"
                            />{' '}
                            {t('completeSprint.open')}
                          </>
                        )}
                        {impediment.status === 'IN_PROGRESS' && (
                          <>
                            <CircleIcon
                              size={8}
                              style={{ color: 'var(--color-warning-500)' }}
                              aria-hidden="true"
                            />{' '}
                            {t('completeSprint.inProgress')}
                          </>
                        )}
                      </div>
                      <div className={styles['impediment-details']}>
                        <span className={styles['impediment-title']}>{impediment.title}</span>
                        {impediment.sprint && (
                          <span className={styles['impediment-sprint']}>
                            {impediment.sprint.name}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                  {outstandingImpedimentsCount > 5 && (
                    <li className={styles['outstanding-impediment-item']}>
                      <span className={styles['more-impediments']}>
                        {t('completeSprint.moreImpediments', {
                          count: outstandingImpedimentsCount - 5,
                        })}
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              <div className={styles['outstanding-impediments-actions']}>
                <button className={styles['button-view-impediments']} onClick={onViewImpediments}>
                  <AlertTriangleIcon size={14} aria-hidden="true" />{' '}
                  {t('completeSprint.viewImpediments')}
                </button>
              </div>
            </div>
          )}

          {hasIncompleteTasks ? (
            <div className={styles['incomplete-tasks-warning']} role="alert" aria-live="polite">
              <div className={styles['incomplete-warning-header']}>
                <span className={styles['warning-icon']} aria-hidden="true">
                  <AlertTriangleIcon size={20} />
                </span>
                <strong>{t('completeSprint.incompleteWork')}</strong>
              </div>
              <p className={styles['warning-details']}>
                {t('completeSprint.incompleteWorkDetails', {
                  taskCount: incompleteTasksCount,
                  pbiCount: incompletePbisCount,
                })}
              </p>

              <div className={styles['incomplete-tasks-list']}>
                <h4 className={styles['incomplete-tasks-list-title']}>
                  {t('completeSprint.incompleteTasksList')}
                </h4>
                <ul className={styles['incomplete-tasks-items']}>
                  {incompleteTasks.map((task) => (
                    <li key={task.id} className={styles['incomplete-task-item']}>
                      <div className={styles['task-status-badge']}>
                        {task.status === TaskStatusEnum.TODO && (
                          <>
                            <ClipboardIcon size={12} aria-hidden="true" />{' '}
                            {t('taskStatus.todo').toUpperCase()}
                          </>
                        )}
                        {task.status === TaskStatusEnum.IN_PROGRESS && (
                          <>
                            <RefreshCwIcon size={12} aria-hidden="true" />{' '}
                            {t('taskStatus.inProgress')}
                          </>
                        )}
                        {task.status === TaskStatusEnum.REVIEW && (
                          <>
                            <EyeIcon size={12} aria-hidden="true" /> {t('taskStatus.review')}
                          </>
                        )}
                      </div>
                      <div className={styles['task-details']}>
                        <span className={styles['task-title']}>{task.title}</span>
                        <span className={styles['task-pbi']}>{task.pbiTitle}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles['incomplete-tasks-actions']}>
                <button className={styles['button-manage-backlog']} onClick={onManageBacklog}>
                  <ClipboardIcon size={14} aria-hidden="true" /> {t('completeSprint.manageBacklog')}
                </button>
              </div>
            </div>
          ) : !hasOutstandingImpediments && !hasIncompleteReview && !hasIncompleteRetrospective ? (
            <div className={styles['ready-to-complete']}>
              <p className={styles['confirmation-text']}>{t('completeSprint.readyToComplete')}</p>
            </div>
          ) : null}

          {hasIncompleteReview && (
            <div
              className={styles['outstanding-impediments-warning']}
              role="alert"
              aria-live="polite"
            >
              <div className={styles['impediments-warning-header']}>
                <span className={styles['warning-icon']} aria-hidden="true">
                  <AlertTriangleIcon size={20} />
                </span>
                <strong>{t('completeSprint.incompleteSprintReview')}</strong>
              </div>
              <p className={styles['impediments-warning-details']}>
                {t('completeSprint.incompleteSprintReviewDetails')}
              </p>
              <div className={styles['outstanding-impediments-actions']}>
                <button className={styles['button-view-impediments']} onClick={onViewSprintReview}>
                  <EyeIcon size={14} aria-hidden="true" /> {t('completeSprint.viewSprintReview')}
                </button>
              </div>
            </div>
          )}

          {hasIncompleteRetrospective && (
            <div
              className={styles['outstanding-impediments-warning']}
              role="alert"
              aria-live="polite"
            >
              <div className={styles['impediments-warning-header']}>
                <span className={styles['warning-icon']} aria-hidden="true">
                  <AlertTriangleIcon size={20} />
                </span>
                <strong>{t('completeSprint.incompleteSprintRetrospective')}</strong>
              </div>
              <p className={styles['impediments-warning-details']}>
                {t('completeSprint.incompleteSprintRetrospectiveDetails')}
              </p>
              <div className={styles['outstanding-impediments-actions']}>
                <button className={styles['button-view-impediments']} onClick={onViewRetrospective}>
                  <EyeIcon size={14} aria-hidden="true" /> {t('completeSprint.viewRetrospective')}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className={baseStyles['modal-footer']}>
          <button
            className={`${baseStyles.button} ${baseStyles['button-secondary']}`}
            onClick={onClose}
            disabled={isCompleting}
          >
            {t('completeSprint.cancel')}
          </button>
          <button
            className={styles['button-complete-sprint-confirm']}
            onClick={hasBlockingPrerequisites ? undefined : onProceedToDodVerification}
            disabled={isCompleting || hasBlockingPrerequisites}
            aria-busy={isCompleting}
            title={
              hasIncompleteTasks
                ? t('completeSprint.cannotCompleteWithIncomplete')
                : hasOutstandingImpediments
                  ? t('completeSprint.cannotCompleteWithImpediments')
                  : hasIncompleteReview
                    ? t('completeSprint.cannotCompleteWithIncompleteReview')
                    : hasIncompleteRetrospective
                      ? t('completeSprint.cannotCompleteWithIncompleteRetrospective')
                      : t('completeSprint.proceedToDodVerificationTitle')
            }
          >
            {isCompleting ? (
              <>
                <span className={baseStyles['button-spinner']} aria-hidden="true" />
                {t('completeSprint.processing')}
              </>
            ) : hasBlockingPrerequisites ? (
              <>
                <XCircleIcon
                  size={16}
                  aria-hidden="true"
                  className={styles['button-icon-disabled']}
                />
                {t('completeSprint.completeSprintDisabled')}
              </>
            ) : (
              <>
                <CheckCircleIcon
                  size={16}
                  aria-hidden="true"
                  className={styles['button-icon-active']}
                />
                {t('completeSprint.proceedToDodVerification')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
