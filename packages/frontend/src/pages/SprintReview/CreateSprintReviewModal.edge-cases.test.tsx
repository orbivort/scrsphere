import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { CreateSprintReviewModal } from './CreateSprintReviewModal';

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

vi.mock('../../hooks/useModalFocus', () => ({
  useModalFocus: () => ({ modalRef: { current: null } }),
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

describe('CreateSprintReviewModal - Additional Edge Case Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Date Input Edge Cases', () => {
    it('should handle empty date value', () => {
      const setCreateReviewData = vi.fn();
      render(
        <CreateSprintReviewModal
          {...defaultProps}
          createReviewData={{ reviewDate: '', summary: '' }}
          setCreateReviewData={setCreateReviewData}
        />
      );

      const dateInput = screen.getByLabelText(/Review Date/i);
      expect(dateInput).toHaveValue('');
    });

    it('should handle date change to empty string', () => {
      const setCreateReviewData = vi.fn();
      render(
        <CreateSprintReviewModal {...defaultProps} setCreateReviewData={setCreateReviewData} />
      );

      const dateInput = screen.getByLabelText(/Review Date/i);
      fireEvent.change(dateInput, { target: { value: '' } });

      expect(setCreateReviewData).toHaveBeenCalledWith({
        reviewDate: '',
        summary: 'Test summary',
      });
    });

    it('should handle date change to valid date', () => {
      const setCreateReviewData = vi.fn();
      render(
        <CreateSprintReviewModal {...defaultProps} setCreateReviewData={setCreateReviewData} />
      );

      const dateInput = screen.getByLabelText(/Review Date/i);
      fireEvent.change(dateInput, { target: { value: '2026-12-31' } });

      expect(setCreateReviewData).toHaveBeenCalledWith({
        reviewDate: '2026-12-31',
        summary: 'Test summary',
      });
    });

    it('should handle past dates', () => {
      const setCreateReviewData = vi.fn();
      render(
        <CreateSprintReviewModal
          {...defaultProps}
          createReviewData={{ reviewDate: '2020-01-01', summary: '' }}
          setCreateReviewData={setCreateReviewData}
        />
      );

      const dateInput = screen.getByLabelText(/Review Date/i);
      expect(dateInput).toHaveValue('2020-01-01');
    });

    it('should handle future dates', () => {
      const setCreateReviewData = vi.fn();
      render(
        <CreateSprintReviewModal
          {...defaultProps}
          createReviewData={{ reviewDate: '2030-12-31', summary: '' }}
          setCreateReviewData={setCreateReviewData}
        />
      );

      const dateInput = screen.getByLabelText(/Review Date/i);
      expect(dateInput).toHaveValue('2030-12-31');
    });
  });

  describe('Summary Input Edge Cases', () => {
    it('should handle very long summary text', () => {
      const longSummary = 'A'.repeat(1000);
      render(
        <CreateSprintReviewModal
          {...defaultProps}
          createReviewData={{ reviewDate: '2026-01-14', summary: longSummary }}
        />
      );

      const textarea = screen.getByLabelText(/Summary/i);
      expect(textarea).toHaveValue(longSummary);
    });

    it('should handle special characters in summary', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      render(
        <CreateSprintReviewModal
          {...defaultProps}
          createReviewData={{ reviewDate: '2026-01-14', summary: specialChars }}
        />
      );

      const textarea = screen.getByLabelText(/Summary/i);
      expect(textarea).toHaveValue(specialChars);
    });

    it('should handle unicode characters in summary', () => {
      const unicodeText = '你好世界 🌍 مرحبا';
      render(
        <CreateSprintReviewModal
          {...defaultProps}
          createReviewData={{ reviewDate: '2026-01-14', summary: unicodeText }}
        />
      );

      const textarea = screen.getByLabelText(/Summary/i);
      expect(textarea).toHaveValue(unicodeText);
    });

    it('should handle multiline summary', () => {
      const multilineSummary = 'Line 1\nLine 2\nLine 3';
      render(
        <CreateSprintReviewModal
          {...defaultProps}
          createReviewData={{ reviewDate: '2026-01-14', summary: multilineSummary }}
        />
      );

      const textarea = screen.getByLabelText(/Summary/i);
      expect(textarea).toHaveValue(multilineSummary);
    });

    it('should handle summary with only whitespace', () => {
      const setCreateReviewData = vi.fn();
      render(
        <CreateSprintReviewModal {...defaultProps} setCreateReviewData={setCreateReviewData} />
      );

      const textarea = screen.getByLabelText(/Summary/i);
      fireEvent.change(textarea, { target: { value: '   ' } });

      expect(setCreateReviewData).toHaveBeenCalledWith({
        reviewDate: '2026-01-14',
        summary: '   ',
      });
    });
  });

  describe('Error State Combinations', () => {
    it('should display multiple errors simultaneously', () => {
      render(
        <CreateSprintReviewModal
          {...defaultProps}
          formErrors={{
            reviewDate: 'Review date is required',
            increment: 'No delivered increment found',
          }}
          isError={true}
          error={new Error('API error')}
        />
      );

      expect(screen.getByText('Review date is required')).toBeInTheDocument();
      expect(screen.getByText('No delivered increment found')).toBeInTheDocument();
      expect(screen.getByText('API error')).toBeInTheDocument();
    });

    it('should display error with non-Error object', () => {
      render(<CreateSprintReviewModal {...defaultProps} isError={true} error={null} />);

      expect(
        screen.getByText('Failed to create sprint review. Please try again.')
      ).toBeInTheDocument();
    });

    it('should display error with string error', () => {
      render(
        <CreateSprintReviewModal
          {...defaultProps}
          isError={true}
          error={'String error' as unknown as Error}
        />
      );

      expect(
        screen.getByText('Failed to create sprint review. Please try again.')
      ).toBeInTheDocument();
    });

    it('should clear errors when closing modal', () => {
      const onClose = vi.fn();
      const setFormErrors = vi.fn();
      render(
        <CreateSprintReviewModal
          {...defaultProps}
          onClose={onClose}
          setFormErrors={setFormErrors}
          formErrors={{ reviewDate: 'Error' }}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(setFormErrors).toHaveBeenCalledWith({});
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Button State Combinations', () => {
    it('should disable button when isPending is true regardless of hasIncrement', () => {
      render(<CreateSprintReviewModal {...defaultProps} isPending={true} hasIncrement={false} />);

      expect(screen.getByRole('button', { name: /Creating/i })).toBeDisabled();
    });

    it('should disable button when hasIncrement is false regardless of isPending', () => {
      render(<CreateSprintReviewModal {...defaultProps} isPending={false} hasIncrement={false} />);

      expect(screen.getByRole('button', { name: /Create Review/i })).toBeDisabled();
    });

    it('should enable button only when both isPending is false and hasIncrement is true', () => {
      render(<CreateSprintReviewModal {...defaultProps} isPending={false} hasIncrement={true} />);

      expect(screen.getByRole('button', { name: /Create Review/i })).not.toBeDisabled();
    });

    it('should show Creating... text when isPending is true', () => {
      render(<CreateSprintReviewModal {...defaultProps} isPending={true} />);

      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  describe('Focus and Keyboard Interactions', () => {
    it('should have type="button" on close button', () => {
      render(<CreateSprintReviewModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /Close dialog/i });
      expect(closeButton).toHaveAttribute('type', 'button');
    });

    it('should have cancel button', () => {
      render(<CreateSprintReviewModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      expect(cancelButton).toBeInTheDocument();
    });

    it('should have aria-label on close button', () => {
      render(<CreateSprintReviewModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /Close dialog/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close dialog');
    });
  });

  describe('Modal Visibility', () => {
    it('should not render anything when isOpen is false', () => {
      render(<CreateSprintReviewModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render all elements when isOpen is true', () => {
      render(<CreateSprintReviewModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/Review Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Summary/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Review/i })).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit when Create Review button is clicked', () => {
      const onSubmit = vi.fn();
      render(<CreateSprintReviewModal {...defaultProps} onSubmit={onSubmit} />);

      fireEvent.click(screen.getByRole('button', { name: /Create Review/i }));

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should not call onSubmit when button is disabled', () => {
      const onSubmit = vi.fn();
      render(
        <CreateSprintReviewModal {...defaultProps} onSubmit={onSubmit} hasIncrement={false} />
      );

      fireEvent.click(screen.getByRole('button', { name: /Create Review/i }));

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('ARIA and Accessibility', () => {
    it('should have aria-required on date input', () => {
      render(<CreateSprintReviewModal {...defaultProps} />);

      const dateInput = screen.getByLabelText(/Review Date/i);
      expect(dateInput).toHaveAttribute('aria-required', 'true');
    });

    it('should have aria-invalid set to true when error exists', () => {
      render(<CreateSprintReviewModal {...defaultProps} formErrors={{ reviewDate: 'Required' }} />);

      const dateInput = screen.getByLabelText(/Review Date/i);
      expect(dateInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-invalid set to false when no error', () => {
      render(<CreateSprintReviewModal {...defaultProps} formErrors={{}} />);

      const dateInput = screen.getByLabelText(/Review Date/i);
      expect(dateInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('should have role="alert" on error messages', () => {
      render(<CreateSprintReviewModal {...defaultProps} formErrors={{ reviewDate: 'Required' }} />);

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Required');
    });

    it('should have proper id on error message for aria-describedby', () => {
      render(<CreateSprintReviewModal {...defaultProps} formErrors={{ reviewDate: 'Required' }} />);

      const dateInput = screen.getByLabelText(/Review Date/i);
      const errorId = dateInput.getAttribute('aria-describedby');
      expect(errorId).toBe('review-date-error');

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveAttribute('id', 'review-date-error');
    });
  });

  describe('Increment Warning Display', () => {
    it('should show increment warning when formErrors.increment exists', () => {
      render(
        <CreateSprintReviewModal
          {...defaultProps}
          formErrors={{ increment: 'No delivered increment found' }}
        />
      );

      expect(screen.getByText('No delivered increment found')).toBeInTheDocument();
    });

    it('should not show increment warning when formErrors.increment does not exist', () => {
      render(<CreateSprintReviewModal {...defaultProps} formErrors={{}} />);

      expect(screen.queryByText('No delivered increment found')).not.toBeInTheDocument();
    });

    it('should show warning icon when increment warning is displayed', () => {
      render(
        <CreateSprintReviewModal
          {...defaultProps}
          formErrors={{ increment: 'No delivered increment found' }}
        />
      );

      const warningContainer = screen.getByText('No delivered increment found').parentElement;
      expect(warningContainer).toHaveClass('modal-warning');
    });
  });

  describe('Close Button Behavior', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<CreateSprintReviewModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: /Close dialog/i }));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Summary Placeholder', () => {
    it('should display placeholder text in summary textarea', () => {
      render(
        <CreateSprintReviewModal
          {...defaultProps}
          createReviewData={{ reviewDate: '', summary: '' }}
        />
      );

      const textarea = screen.getByLabelText(/Summary/i);
      expect(textarea).toHaveAttribute('placeholder', 'Enter a summary of the sprint review...');
    });
  });

  describe('Required Field Indicators', () => {
    it('should show asterisk on Review Date label', () => {
      render(<CreateSprintReviewModal {...defaultProps} />);

      const label = screen.getByText(/Review Date/);
      expect(label.textContent).toContain('*');
    });

    it('should show (Optional) on Summary label', () => {
      render(<CreateSprintReviewModal {...defaultProps} />);

      expect(screen.getByText(/Summary \(Optional\)/i)).toBeInTheDocument();
    });
  });
});
