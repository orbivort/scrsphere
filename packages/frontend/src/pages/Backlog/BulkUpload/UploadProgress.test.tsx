import { screen, renderWithProviders, initTestI18n } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';

import { UploadProgress } from './UploadProgress';

describe('UploadProgress', () => {
  const mockOnCancel = vi.fn();

  const defaultProps = {
    current: 5,
    total: 10,
    currentItem: 'Test Item',
    isCancelling: false,
    onCancel: mockOnCancel,
  };

  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render progress title', () => {
      renderWithProviders(<UploadProgress {...defaultProps} />);

      expect(screen.getByText('Importing Backlog Items')).toBeInTheDocument();
    });

    it('should render current item being processed', () => {
      renderWithProviders(<UploadProgress {...defaultProps} />);

      expect(screen.getByText(/Creating: "Test Item"/i)).toBeInTheDocument();
    });

    it('should render progress stats', () => {
      renderWithProviders(<UploadProgress {...defaultProps} />);

      expect(screen.getByText('Processed')).toBeInTheDocument();
      expect(screen.getByText('Remaining')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      renderWithProviders(<UploadProgress {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel import/i })).toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate 0% when no items processed', () => {
      renderWithProviders(<UploadProgress {...defaultProps} current={0} total={10} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should calculate 100% when all items processed', () => {
      renderWithProviders(<UploadProgress {...defaultProps} current={10} total={10} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle zero total', () => {
      renderWithProviders(<UploadProgress {...defaultProps} current={0} total={0} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Cancelling State', () => {
    it('should show cancelling message', () => {
      renderWithProviders(<UploadProgress {...defaultProps} isCancelling={true} />);

      expect(screen.getByText('Cancelling...')).toBeInTheDocument();
    });

    it('should show cancelling subtitle', () => {
      renderWithProviders(<UploadProgress {...defaultProps} isCancelling={true} />);

      expect(
        screen.getByText('Please wait while we stop the import process...')
      ).toBeInTheDocument();
    });

    it('should hide cancel button when cancelling', () => {
      renderWithProviders(<UploadProgress {...defaultProps} isCancelling={true} />);

      expect(screen.queryByRole('button', { name: /cancel import/i })).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onCancel when clicking cancel button', async () => {
      renderWithProviders(<UploadProgress {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: /cancel import/i }));

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Optional Props', () => {
    it('should render without current item', () => {
      renderWithProviders(<UploadProgress current={5} total={10} />);

      expect(screen.getByText('Processing your file...')).toBeInTheDocument();
    });

    it('should render without cancel button when onCancel not provided', () => {
      renderWithProviders(<UploadProgress current={5} total={10} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle large numbers', () => {
      renderWithProviders(<UploadProgress current={5000} total={10000} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });
});
