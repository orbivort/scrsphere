import React from 'react';
import { screen, render, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { BacklogProvider, useBacklogContext } from '../context/BacklogContext';
import type { ItemFormData, FormErrors } from '../types/backlog.types';

import { CreateItemModal } from './CreateItemModal';

/** Helper to set context state for testing specific scenarios */
const SetContextValues: React.FC<{
  initialFormData?: ItemFormData | null;
  formErrors?: FormErrors;
  workflowError?: string | null;
}> = ({ initialFormData, formErrors, workflowError }) => {
  const { setInitialFormData, setFormErrors, setWorkflowError } = useBacklogContext();
  React.useEffect(() => {
    if (initialFormData !== undefined) setInitialFormData(initialFormData);
    if (formErrors !== undefined) setFormErrors(formErrors);
    if (workflowError !== undefined) setWorkflowError(workflowError);
  }, []);
  return null;
};

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

    it('should pass undefined when clearing business value selection', async () => {
      renderCreateModal();

      const businessValueSelect = document.getElementById('business-value') as HTMLSelectElement;
      await userEvent.selectOptions(businessValueSelect, '');

      expect(businessValueSelect.value).toBe('');
    });

    it('should pass undefined when clearing estimate selection', async () => {
      renderCreateModal();

      const estimateSelect = document.getElementById('estimate') as HTMLSelectElement;

      await userEvent.selectOptions(estimateSelect, '5');
      expect(estimateSelect.value).toBe('5');

      await userEvent.selectOptions(estimateSelect, '');
      expect(estimateSelect.value).toBe('');
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

    it('should close modal when clicking overlay background', () => {
      const handleClose = vi.fn();
      renderCreateModal({ onClose: handleClose });

      const overlay = document.querySelector('[class*="modal-overlay"]');
      expect(overlay).toBeInTheDocument();

      fireEvent.click(overlay!);

      expect(handleClose).toHaveBeenCalled();
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

  describe('Unsaved Changes', () => {
    it('should show unsaved changes modal when closing with unsaved changes', async () => {
      const handleClose = vi.fn();
      render(
        <BacklogProvider>
          <SetContextValues
            initialFormData={{
              title: 'Original',
              description: '',
              estimate: undefined,
              moscowPriority: 'COULD_HAVE' as never,
              businessValue: undefined,
              labels: '',
              acceptanceCriteria: '',
              status: 'NEW' as never,
            }}
          />
          <CreateItemModal
            isOpen={true}
            onClose={handleClose}
            onSubmit={vi.fn()}
            isSubmitting={false}
          />
        </BacklogProvider>
      );

      // Change the title to create unsaved changes
      const titleInput = screen.getByLabelText(/title/i);
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Modified Title');

      // Click cancel to trigger unsaved changes check
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      // UnsavedChangesModal should appear
      await waitFor(() => {
        expect(screen.getByText(/discard changes/i)).toBeInTheDocument();
      });
    });

    it('should call onClose when confirming discard in unsaved changes modal', async () => {
      const handleClose = vi.fn();
      render(
        <BacklogProvider>
          <SetContextValues
            initialFormData={{
              title: 'Original',
              description: '',
              estimate: undefined,
              moscowPriority: 'COULD_HAVE' as never,
              businessValue: undefined,
              labels: '',
              acceptanceCriteria: '',
              status: 'NEW' as never,
            }}
          />
          <CreateItemModal
            isOpen={true}
            onClose={handleClose}
            onSubmit={vi.fn()}
            isSubmitting={false}
          />
        </BacklogProvider>
      );

      // Change the title to create unsaved changes
      const titleInput = screen.getByLabelText(/title/i);
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Modified Title');

      // Click cancel to trigger unsaved changes check
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      // Click Discard Changes in the unsaved modal
      const discardButton = await screen.findByRole('button', { name: /discard changes/i });
      await userEvent.click(discardButton);

      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('Error States', () => {
    it('should display workflow error banner', () => {
      render(
        <BacklogProvider>
          <SetContextValues workflowError="Workflow validation failed" />
          <CreateItemModal
            isOpen={true}
            onClose={vi.fn()}
            onSubmit={vi.fn()}
            isSubmitting={false}
          />
        </BacklogProvider>
      );

      expect(screen.getByText('Workflow validation failed')).toBeInTheDocument();
    });

    it('should dismiss workflow error banner when clicking close', async () => {
      render(
        <BacklogProvider>
          <SetContextValues workflowError="Workflow validation failed" />
          <CreateItemModal
            isOpen={true}
            onClose={vi.fn()}
            onSubmit={vi.fn()}
            isSubmitting={false}
          />
        </BacklogProvider>
      );

      expect(screen.getByText('Workflow validation failed')).toBeInTheDocument();

      const closeErrorButton = screen.getByLabelText('Close error message');
      await userEvent.click(closeErrorButton);

      await waitFor(() => {
        expect(screen.queryByText('Workflow validation failed')).not.toBeInTheDocument();
      });
    });

    it('should display title error', () => {
      render(
        <BacklogProvider>
          <SetContextValues formErrors={{ title: 'Title is required' }} />
          <CreateItemModal
            isOpen={true}
            onClose={vi.fn()}
            onSubmit={vi.fn()}
            isSubmitting={false}
          />
        </BacklogProvider>
      );

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveTextContent('Title is required');
    });

    it('should display moscow priority error', () => {
      render(
        <BacklogProvider>
          <SetContextValues formErrors={{ moscowPriority: 'Priority is required' }} />
          <CreateItemModal
            isOpen={true}
            onClose={vi.fn()}
            onSubmit={vi.fn()}
            isSubmitting={false}
          />
        </BacklogProvider>
      );

      expect(screen.getByText('Priority is required')).toBeInTheDocument();
    });
  });

  describe('Submitting State', () => {
    it('should show loading overlay when submitting', () => {
      renderCreateModal({ isSubmitting: true });

      expect(screen.getByText('Creating backlog item...')).toBeInTheDocument();
    });
  });

  describe('Escape Key', () => {
    it('should close modal on Escape key', async () => {
      const handleClose = vi.fn();
      renderCreateModal({ onClose: handleClose });

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });
});
