import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { apiService } from '../../services';
import { useTeamStore } from '../../store';
import { logger } from '../../utils/logger';
import { ImpedimentStatus, type Impediment } from '../../types';
import { TeamMemberSelect } from '../../components/TeamMemberSelect/TeamMemberSelect';
import { ToastContainer } from '../../components/common/ToastContainer';
import { useToast } from '../../hooks/useToast';
import { useModalFocus } from '../../hooks/useModalFocus';
import { queryKeys } from '../../hooks/queryKeys';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/common/Loading';
import { UnsavedChangesModal } from '../../components/common/Form/UnsavedChangesModal';
import {
  AlertTriangleIcon,
  SprintIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  SearchIcon,
  CalendarIcon,
  FileTextIcon,
  XIcon,
  PlusIcon,
  ArrowRightIcon,
  SaveIcon,
  TrashIcon,
} from '../../components/common/Icons';

import styles from './Impediments.module.css';

const QUERY_STALE_TIME = 5 * 60 * 1000;
const QUERY_CACHE_TIME = 10 * 60 * 1000;

export const Impediments: React.FC = () => {
  const { currentTeam } = useTeamStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedImpediment, setSelectedImpediment] = useState<Impediment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ownerId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [resolutionInput, setResolutionInput] = useState('');
  const [showResolutionInput, setShowResolutionInput] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const { toasts, success, error: toastError, removeToast } = useToast();

  const teamId = currentTeam?.id;
  const teamMembers = currentTeam?.members ?? [];

  const {
    data: activeSprintData,
    isLoading: isLoadingSprint,
    error: sprintError,
    refetch: refetchActiveSprint,
  } = useQuery({
    queryKey: ['activeSprint', teamId],
    queryFn: () => apiService.getActiveSprint(teamId ?? ''),
    enabled: !!teamId,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_CACHE_TIME,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const activeSprint = activeSprintData?.data;

  const {
    data: impedimentsData,
    isLoading: isLoadingImpediments,
    error: impedimentsError,
    refetch: refetchImpediments,
  } = useQuery({
    queryKey: ['impediments', teamId, activeSprint?.id],
    queryFn: () => apiService.getImpediments(teamId ?? ''),
    enabled: !!teamId,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_CACHE_TIME,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const isLoading = isLoadingSprint || isLoadingImpediments;
  const hasError = sprintError ?? impedimentsError;

  const impedimentIdFromUrl = searchParams.get('id');
  const impedimentFromUrl = useMemo(() => {
    if (impedimentIdFromUrl && impedimentsData?.data) {
      return impedimentsData.data.find((imp) => imp.id === impedimentIdFromUrl) ?? null;
    }
    return null;
  }, [impedimentIdFromUrl, impedimentsData]);

  const effectiveSelectedImpediment = selectedImpediment ?? impedimentFromUrl;

  const createModalFocus = useModalFocus({
    isOpen: showCreateModal,
    onClose: () => setShowCreateModal(false),
  });

  const detailModalFocus = useModalFocus({
    isOpen: !!effectiveSelectedImpediment && !showDeleteConfirm,
    onClose: () => {
      setSelectedImpediment(null);
      setSearchParams({});
    },
  });

  const deleteModalFocus = useModalFocus({
    isOpen: showDeleteConfirm,
    onClose: () => setShowDeleteConfirm(false),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Impediment> }) =>
      apiService.updateImpediment(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.impediment.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dailyUpdate.all });
      success('Impediment updated successfully');
    },
    onError: (
      error: Error & { response?: { status: number; data?: { error?: { message: string } } } }
    ) => {
      logger.error('Failed to update impediment', undefined, { error });
      if (error.response?.status === 400 && error.response.data?.error?.message) {
        const errorMessage = error.response.data.error.message;
        if (errorMessage.includes('teamId')) {
          toastError('Team ID is required. Please select a team first.');
        } else {
          toastError(errorMessage);
        }
      } else {
        toastError('Failed to update impediment. Please try again.');
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Impediment>) => apiService.createImpediment(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.impediment.all });
      setShowCreateModal(false);
      setFormData({ title: '', description: '', ownerId: '' });
      setFormErrors({});
      success('Impediment created successfully');
    },
    onError: (
      error: Error & { response?: { status: number; data?: { error?: { message: string } } } }
    ) => {
      logger.error('Failed to create impediment', undefined, { error });
      if (error.response?.status === 400 && error.response.data?.error?.message) {
        const errorMessage = error.response.data.error.message;
        if (errorMessage.includes('teamId')) {
          setFormErrors({ teamId: errorMessage });
        } else {
          toastError(errorMessage);
        }
      } else {
        toastError('Failed to create impediment. Please try again.');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteImpediment(id, teamId ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.impediment.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dailyUpdate.all });
      setSelectedImpediment(null);
      setSearchParams({});
      success('Impediment deleted successfully');
    },
    onError: (
      error: Error & { response?: { status: number; data?: { error?: { message: string } } } }
    ) => {
      logger.error('Failed to delete impediment', undefined, { error });
      if (error.response?.status === 400 && error.response.data?.error?.message) {
        const errorMessage = error.response.data.error.message;
        if (errorMessage.includes('teamId')) {
          toastError('Team ID is required. Please select a team first.');
        } else {
          toastError(errorMessage);
        }
      } else {
        toastError('Failed to delete impediment. Please try again.');
      }
    },
  });

  const filteredImpediments = useMemo(() => {
    if (!impedimentsData?.data) return [];

    let filtered = impedimentsData.data;

    if (activeSprint?.id) {
      filtered = filtered.filter((imp) => imp.sprintId === activeSprint.id);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((imp) => imp.status === filterStatus);
    }

    return filtered;
  }, [impedimentsData?.data, activeSprint?.id, filterStatus]);

  const sprintImpedimentsStats = useMemo(() => {
    if (!impedimentsData?.data || !activeSprint?.id) {
      return { open: 0, inProgress: 0, resolved: 0, closed: 0 };
    }

    const sprintImpediments = impedimentsData.data.filter(
      (imp) => imp.sprintId === activeSprint.id
    );

    return {
      open: sprintImpediments.filter((i) => i.status === 'OPEN').length,
      inProgress: sprintImpediments.filter((i) => i.status === 'IN_PROGRESS').length,
      resolved: sprintImpediments.filter((i) => i.status === 'RESOLVED').length,
      closed: sprintImpediments.filter((i) => i.status === 'CLOSED').length,
    };
  }, [impedimentsData?.data, activeSprint?.id]);

  const handleRetry = useCallback(() => {
    void refetchActiveSprint();
    void refetchImpediments();
  }, [refetchActiveSprint, refetchImpediments]);

  const getStatusClass = (status: ImpedimentStatus): string => {
    switch (status) {
      case 'OPEN':
        return styles['status-open'] ?? '';
      case 'IN_PROGRESS':
        return styles['status-in-progress'] ?? '';
      case 'RESOLVED':
        return styles['status-resolved'] ?? '';
      case 'CLOSED':
        return styles['status-closed'] ?? '';
      default:
        return styles['status-open'] ?? '';
    }
  };

  const getStatusLabel = (status: ImpedimentStatus): string => {
    switch (status) {
      case 'OPEN':
        return 'Open';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'RESOLVED':
        return 'Resolved';
      case 'CLOSED':
        return 'Closed';
      default:
        return status;
    }
  };

  const handleStatusChange = (impedimentId: string, newStatus: ImpedimentStatus) => {
    if (!teamId) {
      toastError('Team ID is required. Please select a team first.');
      return;
    }

    if (newStatus === 'RESOLVED' && !resolutionInput.trim()) {
      setShowResolutionInput(true);
      return;
    }

    updateMutation.mutate({
      id: impedimentId,
      updates: {
        status: newStatus,
        teamId,
        resolution: newStatus === 'RESOLVED' ? resolutionInput : undefined,
      },
    });
    setShowResolutionInput(false);
    setResolutionInput('');
  };

  const handleStatusSelect = (newStatus: ImpedimentStatus) => {
    const current = effectiveSelectedImpediment;
    if (!current) return;

    const oldStatus = current.status;

    const updatedImpediment = {
      ...current,
      status: newStatus,
    };

    setSelectedImpediment(updatedImpediment);
    setSearchParams({ id: current.id });

    if (newStatus === 'RESOLVED' && !current.resolution) {
      setShowResolutionInput(true);
    } else if (newStatus !== oldStatus) {
      handleStatusChange(current.id, newStatus);
    }
  };

  const handleSelectImpediment = (impediment: Impediment) => {
    setSelectedImpediment(impediment);
    setSearchParams({ id: impediment.id });
  };

  const handleCloseDetail = () => {
    setSelectedImpediment(null);
    setShowResolutionInput(false);
    setResolutionInput('');
    setSearchParams({});
  };

  const handleNavigateToDailyUpdate = (dailyUpdateId: string) => {
    void navigate(`/daily-scrum?highlight=${dailyUpdateId}`);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!teamId) {
      errors.teamId = 'Team ID is required. Please select a team first.';
    }

    if (!activeSprint?.id) {
      errors.sprintId = 'No active sprint found. Please start a sprint first.';
    }

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamId) {
      setFormErrors({ teamId: 'Team ID is required. Please select a team first.' });
      return;
    }

    if (!activeSprint?.id) {
      setFormErrors({ sprintId: 'No active sprint found. Please start a sprint first.' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    createMutation.mutate({
      teamId,
      sprintId: activeSprint.id,
      title: formData.title.trim(),
      description: formData.description.trim(),
      ownerId: formData.ownerId || undefined,
    });
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const hasUnsavedChanges = useCallback(() => {
    const current = formDataRef.current;
    return (
      current.title.trim() !== '' || current.description.trim() !== '' || current.ownerId !== ''
    );
  }, []);

  const handleCloseCreateModal = useCallback(
    (onClose?: () => void) => {
      if (hasUnsavedChanges()) {
        setPendingCloseAction(
          () =>
            onClose ??
            (() => {
              setShowCreateModal(false);
              setFormData({ title: '', description: '', ownerId: '' });
              setFormErrors({});
            })
        );
        setShowUnsavedChangesModal(true);
      } else {
        setShowCreateModal(false);
        setFormData({ title: '', description: '', ownerId: '' });
        setFormErrors({});
        onClose?.();
      }
    },
    [hasUnsavedChanges]
  );

  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedChangesModal(false);
    setFormData({ title: '', description: '', ownerId: '' });
    setFormErrors({});
    if (pendingCloseAction) {
      pendingCloseAction();
    } else {
      setShowCreateModal(false);
    }
    setPendingCloseAction(null);
  }, [pendingCloseAction]);

  const handleCancelDiscard = useCallback(() => {
    setShowUnsavedChangesModal(false);
    setPendingCloseAction(null);
  }, []);

  const getCardClassName = (impediment: Impediment) => {
    const classes = [styles['impediment-card']];
    if (effectiveSelectedImpediment?.id === impediment.id) {
      classes.push(styles['impediment-card-selected']);
    }
    if (impediment.dailyUpdateId) {
      classes.push(styles['impediment-card-from-daily']);
    }
    return classes.join(' ');
  };

  if (!teamId) {
    return <EmptyState type="no-team" variant="full-page" />;
  }

  if (isLoading) {
    return <LoadingState variant="page" label="Loading impediments..." />;
  }

  if (!activeSprint) {
    return <EmptyState type="no-active-sprint" variant="full-page" />;
  }

  if (hasError) {
    const errorMessage = sprintError
      ? 'Failed to load active sprint information. Please try again.'
      : 'Failed to load impediments. Please try again.';

    return (
      <div className={styles.impediments}>
        <div className={styles['empty-state-container']}>
          <div className={styles['empty-state']}>
            <AlertCircleIcon className={`${styles['empty-state-icon']} ${styles['error-icon']}`} />
            <h2>Error Loading Data</h2>
            <p>{errorMessage}</p>
            <button className={`${styles.btn} ${styles['btn-primary']}`} onClick={handleRetry}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.impediments} data-testid="impediments">
      {/* Page Header */}
      <div className={styles['page-header']}>
        <div className={styles['header-content']}>
          <h1 className={styles['page-title']}>
            <AlertTriangleIcon className={styles['page-title-icon']} />
            Impediments
          </h1>
          <p className={styles['page-subtitle']}>
            {activeSprint.name} • Track and resolve blockers affecting the team
          </p>
        </div>
        <div className={styles['header-actions']}>
          <label htmlFor="filter-status" className={styles['visually-hidden']}>
            Filter by status
          </label>
          <select
            id="filter-status"
            className={styles['filter-select']}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <button
            className={`${styles.btn} ${styles['btn-primary']}`}
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon style={{ width: '16px', height: '16px' }} />
            Report Impediment
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className={styles['stats-section']}>
        <div className={styles['stat-card']}>
          <span className={`${styles['stat-value']} ${styles['stat-value-open']}`}>
            {sprintImpedimentsStats.open}
          </span>
          <span className={styles['stat-label']}>Open</span>
        </div>
        <div className={styles['stat-card']}>
          <span className={`${styles['stat-value']} ${styles['stat-value-in-progress']}`}>
            {sprintImpedimentsStats.inProgress}
          </span>
          <span className={styles['stat-label']}>In Progress</span>
        </div>
        <div className={styles['stat-card']}>
          <span className={`${styles['stat-value']} ${styles['stat-value-resolved']}`}>
            {sprintImpedimentsStats.resolved}
          </span>
          <span className={styles['stat-label']}>Resolved</span>
        </div>
        <div className={styles['stat-card']}>
          <span className={`${styles['stat-value']} ${styles['stat-value-closed']}`}>
            {sprintImpedimentsStats.closed}
          </span>
          <span className={styles['stat-label']}>Closed</span>
        </div>
      </div>

      {/* Impediments List */}
      <div id="impediments-list" className={styles['impediments-list']}>
        {filteredImpediments.length > 0 ? (
          filteredImpediments.map((impediment) => (
            <div
              key={impediment.id}
              className={getCardClassName(impediment)}
              onClick={() => handleSelectImpediment(impediment)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectImpediment(impediment);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View details for impediment: ${impediment.title}. Status: ${getStatusLabel(impediment.status)}`}
            >
              <div className={styles['card-header']}>
                <div className={styles['card-title-row']}>
                  <h3 className={styles['card-title']}>{impediment.title}</h3>
                  <span
                    className={`${styles['status-badge']} ${getStatusClass(impediment.status)}`}
                  >
                    <span className={styles['status-icon']} />
                    {getStatusLabel(impediment.status)}
                  </span>
                </div>
                <div className={styles['card-meta']}>
                  <span className={styles['meta-item']}>
                    <CalendarIcon className={styles['meta-icon']} />
                    {new Date(impediment.createdAt).toLocaleDateString()}
                  </span>
                  {impediment.sprintId && (
                    <span className={styles['meta-item']}>
                      <SprintIcon className={styles['meta-icon']} />
                      Sprint
                    </span>
                  )}
                  {impediment.dailyUpdateId && (
                    <span className={styles['source-badge']} title="Created from Daily Update">
                      <FileTextIcon
                        style={{
                          width: '12px',
                          height: '12px',
                          marginRight: '4px',
                          display: 'inline',
                        }}
                      />
                      From Daily Scrum
                    </span>
                  )}
                </div>
              </div>
              <p className={styles['card-description']}>{impediment.description}</p>
              <div className={styles['card-footer']}>
                <div className={styles['footer-item']}>
                  <span className={styles['footer-label']}>Reported by</span>
                  <span className={styles['footer-value']}>
                    {impediment.reportedBy?.firstName && impediment.reportedBy.lastName
                      ? `${impediment.reportedBy.firstName} ${impediment.reportedBy.lastName}`
                      : (impediment.reportedBy?.email ?? 'Unknown')}
                  </span>
                </div>
                {impediment.owner && (
                  <div className={styles['footer-item']}>
                    <span className={styles['footer-label']}>Owner</span>
                    <span className={styles['footer-value']}>
                      {impediment.owner.firstName && impediment.owner.lastName
                        ? `${impediment.owner.firstName} ${impediment.owner.lastName}`
                        : impediment.owner.email || 'Unknown'}
                    </span>
                  </div>
                )}
              </div>
              {impediment.resolution && (
                <div className={styles['resolution-section']}>
                  <h4 className={styles['resolution-label']}>Resolution</h4>
                  <p className={styles['resolution-text']}>{impediment.resolution}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className={styles['no-impediments']}>
            <div className={styles['empty-state']}>
              {filterStatus === 'all' ? (
                <CheckCircleIcon
                  className={`${styles['empty-state-icon']} ${styles['success-icon']}`}
                />
              ) : (
                <SearchIcon className={`${styles['empty-state-icon']} ${styles['info-icon']}`} />
              )}
              <h3>
                {filterStatus === 'all'
                  ? `No Impediments for ${activeSprint.name || 'Active Sprint'}`
                  : `No ${getStatusLabel(filterStatus as ImpedimentStatus)} Impediments`}
              </h3>
              <p>
                {filterStatus === 'all'
                  ? `Great! No impediments reported for the current active sprint "${activeSprint.name || 'Unknown'}.`
                  : `There are no ${getStatusLabel(filterStatus as ImpedimentStatus).toLowerCase()} impediments in "${activeSprint.name || 'Unknown'}. Try selecting a different status filter.`}
              </p>
              {filterStatus !== 'all' && (
                <button
                  className={`${styles.btn} ${styles['btn-secondary']}`}
                  onClick={() => setFilterStatus('all')}
                  style={{ marginBottom: '12px' }}
                >
                  Clear Filter
                </button>
              )}
              <button
                className={`${styles.btn} ${styles['btn-primary']}`}
                onClick={() => setShowCreateModal(true)}
              >
                <PlusIcon style={{ width: '16px', height: '16px' }} />
                Report Impediment
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className={styles['modal-overlay']}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-modal-title"
          onClick={() => handleCloseCreateModal()}
        >
          <div
            ref={createModalFocus.modalRef}
            className={`${styles.modal} ${styles['modal-create']}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles['modal-header']}>
              <div className={styles['modal-header-content']}>
                <div className={styles['modal-icon-wrapper']} aria-hidden="true">
                  <AlertTriangleIcon className={styles['modal-icon']} />
                </div>
                <h2 id="create-modal-title" className={styles['modal-title']}>
                  Report New Impediment
                </h2>
                <p className={styles['modal-subtitle']}>
                  Document blockers affecting your team&apos;s progress
                </p>
              </div>
              <button
                className={styles['modal-close']}
                onClick={() => handleCloseCreateModal()}
                aria-label="Close modal"
              >
                <XIcon className={styles['modal-close-icon']} />
              </button>
            </div>
            <div className={styles['modal-body']}>
              <form className={styles.form} onSubmit={handleCreateSubmit}>
                <div className={styles['form-group']}>
                  <label
                    htmlFor="impediment-sprint"
                    className={`${styles['form-label']} ${styles['form-label-required']}`}
                  >
                    Sprint
                  </label>
                  <div
                    id="impediment-sprint"
                    className={`${styles['team-display']} ${formErrors.sprintId ? styles['team-display-error'] : ''}`}
                    aria-invalid={!!formErrors.sprintId}
                    aria-describedby={formErrors.sprintId ? 'sprint-error' : undefined}
                  >
                    <span className={styles['team-name']}>{activeSprint.name} (Active)</span>
                  </div>
                  {formErrors.sprintId && (
                    <span id="sprint-error" className={styles['form-error-message']} role="alert">
                      {formErrors.sprintId}
                    </span>
                  )}
                </div>
                <div className={styles['form-group']}>
                  <label
                    htmlFor="impediment-title"
                    className={`${styles['form-label']} ${styles['form-label-required']}`}
                  >
                    Title
                  </label>
                  <input
                    id="impediment-title"
                    type="text"
                    className={`${styles['form-input']} ${formErrors.title ? styles['form-input-error'] : ''}`}
                    placeholder="Brief description of the impediment"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    aria-required="true"
                    aria-invalid={!!formErrors.title}
                    aria-describedby={formErrors.title ? 'title-error' : undefined}
                  />
                  {formErrors.title && (
                    <span id="title-error" className={styles['form-error-message']} role="alert">
                      {formErrors.title}
                    </span>
                  )}
                </div>
                <div className={styles['form-group']}>
                  <label
                    htmlFor="impediment-description"
                    className={`${styles['form-label']} ${styles['form-label-required']}`}
                  >
                    Description
                  </label>
                  <textarea
                    id="impediment-description"
                    className={`${styles['form-textarea']} ${formErrors.description ? styles['form-textarea-error'] : ''}`}
                    rows={4}
                    placeholder="Provide details about the impediment"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    aria-required="true"
                    aria-invalid={!!formErrors.description}
                    aria-describedby={formErrors.description ? 'description-error' : undefined}
                  />
                  {formErrors.description && (
                    <span
                      id="description-error"
                      className={styles['form-error-message']}
                      role="alert"
                    >
                      {formErrors.description}
                    </span>
                  )}
                </div>
                <div className={styles['form-row']}>
                  <TeamMemberSelect
                    value={formData.ownerId}
                    onChange={(value) => handleInputChange('ownerId', value)}
                    teamMembers={teamMembers}
                    disabled={createMutation.isPending}
                  />
                </div>
              </form>
            </div>
            <div className={styles['modal-footer']}>
              <button
                className={`${styles.btn} ${styles['btn-secondary']}`}
                onClick={() => handleCloseCreateModal()}
              >
                Cancel
              </button>
              <button
                className={`${styles.btn} ${styles['btn-primary']}`}
                onClick={handleCreateSubmit}
                disabled={createMutation.isPending}
                aria-busy={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <span className={styles['btn-spinner']} aria-hidden="true" />
                    Creating...
                  </>
                ) : (
                  <>
                    <SaveIcon style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                    Create Impediment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {effectiveSelectedImpediment && (
        <div
          className={styles['modal-overlay']}
          onClick={handleCloseDetail}
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
        >
          <div
            ref={detailModalFocus.modalRef}
            className={`${styles.modal} ${styles['modal-detail']}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles['modal-header']}>
              <div className={styles['modal-header-content']}>
                <div className={styles['modal-icon-wrapper']} aria-hidden="true">
                  <FileTextIcon className={styles['modal-icon']} />
                </div>
                <h2 id="detail-modal-title" className={styles['modal-title']}>
                  Impediment Details
                </h2>
                <p className={styles['modal-subtitle']}>View and manage impediment information</p>
              </div>
              <button
                className={styles['modal-close']}
                onClick={handleCloseDetail}
                aria-label="Close modal"
              >
                <XIcon className={styles['modal-close-icon']} />
              </button>
            </div>
            <div className={styles['modal-body']}>
              {effectiveSelectedImpediment.dailyUpdateId &&
                effectiveSelectedImpediment.dailyUpdate && (
                  <div className={styles['source-context-section']}>
                    <div className={styles['source-context-banner']}>
                      <FileTextIcon className={styles['source-icon']} />
                      <div className={styles['source-info']}>
                        <span className={styles['source-label']}>
                          Created from Daily Scrum Update
                        </span>
                        <span className={styles['source-date']}>
                          by {effectiveSelectedImpediment.dailyUpdate.user?.firstName}{' '}
                          {effectiveSelectedImpediment.dailyUpdate.user?.lastName} on{' '}
                          {new Date(
                            effectiveSelectedImpediment.dailyUpdate.updateDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        className={styles['view-source-btn']}
                        onClick={() =>
                          handleNavigateToDailyUpdate(
                            effectiveSelectedImpediment.dailyUpdateId ?? ''
                          )
                        }
                      >
                        View Daily Update
                        <ArrowRightIcon
                          style={{
                            width: '14px',
                            height: '14px',
                            marginLeft: '4px',
                            display: 'inline',
                          }}
                        />
                      </button>
                    </div>
                  </div>
                )}
              <div className={styles['detail-section']}>
                <label className={styles['detail-label']}>
                  <FileTextIcon className={styles['detail-label-icon']} />
                  Title
                </label>
                <p className={styles['detail-value']}>{effectiveSelectedImpediment.title}</p>
              </div>
              <div className={styles['detail-section']}>
                <label className={styles['detail-label']}>
                  <FileTextIcon className={styles['detail-label-icon']} />
                  Description
                </label>
                <p className={styles['detail-value']}>{effectiveSelectedImpediment.description}</p>
              </div>
              {effectiveSelectedImpediment.sprint && (
                <div className={styles['detail-section']}>
                  <label className={styles['detail-label']}>
                    <SprintIcon className={styles['detail-label-icon']} />
                    Sprint
                  </label>
                  <p className={styles['detail-value']}>
                    {effectiveSelectedImpediment.sprint.name}
                  </p>
                </div>
              )}
              <div className={styles['detail-section']}>
                <label htmlFor="impediment-status" className={styles['detail-label']}>
                  <AlertCircleIcon className={styles['detail-label-icon']} />
                  Status
                </label>
                <select
                  id="impediment-status"
                  className={styles['status-select']}
                  value={effectiveSelectedImpediment.status}
                  onChange={(e) => {
                    handleStatusSelect(e.target.value as ImpedimentStatus);
                  }}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              {showResolutionInput && !effectiveSelectedImpediment.resolution && (
                <div className={styles['detail-section']}>
                  <label
                    htmlFor="impediment-resolution"
                    className={`${styles['detail-label']} ${styles['form-label-required']}`}
                  >
                    <CheckCircleIcon className={styles['detail-label-icon']} />
                    Resolution
                  </label>
                  <textarea
                    id="impediment-resolution"
                    className={styles['resolution-input']}
                    rows={3}
                    placeholder="Describe how this impediment was resolved..."
                    value={resolutionInput}
                    onChange={(e) => setResolutionInput(e.target.value)}
                    aria-required="true"
                  />
                  <div className={styles['resolution-actions']}>
                    <button
                      className={`${styles.btn} ${styles['btn-secondary']}`}
                      onClick={() => {
                        setShowResolutionInput(false);
                        setResolutionInput('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className={`${styles.btn} ${styles['btn-primary']}`}
                      onClick={() =>
                        handleStatusChange(
                          effectiveSelectedImpediment.id,
                          ImpedimentStatus.RESOLVED
                        )
                      }
                      disabled={updateMutation.isPending || !resolutionInput.trim()}
                    >
                      {updateMutation.isPending ? (
                        <>
                          <span className={styles['btn-spinner']} aria-hidden="true" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <SaveIcon style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                          Save Resolution
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {effectiveSelectedImpediment.resolution && (
                <div className={styles['detail-section']}>
                  <label className={styles['detail-label']}>
                    <CheckCircleIcon className={styles['detail-label-icon']} />
                    Resolution
                  </label>
                  <div className={styles['detail-card']}>
                    <p className={styles['detail-card-text']}>
                      {effectiveSelectedImpediment.resolution}
                    </p>
                  </div>
                </div>
              )}
              <div className={styles['detail-section']}>
                <label className={styles['detail-label']}>
                  <AlertCircleIcon className={styles['detail-label-icon']} />
                  Reported by
                </label>
                <p className={styles['detail-value']}>
                  {effectiveSelectedImpediment.reportedBy?.firstName &&
                  effectiveSelectedImpediment.reportedBy.lastName
                    ? `${effectiveSelectedImpediment.reportedBy.firstName} ${effectiveSelectedImpediment.reportedBy.lastName}`
                    : (effectiveSelectedImpediment.reportedBy?.email ?? 'Unknown')}
                </p>
              </div>
              {effectiveSelectedImpediment.owner && (
                <div className={styles['detail-section']}>
                  <label className={styles['detail-label']}>
                    <AlertCircleIcon className={styles['detail-label-icon']} />
                    Owner
                  </label>
                  <p className={styles['detail-value']}>
                    {effectiveSelectedImpediment.owner.firstName &&
                    effectiveSelectedImpediment.owner.lastName
                      ? `${effectiveSelectedImpediment.owner.firstName} ${effectiveSelectedImpediment.owner.lastName}`
                      : effectiveSelectedImpediment.owner.email || 'Unknown'}
                  </p>
                </div>
              )}
              <div className={styles['detail-section']}>
                <label className={styles['detail-label']}>
                  <CalendarIcon className={styles['detail-label-icon']} />
                  Created
                </label>
                <p className={styles['detail-value']}>
                  {new Date(effectiveSelectedImpediment.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className={styles['modal-footer']}>
              <button
                className={`${styles.btn} ${styles['btn-danger']}`}
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <LoadingState variant="spinner" size="sm" label="Deleting impediment" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon style={{ width: '16px', height: '16px' }} />
                    Delete
                  </>
                )}
              </button>
              <button
                className={`${styles.btn} ${styles['btn-secondary']}`}
                onClick={handleCloseDetail}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && effectiveSelectedImpediment && (
        <div
          className={styles['modal-overlay']}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          aria-describedby="delete-desc"
        >
          <div
            ref={deleteModalFocus.modalRef}
            className={`${styles.modal} ${styles['modal-delete']}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative gradient orb - danger theme */}
            <div className={styles['gradient-orb-danger']} aria-hidden="true" />

            {/* Modal Header */}
            <header className={styles['modal-header']}>
              <div className={styles['modal-header-content']}>
                <div className={styles['icon-wrapper-danger']} aria-hidden="true">
                  <AlertTriangleIcon className={styles['modal-icon']} />
                </div>
                <h2 id="delete-title" className={styles['modal-title']}>
                  Delete Impediment
                </h2>
                <p className={styles['modal-subtitle']}>
                  This action is permanent and cannot be undone
                </p>
              </div>
              <button
                className={styles['modal-close']}
                onClick={() => setShowDeleteConfirm(false)}
                aria-label="Close modal"
                type="button"
              >
                <XIcon className={styles['modal-close-icon']} />
              </button>
            </header>

            {/* Modal Body */}
            <div className={styles['modal-body']}>
              {/* Warning Card */}
              <div className={styles['warning-card']}>
                <div className={styles['warning-header']}>
                  <div className={styles['warning-icon-large']} aria-hidden="true">
                    <AlertTriangleIcon />
                  </div>
                  <div className={styles['warning-title-group']}>
                    <h3 className={styles['warning-title']}>Action Warning</h3>
                    <p className={styles['warning-subtitle']}>
                      Item:{' '}
                      <strong>
                        &ldquo;{effectiveSelectedImpediment.title || 'Unknown Item'}&rdquo;
                      </strong>
                    </p>
                  </div>
                </div>

                <div className={styles['warning-content']}>
                  <p className={styles['delete-warning-text']}>
                    You are about to permanently delete this impediment. This action{' '}
                    <strong>cannot be undone</strong>. All associated data will be permanently
                    removed.
                  </p>

                  {/* Impact Alert */}
                  <div className={styles['impact-alert']}>
                    <span className={styles['impact-icon']} aria-hidden="true">
                      <AlertCircleIcon />
                    </span>
                    <span className={styles['impact-text']}>
                      Status:{' '}
                      <strong
                        className={`${styles['status-badge-inline']} ${styles[`status-badge-${effectiveSelectedImpediment.status.toLowerCase().replace('_', '-')}`] ?? styles['status-badge-open']}`}
                      >
                        {effectiveSelectedImpediment.status.replace('_', ' ') || 'OPEN'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className={styles['modal-footer']}>
              <button
                type="button"
                className={`${styles.btn} ${styles['btn-secondary']}`}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles['btn-danger']}`}
                onClick={() => {
                  deleteMutation.mutate(effectiveSelectedImpediment.id);
                  setShowDeleteConfirm(false);
                }}
                disabled={deleteMutation.isPending}
                aria-busy={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <span className={styles['btn-spinner']} aria-hidden="true" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon style={{ width: '14px', height: '14px' }} />
                    Delete Impediment
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        onConfirm={handleDiscardChanges}
        onCancel={handleCancelDiscard}
        title="Unsaved Changes"
        message="You have unsaved changes in the impediment form. Are you sure you want to discard them?"
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default Impediments;
