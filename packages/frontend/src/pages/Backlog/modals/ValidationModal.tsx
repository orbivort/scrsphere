import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import type { DefinitionItem } from '../hooks/useDefinitionOfReadyDone';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useBacklogContext } from '../context/BacklogContext';

import styles from './ValidationModal.module.css';

import {
  CheckCircleIcon,
  XIcon,
  AlertTriangleIcon,
  AlertIcon,
  CheckIcon,
} from '@/components/common/Icons';

/**
 * Maps DoR item descriptions to translation keys
 */
const DOR_ITEM_MAP: Record<string, string> = {
  'Clear title and description provided': 'validation.dorItems.clearTitleAndDescription',
  'Acceptance criteria defined and agreed':
    'validation.dorItems.acceptanceCriteriaDefinedAndAgreed',
  'Story points estimated by the team': 'validation.dorItems.storyPointsEstimatedByTeam',
  'Business value assigned': 'validation.dorItems.businessValueAssigned',
  'Dependencies identified and documented':
    'validation.dorItems.dependenciesIdentifiedAndDocumented',
  'No blockers or impediments': 'validation.dorItems.noBlockersOrImpediments',
  'User story clearly written': 'validation.dorItems.userStoryClearlyWritten',
  'Acceptance criteria defined': 'validation.dorItems.acceptanceCriteriaDefined',
  'Story points estimated': 'validation.dorItems.storyPointsEstimated',
  'Dependencies identified': 'validation.dorItems.dependenciesIdentified',
};

/**
 * Maps DoD item descriptions to translation keys
 */
const DOD_ITEM_MAP: Record<string, string> = {
  'Code is peer-reviewed and approved': 'validation.dodItems.codePeerReviewed',
  'Unit tests written and passing (minimum 80% coverage)': 'validation.dodItems.unitTestsWritten',
  'Integration tests passing': 'validation.dodItems.integrationTestsPassing',
  'Code is properly documented': 'validation.dodItems.codeProperlyDocumented',
  'No critical or high-severity bugs': 'validation.dodItems.noCriticalBugs',
};

/**
 * Maps categories to translation keys
 */
const CATEGORY_MAP: Record<string, string> = {
  documentation: 'validation.categories.documentation',
  estimation: 'validation.categories.estimation',
  dependencies: 'validation.categories.dependencies',
  clarity: 'validation.categories.clarity',
  acceptance: 'validation.categories.acceptance',
  technical: 'validation.categories.technical',
  value: 'validation.categories.value',
  quality: 'validation.categories.quality',
  testing: 'validation.categories.testing',
  deployment: 'validation.categories.deployment',
  review: 'validation.categories.review',
};

/**
 * Translates a DoR/DoD item label if it matches a known default
 */
function getTranslatedLabel(item: DefinitionItem, t: TFunction<'backlog'>): string {
  const translationKey = DOR_ITEM_MAP[item.label] ?? DOD_ITEM_MAP[item.label];
  return translationKey ? (t(translationKey as never) as string) : item.label;
}

/**
 * Translates a category if it matches a known category
 */
function getTranslatedCategory(category: string, t: TFunction<'backlog'>): string {
  const translationKey = CATEGORY_MAP[category];
  return translationKey ? (t(translationKey as never) as string) : category;
}

