import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

export const SprintConfiguration: React.FC = () => {
  const { currentTeam } = useTeamStore();
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
    queryFn: () => apiService.getSprintConfiguration(teamId!),
    enabled: !!teamId,
  });

  const { data: sprintsData, isLoading: sprintsLoading } = useQuery({
    queryKey: queryKeys.generatedSprint.byTeam(teamId),
    queryFn: () => apiService.getGeneratedSprints(teamId!, selectedYear),
    enabled: !!teamId,
  });

  const existingConfig = configData?.data;
  const generatedSprints = sprintsData?.data || [];

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
      queryClient.invalidateQueries({ queryKey: queryKeys.sprintConfiguration.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sprintConfiguration.byTeam(teamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.generatedSprint.byTeam(teamId) });
      setNotification({ type: 'success', message: 'Configuration saved successfully!' });
      setTimeout(() => setNotification(null), TOAST_SUCCESS_DURATION);
    },
    onError: (error: unknown) => {
      const message = handleMutationError(error, {
        operationName: 'save configuration',
      });
      setNotification({ type: 'error', message: `Failed to save configuration: ${message}` });
      setTimeout(() => setNotification(null), TOAST_DURATION);
    },
  });

  const generateSprintsMutation = useMutation({
    mutationFn: () => apiService.generateSprintsForYear(teamId!, selectedDuration, selectedYear),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.generatedSprint.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.generatedSprint.byTeam(teamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      setShowPreview(false);
      setNotification({ type: 'success', message: 'Sprints generated successfully!' });
      setTimeout(() => setNotification(null), TOAST_SUCCESS_DURATION);
    },
    onError: (error: unknown) => {
      const message = handleMutationError(error, {
        operationName: 'generate sprints',
      });
      setNotification({ type: 'error', message: `Failed to generate sprints: ${message}` });
      setTimeout(() => setNotification(null), TOAST_DURATION);
    },
  });

  const deleteSprintMutation = useMutation({
    mutationFn: (sprintId: string) => apiService.deleteGeneratedSprint(sprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.generatedSprint.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.generatedSprint.byTeam(teamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      setShowDeleteConfirm(null);
      setNotification({ type: 'success', message: 'Sprint deleted successfully!' });
      setTimeout(() => setNotification(null), TOAST_SUCCESS_DURATION);
    },
    onError: (error: unknown) => {
      const message = handleMutationError(error, {
        operationName: 'delete sprint',
      });
      setNotification({ type: 'error', message: `Failed to delete sprint: ${message}` });
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
        <p className={styles['loading-text']}>Loading configuration...</p>
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
            Sprint Configuration
          </h1>
          <p className={styles['page-subtitle']}>
            Configure sprint duration and automatically generate sprint plans for the year
          </p>
        </div>
        {location.state?.from === 'sprint-planning' && (
          <Link to="/sprint-planning" className={styles['return-link']}>
            <span className={styles['return-link-icon']}>
              <ArrowLeftIcon size={16} />
            </span>
            Back to Sprint Planning
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
            aria-label="Dismiss notification"
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
            Current Configuration
          </h2>
          {existingConfig && (
            <span className={styles['config-badge']}>Configured for {existingConfig.year}</span>
          )}
        </div>
        <div className={styles['card-body']}>
          <div className={styles['config-row']}>
            <label className={styles['config-label']}>Sprint Duration</label>
            <div className={styles['duration-options']}>
              <button
                className={`${styles['duration-button']} ${selectedDuration === SprintDurationEnum.TWO_WEEKS ? styles['duration-button-active'] : ''}`}
                onClick={() => setSelectedDuration(SprintDurationEnum.TWO_WEEKS)}
                type="button"
                aria-pressed={selectedDuration === SprintDurationEnum.TWO_WEEKS}
              >
                <span className={styles['duration-button-icon']}>
                  <CalendarIcon />
                </span>
                <span className={styles['duration-button-text']}>2 Weeks</span>
                <span className={styles['duration-button-description']}>
                  Standard 2-week sprint cycle
                </span>
              </button>
              <button
                className={`${styles['duration-button']} ${selectedDuration === SprintDurationEnum.FOUR_WEEKS ? styles['duration-button-active'] : ''}`}
                onClick={() => setSelectedDuration(SprintDurationEnum.FOUR_WEEKS)}
                type="button"
                aria-pressed={selectedDuration === SprintDurationEnum.FOUR_WEEKS}
              >
                <span className={styles['duration-button-icon']}>
                  <CalendarRangeIcon />
                </span>
                <span className={styles['duration-button-text']}>4 Weeks</span>
                <span className={styles['duration-button-description']}>
                  Extended 4-week sprint cycle
                </span>
              </button>
            </div>
          </div>

          <div className={styles['config-row']}>
            <label className={styles['config-label']}>Year</label>
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
              {saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </button>
            <button
              className={`${styles['button']} ${styles['button-secondary']}`}
              onClick={handleGenerateSprints}
              disabled={!selectedYear || generateSprintsMutation.isPending}
              type="button"
            >
              <PlayIcon size={16} />
              Preview & Generate Sprints
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
              Generated Sprints
            </h2>
            <span className={styles['sprint-count']}>{generatedSprints.length} sprints</span>
          </div>
          <div className={styles['sprints-grid']}>
            {generatedSprints.map((sprint) => (
              <div key={sprint.id} className={getSprintItemClassName(sprint.status)}>
                <div className={styles['sprint-item-header']}>
                  <span className={styles['sprint-name']}>{sprint.name}</span>
                  <span className={getSprintStatusClassName(sprint.status)}>{sprint.status}</span>
                </div>
                <div className={styles['sprint-item-dates']}>
                  <span className={styles['date-range']}>
                    {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                  </span>
                </div>
                <div className={styles['sprint-item-actions']}>
                  {sprint.status === SprintStatus.PLANNED && (
                    <button
                      className={styles['delete-button']}
                      onClick={() => handleDeleteSprint(sprint.id)}
                      title="Delete sprint"
                      type="button"
                      aria-label={`Delete ${sprint.name}`}
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
                Sprint Generation Preview
              </h2>
              <button
                className={styles['modal-close']}
                onClick={() => setShowPreview(false)}
                type="button"
                aria-label="Close preview modal"
              >
                <XIcon />
              </button>
            </div>
            <div className={styles['modal-body']}>
              <div className={styles['preview-info']}>
                <p className={styles['preview-info-row']}>
                  <span className={styles['preview-info-label']}>Duration:</span>{' '}
                  {selectedDuration === SprintDurationEnum.TWO_WEEKS ? '2 Weeks' : '4 Weeks'}
                </p>
                <p className={styles['preview-info-row']}>
                  <span className={styles['preview-info-label']}>Year:</span> {selectedYear}
                </p>
                <p className={styles['preview-info-row']}>
                  <span className={styles['preview-info-label']}>Sprints to Generate:</span>{' '}
                  {previewSprints.length}
                </p>
              </div>

              <div>
                <h3 className={styles['preview-list-title']}>Generated Sprints</h3>
                <div className={styles['preview-sprints']}>
                  {previewSprints.slice(0, 6).map((sprint, index) => (
                    <div key={index} className={styles['preview-sprint-item']}>
                      <span className={styles['preview-sprint-name']}>{sprint.name}</span>
                      <span className={styles['preview-sprint-dates']}>{sprint.dateRange}</span>
                    </div>
                  ))}
                  {previewSprints.length > 6 && (
                    <div className={styles['preview-more']}>
                      ... and {previewSprints.length - 6} more sprints
                    </div>
                  )}
                </div>
              </div>

              <div className={styles['preview-warning']}>
                <span className={styles['warning-icon']}>
                  <AlertTriangleIcon size={20} />
                </span>
                <p className={styles['warning-text']}>
                  This will generate {previewSprints.length} sprints for {selectedYear}. Existing
                  sprints for this year may be affected.
                </p>
              </div>
            </div>
            <div className={styles['modal-footer']}>
              <button
                className={`${styles['button']} ${styles['button-secondary']}`}
                onClick={() => setShowPreview(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={`${styles['button']} ${styles['button-primary']}`}
                onClick={handleConfirmGeneration}
                disabled={generateSprintsMutation.isPending}
                type="button"
              >
                <RocketIcon size={16} />
                {generateSprintsMutation.isPending
                  ? 'Generating...'
                  : `Generate ${previewSprints.length} Sprints`}
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
                Delete Sprint
              </h2>
              <button
                className={styles['modal-close']}
                onClick={() => setShowDeleteConfirm(null)}
                type="button"
                aria-label="Close delete modal"
              >
                <XIcon />
              </button>
            </div>
            <div className={styles['modal-body']}>
              <p>Are you sure you want to delete this sprint?</p>
              {generatedSprints.find((s) => s.id === showDeleteConfirm) && (
                <div className={styles['delete-sprint-info']}>
                  <p className={styles['delete-sprint-label']}>Sprint to delete:</p>
                  <p className={styles['delete-sprint-name']}>
                    {generatedSprints.find((s) => s.id === showDeleteConfirm)?.name}
                  </p>
                  <p className={styles['delete-sprint-dates']}>
                    {formatDate(
                      generatedSprints.find((s) => s.id === showDeleteConfirm)?.startDate || ''
                    )}{' '}
                    -{' '}
                    {formatDate(
                      generatedSprints.find((s) => s.id === showDeleteConfirm)?.endDate || ''
                    )}
                  </p>
                </div>
              )}
              <p className={styles['warning-text-danger']}>This action cannot be undone.</p>
            </div>
            <div className={styles['modal-footer']}>
              <button
                className={`${styles['button']} ${styles['button-secondary']}`}
                onClick={() => setShowDeleteConfirm(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={`${styles['button']} ${styles['button-danger']}`}
                onClick={() => deleteSprintMutation.mutate(showDeleteConfirm)}
                disabled={deleteSprintMutation.isPending}
                type="button"
              >
                <TrashIcon size={16} />
                {deleteSprintMutation.isPending ? 'Deleting...' : 'Delete Sprint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function generateSprintPreview(
  year: number,
  duration: SprintDuration
): Array<{ name: string; dateRange: string }> {
  const sprints: Array<{ name: string; dateRange: string }> = [];
  const shortYear = year.toString().slice(-2);
  const weekDuration = duration === SprintDurationEnum.TWO_WEEKS ? 14 : 28;
  const durationStr = duration === SprintDurationEnum.TWO_WEEKS ? '2w' : '4w';

  const currentDate = new Date(year, 0, 1);

  const dayOfWeek = currentDate.getDay();
  if (dayOfWeek !== 1) {
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    currentDate.setDate(currentDate.getDate() + daysUntilMonday);
  }

  let sprintNumber = 1;

  while (currentDate.getFullYear() <= year) {
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + weekDuration - 3);

    if (startDate.getFullYear() > year) break;

    const formattedSprintNum = sprintNumber.toString().padStart(2, '0');
    const dateRange = `${formatDateSimple(startDate)}-${formatDateSimple(endDate)}`;
    const name = `Sprint-${durationStr}-${shortYear}${formattedSprintNum} (${dateRange})`;

    sprints.push({ name, dateRange });

    currentDate.setDate(currentDate.getDate() + weekDuration);
    sprintNumber++;
  }

  return sprints;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateSimple(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}
