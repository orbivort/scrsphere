import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { BacklogProvider } from '../context/BacklogContext';

import { CreateItemModal } from './CreateItemModal';

const renderCreateModal = (props = {}) => {
  return render(
    <BacklogProvider>
      <CreateItemModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        {...props}
      />
    </BacklogProvider>
  );
};

describe('CreateItemModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when open', () => {
      renderCreateModal({ isOpen: true });

      expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      renderCreateModal({ isOpen: false });

      expect(screen.queryByText('Create New Backlog Item')).not.toBeInTheDocument();
    });

    it('should render form sections', () => {
      renderCreateModal();

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Priority & Value')).toBeInTheDocument();
      expect(screen.getByText('More Information')).toBeInTheDocument();
    });

    it('should render required field indicator', () => {
      renderCreateModal();

      expect(screen.getByText(/indicates required fields/i)).toBeInTheDocument();
    });

    it('should render MoSCoW priority selector', () => {
      renderCreateModal();

      const moscowSelector = document.querySelector('[role="radiogroup"]');
      expect(moscowSelector).toBeInTheDocument();

      const radioOptions = document.querySelectorAll('[role="radio"]');
      expect(radioOptions.length).toBe(4);
    });

    it('should have proper ARIA attributes', () => {
      renderCreateModal();

      const modal = document.querySelector('[role="dialog"]');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Form Fields', () => {
    it('should have title input field', () => {
      renderCreateModal();

      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toBeInTheDocument();
    });

    it('should have description textarea', () => {
      renderCreateModal();

      const descriptionInput = screen.getByLabelText(/description/i);
      expect(descriptionInput).toBeInTheDocument();
    });

    it('should have field help text with proper IDs', () => {
      renderCreateModal();

      const titleInput = document.getElementById('item-title');
      expect(titleInput).toHaveAttribute('aria-describedby');
    });
  });

  describe('Labels/Tags', () => {
    it('should add labels in create form', async () => {
      renderCreateModal();

      const labelsInput = document.getElementById('item-labels') as HTMLInputElement;
      await userEvent.type(labelsInput, 'frontend');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('frontend')).toBeInTheDocument();
      });
    });

    it('should limit labels to maximum of 10', async () => {
      renderCreateModal();

      const labelsInput = document.getElementById('item-labels') as HTMLInputElement;
      for (let i = 1; i <= 10; i++) {
        await userEvent.clear(labelsInput);
        await userEvent.type(labelsInput, `tag${i}`);
        await userEvent.keyboard('{Enter}');
      }

      await waitFor(() => {
        const tagElements = document.querySelectorAll('[class*="tag-item"]');
        expect(tagElements.length).toBe(10);
      });

      expect(labelsInput).toBeDisabled();
    });
  });

  describe('Modal Actions', () => {
    it('should close modal when clicking cancel', async () => {
      renderCreateModal({ onClose: mockOnClose });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should call onSubmit when clicking create button', async () => {
      renderCreateModal({ onSubmit: mockOnSubmit });

      const createButton = screen.getByRole('button', { name: /create item/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should disable buttons during submission', () => {
      renderCreateModal({ isSubmitting: true });

      const createButton = screen.getByRole('button', { name: /creating/i });
      expect(createButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have close button with proper aria label', () => {
      renderCreateModal();

      const closeButton = document.querySelector('[data-modal-close]');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });

    it('should have required field indicators', () => {
      renderCreateModal();

      expect(screen.getByText(/indicates required fields/i)).toBeInTheDocument();
    });
  });
});
