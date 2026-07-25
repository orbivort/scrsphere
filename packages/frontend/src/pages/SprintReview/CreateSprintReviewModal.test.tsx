import React from 'react';
import { screen, fireEvent, renderWithProviders, initTestI18n, i18nT } from '../../test-utils';
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';

import { CreateSprintReviewModal } from './CreateSprintReviewModal';

// Initialize i18n before all tests
beforeAll(async () => {
  await initTestI18n();
});

vi.mock('./CreateSprintReviewModal.module.css', () => ({
  default: {
    'modal-overlay': 'modal-overlay',
    modal: 'modal',
    'modal-header': 'modal-header',
    'close-button': 'close-button',
    'modal-content': 'modal-content',
    'form-group': 'form-group',
    error: 'error',
    'error-message': 'error-message',
    'modal-warning': 'modal-warning',
    'warning-icon': 'warning-icon',
    'modal-actions': 'modal-actions',
    button: 'button',
    'button-primary': 'button-primary',
    'button-secondary': 'button-secondary',
    'modal-error': 'modal-error',
  },
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  createReviewData: {
    reviewDate: '2026-01-14',
    summary: 'Test summary',
  },
  setCreateReviewData: vi.fn(),
  formErrors: {},
  setFormErrors: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
  hasIncrement: true,
};

describe('CreateSprintReviewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      renderWithProviders(<CreateSprintReviewModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByRole('heading', { name: /Create Sprint Review/i })).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      renderWithProviders(<CreateSprintReviewModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render close button', () => {
      renderWithProviders(<CreateSprintReviewModal {...defaultProps} />);

      const closeButton = screen
        .getAllByRole('button')
        .find(
          (button) =>
            button.getAttribute('aria-label') === i18nT('sprint-review:createModal.cancel')
        );
      expect(closeButton).toBeInTheDocument();
    });

    it('should render review date input', () => {
      renderWithProviders(<CreateSprintReviewModal {...defaultProps} />);

      const dateInput = screen.getByLabelText(/Review Date/i);
      expect(dateInput).toBeInTheDocument();
      // LocaleDateInput uses a visible text input, not a date input
      expect(dateInput).toHaveAttribute('type', 'text');
      // LocaleDateInput uses required HTML attribute, not aria-required
      expect(dateInput).toBeRequired();
    });

    it('should render summary textarea', () => {
      renderWithProviders(<CreateSprintReviewModal {...defaultProps} />);

      const textarea = screen.getByLabelText(/Summary/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName.toLowerCase()).toBe('textarea');
    });

    it('should render action buttons', () => {
      renderWithProviders(<CreateSprintReviewModal {...defaultProps} />);

      expect(screen.getByText(i18nT('sprint-review:createModal.cancel'))).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Review/i })).toBeInTheDocument();
    });

    it('should display review date value from createReviewData', () => {
      renderWithProviders(
        <CreateSprintReviewModal
          {...defaultProps}
          createReviewData={{ reviewDate: '2026-02-15', summary: '' }}
        />
      );

      // LocaleDateInput displays dates in locale format (dd/MM/yyyy for en)
      expect(screen.getByLabelText(/Review Date/i)).toHaveValue('15/02/2026');
    });

    it('should display summary value from createReviewData', () => {
      renderWithProviders(
        <CreateSprintReviewModal
          {...defaultProps}
          createReviewData={{ reviewDate: '', summary: 'My sprint review summary' }}
        />
      );

      expect(screen.getByLabelText(/Summary/i)).toHaveValue('My sprint review summary');
    });
  });

  describe('Form Interactions', () => {
    it('should call setCreateReviewData when review date changes', () => {
      const setCreateReviewData = vi.fn();
      renderWithProviders(
        <CreateSprintReviewModal {...defaultProps} setCreateReviewData={setCreateReviewData} />
      );

      const dateInput = screen.getByLabelText(/Review Date/i);
      // LocaleDateInput expects locale format (dd/MM/yyyy for en)
      fireEvent.change(dateInput, { target: { value: '20/03/2026' } });

      expect(setCreateReviewData).toHaveBeenCalledWith({
        reviewDate: '2026-03-20',
        summary: 'Test summary',
      });
    });

    it('should call setCreateReviewData when summary changes', () => {
      const setCreateReviewData = vi.fn();
      renderWithProviders(
        <CreateSprintReviewModal {...defaultProps} setCreateReviewData={setCreateReviewData} />
      );

      const textarea = screen.getByLabelText(/Summary/i);
      fireEvent.change(textarea, { target: { value: 'Updated summary' } });

      expect(setCreateReviewData).toHaveBeenCalledWith({
        reviewDate: '2026-01-14',
        summary: 'Updated summary',
      });
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      renderWithProviders(<CreateSprintReviewModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen
        .getAllByRole('button')
        .find(
          (button) =>
            button.getAttribute('aria-label') === i18nT('sprint-review:createModal.cancel')
        );
      fireEvent.click(closeButton!);

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose and setFormErrors when Cancel button is clicked', () => {
      const onClose = vi.fn();
      const setFormErrors = vi.fn();
      renderWithProviders(
        <CreateSprintReviewModal
          {...defaultProps}
          onClose={onClose}
          setFormErrors={setFormErrors}
        />
      );

      fireEvent.click(screen.getByText(i18nT('sprint-review:createModal.cancel')));

      expect(onClose).toHaveBeenCalled();
      expect(setFormErrors).toHaveBeenCalledWith({});
    });

    it('should call onSubmit when Create Review button is clicked', () => {
      const onSubmit = vi.fn();
      renderWithProviders(<CreateSprintReviewModal {...defaultProps} onSubmit={onSubmit} />);

      fireEvent.click(screen.getByRole('button', { name: /Create Review/i }));

      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe('Form Validation and Errors', () => {
    it('should display review date error when formErrors.reviewDate exists', () => {
      renderWithProviders(
        <CreateSprintReviewModal
          {...defaultProps}
          formErrors={{ reviewDate: 'Review date is required' }}
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Review date is required');
    });

    it('should mark review date input as invalid when formErrors.reviewDate exists', () => {
      renderWithProviders(
        <CreateSprintReviewModal
          {...defaultProps}
          formErrors={{ reviewDate: 'Review date is required' }}
        />
      );

      expect(screen.getByLabelText(/Review Date/i)).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not mark review date input as invalid when no error', () => {
      renderWithProviders(<CreateSprintReviewModal {...defaultProps} formErrors={{}} />);

      expect(screen.getByLabelText(/Review Date/i)).toHaveAttribute('aria-invalid', 'false');
    });

    it('should display modal error when isError is true and error is Error instance', () => {
      renderWithProviders(
        <CreateSprintReviewModal
          {...defaultProps}
          isError={true}
          error={new Error('Network error occurred')}
        />
      );

      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('should display default error message when isError is true and error is not Error instance', () => {
      renderWithProviders(
        <CreateSprintReviewModal {...defaultProps} isError={true} error={null} />
      );

      expect(
        screen.getByText('Failed to create sprint review. Please try again.')
      ).toBeInTheDocument();
    });

    it('should not display error message when isError is false', () => {
      renderWithProviders(
        <CreateSprintReviewModal {...defaultProps} isError={false} error={null} />
      );

      expect(
        screen.queryByText('Failed to create sprint review. Please try again.')
      ).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should disable Create Review button when isPending is true', () => {
      renderWithProviders(<CreateSprintReviewModal {...defaultProps} isPending={true} />);

      expect(screen.getByRole('button', { name: /Creating/i })).toBeDisabled();
    });

    it('should show "Creating..." text when isPending is true', () => {
      renderWithProviders(<CreateSprintReviewModal {...defaultProps} isPending={true} />);

      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    it('should show "Create Review" text when isPending is false', () => {
      renderWithProviders(<CreateSprintReviewModal {...defaultProps} isPending={false} />);

      expect(screen.getByRole('button', { name: /Create Review/i })).not.toBeDisabled();
    });
  });

  describe('Increment Validation', () => {
    it('should disable Create Review button when hasIncrement is false', () => {
      renderWithProviders(<CreateSprintReviewModal {...defaultProps} hasIncrement={false} />);

      expect(screen.getByRole('button', { name: /Create Review/i })).toBeDisabled();
    });

    it('should enable Create Review button when hasIncrement is true and not pending', () => {
      renderWithProviders(
        <CreateSprintReviewModal {...defaultProps} hasIncrement={true} isPending={false} />
      );

      expect(screen.getByRole('button', { name: /Create Review/i })).not.toBeDisabled();
    });

    it('should display warning when formErrors.increment exists', () => {
      renderWithProviders(
        <CreateSprintReviewModal
          {...defaultProps}
          formErrors={{ increment: 'No delivered increment found' }}
        />
      );

      expect(screen.getByText('No delivered increment found')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on modal', () => {
      renderWithProviders(<CreateSprintReviewModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'create-review-title');
    });

    it('should have accessible title', () => {
      renderWithProviders(<CreateSprintReviewModal {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Create Sprint Review');
    });

    it('should have aria-describedby on date input when error exists', () => {
      renderWithProviders(
        <CreateSprintReviewModal
          {...defaultProps}
          formErrors={{ reviewDate: 'Date is required' }}
        />
      );

      expect(screen.getByLabelText(/Review Date/i)).toHaveAttribute(
        'aria-describedby',
        'review-date-error'
      );
    });
  });

  describe('Negative Test Cases', () => {
    it('should handle empty review date and summary', () => {
      renderWithProviders(
        <CreateSprintReviewModal
          {...defaultProps}
          createReviewData={{ reviewDate: '', summary: '' }}
        />
      );

      expect(screen.getByLabelText(/Review Date/i)).toHaveValue('');
      expect(screen.getByLabelText(/Summary/i)).toHaveValue('');
    });

    it('should handle long summary text', () => {
      const longSummary = 'A'.repeat(500);
      renderWithProviders(
        <CreateSprintReviewModal
          {...defaultProps}
          createReviewData={{ reviewDate: '', summary: longSummary }}
        />
      );

      expect(screen.getByLabelText(/Summary/i)).toHaveValue(longSummary);
    });

    it('should handle both isPending and hasIncrement false', () => {
      renderWithProviders(
        <CreateSprintReviewModal {...defaultProps} isPending={true} hasIncrement={false} />
      );

      expect(screen.getByRole('button', { name: /Creating/i })).toBeDisabled();
    });
  });
});