export interface ValidationModalProps {
  isOpen: boolean;
  validationType: 'ready' | 'done' | null;
  dorItems: DefinitionItem[];
  dodItems: DefinitionItem[];
  validationChecks: Record<string, boolean>;
  onCheckChange: (checkId: string, checked: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isUpdating: boolean;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  validationType,
  dorItems,
  dodItems,
  validationChecks,
  onCheckChange,
  onConfirm,
  onCancel,
  isUpdating,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('backlog');

  const { selectedItem, workflowError, setWorkflowError } = useBacklogContext();

  useFocusTrap(isOpen, modalRef);

  if (!isOpen || !validationType || !selectedItem) return null;

  const checks = validationType === 'ready' ? dorItems : dodItems;
  const checkedCount = checks.filter((c) => validationChecks[c.id]).length;
  const isComplete = checks.length > 0 && checks.every((check) => validationChecks[check.id]);

  return (
    <div className={styles['modal-overlay']}>
      <div
        ref={modalRef}
        className={`${styles.modal} ${styles['validation-modal']}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles['modal-header']}>
          <div className={styles['validation-header-content']}>
            <div className={styles['validation-icon']}>
              <CheckCircleIcon
                width="24"
                height="24"
                className={
                  styles[
                    validationType === 'ready' ? 'validation-icon-ready' : 'validation-icon-done'
                  ]
                }
              />
            </div>
            <div>
              <h2>
                {
                  t(
                    validationType === 'ready' ? 'validation.dorShort' : 'validation.dodShort'
                  ) as string
                }
              </h2>
              <p className={styles['validation-subtitle']}>
                {
                  t('validation.verifyAllCriteria', {
                    status: validationType === 'ready' ? t('status.ready') : t('status.done'),
                  }) as string
                }
              </p>
            </div>
          </div>
          <button className={styles['modal-close']} onClick={onCancel} data-modal-close>
            <XIcon width="16" height="16" />
          </button>
        </div>
        <div className={styles['modal-body']}>
          {workflowError && (
            <div className={styles['modal-error-banner']}>
              <div className={styles['modal-error-content']}>
                <span className={styles['modal-error-icon']}>
                  <AlertIcon width="16" height="16" />
                </span>
                <span className={styles['modal-error-text']}>{workflowError}</span>
                <button
                  className={styles['modal-error-close']}
                  onClick={() => setWorkflowError(null)}
                  aria-label={t('validation.closeError') as string}
                >
                  <XIcon width="14" height="14" />
                </button>
              </div>
            </div>
          )}
          <div className={styles['validation-item-preview']}>
            <span className={styles['preview-id']}>#{selectedItem.id.slice(-4)}</span>
            <span className={styles['preview-title']}>{selectedItem.title}</span>
          </div>

          <div className={styles['validation-checklist']}>
            {checks.map((check) => (
              <label
                key={check.id}
                className={`${styles['validation-check-item']} ${validationChecks[check.id] ? styles.checked : ''}`}
              >
                <div className={styles['check-checkbox']}>
                  <input
                    type="checkbox"
                    checked={validationChecks[check.id] ?? false}
                    onChange={(e) => onCheckChange(check.id, e.target.checked)}
                  />
                  <span className={styles['check-custom']}>
                    {validationChecks[check.id] && (
                      <CheckIcon width="12" height="12" strokeWidth="3" />
                    )}
                  </span>
                </div>
                <div className={styles['check-content']}>
                  <span className={styles['check-label']}>{getTranslatedLabel(check, t)}</span>
                  <span className={styles['check-desc']}>
                    {getTranslatedCategory(check.description, t)}
                  </span>
                </div>
              </label>
            ))}
          </div>

          <div className={styles['validation-progress']}>
            <div className={styles['progress-bar']}>
              <div
                className={styles['progress-fill']}
                style={{
                  width: `${(checkedCount / checks.length) * 100}%`,
                }}
              />
            </div>
            <span className={styles['progress-text']}>
              {checkedCount} of {checks.length}{' '}
              {t('validation.criteriaMet', { met: checkedCount, total: checks.length }) as string}
            </span>
          </div>

          {!isComplete && (
            <div className={styles['validation-warning']}>
              <AlertTriangleIcon width="16" height="16" />
              <span>{t('validation.allMustBeVerified') as string}</span>
            </div>
          )}
        </div>
        <div className={styles['modal-footer']}>
          <button className={`${styles.button} ${styles['button-secondary']}`} onClick={onCancel}>
            {t('validation.cancel') as string}
          </button>
          <button
            className={`${styles.button} ${styles['button-primary']}`}
            onClick={onConfirm}
            disabled={isUpdating || !isComplete}
          >
            {isUpdating ? (
              (t('validation.updating') as string)
            ) : (
              <>
                <CheckIcon width="16" height="16" />
                {t('validation.confirmStatusChange') as string}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
