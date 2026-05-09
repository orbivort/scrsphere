import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';

import { apiService } from '../../services';
import { useTeamStore, useAuthStore } from '../../store';
import { logger } from '../../utils/logger';
import { TeamSwitcher } from '../../components/TeamSwitcher/TeamSwitcher';
import { UnsavedChangesModal } from '../../components/common/Form/UnsavedChangesModal';
import { useModalFocus, useTimeout } from '../../hooks';
import {
  CloseIcon,
  AlertIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  PlusIcon,
  ChartIcon,
  CheckSquareIcon,
  ZapIcon,
  TargetIcon,
  SparklesIcon,
  UsersIcon,
  RocketIcon,
  ArrowRightIcon,
  LightbulbIcon,
  CrownIcon,
  CodeIcon,
  MailIcon,
  ShieldIcon,
  BriefcaseIcon,
  SearchIcon,
  GridViewIcon,
  ListViewIcon,
  SendIcon,
  UserPlusIcon,
  UserXIcon,
  TrashIcon,
} from '../../components/common/Icons';
import { queryKeys } from '../../hooks/queryKeys';
import type { Team, TeamMember, ApiResponse, TeamMetrics, SprintHistoryItem } from '../../types';

import { MemberCard } from './MemberCard';
import styles from './Team.module.css';

type TeamErrorType = 'no_team' | 'validation_error' | 'not_found' | 'forbidden' | 'unknown';

interface TeamErrorState {
  type: TeamErrorType;
  message: string;
  details?: string;
}

const isInvalidTeamId = (teamId: string | undefined): boolean => {
  if (!teamId) return true;
  const fallbackPatterns = ['team-fallback', 'team-error', 'team-1'];
  return (
    fallbackPatterns.some((pattern) => teamId.includes(pattern)) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId)
  );
};

const parseTeamError = (error: Error | null, teamId: string | undefined): TeamErrorState => {
  if (isInvalidTeamId(teamId)) {
    return {
      type: 'no_team',
      message: "You haven't been invited to a team yet",
      details:
        'Your account is registered but you need to be invited to a team by project administrator before you can access team features.',
    };
  }

  if (!error) {
    return { type: 'unknown', message: 'An unexpected error occurred' };
  }

  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes('422') || errorMessage.includes('validation')) {
    return {
      type: 'validation_error',
      message: 'Team access required',
      details:
        'Your account needs to be associated with a valid team. Please contact project administrator to receive a team invitation.',
    };
  }

  if (errorMessage.includes('404') || errorMessage.includes('not found')) {
    return {
      type: 'not_found',
      message: 'Team not found',
      details: "The team you're looking for doesn't exist or has been deleted.",
    };
  }

  if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
    return {
      type: 'forbidden',
      message: 'Access denied',
      details:
        "You don't have permission to access this team. Please contact your team administrator.",
    };
  }

  return {
    type: 'unknown',
    message: 'Unable to load team',
    details: 'An error occurred while loading team information. Please try again later.',
  };
};

