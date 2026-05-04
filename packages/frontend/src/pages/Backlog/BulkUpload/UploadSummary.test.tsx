import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { UploadSummary } from './UploadSummary';
import type { UploadResult } from './bulkUploadUtils';

vi.mock('./BulkUploadModal.module.css', () => ({
  default: {
    'summary-container': 'summary-container',
    'summary-icon': 'summary-icon',
    success: 'success',
    partial: 'partial',
    error: 'error',
    'summary-title': 'summary-title',
    'summary-subtitle': 'summary-subtitle',
    'summary-stats': 'summary-stats',
    'summary-stat': 'summary-stat',
    total: 'total',
    'summary-stat-value': 'summary-stat-value',
    'summary-stat-label': 'summary-stat-label',
    failed: 'failed',
    'error-summary': 'error-summary',
    'error-summary-title': 'error-summary-title',
    'error-list-container': 'error-list-container',
    'error-item': 'error-item',
    'error-item-row': 'error-item-row',
    'error-item-message': 'error-item-message',
    'error-more-link': 'error-more-link',
    'summary-actions': 'summary-actions',
    btn: 'btn',
    'btn-primary': 'btn-primary',
    'btn-secondary': 'btn-secondary',
  },
}));

describe('UploadSummary', () => {
  const mockOnClose = vi.fn();
  const mockOnViewItems = vi.fn();

  const defaultProps = {
    onClose: mockOnClose,
    onViewItems: mockOnViewItems,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Success State', () => {
    const successResult: UploadResult = {
      total: 5,
      successful: 5,
      failed: 0,
      duplicates: 0,
      errors: [],
      createdItems: [],
    };

    it('should render success title', () => {
      render(<UploadSummary {...defaultProps} result={successResult} />);

      expect(screen.getByText('Import Complete!')).toBeInTheDocument();
    });

    it('should render success subtitle', () => {
      render(<UploadSummary {...defaultProps} result={successResult} />);

      expect(screen.getByText(/Successfully imported 5 backlog items/)).toBeInTheDocument();
    });

    it('should display total and imported labels', () => {
      render(<UploadSummary {...defaultProps} result={successResult} />);

      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Imported')).toBeInTheDocument();
    });

    it('should render View Imported Items button', () => {
      render(<UploadSummary {...defaultProps} result={successResult} />);

      expect(screen.getByRole('button', { name: /view imported items/i })).toBeInTheDocument();
    });
  });

  describe('Partial Success State', () => {
    const partialResult: UploadResult = {
      total: 5,
      successful: 3,
      failed: 2,
      duplicates: 0,
      errors: [
        { row: 3, field: 'title', message: 'Duplicate title' },
        { row: 5, field: 'title', message: 'Invalid title' },
      ],
      createdItems: [],
    };

    it('should render partial success title', () => {
      render(<UploadSummary {...defaultProps} result={partialResult} />);

      expect(screen.getByText('Import Completed with Errors')).toBeInTheDocument();
    });

    it('should render partial success subtitle', () => {
      render(<UploadSummary {...defaultProps} result={partialResult} />);

      expect(screen.getByText(/3 items imported, 2 failed/)).toBeInTheDocument();
    });

    it('should display error list', () => {
      render(<UploadSummary {...defaultProps} result={partialResult} />);

      expect(screen.getByText('Errors (2)')).toBeInTheDocument();
    });
  });

  describe('Failure State', () => {
    const failureResult: UploadResult = {
      total: 5,
      successful: 0,
      failed: 5,
      duplicates: 0,
      errors: [
        { row: 1, field: 'title', message: 'Missing title' },
        { row: 2, field: 'title', message: 'Missing title' },
      ],
      createdItems: [],
    };

    it('should render failure title', () => {
      render(<UploadSummary {...defaultProps} result={failureResult} />);

      expect(screen.getByText('Import Failed')).toBeInTheDocument();
    });

    it('should render failure subtitle', () => {
      render(<UploadSummary {...defaultProps} result={failureResult} />);

      expect(screen.getByText('No items were imported due to errors.')).toBeInTheDocument();
    });
  });

  describe('Error Truncation', () => {
    const manyErrorsResult: UploadResult = {
      total: 10,
      successful: 0,
      failed: 10,
      duplicates: 0,
      errors: Array.from({ length: 10 }, (_, i) => ({
        row: i + 1,
        field: 'title',
        message: `Error ${i + 1}`,
      })),
      createdItems: [],
    };

    it('should show only first 5 errors', () => {
      render(<UploadSummary {...defaultProps} result={manyErrorsResult} />);

      expect(screen.getByText('Row 1:')).toBeInTheDocument();
      expect(screen.getByText('Row 5:')).toBeInTheDocument();
    });

    it('should show "more errors" message', () => {
      render(<UploadSummary {...defaultProps} result={manyErrorsResult} />);

      expect(screen.getByText(/and 5 more errors/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    const successResult: UploadResult = {
      total: 5,
      successful: 5,
      failed: 0,
      duplicates: 0,
      errors: [],
      createdItems: [],
    };

    it('should call onClose when clicking close button', async () => {
      render(<UploadSummary {...defaultProps} result={successResult} />);

      await userEvent.click(screen.getByRole('button', { name: /close/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onViewItems when clicking view items button', async () => {
      render(<UploadSummary {...defaultProps} result={successResult} />);

      await userEvent.click(screen.getByRole('button', { name: /view imported items/i }));

      expect(mockOnViewItems).toHaveBeenCalled();
    });
  });

  describe('Singular/Plural Handling', () => {
    it('should use singular form for single item', () => {
      const singleResult: UploadResult = {
        total: 1,
        successful: 1,
        failed: 0,
        duplicates: 0,
        errors: [],
        createdItems: [],
      };

      render(<UploadSummary {...defaultProps} result={singleResult} />);

      expect(screen.getByText(/Successfully imported 1 backlog item\./)).toBeInTheDocument();
    });

    it('should use plural form for multiple items', () => {
      const multipleResult: UploadResult = {
        total: 2,
        successful: 2,
        failed: 0,
        duplicates: 0,
        errors: [],
        createdItems: [],
      };

      render(<UploadSummary {...defaultProps} result={multipleResult} />);

      expect(screen.getByText(/Successfully imported 2 backlog items\./)).toBeInTheDocument();
    });
  });
});
