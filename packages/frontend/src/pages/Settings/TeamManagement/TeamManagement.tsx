import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { TeamList } from './components/TeamList';
import { TeamSearchBar } from './components/TeamSearchBar';
import { CreateTeamModal } from './components/CreateTeamModal';
import { EditTeamModal } from './components/EditTeamModal';
import { DeleteTeamModal } from './components/DeleteTeamModal';
import styles from './TeamManagement.module.css';

import { BuildingIcon, AlertTriangleIcon, CloseIcon, PlusIcon } from '@/components/common/Icons';
import { useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam } from '@/hooks/useTeamManagement';
import { useToast } from '@/hooks/useToast';
import { useDebounce, useDebounceCallback } from '@/hooks/useDebounce';
import { useTeamContext } from '@/contexts/TeamContext';
import { logger } from '@/utils/logger';
import type {
  Team,
  CreateTeamInput,
  UpdateTeamInput,
  TeamsResponse,
} from '@/types/teamManagement.types';
import { ToastContainer } from '@/components/common/ToastContainer';
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';

const EDIT_DELETE_ROLES = ['PRODUCT_OWNER', 'SCRUM_MASTER'];

const canModifyTeam = (team: Team, userRole: string | null | undefined): boolean => {
  if (!userRole) return false;
  if (!EDIT_DELETE_ROLES.includes(userRole)) return false;
  return team.userRole === userRole;
};

