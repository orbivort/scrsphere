import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { MoSCoWPriority } from '../../../types';
import { useBacklogContext } from '../context/BacklogContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useBacklogCapacityValidation } from '../hooks/useBacklogCapacityValidation';
import { MOSCOW_CONFIG } from '../config/moscow.config';
import { handleMoscowKeyDown } from '../utils/formHandlers';
import { useTeamContext } from '../../../contexts/TeamContext';
import { UnsavedChangesModal } from '../../../components/common/Form/UnsavedChangesModal';

import styles from './CreateItemModal.module.css';

import {
  PlusIcon,
  XIcon,
  AlertIcon,
  XCircleIcon,
  PathIcon,
  CheckIcon,
  InfoIcon,
} from '@/components/common/Icons';

export interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  activeGoalId?: string;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  activeGoalId,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const [capacityInfo, setCapacityInfo] = useState<{
    currentCount: number;
    maxLimit: number;
    availableSlots: number;
  } | null>(null);
  const { t } = useTranslation('backlog');

  // Only Developers are responsible for sizing; PO/SM cannot set story points.
  const { userRole } = useTeamContext();
  const isDeveloper = userRole === 'DEVELOPER';

  const {
    formData,
    formErrors,
    workflowError,
    setWorkflowError,
    labelTags,
    labelInputValue,
    hasUnsavedChanges,
    handleFormChange,
    handlePriorityChange,
    handleLabelInputChange,
    handleLabelKeyDown,
    removeLabelTag,
  } = useBacklogContext();

  const { validateCapacity, isLimitEnabled, maxItemsPerGoal } = useBacklogCapacityValidation();

  useFocusTrap(isOpen, modalRef);

  // Fetch capacity info when modal opens
  useEffect(() => {
    if (!isOpen || !isLimitEnabled || !activeGoalId) {
      setCapacityInfo(null);
      setCapacityError(null);
      return;
    }

    const fetchCapacityInfo = async () => {
      const result = await validateCapacity(activeGoalId, 0);
      if (result.isValid && result.currentCount !== undefined) {
        setCapacityInfo({
          currentCount: result.currentCount,
          maxLimit: result.maxLimit ?? maxItemsPerGoal,
          availableSlots: result.availableSlots ?? 0,
        });
      }
    };

    void fetchCapacityInfo();
  }, [isOpen, isLimitEnabled, activeGoalId, validateCapacity, maxItemsPerGoal]);

  // Clear capacity error when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCapacityError(null);
    }
  }, [isOpen]);

  // Define all callbacks before any early returns to follow React Hooks rules
  const handleCloseAttempt = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowUnsavedModal(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleUnsavedConfirm = useCallback(() => {
    setShowUnsavedModal(false);
    onClose();
  }, [onClose]);

  const handleUnsavedCancel = useCallback(() => {
    setShowUnsavedModal(false);
  }, []);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      // Only close if clicking the overlay itself, not the modal content
      if (e.target === e.currentTarget) {
        handleCloseAttempt();
      }
    },
    [handleCloseAttempt]
  );

  // Handle form submission with capacity validation
  const handleSubmitWithValidation = useCallback(async () => {
    // Clear previous capacity error
    setCapacityError(null);

    // Validate capacity if limit is enabled
    if (isLimitEnabled && activeGoalId) {
      const result = await validateCapacity(activeGoalId, 1);
      if (!result.isValid) {
        setCapacityError(result.error ?? 'Capacity limit reached');
        return;
      }
    }

    // Proceed with submission
    onSubmit();
  }, [isLimitEnabled, activeGoalId, validateCapacity, onSubmit]);

  // Handle escape key for unsaved changes
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseAttempt();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCloseAttempt]);

  if (!isOpen) return null;

  const handleMoscowKeyDownWrapper = (e: React.KeyboardEvent, currentIndex: number) => {
    handleMoscowKeyDown(e, currentIndex, handlePriorityChange);
  };

  return (
    <>
      <div className={styles['modal-overlay']} onClick={handleOverlayClick}>
        <div
          ref={modalRef}
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-modal-title"
        >
          <div className={styles['modal-header']}>
            <div className={styles['header-content']}>
              <div className={styles['icon-wrapper']} aria-hidden="true">
                <PlusIcon width="28" height="28" />
              </div>
              <h2 id="create-modal-title" className={styles['modal-title']}>
                {t('createItem.createNewBacklogItem') as string}
              </h2>
            </div>
            <button
              className={styles['close-button']}
              onClick={handleCloseAttempt}
              data-modal-close
              aria-label={t('createItem.closeModal') as string}
            >
              <XIcon width="20" height="20" />
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
                    aria-label={t('createItem.closeError') as string}
                  >
                    <XCircleIcon width="14" height="14" />
                  </button>
                </div>
              </div>
            )}
            {capacityError && (
              <div className={styles['modal-error-banner']} role="alert">
                <div className={styles['modal-error-content']}>
                  <span className={styles['modal-error-icon']}>
                    <AlertIcon width="16" height="16" />
                  </span>
                  <span className={styles['modal-error-text']}>{capacityError}</span>
                  <button
                    className={styles['modal-error-close']}
                    onClick={() => setCapacityError(null)}
                    aria-label={t('createItem.closeCapacityError') as string}
                  >
                    <XCircleIcon width="14" height="14" />
                  </button>
                </div>
              </div>
            )}
            {capacityInfo && !capacityError && (
              <div
                className={`${styles['capacity-info']} ${capacityInfo.availableSlots <= 5 ? styles['capacity-warning'] : ''}`}
                aria-live="polite"
              >
                <span className={styles['capacity-info-icon']}>
                  <InfoIcon width="16" height="16" />
                </span>
                <span className={styles['capacity-info-text']}>
                  {capacityInfo.availableSlots === 0
                    ? (t('createItem.capacityReached', {
                        maxLimit: capacityInfo.maxLimit,
                      }) as string)
                    : (t('createItem.capacityAvailable', {
                        currentCount: capacityInfo.currentCount,
                        maxLimit: capacityInfo.maxLimit,
                        availableSlots: capacityInfo.availableSlots,
                        plural: capacityInfo.availableSlots !== 1 ? 's' : '',
                      }) as string)}
                </span>
              </div>
            )}
            <form className={styles['item-form']}>
              <div className={styles['form-legend']}>
                <span className={styles['required-indicator']}>*</span>
                <span className={styles['legend-text']}>
                  {t('createItem.requiredFields') as string}
                </span>
              </div>

              <div className={styles['form-section']}>
                <h3 className={styles['section-title']}>{t('createItem.basicInfo') as string}</h3>

                <div className={styles['form-group']}>
                  <label htmlFor="item-title">
                    {t('createItem.titleLabel') as string}{' '}
                    <span className={styles['required-indicator']}>*</span>
                  </label>
                  <input
                    id="item-title"
                    type="text"
                    placeholder={t('createItem.titlePlaceholder') as string}
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className={formErrors.title ? styles['input-error'] : ''}
                    aria-describedby="title-help title-error"
                    aria-required="true"
                    maxLength={200}
                  />
                  <span id="title-help" className={styles['field-help']}>
                    {t('createItem.titleHelp') as string}
                  </span>
                  {formErrors.title && (
                    <span id="title-error" className={styles['error-text']} role="alert">
                      {formErrors.title}
                    </span>
                  )}
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="item-description">
                    {t('createItem.descriptionLabel') as string}
                  </label>
                  <textarea
                    id="item-description"
                    rows={4}
                    placeholder={t('createItem.descriptionPlaceholder') as string}
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    aria-describedby="description-help"
                  />
                  <span id="description-help" className={styles['field-help']}>
                    {t('createItem.descriptionHelp') as string}
                  </span>
                </div>
              </div>

              <div className={styles['form-section']}>
                <h3 className={styles['section-title']}>
                  {t('createItem.priorityAndValue') as string}
                </h3>

                <div className={styles['form-group']}>
                  <label>
                    {t('createItem.moscowLabel') as string}{' '}
                    <span className={styles['required-indicator']}>*</span>
                  </label>
                  <div
                    className={styles['moscow-selector']}
                    role="radiogroup"
                    aria-label={t('createItem.selectMoscowPriority') as string}
                  >
                    {Object.values(MoSCoWPriority).map((priority, index) => {
                      const config = MOSCOW_CONFIG[priority];
                      const isSelected = formData.moscowPriority === priority;
                      return (
                        <button
                          key={priority}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={isSelected ? 0 : -1}
                          className={`${styles['moscow-option']} ${isSelected ? styles.selected : ''} ${styles[`priority-${priority.toLowerCase().replace('_', '-')}`]}`}
                          onClick={() => handlePriorityChange(priority)}
                          onKeyDown={(e) => handleMoscowKeyDownWrapper(e, index)}
                          style={
                            {
                              '--option-color': config.color,
                              '--option-bg': config.bgColor,
                              '--option-border': config.borderColor,
                            } as React.CSSProperties
                          }
                        >
                          <span className={styles['moscow-icon']} aria-hidden="true">
                            <PathIcon path={config.icon} size={20} />
                          </span>
                          <span className={styles['moscow-content']}>
                            <span className={styles['moscow-label']}>
                              {t(`moscowLabels.${priority}` as const)}
                            </span>
                            <span className={styles['moscow-desc']}>
                              {t(`moscowDescriptions.${priority}` as const)}
                            </span>
                          </span>
                          {isSelected && (
                            <span className={styles['moscow-check']} aria-hidden="true">
                              <CheckIcon width="16" height="16" strokeWidth="3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <span className={styles['field-help']}>
                    {t('createItem.moscowHelp') as string}
                  </span>
                  {formErrors.moscowPriority && (
                    <span className={styles['error-text']} role="alert">
                      {formErrors.moscowPriority}
                    </span>
                  )}
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="business-value">
                    {t('createItem.businessValueLabel') as string}
                  </label>
                  <select
                    id="business-value"
                    value={formData.businessValue ?? ''}
                    onChange={(e) =>
                      handleFormChange(
                        'businessValue',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    aria-describedby="business-value-help"
                  >
                    <option value="">{t('createItem.businessValuePlaceholder') as string}</option>
                    <option value={1}>1 - {t('businessValueOptions.1') as string}</option>
                    <option value={2}>2 - {t('businessValueOptions.2') as string}</option>
                    <option value={3}>3 - {t('businessValueOptions.3') as string}</option>
                    <option value={5}>5 - {t('businessValueOptions.5') as string}</option>
                    <option value={8}>8 - {t('businessValueOptions.8') as string}</option>
                    <option value={13}>13 - {t('businessValueOptions.13') as string}</option>
                  </select>
                  <span id="business-value-help" className={styles['field-help']}>
                    {t('createItem.businessValueHelp') as string}
                  </span>
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="estimate">{t('createItem.storyPointsLabel') as string}</label>
                  <select
                    id="estimate"
                    value={formData.estimate ?? ''}
                    onChange={(e) =>
                      handleFormChange(
                        'estimate',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    disabled={!isDeveloper}
                    aria-describedby={`estimate-help${!isDeveloper ? ' estimate-hint' : ''}`}
                  >
                    <option value="">{t('createItem.storyPointsPlaceholder') as string}</option>
                    <option value={1}>1 - {t('estimateOptions.1') as string}</option>
                    <option value={2}>2 - {t('estimateOptions.2') as string}</option>
                    <option value={3}>3 - {t('estimateOptions.3') as string}</option>
                    <option value={5}>5 - {t('estimateOptions.5') as string}</option>
                    <option value={8}>8 - {t('estimateOptions.8') as string}</option>
                    <option value={13}>13 - {t('estimateOptions.13') as string}</option>
                  </select>
                  <span id="estimate-help" className={styles['field-help']}>
                    {t('createItem.storyPointsHelp') as string}
                  </span>
                  {!isDeveloper && (
                    <span id="estimate-hint" className={styles['field-help-warning']}>
                      {t('createItem.storyPointsDeveloperOnly') as string}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles['form-section']}>
                <h3 className={styles['section-title']}>
                  {t('createItem.moreInformation') as string}
                </h3>

                <div className={styles['form-group']}>
                  <label htmlFor="item-labels">{t('createItem.labelsLabel') as string}</label>
                  <div
                    className={`${styles['tag-input-container']} ${formErrors.labels ? styles['input-error'] : ''}`}
                    onClick={() => document.getElementById('item-labels')?.focus()}
                  >
                    {labelTags.map((tag, index) => (
                      <span key={`${tag}-${index}`} className={styles['tag-item']}>
                        {tag}
                        <button
                          type="button"
                          className={styles['tag-remove']}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLabelTag(tag);
                          }}
                          aria-label={t('createItem.removeLabel', { label: tag }) as string}
                        >
                          <XIcon width="12" height="12" />
                        </button>
                      </span>
                    ))}
                    <input
                      id="item-labels"
                      type="text"
                      placeholder={
                        labelTags.length === 0
                          ? (t('createItem.labelsPlaceholderEmpty') as string)
                          : (t('createItem.labelsPlaceholderMore') as string)
                      }
                      value={labelInputValue}
                      onChange={(e) => handleLabelInputChange(e.target.value)}
                      onKeyDown={handleLabelKeyDown}
                      aria-describedby="labels-help labels-error"
                      disabled={labelTags.length >= 10}
                      className={styles['tag-input']}
                    />
                  </div>
                  {labelTags.length >= 10 && (
                    <span className={`${styles['field-help']} ${styles['field-help-warning']}`}>
                      {t('createItem.labelsMaxReached') as string}
                    </span>
                  )}
                  {formErrors.labels && (
                    <span id="labels-error" className={styles['error-text']} role="alert">
                      {formErrors.labels}
                    </span>
                  )}
                  <span id="labels-help" className={styles['field-help']}>
                    {t('createItem.labelsHelp') as string}
                  </span>
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="acceptance-criteria">
                    {t('createItem.acceptanceCriteriaLabel') as string}
                  </label>
                  <textarea
                    id="acceptance-criteria"
                    rows={4}
                    placeholder={t('createItem.acceptanceCriteriaPlaceholder') as string}
                    value={formData.acceptanceCriteria}
                    onChange={(e) => handleFormChange('acceptanceCriteria', e.target.value)}
                    aria-describedby="criteria-help"
                  />
                  <span id="criteria-help" className={styles['field-help']}>
                    {t('createItem.acceptanceCriteriaHelp') as string}
                  </span>
                </div>
              </div>
            </form>
          </div>
          <div className={styles['modal-footer']}>
            <button
              className={`${styles.button} ${styles['button-secondary']}`}
              onClick={handleCloseAttempt}
              disabled={isSubmitting}
            >
              {t('createItem.cancel') as string}
            </button>
            <button
              className={`${styles.button} ${styles['button-primary']}`}
              onClick={handleSubmitWithValidation}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles['button-spinner']} />
                  {t('createItem.creating') as string}
                </>
              ) : (
                <>
                  <PlusIcon width="18" height="18" />
                  {t('createItem.createItem') as string}
                </>
              )}
            </button>
          </div>
        </div>

        {isSubmitting && (
          <div className={styles['loading-overlay']}>
            <div className={styles['loading-content']}>
              <div className={styles['spinner-ring']} />
              <p>{t('createItem.creatingBacklogItem') as string}</p>
            </div>
          </div>
        )}
      </div>

      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onConfirm={handleUnsavedConfirm}
        onCancel={handleUnsavedCancel}
        title={t('createItem.unsavedTitle') as string}
        message={t('createItem.unsavedMessage') as string}
      />
    </>
  );
};
