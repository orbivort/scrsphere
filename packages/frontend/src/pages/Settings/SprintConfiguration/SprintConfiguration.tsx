import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '@scrumooth/shared';

import { apiService } from '../../../services';
import { useTeamStore } from '../../../store';
import {
  SprintDuration as SprintDurationEnum,
  SprintStatus,
  type SprintConfiguration as SprintConfigType,
  type SprintDuration,
} from '../../../types';
import { EmptyState } from '../../../components/EmptyState';
import { queryKeys } from '../../../hooks/queryKeys';
import { useMutationErrorHandler } from '../../../hooks/useMutationErrorHandler';
import { TOAST_SUCCESS_DURATION, TOAST_DURATION } from '../../../utils/constants';
import {
  SettingsIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardIcon,
  CalendarIcon,
  CalendarRangeIcon,
  SearchIcon,
  TrashIcon,
  AlertTriangleIcon,
  XIcon,
  RunningIcon,
  SaveIcon,
  PlayIcon,
  RocketIcon,
} from '../../../components/common/Icons';

import styles from './SprintConfiguration.module.css';

import { useI18nStore } from '@/i18n/useI18nStore';

const DURATION_I18N_KEYS: Record<
  SprintDuration,
  {
    label: string;
    description: string;
    icon: 'CalendarIcon' | 'CalendarRangeIcon';
    days: number;
    shortLabel: string;
    offset: number;
  }
> = {
  [SprintDurationEnum.ONE_WEEK]: {
    label: 'sprintConfiguration.durationOptions.oneWeek',
    description: 'sprintConfiguration.durationOptions.oneWeekDescription',
    icon: 'CalendarIcon',
    days: 7,
    shortLabel: '1w',
    offset: 1,
  },
  [SprintDurationEnum.TWO_WEEKS]: {
    label: 'sprintConfiguration.durationOptions.twoWeeks',
    description: 'sprintConfiguration.durationOptions.twoWeeksDescription',
    icon: 'CalendarIcon',
    days: 14,
    shortLabel: '2w',
    offset: 2,
  },
  [SprintDurationEnum.THREE_WEEKS]: {
    label: 'sprintConfiguration.durationOptions.threeWeeks',
    description: 'sprintConfiguration.durationOptions.threeWeeksDescription',
    icon: 'CalendarRangeIcon',
    days: 21,
    shortLabel: '3w',
    offset: 2,
  },
  [SprintDurationEnum.FOUR_WEEKS]: {
    label: 'sprintConfiguration.durationOptions.fourWeeks',
    description: 'sprintConfiguration.durationOptions.fourWeeksDescription',
    icon: 'CalendarRangeIcon',
    days: 28,
    shortLabel: '4w',
    offset: 3,
  },
};

