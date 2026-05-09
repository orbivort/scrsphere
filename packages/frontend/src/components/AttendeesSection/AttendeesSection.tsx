import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';

import styles from './AttendeesSection.module.css';

import {
  UsersIcon,
  PlusIcon,
  ClipboardListIcon,
  UserPlusIcon,
  UserEditIcon,
  CheckIcon,
  XIcon,
  EditIcon,
  TrashIcon,
  InboxIcon,
} from '@/components/common/Icons';

// ============================================
// Type Definitions
// ============================================

export interface Attendee {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  role: string;
  attended: boolean;
}

export interface TeamMember {
  id: string;
  userId?: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  role?: string;
}

export type AttendeeFilter = 'all' | 'team' | 'guests';
export type AttendanceStatus = 'attended' | 'absent';

export interface AttendeeFormData {
  name: string;
  email?: string;
  role: string;
  attended: boolean;
}

export interface ApiConfig {
  addAttendee: (data: AttendeeFormData) => Promise<unknown>;
  updateAttendee: (id: string, data: AttendeeFormData) => Promise<unknown>;
  deleteAttendee: (id: string) => Promise<unknown>;
}

export interface AttendeesSectionProps {
  /** Unique identifier for the parent entity (sprint review or retrospective) */
  entityId: string;
  /** Sprint ID for cache invalidation */
  sprintId: string;
  /** List of attendees */
  attendees: Attendee[];
  /** List of team members for unmarked section */
  teamMembers: TeamMember[];
  /** Whether the entity is completed (disables editing) */
  isCompleted: boolean;
  /** API configuration for attendee operations */
  apiConfig: ApiConfig;
  /** React Query key for cache invalidation */
  queryKey: string[];
  /** Default role for new attendees */
  defaultRole?: string;
  /** Callback when toggling attendance status */
  onToggleAttendance: (attendeeId: string, attended: boolean) => void;
  /** Callback when adding a team member */
  onAddTeamMember: (member: TeamMember, attended: boolean) => void;
  /** Loading state for add operation */
  isAdding?: boolean;
  /** Loading state for update operation */
  isUpdating?: boolean;
  /** Optional className for custom styling */
  className?: string;
}

// ============================================
// Constants
// ============================================

const ROLE_OPTIONS = [
  { value: 'product_owner', label: 'Product Owner' },
  { value: 'scrum_master', label: 'Scrum Master' },
  { value: 'developer', label: 'Developer' },
  { value: 'stakeholder', label: 'Stakeholder' },
];

// ============================================
// Utility Functions
// ============================================

const getInitials = (name: string): string => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatRole = (role: string): string => {
  return role.replace(/_/g, ' ').toLowerCase();
};

// ============================================
// Sub-components
// ============================================

interface FilterTabsProps {
  filter: AttendeeFilter;
  onFilterChange: (filter: AttendeeFilter) => void;
  counts: {
    all: number;
    team: number;
    guests: number;
  };
}