export const TeamManagement: React.FC = () => {
  const { currentTeam, setCurrentTeam, userTeamsWithRoles } = useTeamStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<
    'developer' | 'scrum_master' | 'product_owner'
  >('developer');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [showInviteUnsavedWarning, setShowInviteUnsavedWarning] = useState(false);
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'joined'>('name');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const inviteCancelButtonRef = useRef<HTMLButtonElement>(null);

  const hasInviteUnsavedChanges = newMemberEmail.trim().length > 0 && !inviteSuccess;

  useTimeout(() => setInviteSuccess(null), inviteSuccess ? 5000 : null);
  useTimeout(() => setDeleteSuccess(null), deleteSuccess ? 5000 : null);

  const teamId = currentTeam?.id;

  const isUninvitedUser = !teamId || isInvalidTeamId(teamId);

  const EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  const validateEmail = (email: string): { valid: boolean; error?: string } => {
    if (!email || email.trim() === '') {
      return { valid: false, error: 'Email address is required' };
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }

    if (trimmedEmail.length > 254) {
      return { valid: false, error: 'Email address is too long' };
    }

    return { valid: true };
  };

  const isUserAlreadyMember = (email: string): boolean => {
    if (!team?.members) return false;
    const normalizedEmail = email.trim().toLowerCase();
    return team.members.some((member) => member.user?.email.toLowerCase() === normalizedEmail);
  };

  const canInviteMembers = (): boolean => {
    if (!user || !teamId) return false;
    const userTeam = userTeamsWithRoles.find((t: Team & { userRole: string }) => t.id === teamId);
    const userRole = userTeam?.userRole.toLowerCase();
    return userRole === 'product_owner' || userRole === 'scrum_master';
  };

  const canRemoveMembers = (): boolean => {
    if (!user || !teamId) return false;
    const userTeam = userTeamsWithRoles.find((t: Team & { userRole: string }) => t.id === teamId);
    const userRole = userTeam?.userRole.toLowerCase();
    return userRole === 'product_owner' || userRole === 'scrum_master';
  };

  const canRemoveSpecificMember = (member: TeamMember): boolean => {
    if (!canRemoveMembers()) return false;
    if (!user) return false;
    if (member.userId === user.id) return false;
    return true;
  };

  useEffect(() => {
    if (user) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myTeams.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.team.all });
    }
  }, [user, queryClient]);

  const { data: teamsData, error: teamsError } = useQuery<
    ApiResponse<(Team & { userRole: string })[]>,
    Error
  >({
    queryKey: queryKeys.myTeams.all,
    queryFn: () => apiService.getMyTeams(),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes('404') ||
        errorMessage.includes('403') ||
        errorMessage.includes('422')
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const {
    data: teamData,
    isLoading: teamLoading,
    error: teamQueryError,
    refetch: refetchTeam,
  } = useQuery<ApiResponse<Team>, Error>({
    queryKey: ['team', teamId],
    queryFn: () => {
      if (!teamId || isUninvitedUser) {
        throw new Error('No team available');
      }
      return apiService.getTeam(teamId);
    },
    enabled: !!teamId && !isUninvitedUser,
    retry: (failureCount, error) => {
      if (isUninvitedUser) return false;
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes('404') ||
        errorMessage.includes('403') ||
        errorMessage.includes('422')
      ) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) => {
      if (!teamId || isUninvitedUser) {
        throw new Error('No team available');
      }
      return apiService.addTeamMember(teamId, email, role);
    },
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.team.byId(teamId) });
      setIsInvitingMember(false);
      setNewMemberEmail('');
      setNewMemberRole('developer');
      setInviteError(null);
      const memberName = response.data?.user?.firstName
        ? `${response.data.user.firstName} ${response.data.user.lastName || ''}`.trim()
        : (response.data?.user?.email ?? 'User');
      setInviteSuccess(
        `${memberName} has been successfully added to the team as ${newMemberRole.replace('_', ' ')}`
      );
    },
    onError: (error: Error) => {
      logger.error('Failed to add team member', undefined, { error });
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        setInviteError(
          'No user found with this email address. The user must register first before being added to a team.'
        );
      } else if (
        errorMessage.includes('409') ||
        errorMessage.includes('conflict') ||
        errorMessage.includes('already')
      ) {
        setInviteError('This user is already a member of the team.');
      } else if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        setInviteError(
          'You do not have permission to add team members. Only Product Owners and Scrum Masters can invite members.'
        );
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        setInviteError('Network error. Please check your connection and try again.');
      } else {
        setInviteError('Failed to add team member. Please try again later.');
      }
    },
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) => {
      return apiService.removeTeamMember(teamId, memberId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.team.byId(teamId) });
      setMemberToDelete(null);
      setDeleteError(null);
      setDeleteSuccess('Team member has been successfully removed.');
    },
    onError: (error: Error | AxiosError<ApiResponse<never>>) => {
      logger.error('Failed to remove team member', undefined, { error });

      let errorMessage = 'Failed to remove team member. Please try again later.';

      if (error instanceof AxiosError && error.response?.data) {
        const apiError = error.response.data;
        if (apiError.error?.message) {
          errorMessage = apiError.error.message;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
      } else if (error.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('403') || msg.includes('forbidden')) {
          errorMessage =
            'You do not have permission to remove team members. Only Scrum Masters and Product Owners can remove members.';
        } else if (msg.includes('404') || msg.includes('not found')) {
          errorMessage = 'Team member not found. They may have already been removed.';
        } else if (msg.includes('network') || msg.includes('connection')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      setDeleteError(errorMessage);
    },
  });

  const handleDeleteClick = (member: TeamMember) => {
    setDeleteError(null);
    setMemberToDelete(member);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete || !teamId) return;

    setDeleteError(null);
    await removeTeamMemberMutation.mutateAsync({
      teamId,
      memberId: memberToDelete.id,
    });
  };

  const handleCancelDelete = () => {
    setMemberToDelete(null);
    setDeleteError(null);
  };

  const resetInviteForm = useCallback(() => {
    setIsInvitingMember(false);
    setNewMemberEmail('');
    setNewMemberRole('developer');
    setInviteError(null);
    setShowInviteUnsavedWarning(false);
  }, []);

  const handleCancelInvite = useCallback(() => {
    if (addTeamMemberMutation.isPending || inviteSuccess) {
      return;
    }

    if (hasInviteUnsavedChanges) {
      setShowInviteUnsavedWarning(true);
    } else {
      resetInviteForm();
    }
  }, [addTeamMemberMutation.isPending, inviteSuccess, hasInviteUnsavedChanges, resetInviteForm]);

  const handleInviteUnsavedConfirm = useCallback(() => {
    setShowInviteUnsavedWarning(false);
    resetInviteForm();
  }, [resetInviteForm]);

  const handleInviteUnsavedCancel = useCallback(() => {
    setShowInviteUnsavedWarning(false);
  }, []);

  const { modalRef: deleteModalRef } = useModalFocus({
    isOpen: !!memberToDelete,
    onClose: handleCancelDelete,
    initialFocusRef: cancelButtonRef,
  });

  const { modalRef: inviteModalRef } = useModalFocus({
    isOpen: isInvitingMember,
    onClose: handleCancelInvite,
    initialFocusRef: inviteCancelButtonRef,
  });

  const handleInviteMember = () => {
    setInviteError(null);
    setInviteSuccess(null);
    setIsInvitingMember(true);
  };

  const handleSubmitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    const emailValidation = validateEmail(newMemberEmail);
    if (!emailValidation.valid) {
      setInviteError(emailValidation.error ?? 'Invalid email address');
      return;
    }

    const normalizedEmail = newMemberEmail.trim().toLowerCase();

    if (isUserAlreadyMember(normalizedEmail)) {
      setInviteError('This user is already a member of the team.');
      return;
    }

    await addTeamMemberMutation.mutateAsync({
      email: normalizedEmail,
      role: newMemberRole,
    });
  };

  const teams = teamsData?.success ? teamsData.data : userTeamsWithRoles;

  const computedErrorState = useMemo(() => {
    let errorState: TeamErrorState | null = null;

    if (isUninvitedUser) {
      errorState = parseTeamError(null, teamId);
    } else if (teamsError) {
      errorState = parseTeamError(teamsError, teamId);
    } else if (!teams || teams.length === 0) {
      errorState = parseTeamError(null, teamId);
    } else if (teamQueryError) {
      errorState = parseTeamError(teamQueryError, teamId);
    } else if (teamData && !teamData.success) {
      errorState = {
        type: 'unknown',
        message: teamData.error?.message ?? 'Failed to load team data',
      };
    }

    return errorState;
  }, [teamData, teamQueryError, isUninvitedUser, teamId, teamsError, teams]);

  useEffect(() => {
    if (teamData?.success && teamData.data) {
      setCurrentTeam(teamData.data);
    }
  }, [teamData, setCurrentTeam]);

  const team = teamData?.success ? teamData.data : currentTeam;

  const filteredAndSortedMembers = useMemo(() => {
    if (!team?.members) return [];

    let members = [...team.members];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      members = members.filter((member) => {
        const name = member.user
          ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim().toLowerCase()
          : '';
        const email = member.user?.email.toLowerCase() ?? '';
        return name.includes(query) || email.includes(query);
      });
    }

    if (roleFilter !== 'all') {
      members = members.filter((member) => member.role.toLowerCase() === roleFilter.toLowerCase());
    }

    members.sort((a, b) => {
      switch (sortBy) {
        case 'name': {
          const nameA = a.user
            ? `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim().toLowerCase()
            : '';
          const nameB = b.user
            ? `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim().toLowerCase()
            : '';
          return nameA.localeCompare(nameB);
        }
        case 'role': {
          const roleA = a.role;
          const roleB = b.role;
          return roleA.localeCompare(roleB);
        }
        case 'joined': {
          const dateA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
          const dateB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
          return dateB - dateA;
        }
        default:
          return 0;
      }
    });

    return members;
  }, [team?.members, searchQuery, roleFilter, sortBy]);

  const memberCount = team?.members?.length ?? 0;
  const filteredCount = filteredAndSortedMembers.length;

  const { data: teamMetricsData } = useQuery<ApiResponse<TeamMetrics>, Error>({
    queryKey: ['teamMetrics', teamId],
    queryFn: () => {
      if (!teamId || isUninvitedUser) {
        throw new Error('No team available');
      }
      return apiService.getTeamMetrics(teamId);
    },
    enabled: !!teamId && !isUninvitedUser,
    staleTime: 5 * 60 * 1000,
  });

  const { data: sprintHistoryData } = useQuery<ApiResponse<SprintHistoryItem[]>, Error>({
    queryKey: ['sprintHistory', teamId],
    queryFn: () => {
      if (!teamId || isUninvitedUser) {
        throw new Error('No team available');
      }
      return apiService.getSprintHistory(teamId);
    },
    enabled: !!teamId && !isUninvitedUser,
    staleTime: 5 * 60 * 1000,
  });

  const teamMetrics = teamMetricsData?.success ? teamMetricsData.data : null;
  const sprintHistory = sprintHistoryData?.success ? sprintHistoryData.data : [];

  const completedSprintsCount = (sprintHistory ?? []).filter(
    (s) => s.status === 'COMPLETED'
  ).length;
  const totalStoryPointsCompleted = (sprintHistory ?? [])
    .filter((s) => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + s.completedPoints, 0);
  const avgVelocity = teamMetrics?.averageVelocity ?? 0;
  const sprintSuccessRate = teamMetrics?.successRate ?? 0;

  const isLoading = teamLoading;

  if (computedErrorState) {
    const isNoTeamError =
      computedErrorState.type === 'no_team' || computedErrorState.type === 'validation_error';

    if (isNoTeamError) {
      return (
        <div className={styles['team-management']}>
          <div className={styles['welcome-container']}>
            <div className={styles['welcome-hero']}>
              <div className={styles['welcome-icon']}>
                <SparklesIcon size={80} />
              </div>
              <h1 className={styles['welcome-title']}>
                Welcome to ScrSphere, {user?.firstName ?? 'there'}!
              </h1>
              <p className={styles['welcome-subtitle']}>
                Your agile journey starts here. Choose your path below to get started with your team
                collaboration experience.
              </p>
            </div>

            <div className={styles['role-selection-section']}>
              <h2 className={styles['role-section-title']}>Select Your Role to Continue</h2>

              <div className={styles['role-card-leadership']}>
                <div className={styles['role-card-header']}>
                  <div className={styles['role-icon-leadership']}>
                    <CrownIcon size={24} />
                  </div>
                  <div className={styles['role-badge-leadership']}>Leadership</div>
                </div>
                <h3 className={styles['role-title']}>Scrum Master or Product Owner</h3>
                <p className={styles['role-description']}>
                  As an agile leader, you have the authority to create and manage teams. Take charge
                  of your project&apos;s success by establishing your team workspace.
                </p>
                <div className={styles['role-actions']}>
                  <button
                    className={styles['cta-button-primary']}
                    onClick={() => navigate('/settings/team-management')}
                    type="button"
                  >
                    <BriefcaseIcon size={24} />
                    <span>Create New Team</span>
                    <ArrowRightIcon size={20} />
                  </button>
                </div>
                <div className={styles['role-steps']}>
                  <h4>Quick Start Process:</h4>
                  <div className={styles['steps-indicator']}>
                    <div className={styles['step-item']}>
                      <span className={styles['step-number']}>1</span>
                      <span>Create team</span>
                    </div>
                    <div className={styles['step-arrow']} aria-hidden="true" />
                    <div className={styles['step-item']}>
                      <span className={styles['step-number']}>2</span>
                      <span>Invite members</span>
                    </div>
                    <div className={styles['step-arrow']} aria-hidden="true" />
                    <div className={styles['step-item']}>
                      <span className={styles['step-number']}>3</span>
                      <span>Start sprint</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles['role-card-developer']}>
                <div className={styles['role-card-header']}>
                  <div className={styles['role-icon-developer']}>
                    <CodeIcon size={24} />
                  </div>
                  <div className={styles['role-badge-developer']}>Team Member</div>
                </div>
                <h3 className={styles['role-title']}>Developer</h3>
                <p className={styles['role-description']}>
                  Join an existing Scrum team to collaborate on sprints, track your work, and
                  contribute to agile ceremonies.
                </p>
                <div className={styles['developer-info-box']}>
                  <div className={styles['info-box-header']}>
                    <ShieldIcon size={24} />
                    <h4>How to Join a Team</h4>
                  </div>
                  <ul className={styles['info-box-list']}>
                    <li>
                      <strong>Team invitations are sent by:</strong>
                      <span>Scrum Masters or Product Owners only</span>
                    </li>
                    <li>
                      <strong>Check your notifications:</strong>
                      <span>Look for pending team invitations</span>
                    </li>
                    <li>
                      <strong>Contact your leadership:</strong>
                      <span>Reach out to your Scrum Master or Product Owner</span>
                    </li>
                  </ul>
                  <button
                    className={styles['cta-button-secondary']}
                    onClick={() => navigate('/notifications')}
                    type="button"
                  >
                    <MailIcon size={20} />
                    <span>Check Invitations</span>
                  </button>
                </div>
              </div>
            </div>

            <div className={styles['features-section']}>
              <h3 className={styles['features-title']}>Platform Capabilities</h3>
              <div className={styles['welcome-features']}>
                <div className={styles['feature-card']}>
                  <div className={styles['feature-icon']}>
                    <UsersIcon size={24} />
                  </div>
                  <h4>Team Collaboration</h4>
                  <p>Work together with role-based permissions and real-time updates</p>
                </div>
                <div className={styles['feature-card']}>
                  <div className={styles['feature-icon']}>
                    <ZapIcon size={24} />
                  </div>
                  <h4>Sprint Planning</h4>
                  <p>Plan iterations, estimate stories, and manage your backlog</p>
                </div>
                <div className={styles['feature-card']}>
                  <div className={styles['feature-icon']}>
                    <ChartIcon size={24} />
                  </div>
                  <h4>Progress Tracking</h4>
                  <p>Monitor velocity, burndown charts, and team metrics</p>
                </div>
                <div className={styles['feature-card']}>
                  <div className={styles['feature-icon']}>
                    <RocketIcon size={24} />
                  </div>
                  <h4>Agile Ceremonies</h4>
                  <p>Run daily scrums, retrospectives, and sprint reviews</p>
                </div>
              </div>
            </div>

            <div className={styles['help-section']}>
              <div className={styles['help-icon']}>
                <LightbulbIcon size={20} />
              </div>
              <div className={styles['help-content']}>
                <h4>Need Help Getting Started?</h4>
                <p>
                  If you&apos;re unsure about your role or need assistance, contact your
                  organization administrator or check with your project manager.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles['team-management']}>
        <div className={styles['team-error']} role="alert" aria-live="assertive">
          <div className={styles['team-error-icon']} aria-hidden="true">
            <AlertIcon size={64} />
          </div>
          <h2>{computedErrorState.message}</h2>
          {computedErrorState.details && (
            <p className={styles['team-error-details']}>{computedErrorState.details}</p>
          )}
          <button
            className={`${styles.button} ${styles['button-primary']}`}
            onClick={() => refetchTeam()}
            type="button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles['team-management']}>
        <div className={styles['team-loading']} role="status" aria-live="polite">
          <div className={styles['loading-spinner']} aria-hidden="true" />
          <p>Loading team information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['team-management']} data-testid="team-management">
      <header className={styles['team-header']}>
        <div className={styles['header-left']}>
          <h1 className={styles['page-title']}>
            <span className={styles['page-title-icon']}>
              <UsersIcon size={24} />
            </span>
            Team
          </h1>
          <p className={styles['page-subtitle']}>Manage team members and team standards</p>
        </div>
        <div className={styles['header-right']}>
          <TeamSwitcher />
          {team && <span className={styles['team-id']}>Team ID: {team.id}</span>}
        </div>
      </header>

      {team ? (
        <section className={styles['team-info-card']} aria-labelledby="team-name">
          <div className={styles['team-info-header']}>
            <h2 id="team-name">{team.name}</h2>
            <span className={styles['team-size']}>
              {team.members?.length ?? 0} member{team.members?.length !== 1 ? 's' : ''}
            </span>
          </div>
          {team.description && <p className={styles['team-description']}>{team.description}</p>}
          <div className={styles['team-meta']}>
            <span className={styles['meta-item']}>
              Created: {new Date(team.createdAt).toLocaleDateString()}
            </span>
            <span className={styles['meta-item']}>
              Last updated: {new Date(team.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </section>
      ) : (
        <section className={styles['team-info-card']}>
          <div className={styles['team-info-header']}>
            <h2>Team Information Unavailable</h2>
          </div>
          <p className={styles['team-description']}>
            Unable to load team details. Please try refreshing the page.
          </p>
        </section>
      )}

      <section className={styles['team-members']} aria-labelledby="members-heading">
        <div className={styles['members-header']}>
          <h3 id="members-heading">Team Members</h3>
          {canInviteMembers() && (
            <button
              className={`${styles.button} ${styles['button-primary']}`}
              onClick={handleInviteMember}
              disabled={addTeamMemberMutation.isPending}
              type="button"
            >
              {addTeamMemberMutation.isPending ? (
                'Adding...'
              ) : (
                <>
                  <PlusIcon size={16} /> Invite Member
                </>
              )}
            </button>
          )}
        </div>

        {memberCount > 0 && (
          <div className={styles['members-controls']}>
            <div className={styles['search-container']}>
              <SearchIcon size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles['search-input']}
                aria-label="Search team members"
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles['search-clear']}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <CloseIcon size={14} />
                </button>
              )}
            </div>
            <div className={styles['filter-group']}>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={styles['filter-select']}
                aria-label="Filter by role"
              >
                <option value="all">All Roles</option>
                <option value="product_owner">Product Owner</option>
                <option value="scrum_master">Scrum Master</option>
                <option value="developer">Developer</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'role' | 'joined')}
                className={styles['filter-select']}
                aria-label="Sort members by"
              >
                <option value="name">Sort by Name</option>
                <option value="role">Sort by Role</option>
                <option value="joined">Sort by Joined</option>
              </select>
              <div className={styles['view-toggle']} role="group" aria-label="View mode">
                <button
                  type="button"
                  className={`${styles['view-toggle-btn']} ${viewMode === 'card' ? styles.active : ''}`}
                  onClick={() => setViewMode('card')}
                  aria-pressed={viewMode === 'card'}
                  aria-label="Card view"
                >
                  <GridViewIcon size={18} />
                </button>
                <button
                  type="button"
                  className={`${styles['view-toggle-btn']} ${viewMode === 'list' ? styles.active : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  aria-label="List view"
                >
                  <ListViewIcon size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {searchQuery || roleFilter !== 'all' ? (
          <div className={styles['filter-results']} role="status" aria-live="polite">
            Showing {filteredCount} of {memberCount} member{memberCount !== 1 ? 's' : ''}
            {searchQuery && (
              <button
                type="button"
                className={styles['clear-filters']}
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : null}

        {filteredAndSortedMembers.length > 0 ? (
          <div
            className={`${styles['members-list']} ${viewMode === 'list' ? styles['list-view'] : ''}`}
            role="list"
          >
            {deleteSuccess && (
              <div className={styles['delete-success']} role="status" aria-live="polite">
                <span className={styles['success-icon']} aria-hidden="true">
                  <CheckCircleIcon size={20} />
                </span>
                <span>{deleteSuccess}</span>
              </div>
            )}
            {filteredAndSortedMembers.map((member: TeamMember) => (
              <MemberCard
                key={member.id}
                member={member}
                canRemove={canRemoveSpecificMember(member)}
                onDelete={handleDeleteClick}
                isDeleting={removeTeamMemberMutation.isPending}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : memberCount > 0 ? (
          <div className={styles['no-results']} role="status">
            <p>No members match your search criteria.</p>
            <button
              type="button"
              className={styles['clear-filters-btn']}
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
              }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className={styles['members-empty']} role="status">
            <p>No team members found.</p>
            {canInviteMembers() && (
              <button
                className={`${styles.button} ${styles['button-primary']}`}
                onClick={handleInviteMember}
                disabled={addTeamMemberMutation.isPending}
                type="button"
              >
                {addTeamMemberMutation.isPending ? 'Adding...' : 'Add First Member'}
              </button>
            )}
          </div>
        )}
      </section>

      <section className={styles['team-stats']} aria-label="Team Statistics">
        <div className={styles['stat-card']}>
          <div className={styles['stat-icon']} aria-hidden="true">
            <ChartIcon size={24} />
          </div>
          <div className={styles['stat-content']}>
            <div className={styles['stat-value']}>{completedSprintsCount}</div>
            <div className={styles['stat-label']}>Completed Sprints</div>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-icon']} aria-hidden="true">
            <CheckSquareIcon size={24} />
          </div>
          <div className={styles['stat-content']}>
            <div className={styles['stat-value']}>{totalStoryPointsCompleted}</div>
            <div className={styles['stat-label']}>Story Points Completed</div>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-icon']} aria-hidden="true">
            <ZapIcon size={24} />
          </div>
          <div className={styles['stat-content']}>
            <div className={styles['stat-value']}>{avgVelocity.toFixed(1)}</div>
            <div className={styles['stat-label']}>Avg Velocity</div>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-icon']} aria-hidden="true">
            <TargetIcon size={24} />
          </div>
          <div className={styles['stat-content']}>
            <div className={styles['stat-value']}>{sprintSuccessRate}%</div>
            <div className={styles['stat-label']}>Sprint Success Rate</div>
          </div>
        </div>
      </section>

      {memberToDelete && (
        <div className={styles['modal-overlay']} role="presentation">
          <div
            className={styles['modal']}
            ref={deleteModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <header className={styles['modal-header']}>
              <span className={styles['modal-header-icon']} aria-hidden="true">
                <UserXIcon size={24} />
              </span>
              <h3 id="delete-modal-title">Remove Team Member</h3>
            </header>
            <div className={styles['modal-body']}>
              {deleteError && (
                <div className={styles['delete-error']} role="alert">
                  <span className={styles['error-icon']} aria-hidden="true">
                    <AlertCircleIcon size={20} />
                  </span>
                  <span>{deleteError}</span>
                </div>
              )}
              {!deleteError && (
                <>
                  <p>
                    Are you sure you want to remove{' '}
                    <strong>
                      {memberToDelete.user?.firstName} {memberToDelete.user?.lastName}
                    </strong>{' '}
                    from the team?
                  </p>
                  <p className={styles['modal-warning']}>
                    This action cannot be undone. The user will lose access to all team resources.
                  </p>
                </>
              )}
            </div>
            <footer className={styles['modal-actions']}>
              <button
                ref={cancelButtonRef}
                type="button"
                className={`${styles.button} ${styles['button-secondary']}`}
                onClick={handleCancelDelete}
                disabled={removeTeamMemberMutation.isPending}
              >
                {deleteError ? 'Close' : 'Cancel'}
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles['button-danger']}`}
                onClick={handleConfirmDelete}
                disabled={removeTeamMemberMutation.isPending || !!deleteError}
              >
                {removeTeamMemberMutation.isPending ? (
                  'Removing...'
                ) : (
                  <>
                    <TrashIcon size={16} />
                    Remove Member
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}

      {isInvitingMember && (
        <div
          className={styles['modal-overlay']}
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && handleCancelInvite()}
        >
          <div
            className={styles['modal']}
            ref={inviteModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-modal-title"
          >
            <header className={styles['modal-header']}>
              <span className={styles['modal-header-icon']} aria-hidden="true">
                <UserPlusIcon size={24} />
              </span>
              <h3 id="invite-modal-title">Invite Team Member</h3>
            </header>
            <div className={styles['modal-body']}>
              {inviteError && (
                <div className={styles['invite-error']} role="alert">
                  <span className={styles['error-icon']} aria-hidden="true">
                    <AlertCircleIcon size={20} />
                  </span>
                  <span>{inviteError}</span>
                </div>
              )}
              {inviteSuccess && (
                <div className={styles['invite-success']} role="status">
                  <span className={styles['success-icon']} aria-hidden="true">
                    <CheckCircleIcon size={20} />
                  </span>
                  <span>{inviteSuccess}</span>
                </div>
              )}
              <form onSubmit={handleSubmitInvite} id="invite-form">
                <div className={styles['form-row']}>
                  <div className={styles['form-group']}>
                    <label htmlFor="member-email" className={styles['form-label']}>
                      Email Address
                    </label>
                    <input
                      id="member-email"
                      type="email"
                      placeholder="Enter email address"
                      value={newMemberEmail}
                      onChange={(e) => {
                        setNewMemberEmail(e.target.value);
                        setInviteError(null);
                      }}
                      required
                      aria-describedby={inviteError ? 'email-error' : undefined}
                      className={`${styles['email-input']} ${inviteError ? styles['input-error'] : ''}`}
                      disabled={addTeamMemberMutation.isPending}
                    />
                  </div>
                  <div className={styles['form-group']}>
                    <label htmlFor="member-role" className={styles['form-label']}>
                      Role
                    </label>
                    <select
                      id="member-role"
                      value={newMemberRole}
                      onChange={(e) =>
                        setNewMemberRole(
                          e.target.value as 'developer' | 'scrum_master' | 'product_owner'
                        )
                      }
                      className={styles['role-select']}
                      disabled={addTeamMemberMutation.isPending}
                    >
                      <option value="developer">Developer</option>
                      <option value="scrum_master">Scrum Master</option>
                      <option value="product_owner">Product Owner</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <footer className={styles['modal-actions']}>
              <button
                ref={inviteCancelButtonRef}
                type="button"
                className={`${styles.button} ${styles['button-secondary']}`}
                onClick={handleCancelInvite}
                disabled={addTeamMemberMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="invite-form"
                className={`${styles.button} ${styles['button-primary']}`}
                disabled={addTeamMemberMutation.isPending}
              >
                {addTeamMemberMutation.isPending ? (
                  'Adding...'
                ) : (
                  <>
                    <SendIcon size={16} /> Send Invite
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}

      <UnsavedChangesModal
        isOpen={showInviteUnsavedWarning}
        onConfirm={handleInviteUnsavedConfirm}
        onCancel={handleInviteUnsavedCancel}
        title="Unsent Invitation"
        message="You have an unsent team invitation. Are you sure you want to discard it?"
      />
    </div>
  );
};
