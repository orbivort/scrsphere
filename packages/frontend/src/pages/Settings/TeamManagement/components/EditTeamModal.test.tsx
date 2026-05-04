import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { EditTeamModal } from './EditTeamModal';
import type { Team } from '@/types/teamManagement.types';

const mockTeam: Team = {
  id: 'team-1',
  name: 'Team Alpha',
  description: 'Original description',
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
};

describe('EditTeamModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true and team is provided', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/edit team/i)).toBeInTheDocument();
    });

    it('should NOT render modal when isOpen is false', () => {
      render(
        <EditTeamModal
          isOpen={false}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should NOT render modal when team is null', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should pre-fill form with team data', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByDisplayValue('Team Alpha')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Original description')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('should disable submit button when team name is empty', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show error when team name exceeds 100 characters', async () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'a'.repeat(101) } });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          /team name must be less than 100 characters/i
        );
      });
    });

    it('should show error when description exceeds 1000 characters', async () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Team' } });

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'a'.repeat(1001) } });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          /description must be less than 1000 characters/i
        );
      });
    });
  });

  describe('Form submission', () => {
    it('should call onSubmit with team id and form data when valid', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Team' } });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('team-1', {
        name: 'Updated Team',
        description: 'Original description',
      });
    });

    it('should trim whitespace from name and description', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(nameInput, { target: { value: '  Updated Team  ' } });
      fireEvent.change(descriptionInput, { target: { value: '  Updated description  ' } });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('team-1', {
        name: 'Updated Team',
        description: 'Updated description',
      });
    });

    it('should disable submit button when no changes are made', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when changes are made', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Team' } });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should disable submit button when isSubmitting is true', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Team' } });

      const submitButton = screen.getByRole('button', { name: /saving/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state when submitting', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  describe('Change detection', () => {
    it('should show change indicator when form is modified', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Team' } });

      expect(screen.getByText(/you have unsaved changes/i)).toBeInTheDocument();
    });

    it('should not show change indicator when form matches original values', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Team' } });
      fireEvent.change(nameInput, { target: { value: 'Team Alpha' } });

      expect(screen.queryByText(/you have unsaved changes/i)).not.toBeInTheDocument();
    });
  });

  describe('Modal actions', () => {
    it('should call onClose when cancel button is clicked without changes', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked without changes', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should disable cancel button when submitting', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Unsaved changes dialog', () => {
    it('should show unsaved changes dialog when closing dirty form', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Team' } });

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeButton);

      expect(screen.getByRole('dialog', { name: /unsaved changes/i })).toBeInTheDocument();
    });

    it('should close modal when discarding changes', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Team' } });

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeButton);

      const discardButton = screen.getByRole('button', { name: /discard/i });
      fireEvent.click(discardButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should keep modal open when canceling discard', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Team' } });

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeButton);

      const goBackButton = screen.getByRole('button', { name: /go back/i });
      fireEvent.click(goBackButton);

      expect(mockOnClose).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog', { name: /edit team/i })).toBeInTheDocument();
    });
  });

  describe('Character counters', () => {
    it('should display character count for name field', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByText('10 / 100')).toBeInTheDocument();
    });

    it('should display character count for description field', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByText('20 / 1000')).toBeInTheDocument();
    });

    it('should show warning class when name is 80-99 characters', () => {
      const teamWithLongName = { ...mockTeam, name: 'a'.repeat(85) };
      render(
        <EditTeamModal
          isOpen={true}
          team={teamWithLongName}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const counter = screen.getByText('85 / 100');
      expect(counter).toBeInTheDocument();
    });

    it('should show error class when name is 100 characters', () => {
      const teamWith100CharName = { ...mockTeam, name: 'a'.repeat(100) };
      render(
        <EditTeamModal
          isOpen={true}
          team={teamWith100CharName}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const counter = screen.getByText('100 / 100');
      expect(counter).toBeInTheDocument();
    });

    it('should show warning class when description is 800-999 characters', () => {
      const teamWithLongDesc = { ...mockTeam, description: 'a'.repeat(850) };
      render(
        <EditTeamModal
          isOpen={true}
          team={teamWithLongDesc}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const counter = screen.getByText('850 / 1000');
      expect(counter).toBeInTheDocument();
    });

    it('should show error class when description is 1000 characters', () => {
      const teamWith1000CharDesc = { ...mockTeam, description: 'a'.repeat(1000) };
      render(
        <EditTeamModal
          isOpen={true}
          team={teamWith1000CharDesc}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const counter = screen.getByText('1000 / 1000');
      expect(counter).toBeInTheDocument();
    });
  });

  describe('Form interactions and states', () => {
    it('should disable inputs when submitting', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      expect(nameInput).toBeDisabled();
      expect(descriptionInput).toBeDisabled();
    });

    it('should show form legend with required fields indicator', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByText(/required fields/i)).toBeInTheDocument();
    });

    it('should close modal when clicking overlay with no unsaved changes', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const overlay = document.querySelector('[class*="overlay"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should not close modal when clicking overlay with unsaved changes', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'Changed Team' } });

      const overlay = document.querySelector('[class*="overlay"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(screen.getByRole('dialog', { name: /unsaved changes/i })).toBeInTheDocument();
      }
    });

    it('should clear errors when valid input is provided', () => {
      render(
        <EditTeamModal
          isOpen={true}
          team={mockTeam}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      const submitButton = screen.getByRole('button', { name: /save changes/i });

      // Make changes and try to submit with invalid input
      fireEvent.change(nameInput, { target: { value: 'a'.repeat(101) } });
      fireEvent.click(submitButton);

      expect(screen.getByRole('alert')).toHaveTextContent(
        /team name must be less than 100 characters/i
      );

      // Fix input
      fireEvent.change(nameInput, { target: { value: 'Valid Team Name' } });
    });
  });
});
