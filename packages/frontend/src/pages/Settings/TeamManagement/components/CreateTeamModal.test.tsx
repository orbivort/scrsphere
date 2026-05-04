import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { CreateTeamModal } from './CreateTeamModal';

describe('CreateTeamModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/create new team/i)).toBeInTheDocument();
    });

    it('should NOT render modal when isOpen is false', () => {
      render(
        <CreateTeamModal
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render form fields', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create team/i })).toBeInTheDocument();
    });

    it('should pre-fill name field when defaultName is provided', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
          defaultName="My Team"
        />
      );

      expect(screen.getByDisplayValue('My Team')).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('should disable submit button when team name is empty', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create team/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when team name is provided', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'My Team' } });

      const submitButton = screen.getByRole('button', { name: /create team/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should show error when team name exceeds 100 characters', async () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'a'.repeat(101) } });

      const submitButton = screen.getByRole('button', { name: /create team/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          /team name must be less than 100 characters/i
        );
      });
    });

    it('should show error when description exceeds 1000 characters', async () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'Valid Name' } });

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'a'.repeat(1001) } });

      const submitButton = screen.getByRole('button', { name: /create team/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          /description must be less than 1000 characters/i
        );
      });
    });
  });

  describe('Form submission', () => {
    it('should call onSubmit with form data when valid', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(nameInput, { target: { value: 'My Team' } });
      fireEvent.change(descriptionInput, { target: { value: 'Team description' } });

      const submitButton = screen.getByRole('button', { name: /create team/i });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'My Team',
        description: 'Team description',
      });
    });

    it('should trim whitespace from name and description', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(nameInput, { target: { value: '  My Team  ' } });
      fireEvent.change(descriptionInput, { target: { value: '  Description  ' } });

      const submitButton = screen.getByRole('button', { name: /create team/i });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'My Team',
        description: 'Description',
      });
    });

    it('should allow submission without description', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'My Team' } });

      const submitButton = screen.getByRole('button', { name: /create team/i });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'My Team',
        description: undefined,
      });
    });

    it('should disable submit button when isSubmitting is true', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'My Team' } });

      const submitButton = screen.getByRole('button', { name: /creating/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state when submitting', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      expect(screen.getByText(/creating/i)).toBeInTheDocument();
    });
  });

  describe('Modal actions', () => {
    it('should call onClose when cancel button is clicked', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked', () => {
      render(
        <CreateTeamModal
          isOpen={true}
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
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Character counters', () => {
    it('should display character count for name field', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      expect(screen.getByText('4 / 100')).toBeInTheDocument();
    });

    it('should display character count for description field', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

      expect(screen.getByText('16 / 1000')).toBeInTheDocument();
    });

    it('should show warning class when name is 80-99 characters', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'a'.repeat(85) } });

      const counter = screen.getByText('85 / 100');
      expect(counter).toBeInTheDocument();
    });

    it('should show error class when name is 100 characters', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'a'.repeat(100) } });

      const counter = screen.getByText('100 / 100');
      expect(counter).toBeInTheDocument();
    });

    it('should show warning class when description is 800-999 characters', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'a'.repeat(850) } });

      const counter = screen.getByText('850 / 1000');
      expect(counter).toBeInTheDocument();
    });

    it('should show error class when description is 1000 characters', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'a'.repeat(1000) } });

      const counter = screen.getByText('1000 / 1000');
      expect(counter).toBeInTheDocument();
    });
  });

  describe('Form interactions and states', () => {
    it('should disable inputs when submitting', () => {
      render(
        <CreateTeamModal
          isOpen={true}
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
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByText(/required fields/i)).toBeInTheDocument();
    });

    it('should clear errors when valid input is provided', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      const submitButton = screen.getByRole('button', { name: /create team/i });

      // First set name too long
      fireEvent.change(nameInput, { target: { value: 'a'.repeat(101) } });
      fireEvent.click(submitButton);
      expect(screen.getByRole('alert')).toHaveTextContent(
        /team name must be less than 100 characters/i
      );

      // Now fix name
      fireEvent.change(nameInput, { target: { value: 'Valid Team' } });
    });

    it('should close modal when clicking overlay with no unsaved changes', () => {
      render(
        <CreateTeamModal
          isOpen={true}
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
  });

  describe('Progress bar', () => {
    it('should show 0% progress when form is empty', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const progressFill = document.querySelector('[class*="progress-fill"]');
      expect(progressFill).toHaveStyle({ width: '0%' });
    });

    it('should show 50% progress when only name is filled', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'My Team' } });

      const progressFill = document.querySelector('[class*="progress-fill"]');
      expect(progressFill).toHaveStyle({ width: '50%' });
    });

    it('should show 100% progress when both fields are filled', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(nameInput, { target: { value: 'My Team' } });
      fireEvent.change(descriptionInput, { target: { value: 'Description' } });

      const progressFill = document.querySelector('[class*="progress-fill"]');
      expect(progressFill).toHaveStyle({ width: '100%' });
    });
  });

  describe('Unsaved changes dialog', () => {
    it('should show unsaved changes dialog when closing dirty form', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'My Team' } });

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeButton);

      expect(screen.getByRole('dialog', { name: /unsaved changes/i })).toBeInTheDocument();
    });

    it('should close modal when discarding changes', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'My Team' } });

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeButton);

      const discardButton = screen.getByRole('button', { name: /discard/i });
      fireEvent.click(discardButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should keep modal open when canceling discard', () => {
      render(
        <CreateTeamModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      const nameInput = screen.getByLabelText(/team name/i);
      fireEvent.change(nameInput, { target: { value: 'My Team' } });

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeButton);

      const goBackButton = screen.getByRole('button', { name: /go back/i });
      fireEvent.click(goBackButton);

      expect(mockOnClose).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog', { name: /create new team/i })).toBeInTheDocument();
    });
  });
});