const FilterTabs: React.FC<FilterTabsProps> = ({ filter, onFilterChange, counts }) => {
  const filters: { key: AttendeeFilter; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'team', label: `Team (${counts.team})` },
    { key: 'guests', label: `Guests (${counts.guests})` },
  ];

  return (
    <div className={styles['filter-tabs']} role="radiogroup" aria-label="Filter attendees by type">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          role="radio"
          aria-checked={filter === key}
          className={`${styles['filter-tab']} ${filter === key ? styles.active : ''}`}
          onClick={() => onFilterChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

interface UnmarkedSectionProps {
  members: TeamMember[];
  isAdding: boolean;
  isCompleted: boolean;
  onAddMember: (member: TeamMember, attended: boolean) => void;
}

const UnmarkedSection: React.FC<UnmarkedSectionProps> = ({
  members,
  isAdding,
  isCompleted,
  onAddMember,
}) => {
  if (members.length === 0 || isCompleted) return null;

  return (
    <div className={styles['unmarked-section']}>
      <div className={styles['unmarked-header']}>
        <ClipboardListIcon className={styles['unmarked-icon']} />
        <span className={styles['unmarked-title']}>
          Team members not yet marked ({members.length})
        </span>
      </div>
      <div className={styles['unmarked-list']}>
        {members.map((member) => {
          const name = `${member.user?.firstName ?? ''} ${member.user?.lastName ?? ''}`.trim();
          return (
            <div key={member.id} className={styles['unmarked-item']}>
              <div className={styles['member-info']}>
                <span className={styles['member-avatar']}>{getInitials(name)}</span>
                <div className={styles['member-details']}>
                  <span className={styles['member-name']}>{name || 'Unknown'}</span>
                  <span className={styles['member-role']}>{member.role ?? 'Team Member'}</span>
                </div>
              </div>
              <div className={styles['quick-actions']}>
                <button
                  className={`${styles['quick-btn']} ${styles.attended}`}
                  onClick={() => onAddMember(member, true)}
                  disabled={isAdding}
                  title="Mark as attended"
                >
                  <CheckIcon className={styles['quick-btn-icon']} />
                  Attended
                </button>
                <button
                  className={`${styles['quick-btn']} ${styles.absent}`}
                  onClick={() => onAddMember(member, false)}
                  disabled={isAdding}
                  title="Mark as absent"
                >
                  <XIcon className={styles['quick-btn-icon']} />
                  Absent
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface AttendeeCardProps {
  attendee: Attendee;
  isTeamMember: boolean;
  isCompleted: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  onToggleAttendance: (attendeeId: string, attended: boolean) => void;
  onEdit: (attendee: Attendee) => void;
  onDelete: (attendee: Attendee) => void;
}

const AttendeeCard: React.FC<AttendeeCardProps> = ({
  attendee,
  isTeamMember,
  isCompleted,
  isUpdating,
  isDeleting,
  onToggleAttendance,
  onEdit,
  onDelete,
}) => {
  const status: AttendanceStatus = attendee.attended ? 'attended' : 'absent';

  const handleToggleAttendance = useCallback(
    (attended: boolean) => {
      if (isCompleted || isUpdating) return;
      onToggleAttendance(attendee.id, attended);
    },
    [attendee.id, isCompleted, isUpdating, onToggleAttendance]
  );

  return (
    <div className={`${styles['attendee-card']} ${styles[status]}`}>
      <div className={styles['attendee-info']}>
        <span className={styles['attendee-avatar']}>{getInitials(attendee.name)}</span>
        <div className={styles['attendee-details']}>
          <span className={styles['attendee-name']}>{attendee.name}</span>
          <span className={styles['attendee-role']}>{formatRole(attendee.role)}</span>
        </div>
      </div>

      <div className={styles['attendance-controls']}>
        <button
          className={`${styles['status-btn']} ${styles.attended} ${status === 'attended' ? styles.selected : ''}`}
          onClick={() => handleToggleAttendance(true)}
          disabled={isCompleted || isUpdating}
          title="Mark as attended"
          aria-pressed={status === 'attended'}
        >
          <CheckIcon className={styles['status-btn-icon']} />
        </button>
        <button
          className={`${styles['status-btn']} ${styles.absent} ${status === 'absent' ? styles.selected : ''}`}
          onClick={() => handleToggleAttendance(false)}
          disabled={isCompleted || isUpdating}
          title="Mark as absent"
          aria-pressed={status === 'absent'}
        >
          <XIcon className={styles['status-btn-icon']} />
        </button>
      </div>

      {!isCompleted && (
        <>
          <button
            className={`${styles['edit-btn']} ${isTeamMember ? styles['read-only'] : ''}`}
            onClick={() => onEdit(attendee)}
            title={isTeamMember ? 'Team members cannot be edited' : 'Edit attendee'}
            disabled={isTeamMember}
            aria-disabled={isTeamMember}
          >
            <EditIcon className={styles['edit-btn-icon']} />
          </button>

          <button
            className={`${styles['delete-btn']} ${styles.danger}`}
            onClick={() => onDelete(attendee)}
            disabled={isDeleting}
            title="Remove attendee"
          >
            <TrashIcon className={styles['delete-btn-icon']} />
          </button>
        </>
      )}
    </div>
  );
};

interface EmptyStateProps {
  message?: string;
  hint?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No attendees recorded yet.',
  hint = 'Mark team members above or add attendees manually.',
}) => (
  <div className={styles['empty-state']}>
    <InboxIcon className={styles['empty-icon']} />
    <p>{message}</p>
    <p className={styles['empty-hint']}>{hint}</p>
  </div>
);

// ============================================
// Attendee Form Modal Component
// ============================================

interface AttendeeFormProps {
  attendee: Attendee | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  apiConfig: ApiConfig;
  queryKey: string[];
  defaultRole: string;
}

const AttendeeForm: React.FC<AttendeeFormProps> = ({
  attendee,
  isOpen,
  onClose,
  onSuccess,
  apiConfig,
  queryKey,
  defaultRole,
}) => {
  const queryClient = useQueryClient();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!attendee;

  const [formData, setFormData] = useState<AttendeeFormData>({
    name: attendee?.name ?? '',
    email: attendee?.email ?? '',
    role: attendee?.role ?? defaultRole,
    attended: attendee?.attended ?? true,
  });

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    role?: string;
  }>({});

  const addMutation = useMutation({
    mutationFn: apiConfig.addAttendee,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: AttendeeFormData) => {
      if (!attendee) {
        return Promise.reject(new Error('No attendee selected for update'));
      }
      return apiConfig.updateAttendee(attendee.id, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      onSuccess();
    },
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: attendee?.name ?? '',
        email: attendee?.email ?? '',
        role: attendee?.role ?? defaultRole,
        attended: attendee?.attended ?? true,
      });
      setFormErrors({});
      addMutation.reset();
      updateMutation.reset();
      firstInputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, attendee, defaultRole]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const validateForm = useCallback((): boolean => {
    const errors: { name?: string; email?: string; role?: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      errors.name = 'Name must be 100 characters or less';
    }

    if (formData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.role) {
      errors.role = 'Role is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.name, formData.email, formData.role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const submissionData: AttendeeFormData = {
      ...formData,
      email: formData.email?.trim() ?? undefined,
    };

    if (isEditing) {
      updateMutation.mutate(submissionData);
    } else {
      addMutation.mutate(submissionData);
    }
  };

  const isLoading = addMutation.isPending || updateMutation.isPending;
  const error = addMutation.error ?? updateMutation.error;

  if (!isOpen) return null;

  return (
    <div
      className={styles['modal-overlay']}
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendee-form-title"
    >
      <div className={styles['modal-content']}>
        <div className={styles['modal-header']}>
          <div className={styles['modal-header-content']}>
            <div className={styles['modal-icon-wrapper']}>
              {isEditing ? <UserEditIcon /> : <UserPlusIcon />}
            </div>
            <h3 id="attendee-form-title">{isEditing ? 'Edit Attendee' : 'Add Attendee'}</h3>
            <p className={styles['modal-subtitle']}>
              {isEditing
                ? 'Update attendee information for this review'
                : 'Add a new attendee to this review session'}
            </p>
          </div>
          <button
            className={styles['close-button']}
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles['form-group']}>
            <label htmlFor="attendee-name">
              Name <span className={styles.required}>*</span>
            </label>
            <input
              ref={firstInputRef}
              id="attendee-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter attendee name"
              aria-invalid={!!formErrors.name}
              aria-describedby={formErrors.name ? 'name-error' : undefined}
              disabled={isLoading}
            />
            {formErrors.name && (
              <span id="name-error" className={styles['error-message']} role="alert">
                {formErrors.name}
              </span>
            )}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="attendee-email">Email</label>
            <input
              id="attendee-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address (optional)"
              aria-invalid={!!formErrors.email}
              aria-describedby={formErrors.email ? 'email-error' : undefined}
              disabled={isLoading}
            />
            {formErrors.email && (
              <span id="email-error" className={styles['error-message']} role="alert">
                {formErrors.email}
              </span>
            )}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="attendee-role">
              Role <span className={styles.required}>*</span>
            </label>
            <select
              id="attendee-role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              aria-invalid={!!formErrors.role}
              aria-describedby={formErrors.role ? 'role-error' : undefined}
              disabled={isLoading}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {formErrors.role && (
              <span id="role-error" className={styles['error-message']} role="alert">
                {formErrors.role}
              </span>
            )}
          </div>

          <div className={`${styles['form-group']} ${styles.checkbox}`}>
            <label>
              <input
                type="checkbox"
                checked={formData.attended}
                onChange={(e) => setFormData({ ...formData, attended: e.target.checked })}
                disabled={isLoading}
              />
              Attended
            </label>
          </div>

          {error && (
            <div className={styles['api-error']} role="alert">
              Failed to save attendee. Please try again.
            </div>
          )}

          <div className={styles['form-actions']}>
            <button
              type="button"
              className={`${styles.button} ${styles['button-secondary']}`}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles['button-primary']}`}
              disabled={isLoading}
            >
              {isLoading ? (
                'Saving...'
              ) : isEditing ? (
                <>
                  <CheckIcon /> Update
                </>
              ) : (
                <>
                  <PlusIcon /> Add Attendee
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// Main Component
// ============================================

export const AttendeesSection: React.FC<AttendeesSectionProps> = ({
  entityId: _entityId,
  sprintId: _sprintId,
  attendees,
  teamMembers,
  isCompleted,
  apiConfig,
  queryKey,
  defaultRole = 'stakeholder',
  onToggleAttendance,
  onAddTeamMember,
  isAdding = false,
  isUpdating = false,
  className,
}) => {
  const [filter, setFilter] = useState<AttendeeFilter>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState<Attendee | null>(null);
  const [deleteConfirmAttendee, setDeleteConfirmAttendee] = useState<Attendee | null>(null);

  const queryClient = useQueryClient();

  const deleteAttendeeMutation = useMutation({
    mutationFn: (attendeeId: string) => apiConfig.deleteAttendee(attendeeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      setDeleteConfirmAttendee(null);
    },
  });

  // Categorize attendees into team and guests
  const categorizedAttendees = useMemo(() => {
    const team: Attendee[] = [];
    const guests: Attendee[] = [];

    const teamMemberNames = new Set(
      teamMembers.map((m) => `${m.user?.firstName} ${m.user?.lastName}`.toLowerCase().trim())
    );
    const teamMemberEmails = new Set(
      teamMembers.map((m) => m.user?.email?.toLowerCase()).filter(Boolean)
    );

    attendees.forEach((attendee) => {
      const isTeamMember =
        (attendee.email && teamMemberEmails.has(attendee.email.toLowerCase())) ??
        teamMemberNames.has(attendee.name.toLowerCase());

      if (isTeamMember) {
        team.push(attendee);
      } else {
        guests.push(attendee);
      }
    });

    // Find unmarked team members
    const markedNames = new Set(attendees.map((a) => a.name.toLowerCase()));
    const markedEmails = new Set(attendees.map((a) => a.email?.toLowerCase()).filter(Boolean));

    const unmarked = teamMembers.filter((member) => {
      const name = `${member.user?.firstName} ${member.user?.lastName}`.toLowerCase().trim();
      const email = member.user?.email?.toLowerCase();
      return !markedNames.has(name) && (!email || !markedEmails.has(email));
    });

    return {
      teamAttendees: team,
      guestAttendees: guests,
      unmarkedTeamMembers: unmarked,
    };
  }, [attendees, teamMembers]);

  const { teamAttendees, guestAttendees, unmarkedTeamMembers } = categorizedAttendees;

  // Filter attendees based on selected filter
  const filteredAttendees = useMemo(() => {
    switch (filter) {
      case 'team':
        return teamAttendees;
      case 'guests':
        return guestAttendees;
      default:
        return [...teamAttendees, ...guestAttendees];
    }
  }, [filter, teamAttendees, guestAttendees]);

  // Calculate attendance statistics
  const attendedCount = attendees.filter((a) => a.attended).length;
  const totalCount = attendees.length;

  // Check if an attendee is a team member
  const isAttendeeTeamMember = useCallback(
    (attendee: Attendee): boolean => {
      // First try to match by userId if available
      if (attendee.userId && teamMembers.some((t) => t.userId === attendee.userId)) {
        return true;
      }

      // Fallback to matching by email or name
      const attendeeEmail = attendee.email?.toLowerCase();
      const attendeeName = attendee.name.toLowerCase();

      return teamMembers.some((t) => {
        const teamMemberEmail = t.user?.email?.toLowerCase();
        const teamMemberName = `${t.user?.firstName ?? ''} ${t.user?.lastName ?? ''}`
          .toLowerCase()
          .trim();

        return (
          (attendeeEmail && teamMemberEmail && attendeeEmail === teamMemberEmail) ??
          attendeeName === teamMemberName
        );
      });
    },
    [teamMembers]
  );

  // Handle filter change with useCallback
  const handleFilterChange = useCallback((newFilter: AttendeeFilter) => {
    setFilter(newFilter);
  }, []);

  // Handle adding team member with useCallback
  const handleAddTeamMember = useCallback(
    (member: TeamMember, attended: boolean) => {
      if (isCompleted) return;
      onAddTeamMember(member, attended);
    },
    [isCompleted, onAddTeamMember]
  );

  // Form handlers
  const handleAddAttendee = useCallback(() => {
    if (isCompleted) return;
    setEditingAttendee(null);
    setShowForm(true);
  }, [isCompleted]);

  const handleEditAttendee = useCallback(
    (attendee: Attendee) => {
      if (isCompleted) return;
      setEditingAttendee(attendee);
      setShowForm(true);
    },
    [isCompleted]
  );

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditingAttendee(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setEditingAttendee(null);
  }, []);

  return (
    <section className={`${styles['attendees-section']} ${className ?? ''}`}>
      {/* Section Header */}
      <div className={styles['section-header']}>
        <div className={styles['header-left']}>
          <h3 className={styles['section-title']}>
            <UsersIcon className={styles['section-icon']} />
            Attendees
          </h3>
          <span className={styles['attendance-count']}>
            {attendedCount} / {totalCount} attended
          </span>
        </div>
        <button
          className={styles['add-attendee-button']}
          onClick={handleAddAttendee}
          disabled={isCompleted}
          aria-disabled={isCompleted}
          aria-label="Add Attendees"
          title={isCompleted ? 'Cannot add to a completed review' : ''}
        >
          <PlusIcon className={styles['add-attendee-button-icon']} />
          Add Attendees
        </button>
      </div>

      {/* Filter Tabs */}
      <FilterTabs
        filter={filter}
        onFilterChange={handleFilterChange}
        counts={{
          all: totalCount,
          team: teamAttendees.length,
          guests: guestAttendees.length,
        }}
      />

      {/* Unmarked Team Members Section */}
      <UnmarkedSection
        members={unmarkedTeamMembers}
        isAdding={isAdding}
        isCompleted={isCompleted}
        onAddMember={handleAddTeamMember}
      />

      {/* Attendees List */}
      <div className={styles['attendees-list']}>
        {filteredAttendees.length === 0 ? (
          <EmptyState />
        ) : (
          filteredAttendees.map((attendee) => (
            <AttendeeCard
              key={attendee.id}
              attendee={attendee}
              isTeamMember={isAttendeeTeamMember(attendee)}
              isCompleted={isCompleted}
              isUpdating={isUpdating}
              isDeleting={deleteAttendeeMutation.isPending}
              onToggleAttendance={onToggleAttendance}
              onEdit={handleEditAttendee}
              onDelete={setDeleteConfirmAttendee}
            />
          ))
        )}
      </div>

      {/* Attendee Form Modal */}
      <AttendeeForm
        attendee={editingAttendee}
        isOpen={showForm}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        apiConfig={apiConfig}
        queryKey={queryKey}
        defaultRole={defaultRole}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirmAttendee}
        title="Remove Attendee"
        name={deleteConfirmAttendee?.name}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (deleteConfirmAttendee) {
            deleteAttendeeMutation.mutate(deleteConfirmAttendee.id);
          }
        }}
        onCancel={() => setDeleteConfirmAttendee(null)}
        isLoading={deleteAttendeeMutation.isPending}
        variant="danger"
      />
    </section>
  );
};

export default AttendeesSection;
