import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios, { type AxiosError } from 'axios';

import { apiService } from '../../services';
import { useToast } from '../../hooks/useToast';
import { useTeamContext } from '../../contexts/TeamContext';
import { useAuthStore } from '../../store';
import { queryKeys } from '../../hooks/queryKeys';
import { IncrementStatus, SprintStatus, type ApiResponse } from '../../types';
import { LoadingState } from '../../components/common/Loading';
import { ToastContainer } from '../../components/common/ToastContainer';
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  PackageIcon,
  PlusIcon,
} from '../../components/common/Icons';

import styles from './IncrementCreate.module.css';

/**
 * IncrementCreate Component
 *
 * A form component for creating new increments. Supports both standalone creation
 * and workflow mode (when coming from sprint completion).
 *
 * Features:
 * - Sprint selection dropdown (standalone mode)
 * - PBI selection with duplication prevention
 * - Auto-delivery in workflow mode
 * - Comprehensive form validation
 *
 * @example
 * // Standalone mode
 * <Route path="/increment/create" element={<IncrementCreate />} />
 *
 * // Workflow mode
 * <Route path="/increment/create?fromSprintComplete=true&sprintId=123" element={<IncrementCreate />} />
 */

// Icons imported from shared library

export const IncrementCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toasts, success, error: showError, removeToast } = useToast();
  const { currentTeam } = useTeamContext();
  const { user } = useAuthStore();

  const fromSprintComplete = searchParams.get('fromSprintComplete') === 'true';
  const urlSprintId = searchParams.get('sprintId') ?? '';
  const teamId = currentTeam?.id ?? '';

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSprintId, setSelectedSprintId] = useState<string>(urlSprintId);
  const [selectedPBIs, setSelectedPBIs] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Workflow state
  const [workflowStep, setWorkflowStep] = useState<
    'creating' | 'delivering' | 'redirecting' | null
  >(fromSprintComplete ? 'creating' : null);

  // Query: Get sprint data (for workflow mode or when sprint is pre-selected)
  const { data: sprintData, isLoading: isLoadingSprint } = useQuery({
    queryKey: ['sprint', selectedSprintId],
    queryFn: () => apiService.getSprint(selectedSprintId),
    enabled: !!selectedSprintId,
  });

  const sprint = sprintData?.data;

  // Query: Get available sprints for dropdown (standalone mode only)
  const { data: sprintsData, isLoading: isLoadingSprints } = useQuery({
    queryKey: ['sprints', teamId],
    queryFn: () => apiService.getSprints(teamId),
    enabled: !!teamId && !fromSprintComplete,
  });

  const availableSprints = useMemo(() => {
    const allSprints = sprintsData?.data ?? [];
    return allSprints.filter((s) => {
      const status = s.status.toLowerCase();
      return status === SprintStatus.ACTIVE || status === SprintStatus.COMPLETED;
    });
  }, [sprintsData]);

  // Query: Get eligible PBIs for the selected sprint
  const {
    data: eligiblePBIsData,
    isLoading: isLoadingPBIs,
    isError: isPBIsError,
  } = useQuery({
    queryKey: ['eligible-pbis', selectedSprintId],
    queryFn: () => apiService.getEligiblePBIsForIncrement(selectedSprintId),
    enabled: !!selectedSprintId,
  });

  const eligiblePBIs = useMemo(() => eligiblePBIsData?.data ?? [], [eligiblePBIsData]);

  // Query: Get existing increments to track PBIs already in increments
  const { data: existingIncrementsData } = useQuery({
    queryKey: ['increments', teamId],
    queryFn: () => apiService.getIncrements(teamId),
    enabled: !!teamId,
  });

  // Memo: Track PBIs already in other increments
  const pbiIdsInIncrements = useMemo(() => {
    const increments = existingIncrementsData?.data ?? [];
    const pbiSet = new Set<string>();
    increments.forEach((increment) => {
      increment.includedPBIs.forEach((pbiId) => pbiSet.add(pbiId));
    });
    return pbiSet;
  }, [existingIncrementsData]);

  // Effect: Auto-populate name/description when sprint data loads in workflow mode
  React.useEffect(() => {
    if (sprint && fromSprintComplete) {
      setName(`${sprint.name} Increment`);
      setDescription(
        `Increment created from ${sprint.name} (${new Date(sprint.startDate).toLocaleDateString()} - ${new Date(sprint.endDate).toLocaleDateString()})`
      );
    }
  }, [sprint, fromSprintComplete]);

  // Effect: Auto-select eligible PBIs that are not already in increments
  React.useEffect(() => {
    if (eligiblePBIs.length > 0) {
      const selectablePBIs = eligiblePBIs.filter((pbi) => !pbiIdsInIncrements.has(pbi.id));
      setSelectedPBIs(selectablePBIs.map((pbi) => pbi.id));
    }
  }, [eligiblePBIs, pbiIdsInIncrements]);

  // Mutation: Create increment
  const createMutation = useMutation({
    mutationFn: () =>
      apiService.createIncrement({
        name,
        description,
        sprintId: selectedSprintId,
        teamId,
        includedPBIs: selectedPBIs,
        totalStoryPoints: summary.storyPoints,
        status: IncrementStatus.DRAFT,
        createdBy: user?.id,
      }),
    onSuccess: async (response) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.increment.all });

      if (fromSprintComplete && response.data?.id) {
        setWorkflowStep('delivering');
        success('Increment created! Delivering increment...');

        try {
          await deliverMutation.mutateAsync(response.data.id);
          setWorkflowStep('redirecting');
          success('Increment delivered! Redirecting to Sprint Review...');

          setTimeout(() => {
            void navigate(`/sprint-review/${selectedSprintId}`);
          }, 1500);
        } catch (_error) {
          setWorkflowStep(null);
          showError(
            'Failed to deliver increment. You can deliver it manually from the increment details page.'
          );
          if (response.data.id) {
            void navigate(
              `/increment/${response.data.id}?fromSprintComplete=true&sprintId=${selectedSprintId}`
            );
          } else {
            void navigate('/increments');
          }
        }
      } else {
        success('Increment created successfully!');
        if (response.data) {
          void navigate(`/increment/${response.data.id}`);
        } else {
          void navigate('/increments');
        }
      }
    },
    onError: (error: Error | AxiosError<ApiResponse<never>>) => {
      setWorkflowStep(null);
      let errorMessage = 'Failed to create increment. Please try again.';

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiResponse<never>>;

        if (axiosError.response?.data.error) {
          const apiError = axiosError.response.data.error;

          // Handle validation errors (422) with field details
          if (apiError.details && apiError.details.length > 0) {
            const fieldErrors = apiError.details.map(
              (detail) => `${detail.field}: ${detail.message}`
            );
            errorMessage = `Validation failed: ${fieldErrors.join('; ')}`;

            // Also update form errors for specific fields
            const newFormErrors: Record<string, string> = {};
            apiError.details.forEach((detail) => {
              if (detail.field === 'name' || detail.field === 'includedPBIs') {
                newFormErrors[detail.field] = detail.message;
              } else if (detail.field === 'sprintId' || detail.field === 'teamId') {
                newFormErrors.pbis = detail.message;
              }
            });
            if (Object.keys(newFormErrors).length > 0) {
              setErrors((prev) => ({ ...prev, ...newFormErrors }));
            }
          } else {
            errorMessage = apiError.message;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError(errorMessage);
    },
  });

  // Mutation: Deliver increment (workflow mode)
  const deliverMutation = useMutation({
    mutationFn: (incrementId: string) =>
      apiService.deliverIncrement(
        incrementId,
        'sprint_review',
        'Delivered via sprint completion workflow'
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.increment.all });
    },
    onError: (error: Error | AxiosError<ApiResponse<never>>) => {
      let errorMessage = 'Failed to deliver increment. Please try again.';

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiResponse<never>>;
        errorMessage = axiosError.response?.data.error?.message ?? errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      showError(errorMessage);
    },
  });

  /**
   * Validates the form fields
   * @returns boolean indicating if form is valid
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!teamId) {
      newErrors.teamId = 'No team selected. Please select a team first.';
    }

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!selectedSprintId) {
      newErrors.sprintId = 'Please select a sprint';
    }

    if (selectedPBIs.length === 0) {
      newErrors.pbis = 'At least one PBI must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      createMutation.mutate();
    }
  };

  /**
   * Handles sprint selection change
   * Clears selected PBIs when sprint changes to prevent cross-sprint selection
   */
  const handleSprintChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSprintId = e.target.value;
    setSelectedSprintId(newSprintId);
    // Clear selected PBIs when sprint changes
    setSelectedPBIs([]);
    if (errors.pbis) {
      setErrors((prev) => ({ ...prev, pbis: '' }));
    }
    if (errors.sprintId) {
      setErrors((prev) => ({ ...prev, sprintId: '' }));
    }
  };

  /**
   * Toggles PBI selection
   * Prevents selection of PBIs already in other increments
   */
  const handlePBIToggle = (pbiId: string) => {
    setSelectedPBIs((prev) =>
      prev.includes(pbiId) ? prev.filter((id) => id !== pbiId) : [...prev, pbiId]
    );

    if (errors.pbis) {
      setErrors((prev) => ({ ...prev, pbis: '' }));
    }
  };

  /**
   * Selects or deselects all eligible PBIs
   * Only affects PBIs not already in other increments
   */
  const handleSelectAllPBIs = () => {
    const selectablePBIs = eligiblePBIs.filter((pbi) => !pbiIdsInIncrements.has(pbi.id));
    if (selectedPBIs.length === selectablePBIs.length) {
      setSelectedPBIs([]);
    } else {
      setSelectedPBIs(selectablePBIs.map((pbi) => pbi.id));
    }
  };

  // Memo: Calculate summary statistics
  const summary = useMemo(() => {
    const selectedPBIItems = eligiblePBIs.filter((pbi) => selectedPBIs.includes(pbi.id));
    const totalStoryPoints = selectedPBIItems.reduce((sum, pbi) => sum + (pbi.storyPoints ?? 0), 0);

    return {
      count: selectedPBIs.length,
      storyPoints: totalStoryPoints,
    };
  }, [selectedPBIs, eligiblePBIs]);

  /**
   * Handles back button navigation
   */
  const handleBack = () => {
    if (fromSprintComplete && selectedSprintId) {
      void navigate(`/sprint-review/${selectedSprintId}`);
    } else {
      void navigate('/increments');
    }
  };

  // Loading state
  if (isLoadingSprint || isLoadingPBIs || isLoadingSprints) {
    return <LoadingState variant="page" label="Loading..." />;
  }

  // Error state
  if (isPBIsError) {
    return (
      <div className={styles['increment-loading']}>
        <AlertCircleIcon size={48} className={styles['error-icon']} />
        <p>Failed to load eligible PBIs</p>
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

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className={styles['increment-create-page']}>
        <div className={styles['detail-header']}>
          <button className={styles['back-button']} onClick={handleBack}>
            <ArrowLeftIcon size={20} />
            <span>{fromSprintComplete ? 'Back to Sprint Review' : 'Back to Increments'}</span>
          </button>
          <div className={styles['header-content']}>
            <div className={styles['header-left']}>
              <h1 className={styles['page-title']}>
                <span className={styles['page-title-icon']}>
                  <PackageIcon size={28} aria-hidden="true" />
                </span>
                Create Increment
              </h1>
            </div>
            {fromSprintComplete && (
              <div className={styles['workflow-indicator']}>
                <span className={styles['workflow-badge']}>Sprint Completion Workflow</span>
                <span className={styles['workflow-step']}>
                  {workflowStep === 'creating'
                    ? 'Step 2 of 4: Create Increment'
                    : workflowStep === 'delivering'
                      ? 'Step 3 of 4: Deliver Increment'
                      : workflowStep === 'redirecting'
                        ? 'Step 4 of 4: Sprint Review'
                        : 'Step 2 of 4: Create Increment'}
                </span>
              </div>
            )}
          </div>
        </div>

        {fromSprintComplete && (
          <div className={styles['workflow-progress']}>
            <div className={styles['progress-steps']}>
              <div className={`${styles['progress-step']} ${styles.completed}`}>
                <span className={styles['step-number']}>
                  <CheckIcon size={12} strokeWidth={3} />
                </span>
                <span className={styles['step-label']}>Sprint Completed</span>
              </div>
              <div
                className={`${styles['progress-step']} ${
                  workflowStep === 'creating'
                    ? styles.active
                    : workflowStep === 'delivering' || workflowStep === 'redirecting'
                      ? styles.completed
                      : ''
                }`}
              >
                <span className={styles['step-number']}>
                  {workflowStep === 'creating' ? (
                    <ClockIcon size={12} />
                  ) : (
                    <CheckIcon size={12} strokeWidth={3} />
                  )}
                </span>
                <span className={styles['step-label']}>
                  {workflowStep === 'creating' ? 'Creating Increment...' : 'Create Increment'}
                </span>
              </div>
              <div
                className={`${styles['progress-step']} ${
                  workflowStep === 'delivering'
                    ? styles.active
                    : workflowStep === 'redirecting'
                      ? styles.completed
                      : ''
                }`}
              >
                <span className={styles['step-number']}>
                  {workflowStep === 'delivering' ? (
                    <ClockIcon size={12} />
                  ) : workflowStep === 'redirecting' ? (
                    <CheckIcon size={12} strokeWidth={3} />
                  ) : (
                    '3'
                  )}
                </span>
                <span className={styles['step-label']}>
                  {workflowStep === 'delivering'
                    ? 'Delivering Increment...'
                    : workflowStep === 'redirecting'
                      ? 'Redirecting...'
                      : 'Deliver Increment'}
                </span>
              </div>
              <div
                className={`${styles['progress-step']} ${
                  workflowStep === 'redirecting' ? styles.active : ''
                }`}
              >
                <span className={styles['step-number']}>
                  {workflowStep === 'redirecting' ? <ClockIcon size={12} /> : '4'}
                </span>
                <span className={styles['step-label']}>Sprint Review</span>
              </div>
            </div>
          </div>
        )}

        <form className={styles['create-form']} onSubmit={handleSubmit}>
          <div className={styles['form-grid']}>
            <div className={styles['left-column']}>
              <div className={styles['detail-card']}>
                <h3>Increment Details</h3>
                <p className={styles['card-subtitle']}>
                  Provide a name and optional description for this increment.
                </p>

                <div className={styles['form-group']}>
                  <label htmlFor="name">
                    Name <span className={styles['required-mark']}>*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) {
                        setErrors((prev) => ({ ...prev, name: '' }));
                      }
                    }}
                    placeholder="e.g., Sprint 5 Increment"
                    className={errors.name ? styles.error : ''}
                    disabled={createMutation.isPending || deliverMutation.isPending}
                  />
                  {errors.name && <span className={styles['error-message']}>{errors.name}</span>}
                </div>

                {!fromSprintComplete && (
                  <div className={styles['form-group']}>
                    <label htmlFor="sprintId">
                      Sprint <span className={styles['required-mark']}>*</span>
                    </label>
                    <select
                      id="sprintId"
                      value={selectedSprintId}
                      onChange={handleSprintChange}
                      className={errors.sprintId ? styles.error : ''}
                      disabled={createMutation.isPending || deliverMutation.isPending}
                    >
                      <option value="">Select a sprint</option>
                      {availableSprints.map((sprint) => (
                        <option key={sprint.id} value={sprint.id}>
                          {sprint.name} ({sprint.status})
                        </option>
                      ))}
                    </select>
                    {errors.sprintId && (
                      <span className={styles['error-message']}>{errors.sprintId}</span>
                    )}
                  </div>
                )}

                <div className={styles['form-group']}>
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this increment includes..."
                    rows={4}
                    disabled={createMutation.isPending || deliverMutation.isPending}
                  />
                </div>
              </div>

              <div className={styles['detail-card']}>
                <div className={styles['card-header-row']}>
                  <h3>
                    Select Product Backlog Items <span className={styles['required-mark']}>*</span>
                  </h3>
                  <div className={styles['header-actions']}>
                    <span className={styles['status-badge']}>{summary.count} selected</span>
                    <button
                      type="button"
                      className={`${styles.button} ${styles['button-secondary']} ${styles['button-small']}`}
                      onClick={handleSelectAllPBIs}
                      disabled={
                        !selectedSprintId ||
                        eligiblePBIs.length === 0 ||
                        createMutation.isPending ||
                        deliverMutation.isPending
                      }
                    >
                      {selectedPBIs.length ===
                      eligiblePBIs.filter((pbi) => !pbiIdsInIncrements.has(pbi.id)).length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>
                </div>
                <p className={styles['card-subtitle']}>
                  Choose the PBIs that are complete and ready to be included in this increment.
                </p>

                {eligiblePBIs.length === 0 ? (
                  <div className={styles['empty-pbis']}>
                    <p>No eligible PBIs found for this sprint.</p>
                    <p>
                      PBIs must be in &quot;Done&quot; status and not already in another increment.
                    </p>
                  </div>
                ) : (
                  <div className={styles['pbi-selection-list']}>
                    {eligiblePBIs.map((pbi) => {
                      const isAlreadyInIncrement = pbiIdsInIncrements.has(pbi.id);
                      return (
                        <div
                          key={pbi.id}
                          className={`${styles['pbi-selection-item']} ${
                            selectedPBIs.includes(pbi.id) ? styles.selected : ''
                          } ${isAlreadyInIncrement ? styles.disabled : ''}`}
                          onClick={() => !isAlreadyInIncrement && handlePBIToggle(pbi.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPBIs.includes(pbi.id)}
                            onChange={() => {}}
                            disabled={
                              isAlreadyInIncrement ||
                              createMutation.isPending ||
                              deliverMutation.isPending
                            }
                          />
                          <div className={styles['pbi-selection-content']}>
                            <div className={styles['pbi-selection-header']}>
                              <span className={styles['pbi-title']}>{pbi.title}</span>
                              <span className={styles['pbi-points']}>
                                {pbi.storyPoints ?? 0} pts
                              </span>
                            </div>
                            {isAlreadyInIncrement && (
                              <span className={styles['already-in-increment']}>
                                Already in an increment
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {errors.pbis && (
                  <div className={styles['form-error']}>
                    <AlertCircleIcon size={16} />
                    <span>{errors.pbis}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles['right-column']}>
              <div className={`${styles['detail-card']} ${styles['summary-card']}`}>
                <h3>Summary</h3>
                <p className={styles['card-subtitle']}>Review your increment before creating.</p>

                <div className={styles['summary-stats']}>
                  <div className={styles['summary-stat']}>
                    <span className={styles['summary-label']}>PBIs Selected</span>
                    <span className={styles['summary-value']}>{summary.count}</span>
                  </div>
                  <div className={styles['summary-stat']}>
                    <span className={styles['summary-label']}>Total Story Points</span>
                    <span className={styles['summary-value']}>{summary.storyPoints}</span>
                  </div>
                </div>

                <div className={styles['form-actions']}>
                  <button
                    type="button"
                    className={`${styles.button} ${styles['button-secondary']}`}
                    onClick={handleBack}
                    disabled={createMutation.isPending || deliverMutation.isPending}
                  >
                    {fromSprintComplete ? 'Skip to Sprint Review' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className={`${styles.button} ${styles['button-primary']}`}
                    disabled={createMutation.isPending || deliverMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <LoadingState variant="spinner" size="sm" label="Creating increment" />
                        <span>Creating...</span>
                      </>
                    ) : deliverMutation.isPending ? (
                      <>
                        <LoadingState variant="spinner" size="sm" label="Delivering increment" />
                        <span>Delivering...</span>
                      </>
                    ) : fromSprintComplete ? (
                      <>
                        <PlusIcon size={16} />
                        <span>Create & Continue</span>
                      </>
                    ) : (
                      <>
                        <PlusIcon size={16} />
                        <span>Create Increment</span>
                      </>
                    )}
                  </button>
                </div>

                {createMutation.isError && (
                  <div className={styles['form-error']}>
                    <AlertCircleIcon size={16} />
                    <div className={styles['error-content']}>
                      {(createMutation.error as AxiosError<ApiResponse<never>>).response?.data.error
                        ?.details ? (
                        <>
                          <strong>Validation failed. Please correct the following errors:</strong>
                          <ul className={styles['error-list']}>
                            {(
                              (createMutation.error as AxiosError<ApiResponse<never>>).response
                                ?.data.error?.details ?? []
                            ).map((detail, index) => (
                              <li key={index}>
                                <strong>{detail.field}:</strong> {detail.message}
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <span>
                          {(createMutation.error as AxiosError<ApiResponse<never>>).response?.data
                            .error?.message ??
                            (createMutation.error instanceof Error
                              ? createMutation.error.message
                              : 'Failed to create increment. Please try again.')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {deliverMutation.isError && (
                  <div className={styles['form-error']}>
                    <AlertCircleIcon size={16} />
                    <span>
                      Failed to deliver increment. You can deliver it manually from the increment
                      details page.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
