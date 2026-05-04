import React from 'react';

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
  completeSprintError: string | null;
  onClose: () => void;
  onProceedToDodVerification: () => void;
  onManageBacklog: () => void;
  onViewImpediments: () => void;
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
  completeSprintError,
  onClose,
  onProceedToDodVerification,
  onManageBacklog,
  onViewImpediments,
  isCompleting,
  modalRef,
}) => {
  const hasIncompleteTasks = incompleteTasksCount > 0;
  const hasOutstandingImpediments = outstandingImpedimentsCount > 0;

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
            Complete Sprint
          </h2>
          <button
            className={baseStyles['modal-close']}
            onClick={onClose}
            aria-label="Close modal"
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
            <h3 className={styles['sprint-summary-title']}>Sprint Summary</h3>
            <div className={styles['summary-grid']}>
              <div className={styles['summary-item']}>
                <span className={styles['summary-label']}>Sprint:</span>
                <span className={styles['summary-value']}>{sprintName}</span>
              </div>
              <div className={styles['summary-item']}>
                <span className={styles['summary-label']}>Duration:</span>
                <span className={styles['summary-value']}>
                  {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Timebox ended'}
                </span>
              </div>
              <div className={styles['summary-item']}>
                <span className={styles['summary-label']}>Total Tasks:</span>
                <span className={styles['summary-value']}>{sprintStats.totalTasks}</span>
              </div>
              <div className={styles['summary-item']}>
                <span className={styles['summary-label']}>Completed Tasks:</span>
                <span className={`${styles['summary-value']} ${styles['summary-value-success']}`}>
                  {sprintStats.doneTasks}
                </span>
              </div>
              <div className={styles['summary-item']}>
                <span className={styles['summary-label']}>Story Points:</span>
                <span className={styles['summary-value']}>
                  {sprintStats.completedStoryPoints} / {sprintStats.totalStoryPoints}
                </span>
              </div>
              <div className={styles['summary-item']}>
                <span className={styles['summary-label']}>Progress:</span>
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
                <strong>Outstanding Impediments Detected</strong>
              </div>
              <p className={styles['impediments-warning-details']}>
                You have{' '}
                <strong>
                  {outstandingImpedimentsCount} outstanding impediment
                  {outstandingImpedimentsCount !== 1 ? 's' : ''}
                </strong>{' '}
                that need to be resolved or closed before completing the sprint.
              </p>

              <div className={styles['outstanding-impediments-list']}>
                <h4 className={styles['outstanding-impediments-list-title']}>
                  Outstanding Impediments
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
                            Open
                          </>
                        )}
                        {impediment.status === 'IN_PROGRESS' && (
                          <>
                            <CircleIcon
                              size={8}
                              style={{ color: 'var(--color-warning-500)' }}
                              aria-hidden="true"
                            />{' '}
                            In Progress
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
                        +{outstandingImpedimentsCount - 5} more impediment
                        {outstandingImpedimentsCount - 5 !== 1 ? 's' : ''}
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              <div className={styles['outstanding-impediments-actions']}>
                <button className={styles['button-view-impediments']} onClick={onViewImpediments}>
                  <AlertTriangleIcon size={14} aria-hidden="true" /> View Impediments
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
                <strong>Incomplete Work Detected</strong>
              </div>
              <p className={styles['warning-details']}>
                You have{' '}
                <strong>
                  {incompleteTasksCount} incomplete task{incompleteTasksCount !== 1 ? 's' : ''}
                </strong>{' '}
                across{' '}
                <strong>
                  {incompletePbisCount} backlog item{incompletePbisCount !== 1 ? 's' : ''}
                </strong>
                . Please resolve these items before completing the sprint.
              </p>

              <div className={styles['incomplete-tasks-list']}>
                <h4 className={styles['incomplete-tasks-list-title']}>Incomplete Tasks</h4>
                <ul className={styles['incomplete-tasks-items']}>
                  {incompleteTasks.map((task) => (
                    <li key={task.id} className={styles['incomplete-task-item']}>
                      <div className={styles['task-status-badge']}>
                        {task.status === TaskStatusEnum.TODO && (
                          <>
                            <ClipboardIcon size={12} aria-hidden="true" /> TODO
                          </>
                        )}
                        {task.status === TaskStatusEnum.IN_PROGRESS && (
                          <>
                            <RefreshCwIcon size={12} aria-hidden="true" /> In Progress
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
                  <ClipboardIcon size={14} aria-hidden="true" /> Manage Backlog
                </button>
              </div>
            </div>
          ) : !hasOutstandingImpediments ? (
            <div className={styles['ready-to-complete']}>
              <p className={styles['confirmation-text']}>
                All tasks are complete! Before completing the sprint, you must verify that all
                Product Backlog Items meet the Definition of Done criteria.
              </p>
            </div>
          ) : null}
        </div>
        <div className={baseStyles['modal-footer']}>
          <button
            className={`${baseStyles.button} ${baseStyles['button-secondary']}`}
            onClick={onClose}
            disabled={isCompleting}
          >
            Cancel
          </button>
          <button
            className={styles['button-complete-sprint-confirm']}
            onClick={
              hasIncompleteTasks || hasOutstandingImpediments
                ? undefined
                : onProceedToDodVerification
            }
            disabled={isCompleting || hasIncompleteTasks || hasOutstandingImpediments}
            aria-busy={isCompleting}
            title={
              hasIncompleteTasks
                ? 'Cannot complete sprint with incomplete tasks. Please complete all tasks or return them to backlog.'
                : hasOutstandingImpediments
                  ? 'Cannot complete sprint with outstanding impediments. Please resolve or close all impediments first.'
                  : 'Proceed to Definition of Done verification'
            }
          >
            {isCompleting ? (
              <>
                <span className={baseStyles['button-spinner']} aria-hidden="true" />
                Processing...
              </>
            ) : hasIncompleteTasks || hasOutstandingImpediments ? (
              <>
                <XCircleIcon
                  size={16}
                  aria-hidden="true"
                  className={styles['button-icon-disabled']}
                />
                Complete Sprint (Disabled)
              </>
            ) : (
              <>
                <CheckCircleIcon
                  size={16}
                  aria-hidden="true"
                  className={styles['button-icon-active']}
                />
                Proceed to DoD Verification
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