export const TeamManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTeamDefaultName, setCreateTeamDefaultName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [hasProductGoals, setHasProductGoals] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  // Local state for search input to prevent premature submission
  const [searchInput, setSearchInput] = useState(search);
  const { toasts, removeToast, success, error: toastError } = useToast();
  const debouncedSearch = useDebounce(search, 300);
  const { refreshTeams, userRole: currentUserRole } = useTeamContext();

  // Sync local input with URL param when it changes externally
  React.useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const {
    data: teamsData,
    isLoading,
    error,
    refetch,
  } = useTeams({ search: debouncedSearch, page });
  const createTeamMutation = useCreateTeam();
  const updateTeamMutation = useUpdateTeam();
  const deleteTeamMutation = useDeleteTeam();

  const teams = useMemo(
    () => (teamsData?.data as TeamsResponse | undefined)?.teams ?? [],
    [teamsData]
  );
  const pagination = (teamsData?.data as TeamsResponse | undefined)?.pagination ?? {
    totalPages: 0,
    page: 1,
    pageSize: 20,
    totalItems: 0,
  };

  // Edit/Delete permissions are based on role and team membership
  const canUpdateTeam = EDIT_DELETE_ROLES.includes(currentUserRole ?? '');
  const canDeleteTeam = EDIT_DELETE_ROLES.includes(currentUserRole ?? '');

  // Check if user can modify a specific team
  const canEditTeam = useCallback(
    (team: Team): boolean => {
      return canModifyTeam(team, currentUserRole);
    },
    [currentUserRole]
  );

  const canDeleteTeamCheck = useCallback(
    (team: Team): boolean => {
      return canModifyTeam(team, currentUserRole);
    },
    [currentUserRole]
  );

  const handleCreateTeam = useCallback(
    (data: CreateTeamInput) => {
      createTeamMutation.mutate(data, {
        onSuccess: () => {
          setIsCreateModalOpen(false);
          success('Team created successfully');

          // Refresh the team list and header to reflect the new team
          void (async () => {
            try {
              await refreshTeams();
            } catch (refreshErr) {
              logger.error('Failed to refresh team context after creation', undefined, {
                error: refreshErr,
              });
              // Non-critical error - team was created successfully, but warn user
              toastError(
                'Team created, but failed to refresh team list. Please reload the page if needed.'
              );
            }
          })();
        },
        onError: (error: unknown) => {
          const err = error as Error;
          toastError(err.message || 'Failed to create team');
        },
      });
    },
    [createTeamMutation, success, toastError, refreshTeams]
  );

  const handleUpdateTeam = useCallback(
    (id: string, data: UpdateTeamInput) => {
      // Find the team being updated
      const teamToUpdate = teams.find((t: Team) => t.id === id);

      // Check permissions
      if (!teamToUpdate || !canModifyTeam(teamToUpdate, currentUserRole)) {
        setPermissionError('You do not have permission to edit this team.');
        toastError('You do not have permission to edit this team.');
        setIsEditModalOpen(false);
        setSelectedTeam(null);
        return;
      }

      updateTeamMutation.mutate(
        { id, data },
        {
          onSuccess: () => {
            setIsEditModalOpen(false);
            setSelectedTeam(null);
            setPermissionError(null);
            success('Team updated successfully');

            // Refresh the team list and header to reflect the updated team
            void (async () => {
              try {
                await refreshTeams();
              } catch (refreshErr) {
                logger.error('Failed to refresh team context after update', undefined, {
                  error: refreshErr,
                });
                // Non-critical error - team was updated successfully, but warn user
                toastError(
                  'Team updated, but failed to refresh team list. Please reload the page if needed.'
                );
              }
            })();
          },
          onError: (error: unknown) => {
            const err = error as Error;
            toastError(err.message || 'Failed to update team');
          },
        }
      );
    },
    [updateTeamMutation, success, toastError, refreshTeams, teams, currentUserRole]
  );

  const handleDeleteTeam = useCallback(
    (id: string) => {
      // Find the team being deleted
      const teamToDelete = teams.find((t: Team) => t.id === id);

      // Check permissions
      if (!teamToDelete || !canModifyTeam(teamToDelete, currentUserRole)) {
        setPermissionError('You do not have permission to delete this team.');
        toastError('You do not have permission to delete this team.');
        setIsDeleteModalOpen(false);
        setSelectedTeam(null);
        return;
      }

      deleteTeamMutation.mutate(id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setSelectedTeam(null);
          setHasProductGoals(false);
          setDeleteError(null);
          setPermissionError(null);
          success('Team deleted successfully');

          // Refresh the header team info to reflect the deletion
          void (async () => {
            try {
              await refreshTeams();
            } catch (refreshErr) {
              logger.error('Failed to refresh team context after deletion', undefined, {
                error: refreshErr,
              });
              // Non-critical error - team was deleted successfully, but warn user
              toastError(
                'Team deleted, but failed to refresh team list. Please reload the page if needed.'
              );
            }
          })();
        },
        onError: (error: unknown) => {
          const err = error as Error & { response?: { data?: { error?: { message?: string } } } };
          // Extract the actual error message from the backend response
          // Backend returns: { success: false, error: { code: string, message: string } }
          const backendMessage = err.response?.data?.error?.message;
          const errorMessage = backendMessage ?? err.message;

          // Check if the error is due to existing product goals
          if (backendMessage?.includes('Cannot delete team with existing product goals')) {
            setHasProductGoals(true);
            setDeleteError(backendMessage);
          } else if (err.message.includes('Cannot delete team with existing product goals')) {
            setHasProductGoals(true);
            setDeleteError(errorMessage);
          } else {
            setDeleteError(errorMessage);
            toastError(errorMessage);
          }
        },
      });
    },
    [deleteTeamMutation, success, toastError, refreshTeams, teams, currentUserRole]
  );

  const handleEditClick = useCallback(
    (team: Team) => {
      // Check permissions before opening edit modal
      if (!canModifyTeam(team, currentUserRole)) {
        setPermissionError('You do not have permission to edit this team.');
        toastError('You do not have permission to edit this team.');
        return;
      }
      setPermissionError(null);
      setSelectedTeam(team);
      setIsEditModalOpen(true);
    },
    [currentUserRole, toastError]
  );

  const handleDeleteClick = useCallback(
    (team: Team) => {
      // Check permissions before opening delete modal
      if (!canModifyTeam(team, currentUserRole)) {
        setPermissionError('You do not have permission to delete this team.');
        toastError('You do not have permission to delete this team.');
        return;
      }
      setPermissionError(null);
      setSelectedTeam(team);
      setHasProductGoals(team.hasProductGoals ?? false);
      setDeleteError(null);
      setIsDeleteModalOpen(true);
    },
    [currentUserRole, toastError]
  );

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Track debouncing state for visual feedback
  const [isSearchDebouncing, setIsSearchDebouncing] = useState(false);

  // Debounced search submission to prevent premature updates while typing
  const debouncedSetSearchParams = useDebounceCallback((value: string) => {
    setSearchParams({ q: value, page: '1' });
    setIsSearchDebouncing(false);
  }, 500);

  const handleSearchChange = useCallback(
    (value: string) => {
      // Update local input immediately for responsive UI
      setSearchInput(value);
      // Show debouncing indicator
      setIsSearchDebouncing(true);
      // Debounce the actual search submission
      debouncedSetSearchParams(value);
    },
    [debouncedSetSearchParams]
  );

  const handleClearSearch = useCallback(() => {
    setSearchParams({ q: '', page: '1' });
  }, [setSearchParams]);

  const handleOpenCreateModal = useCallback((searchValue?: string) => {
    setCreateTeamDefaultName(searchValue ?? '');
    setIsCreateModalOpen(true);
  }, []);

  const isAnyMutationPending =
    createTeamMutation.isPending || updateTeamMutation.isPending || deleteTeamMutation.isPending;

  return (
    <ErrorBoundary maxRetries={3}>
      <div className={styles.page} data-testid="team-management-settings">
        <a href="#main-content" className={styles['skip-link']}>
          Skip to main content
        </a>
        {permissionError && (
          <div className={styles['permission-banner']} role="alert" aria-live="assertive">
            <span className={styles['permission-banner-icon']}>
              <AlertTriangleIcon size={18} />
            </span>
            <span className={styles['permission-banner-text']}>{permissionError}</span>
            <button
              className={styles['permission-banner-close']}
              onClick={() => setPermissionError(null)}
              aria-label="Dismiss error"
              type="button"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        )}
        <header className={styles.header}>
          <div className={styles['header-left']}>
            <h1 className={styles['page-title']}>
              <span className={styles['page-title-icon']}>
                <BuildingIcon />
              </span>
              Team Management
              {teams.length > 0 && (
                <span className={styles['item-count']}>
                  {teams.length} team{teams.length !== 1 ? 's' : ''}
                </span>
              )}
            </h1>
            <p className={styles['page-subtitle']}>
              Create and manage teams across the organization
            </p>
          </div>
          <div className={styles['header-right']}>
            <button
              className={styles['create-button']}
              onClick={() => handleOpenCreateModal()}
              disabled={isAnyMutationPending}
              type="button"
            >
              <span className={styles['create-button-icon']}>
                <PlusIcon size={16} />
              </span>
              Create Team
            </button>
          </div>
        </header>

        <div id="main-content" className={styles.content} tabIndex={-1}>
          {teams.length > 0 && (
            <TeamSearchBar
              search={searchInput}
              onSearchChange={handleSearchChange}
              isDebouncing={isSearchDebouncing}
            />
          )}

          <TeamList
            teams={teams}
            isLoading={isLoading}
            error={error}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            canEdit={canUpdateTeam}
            canDelete={canDeleteTeam}
            canEditTeam={canEditTeam}
            canDeleteTeam={canDeleteTeamCheck}
            onRetry={handleRetry}
            onCreateTeam={handleOpenCreateModal}
            onClearSearch={handleClearSearch}
            search={search}
          />

          {pagination.totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Pagination" role="navigation">
              <button
                className={styles['pagination-button']}
                onClick={() => setSearchParams({ q: search, page: String(Math.max(1, page - 1)) })}
                disabled={page === 1 || isAnyMutationPending}
                aria-label="Go to previous page"
                aria-disabled={page === 1 || isAnyMutationPending}
                type="button"
              >
                Previous
              </button>
              <span className={styles['pagination-info']} aria-current="page">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                className={styles['pagination-button']}
                onClick={() =>
                  setSearchParams({
                    q: search,
                    page: String(Math.min(pagination.totalPages, page + 1)),
                  })
                }
                disabled={page === pagination.totalPages || isAnyMutationPending}
                aria-label="Go to next page"
                aria-disabled={page === pagination.totalPages || isAnyMutationPending}
                type="button"
              >
                Next
              </button>
            </nav>
          )}
        </div>

        {isCreateModalOpen && (
          <CreateTeamModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreateTeam}
            isSubmitting={createTeamMutation.isPending}
            defaultName={createTeamDefaultName}
          />
        )}

        {isEditModalOpen && selectedTeam && (
          <EditTeamModal
            isOpen={isEditModalOpen}
            team={selectedTeam}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedTeam(null);
            }}
            onSubmit={handleUpdateTeam}
            isSubmitting={updateTeamMutation.isPending}
          />
        )}

        {isDeleteModalOpen && selectedTeam && (
          <DeleteTeamModal
            isOpen={isDeleteModalOpen}
            team={selectedTeam}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedTeam(null);
              setHasProductGoals(false);
              setDeleteError(null);
            }}
            onConfirm={handleDeleteTeam}
            isDeleting={deleteTeamMutation.isPending}
            hasProductGoals={hasProductGoals}
            deleteError={deleteError ?? undefined}
          />
        )}

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </ErrorBoundary>
  );
};