export const SprintConfiguration: React.FC = () => {
  const { t } = useTranslation('settings');
  const { currentTeam } = useTeamStore();
  const { locale } = useI18nStore();
  const queryClient = useQueryClient();
  const location = useLocation();
  const teamId = currentTeam?.id;
  const { handleMutationError } = useMutationErrorHandler();

  const [selectedDuration, setSelectedDuration] = useState<SprintDuration>(
    SprintDurationEnum.TWO_WEEKS
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: queryKeys.sprintConfiguration.byTeam(teamId),
    queryFn: () => apiService.getSprintConfiguration(teamId ?? ''),
    enabled: !!teamId,
  });

  const { data: sprintsData, isLoading: sprintsLoading } = useQuery({
    queryKey: queryKeys.generatedSprint.byTeam(teamId),
    queryFn: () => apiService.getGeneratedSprints(teamId ?? '', selectedYear),
    enabled: !!teamId,
  });

  const existingConfig = configData?.data;
  const generatedSprints = sprintsData?.data ?? [];

  useEffect(() => {
    if (existingConfig) {
      setSelectedDuration(existingConfig.duration);
    }
  }, [existingConfig]);

  const previewSprints = useMemo(() => {
    return generateSprintPreview(selectedYear, selectedDuration);
  }, [selectedYear, selectedDuration]);

  const saveConfigMutation = useMutation({
    mutationFn: (config: Partial<SprintConfigType>) => {
      if (existingConfig?.id) {
        return apiService.updateSprintConfiguration(existingConfig.id, config);
      }
      return apiService.createSprintConfiguration(config);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprintConfiguration.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sprintConfiguration.byTeam(teamId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.generatedSprint.byTeam(teamId) });
      setNotification({
        type: 'success',
        message: t('sprintConfiguration.notifications.configurationSaved'),
      });
      setTimeout(() => setNotification(null), TOAST_SUCCESS_DURATION);
    },
    onError: (error: unknown) => {
      const message = handleMutationError(error, {
        operationName: 'save configuration',
      });
      setNotification({
        type: 'error',
        message: t('sprintConfiguration.notifications.configurationSaveFailed', { message }),
      });
      setTimeout(() => setNotification(null), TOAST_DURATION);
    },
  });

  const generateSprintsMutation = useMutation({
    mutationFn: () =>
      apiService.generateSprintsForYear(teamId ?? '', selectedDuration, selectedYear),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.generatedSprint.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.generatedSprint.byTeam(teamId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      setShowPreview(false);
      setNotification({
        type: 'success',
        message: t('sprintConfiguration.notifications.sprintsGenerated'),
      });
      setTimeout(() => setNotification(null), TOAST_SUCCESS_DURATION);
    },
    onError: (error: unknown) => {
      const message = handleMutationError(error, {
        operationName: 'generate sprints',
      });
      setNotification({
        type: 'error',
        message: t('sprintConfiguration.notifications.sprintsGenerateFailed', { message }),
      });
      setTimeout(() => setNotification(null), TOAST_DURATION);
    },
  });

  const deleteSprintMutation = useMutation({
    mutationFn: (sprintId: string) => apiService.deleteGeneratedSprint(sprintId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.generatedSprint.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.generatedSprint.byTeam(teamId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      setShowDeleteConfirm(null);
      setNotification({
        type: 'success',
        message: t('sprintConfiguration.notifications.sprintDeleted'),
      });
      setTimeout(() => setNotification(null), TOAST_SUCCESS_DURATION);
    },
    onError: (error: unknown) => {
      const message = handleMutationError(error, {
        operationName: 'delete sprint',
      });
      setNotification({
        type: 'error',
        message: t('sprintConfiguration.notifications.sprintDeleteFailed', { message }),
      });
      setTimeout(() => setNotification(null), TOAST_DURATION);
    },
  });

  const handleSaveConfiguration = () => {
    saveConfigMutation.mutate({
      teamId,
      duration: selectedDuration,
      year: selectedYear,
      sprintStartDay: 1,
    });
  };

  const handleGenerateSprints = () => {
    setShowPreview(true);
  };

  const handleConfirmGeneration = () => {
    generateSprintsMutation.mutate();
  };

  const handleDeleteSprint = (sprintId: string) => {
    setShowDeleteConfirm(sprintId);
  };

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }, []);

  const getSprintItemClassName = (status: SprintStatus) => {
    const baseClass = styles['sprint-item'];
    switch (status) {
      case SprintStatus.ACTIVE:
        return `${baseClass} ${styles['sprint-item-active']}`;
      case SprintStatus.PLANNED:
        return `${baseClass} ${styles['sprint-item-planned']}`;
      case SprintStatus.COMPLETED:
        return `${baseClass} ${styles['sprint-item-completed']}`;
      default:
        return baseClass;
    }
  };

  const getSprintStatusClassName = (status: SprintStatus) => {
    switch (status) {
      case SprintStatus.ACTIVE:
        return `${styles['sprint-status']} ${styles['sprint-status-active']}`;
      case SprintStatus.PLANNED:
        return `${styles['sprint-status']} ${styles['sprint-status-planned']}`;
      case SprintStatus.COMPLETED:
        return `${styles['sprint-status']} ${styles['sprint-status-completed']}`;
      default:
        return styles['sprint-status'];
    }
  };

  if (!teamId) {
    return <EmptyState type="no-team" variant="full-page" />;
  }

  if (configLoading || sprintsLoading) {
    return (
      <div className={styles['loading-container']}>
        <div className={styles['loading-spinner']} />
        <p className={styles['loading-text']}>{t('sprintConfiguration.loading')}</p>
      </div>
    );
  }

  return (
    <div className={styles['page']} data-testid="sprint-configuration">
      <div className={styles['header']}>
        <div className={styles['header-left']}>
          <h1 className={styles['page-title']}>
            <span className={styles['page-title-icon']}>
              <SettingsIcon />
            </span>
            {t('sprintConfiguration.title')}
          </h1>
          <p className={styles['page-subtitle']}>{t('sprintConfiguration.subtitle')}</p>
        </div>
        {location.state?.from === 'sprint-planning' && (
          <Link to="/sprint-planning" className={styles['return-link']}>
            <span className={styles['return-link-icon']}>
              <ArrowLeftIcon size={16} />
            </span>
            {t('sprintConfiguration.backToSprintPlanning')}
          </Link>
        )}
      </div>

      {notification && (
        <div
          className={`${styles['notification']} ${notification.type === 'success' ? styles['notification-success'] : styles['notification-error']}`}
          role="alert"
          aria-live="polite"
        >
          <span className={styles['notification-icon']}>
            {notification.type === 'success' ? (
              <CheckCircleIcon size={20} />
            ) : (
              <XCircleIcon size={20} />
            )}
          </span>
          <span className={styles['notification-message']}>{notification.message}</span>
          <button
            className={styles['notification-close']}
            onClick={() => setNotification(null)}
            type="button"
            aria-label={t('sprintConfiguration.dismissNotification')}
          >
            <XIcon />
          </button>
        </div>
      )}

      <div id="main-content" className={styles['config-card']} tabIndex={-1}>
        <div className={styles['card-header']}>
          <h2 className={styles['card-header-title']}>
            <span className={styles['card-header-icon']}>
              <ClipboardIcon size={20} />
            </span>
            {t('sprintConfiguration.currentConfiguration')}
          </h2>
          {existingConfig && (
            <span className={styles['config-badge']}>
              {t('sprintConfiguration.configuredFor', { year: existingConfig.year })}
            </span>
          )}
        </div>
        <div className={styles['card-body']}>
          <div className={styles['config-row']}>
            <label className={styles['config-label']}>
              {t('sprintConfiguration.sprintDuration')}
            </label>
            <div className={styles['duration-options']}>
              {(
                [
                  SprintDurationEnum.ONE_WEEK,
                  SprintDurationEnum.TWO_WEEKS,
                  SprintDurationEnum.THREE_WEEKS,
                  SprintDurationEnum.FOUR_WEEKS,
                ] as const
              ).map((duration) => {
                const config = DURATION_I18N_KEYS[duration];
                const IconComponent =
                  config.icon === 'CalendarIcon' ? CalendarIcon : CalendarRangeIcon;
                return (
                  <button
                    key={duration}
                    className={`${styles['duration-button']} ${selectedDuration === duration ? styles['duration-button-active'] : ''}`}
                    onClick={() => setSelectedDuration(duration)}
                    type="button"
                    aria-pressed={selectedDuration === duration}
                  >
                    <span className={styles['duration-button-icon']}>
                      <IconComponent />
                    </span>
                    <span className={styles['duration-button-text']}>
                      {t(config.label as never)}
                    </span>
                    <span className={styles['duration-button-description']}>
                      {t(config.description as never)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles['config-row']}>
            <label className={styles['config-label']}>{t('sprintConfiguration.year')}</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className={styles['year-select']}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className={styles['config-actions']}>
            <button
              className={`${styles['button']} ${styles['button-primary']}`}
              onClick={handleSaveConfiguration}
              disabled={saveConfigMutation.isPending}
              type="button"
            >
              <SaveIcon size={16} />
              {saveConfigMutation.isPending
                ? t('sprintConfiguration.saving')
                : t('sprintConfiguration.saveConfiguration')}
            </button>
            <button
              className={`${styles['button']} ${styles['button-secondary']}`}
              onClick={handleGenerateSprints}
              disabled={!selectedYear || generateSprintsMutation.isPending}
              type="button"
            >
              <PlayIcon size={16} />
              {t('sprintConfiguration.previewAndGenerate')}
            </button>
          </div>
        </div>
      </div>

      {generatedSprints.length > 0 && (
        <div className={styles['sprints-list-card']}>
          <div className={styles['card-header']}>
            <h2 className={styles['card-header-title']}>
              <span className={styles['card-header-icon']}>
                <RunningIcon size={20} />
              </span>
              {t('sprintConfiguration.generatedSprints')}
            </h2>
            <span className={styles['sprint-count']}>
              {t('sprintConfiguration.sprintCount', { count: generatedSprints.length })}
            </span>
          </div>
          <div className={styles['sprints-grid']}>
            {generatedSprints.map((sprint) => (
              <div key={sprint.id} className={getSprintItemClassName(sprint.status)}>
                <div className={styles['sprint-item-header']}>
                  <span className={styles['sprint-name']}>{sprint.name}</span>
                  <span className={getSprintStatusClassName(sprint.status)}>
                    {t(
                      `sprintStatus.${sprint.status.toUpperCase()}` as
                        | 'sprintStatus.ACTIVE'
                        | 'sprintStatus.COMPLETED'
                        | 'sprintStatus.PLANNED'
                        | 'sprintStatus.CANCELLED'
                    )}
                  </span>
                </div>
                <div className={styles['sprint-item-dates']}>
                  <span className={styles['date-range']}>
                    {formatLocaleDate(sprint.startDate, locale)} -{' '}
                    {formatLocaleDate(sprint.endDate, locale)}
                  </span>
                </div>
                <div className={styles['sprint-item-actions']}>
                  {sprint.status === SprintStatus.PLANNED && (
                    <button
                      className={styles['delete-button']}
                      onClick={() => handleDeleteSprint(sprint.id)}
                      title={t('sprintConfiguration.deleteSprintTitle')}
                      type="button"
                      aria-label={t('sprintConfiguration.ariaLabels.deleteSprint', {
                        name: sprint.name,
                      })}
                    >
                      <TrashIcon size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPreview && (
        <div
          className={styles['modal-overlay']}
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
          onClick={() => setShowPreview(false)}
        >
          <div
            className={`${styles['modal']} ${styles['modal-preview']}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles['modal-header']}>
              <h2 id="preview-modal-title" className={styles['modal-header-title']}>
                <span className={styles['modal-header-icon']}>
                  <SearchIcon />
                </span>
                {t('sprintConfiguration.previewModal.title')}
              </h2>
              <button
                className={styles['modal-close']}
                onClick={() => setShowPreview(false)}
                type="button"
                aria-label={t('sprintConfiguration.ariaLabels.closePreviewModal')}
              >
                <XIcon />
              </button>
            </div>
            <div className={styles['modal-body']}>
              <div className={styles['preview-info']}>
                <p className={styles['preview-info-row']}>
                  <span className={styles['preview-info-label']}>
                    {t('sprintConfiguration.previewModal.duration')}
                  </span>{' '}
                  {t(DURATION_I18N_KEYS[selectedDuration].label as never)}
                </p>
                <p className={styles['preview-info-row']}>
                  <span className={styles['preview-info-label']}>
                    {t('sprintConfiguration.previewModal.year')}
                  </span>{' '}
                  {selectedYear}
                </p>
                <p className={styles['preview-info-row']}>
                  <span className={styles['preview-info-label']}>
                    {t('sprintConfiguration.previewModal.sprintsToGenerate')}
                  </span>{' '}
                  {previewSprints.length}
                </p>
              </div>

              <div>
                <h3 className={styles['preview-list-title']}>
                  {t('sprintConfiguration.previewModal.generatedSprints')}
                </h3>
                <div className={styles['preview-sprints']}>
                  {previewSprints.slice(0, 6).map((sprint, index) => (
                    <div key={index} className={styles['preview-sprint-item']}>
                      <span className={styles['preview-sprint-name']}>{sprint.name}</span>
                      <span className={styles['preview-sprint-dates']}>{sprint.dateRange}</span>
                    </div>
                  ))}
                  {previewSprints.length > 6 && (
                    <div className={styles['preview-more']}>
                      {t('sprintConfiguration.previewModal.moreSprints', {
                        count: previewSprints.length - 6,
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles['preview-warning']}>
                <span className={styles['warning-icon']}>
                  <AlertTriangleIcon size={20} />
                </span>
                <p className={styles['warning-text']}>
                  {t('sprintConfiguration.previewModal.warning', {
                    count: previewSprints.length,
                    year: selectedYear,
                  })}
                </p>
              </div>
            </div>
            <div className={styles['modal-footer']}>
              <button
                className={`${styles['button']} ${styles['button-secondary']}`}
                onClick={() => setShowPreview(false)}
                type="button"
              >
                {t('sprintConfiguration.previewModal.cancel')}
              </button>
              <button
                className={`${styles['button']} ${styles['button-primary']}`}
                onClick={handleConfirmGeneration}
                disabled={generateSprintsMutation.isPending}
                type="button"
              >
                <RocketIcon size={16} />
                {generateSprintsMutation.isPending
                  ? t('sprintConfiguration.previewModal.generating')
                  : t('sprintConfiguration.previewModal.generateButton', {
                      count: previewSprints.length,
                    })}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className={styles['modal-overlay']}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div
            className={`${styles['modal']} ${styles['modal-delete']}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles['modal-header']}>
              <h2 id="delete-modal-title" className={styles['modal-header-title']}>
                <span className={styles['modal-header-icon']}>
                  <AlertTriangleIcon size={20} />
                </span>
                {t('sprintConfiguration.deleteModal.title')}
              </h2>
              <button
                className={styles['modal-close']}
                onClick={() => setShowDeleteConfirm(null)}
                type="button"
                aria-label={t('sprintConfiguration.ariaLabels.closeDeleteModal')}
              >
                <XIcon />
              </button>
            </div>
            <div className={styles['modal-body']}>
              <p>{t('sprintConfiguration.deleteModal.confirmation')}</p>
              {generatedSprints.find((s) => s.id === showDeleteConfirm) && (
                <div className={styles['delete-sprint-info']}>
                  <p className={styles['delete-sprint-label']}>
                    {t('sprintConfiguration.deleteModal.sprintToDelete')}
                  </p>
                  <p className={styles['delete-sprint-name']}>
                    {generatedSprints.find((s) => s.id === showDeleteConfirm)?.name}
                  </p>
                  <p className={styles['delete-sprint-dates']}>
                    {formatLocaleDate(
                      generatedSprints.find((s) => s.id === showDeleteConfirm)?.startDate ?? '',
                      locale
                    )}{' '}
                    -{' '}
                    {formatLocaleDate(
                      generatedSprints.find((s) => s.id === showDeleteConfirm)?.endDate ?? '',
                      locale
                    )}
                  </p>
                </div>
              )}
              <p className={styles['warning-text-danger']}>
                {t('sprintConfiguration.deleteModal.cannotUndo')}
              </p>
            </div>
            <div className={styles['modal-footer']}>
              <button
                className={`${styles['button']} ${styles['button-secondary']}`}
                onClick={() => setShowDeleteConfirm(null)}
                type="button"
              >
                {t('sprintConfiguration.deleteModal.cancel')}
              </button>
              <button
                className={`${styles['button']} ${styles['button-danger']}`}
                onClick={() => deleteSprintMutation.mutate(showDeleteConfirm)}
                disabled={deleteSprintMutation.isPending}
                type="button"
              >
                <TrashIcon size={16} />
                {deleteSprintMutation.isPending
                  ? t('sprintConfiguration.deleteModal.deleting')
                  : t('sprintConfiguration.deleteModal.deleteSprint')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Adjusts date to previous Friday if it falls on weekend
 * Mirrors backend's adjustToPreviousFriday logic
 */
function adjustToPreviousFriday(date: Date): Date {
  const adjusted = new Date(date);
  const dayOfWeek = adjusted.getDay();
  if (dayOfWeek === 6) {
    // Saturday -> Friday
    adjusted.setDate(adjusted.getDate() - 1);
  } else if (dayOfWeek === 0) {
    // Sunday -> Friday
    adjusted.setDate(adjusted.getDate() - 2);
  }
  return adjusted;
}

function generateSprintPreview(
  year: number,
  duration: SprintDuration
): Array<{ name: string; dateRange: string }> {
  const sprints: Array<{ name: string; dateRange: string }> = [];
  const shortYear = year.toString().slice(-2);
  const durationConfig = DURATION_I18N_KEYS[duration];
  const weekDuration = durationConfig.days;
  const durationStr = durationConfig.shortLabel;

  const currentDate = new Date(year, 0, 1);

  const dayOfWeek = currentDate.getDay();
  if (dayOfWeek !== 1) {
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    currentDate.setDate(currentDate.getDate() + daysUntilMonday);
  }

  let sprintNumber = 1;

  while (currentDate.getFullYear() <= year) {
    const startDate = new Date(currentDate);
    const rawEndDate = new Date(currentDate);
    rawEndDate.setDate(rawEndDate.getDate() + weekDuration - durationConfig.offset);
    const endDate = adjustToPreviousFriday(rawEndDate);

    if (startDate.getFullYear() > year) break;

    const formattedSprintNum = sprintNumber.toString().padStart(2, '0');
    // Format date as ISO 8601 (YYYY-MM-DD) for unambiguous, sortable sprint names
    const formatDateSimple = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    // Use en-dash (U+2013) as typographically correct range separator
    const dateRange = `${formatDateSimple(startDate)} – ${formatDateSimple(endDate)}`;
    const name = `Sprint-${durationStr}-${shortYear}${formattedSprintNum} (${dateRange})`;

    sprints.push({ name, dateRange });

    currentDate.setDate(currentDate.getDate() + weekDuration);
    sprintNumber++;
  }

  return sprints;
}
