import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';

import { TeamList } from './TeamList';
import type { Team } from '@/types/teamManagement.types';

const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Team Alpha',
    description: 'Alpha description',
    createdBy: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    memberCount: 5,
    userRole: 'PRODUCT_OWNER',
    creator: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
  },
  {
    id: 'team-2',
    name: 'Team Beta',
    description: 'Beta description',
    createdBy: 'user-2',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    memberCount: 3,
    userRole: 'DEVELOPER',
    creator: {
      id: 'user-2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
    },
  },
];

describe('TeamList', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnRetry = vi.fn();
  const mockOnCreateTeam = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Permission-based rendering', () => {
    it('should show edit/delete buttons when canEdit and canDelete are true', () => {
      render(
        <TeamList
          teams={mockTeams}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
        />
      );

      expect(screen.getByRole('button', { name: /edit team alpha/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete team alpha/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit team beta/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete team beta/i })).toBeInTheDocument();
    });

    it('should NOT show edit/delete buttons when canEdit and canDelete are false', () => {
      render(
        <TeamList
          teams={mockTeams}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={false}
          canDelete={false}
        />
      );

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('should respect per-team permission checks when canEditTeam is provided', () => {
      // Only allow editing teams where userRole is PRODUCT_OWNER
      const canEditTeam = (team: Team) => team.userRole === 'PRODUCT_OWNER';

      render(
        <TeamList
          teams={mockTeams}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
          canEditTeam={canEditTeam}
        />
      );

      // Team Alpha has PRODUCT_OWNER role, should show edit button
      expect(screen.getByRole('button', { name: /edit team alpha/i })).toBeInTheDocument();

      // Team Beta has DEVELOPER role, should NOT show edit button
      expect(screen.queryByRole('button', { name: /edit team beta/i })).not.toBeInTheDocument();

      // Both teams should show delete buttons (no canDeleteTeam restriction)
      expect(screen.getByRole('button', { name: /delete team alpha/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete team beta/i })).toBeInTheDocument();
    });

    it('should respect per-team permission checks when canDeleteTeam is provided', () => {
      // Only allow deleting teams where userRole is PRODUCT_OWNER
      const canDeleteTeam = (team: Team) => team.userRole === 'PRODUCT_OWNER';

      render(
        <TeamList
          teams={mockTeams}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
          canDeleteTeam={canDeleteTeam}
        />
      );

      // Both teams should show edit buttons (no canEditTeam restriction)
      expect(screen.getByRole('button', { name: /edit team alpha/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit team beta/i })).toBeInTheDocument();

      // Team Alpha has PRODUCT_OWNER role, should show delete button
      expect(screen.getByRole('button', { name: /delete team alpha/i })).toBeInTheDocument();

      // Team Beta has DEVELOPER role, should NOT show delete button
      expect(screen.queryByRole('button', { name: /delete team beta/i })).not.toBeInTheDocument();
    });

    it('should respect both canEditTeam and canDeleteTeam together', () => {
      const canEditTeam = (team: Team) => team.userRole === 'PRODUCT_OWNER';
      const canDeleteTeam = (team: Team) => team.userRole === 'PRODUCT_OWNER';

      render(
        <TeamList
          teams={mockTeams}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
          canEditTeam={canEditTeam}
          canDeleteTeam={canDeleteTeam}
        />
      );

      // Team Alpha has PRODUCT_OWNER role, should show both buttons
      expect(screen.getByRole('button', { name: /edit team alpha/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete team alpha/i })).toBeInTheDocument();

      // Team Beta has DEVELOPER role, should NOT show any buttons
      expect(screen.queryByRole('button', { name: /edit team beta/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete team beta/i })).not.toBeInTheDocument();
    });

    it('should call onEdit with correct team when edit button is clicked', () => {
      render(
        <TeamList
          teams={mockTeams}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit team alpha/i });
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockTeams[0]);
    });

    it('should call onDelete with correct team when delete button is clicked', () => {
      render(
        <TeamList
          teams={mockTeams}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete team alpha/i });
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockTeams[0]);
    });

    it('should disable buttons when editingTeamId matches', () => {
      render(
        <TeamList
          teams={mockTeams}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
          editingTeamId="team-1"
        />
      );

      const editButton = screen.getByRole('button', { name: /edit team alpha/i });
      const deleteButton = screen.getByRole('button', { name: /delete team alpha/i });

      expect(editButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });

    it('should disable buttons when deletingTeamId matches', () => {
      render(
        <TeamList
          teams={mockTeams}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
          deletingTeamId="team-1"
        />
      );

      const editButton = screen.getByRole('button', { name: /edit team alpha/i });
      const deleteButton = screen.getByRole('button', { name: /delete team alpha/i });

      expect(editButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(
        <TeamList
          teams={[]}
          isLoading={true}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
        />
      );

      expect(screen.getByRole('status')).toHaveTextContent(/loading teams/i);
    });

    it('should NOT show team cards when loading', () => {
      render(
        <TeamList
          teams={mockTeams}
          isLoading={true}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
        />
      );

      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should show error message when error is provided', () => {
      const error = new Error('Failed to load teams');

      render(
        <TeamList
          teams={[]}
          isLoading={false}
          error={error}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent(/failed to load teams/i);
    });

    it('should call onRetry when retry button is clicked', () => {
      const error = new Error('Failed to load teams');

      render(
        <TeamList
          teams={[]}
          isLoading={false}
          error={error}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalled();
    });
  });

  describe('Empty state', () => {
    it('should show empty message when no teams are provided', () => {
      render(
        <TeamList
          teams={[]}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
        />
      );

      expect(screen.getByRole('status')).toHaveTextContent(/build your dream team/i);
    });

    it('should show search-specific message when search term is provided', () => {
      render(
        <TeamList
          teams={[]}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
          search="nonexistent"
        />
      );

      expect(screen.getByRole('status')).toHaveTextContent(
        /no teams found matching "nonexistent"/i
      );
    });

    it('should call onCreateTeam when create team link is clicked', () => {
      render(
        <TeamList
          teams={[]}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
          onCreateTeam={mockOnCreateTeam}
        />
      );

      const createLink = screen.getByRole('button', { name: /create your first team/i });
      fireEvent.click(createLink);

      expect(mockOnCreateTeam).toHaveBeenCalled();
    });

    it('should show clear search button when search term is provided and empty state', () => {
      const mockOnClearSearch = vi.fn();
      const mockOnCreateTeam = vi.fn();
      render(
        <TeamList
          teams={[]}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
          search="nonexistent"
          onClearSearch={mockOnClearSearch}
          onCreateTeam={mockOnCreateTeam}
        />
      );

      const clearButton = screen.getByRole('button', {
        name: /clear search and browse all teams/i,
      });
      fireEvent.click(clearButton);

      expect(mockOnClearSearch).toHaveBeenCalled();
    });
  });

  describe('Team card rendering', () => {
    it('should display team information correctly', () => {
      render(
        <TeamList
          teams={mockTeams}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
        />
      );

      // Check team names
      expect(screen.getByRole('heading', { name: /team alpha/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /team beta/i })).toBeInTheDocument();

      // Check member counts
      expect(screen.getByText(/5 members/i)).toBeInTheDocument();
      expect(screen.getByText(/3 members/i)).toBeInTheDocument();

      // Check descriptions
      expect(screen.getByText(/alpha description/i)).toBeInTheDocument();
      expect(screen.getByText(/beta description/i)).toBeInTheDocument();

      // Check creator names
      expect(screen.getByText(/created by john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/created by jane smith/i)).toBeInTheDocument();
    });

    it('should handle singular member count correctly', () => {
      const singleMemberTeam: Team = {
        ...mockTeams[0],
        memberCount: 1,
      };

      render(
        <TeamList
          teams={[singleMemberTeam]}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
        />
      );

      expect(screen.getByText((content) => content.includes('1 member'))).toBeInTheDocument();
    });

    it('should navigate between cards with arrow keys', () => {
      render(
        <TeamList
          teams={mockTeams}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
        />
      );

      const cards = screen.getAllByRole('listitem');

      // Focus first card
      cards[0].focus();
      expect(cards[0]).toHaveFocus();

      // Press ArrowDown to move to second card
      fireEvent.keyDown(cards[0], { key: 'ArrowDown' });
      expect(cards[1]).toHaveFocus();

      // Press ArrowUp to move back to first card
      fireEvent.keyDown(cards[1], { key: 'ArrowUp' });
      expect(cards[0]).toHaveFocus();
    });

    it('should navigate between action buttons with arrow keys', () => {
      render(
        <TeamList
          teams={mockTeams}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
        />
      );

      const cards = screen.getAllByRole('listitem');
      const editButton = within(cards[0]).getByRole('button', { name: /edit team alpha/i });
      const deleteButton = within(cards[0]).getByRole('button', { name: /delete team alpha/i });

      // Focus card and press Enter to focus first action
      cards[0].focus();
      fireEvent.keyDown(cards[0], { key: 'Enter' });
      expect(editButton).toHaveFocus();

      // Press ArrowRight to move to delete button
      fireEvent.keyDown(editButton, { key: 'ArrowRight' });
      expect(deleteButton).toHaveFocus();

      // Press ArrowLeft to move back to edit button
      fireEvent.keyDown(deleteButton, { key: 'ArrowLeft' });
      expect(editButton).toHaveFocus();
    });

    it('should have descriptive aria-label for team cards', () => {
      render(
        <TeamList
          teams={mockTeams}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
        />
      );

      const cards = screen.getAllByRole('listitem');

      // Check that cards have descriptive aria-labels
      expect(cards[0]).toHaveAttribute('aria-label', expect.stringContaining('Team Alpha'));
      expect(cards[0]).toHaveAttribute('aria-label', expect.stringContaining('5 members'));
      expect(cards[0]).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Use arrow keys to navigate')
      );
    });

    it('should handle team with no description', () => {
      const teamWithoutDesc: Team = { ...mockTeams[0], description: undefined };
      render(
        <TeamList
          teams={[teamWithoutDesc]}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
        />
      );

      expect(screen.getByRole('heading', { name: /team alpha/i })).toBeInTheDocument();
    });

    it('should handle team with 0 members', () => {
      const teamWithNoMembers: Team = { ...mockTeams[0], memberCount: 0 };
      render(
        <TeamList
          teams={[teamWithNoMembers]}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
        />
      );

      expect(screen.getByText(/0 members/i)).toBeInTheDocument();
    });

    it('should show loading state for edit button when editingTeamId matches', () => {
      render(
        <TeamList
          teams={mockTeams}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
          editingTeamId="team-1"
        />
      );

      const editButton = screen.getByRole('button', { name: /edit team alpha/i });
      expect(editButton).toBeInTheDocument();
      expect(editButton).toBeDisabled();
    });

    it('should show loading state for delete button when deletingTeamId matches', () => {
      render(
        <TeamList
          teams={mockTeams}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={true}
          deletingTeamId="team-1"
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete team alpha/i });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toBeDisabled();
    });

    it('should navigate with only edit button available', () => {
      const canEditTeam = (team: Team) => team.id === 'team-1';
      render(
        <TeamList
          teams={[mockTeams[0]]}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={true}
          canDelete={false}
          canEditTeam={canEditTeam}
        />
      );

      const cards = screen.getAllByRole('listitem');
      const editButton = within(cards[0]).getByRole('button', { name: /edit team alpha/i });

      // Focus card and press Enter to focus edit button
      cards[0].focus();
      fireEvent.keyDown(cards[0], { key: 'Enter' });
      expect(editButton).toHaveFocus();
    });

    it('should navigate with only delete button available', () => {
      const canDeleteTeam = (team: Team) => team.id === 'team-1';
      render(
        <TeamList
          teams={[mockTeams[0]]}
          isLoading={false}
          error={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          canEdit={false}
          canDelete={true}
          canDeleteTeam={canDeleteTeam}
        />
      );

      const cards = screen.getAllByRole('listitem');
      const deleteButton = within(cards[0]).getByRole('button', { name: /delete team alpha/i });

      // Focus card and press Enter to focus delete button
      cards[0].focus();
      fireEvent.keyDown(cards[0], { key: 'Enter' });
      expect(deleteButton).toHaveFocus();
    });
  });
});
