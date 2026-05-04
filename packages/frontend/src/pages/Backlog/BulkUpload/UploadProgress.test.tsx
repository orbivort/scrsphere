import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render progress title', () => {
      render(<UploadProgress {...defaultProps} />);

      expect(screen.getByText('Importing Backlog Items')).toBeInTheDocument();
    });

    it('should render current item being processed', () => {
      render(<UploadProgress {...defaultProps} />);

      expect(screen.getByText(/Creating: "Test Item"/i)).toBeInTheDocument();
    });

    it('should render progress stats', () => {
      render(<UploadProgress {...defaultProps} />);

      expect(screen.getByText('Processed')).toBeInTheDocument();
      expect(screen.getByText('Remaining')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      render(<UploadProgress {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel import/i })).toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate 0% when no items processed', () => {
      render(<UploadProgress {...defaultProps} current={0} total={10} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should calculate 100% when all items processed', () => {
      render(<UploadProgress {...defaultProps} current={10} total={10} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle zero total', () => {
      render(<UploadProgress {...defaultProps} current={0} total={0} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Cancelling State', () => {
    it('should show cancelling message', () => {
      render(<UploadProgress {...defaultProps} isCancelling={true} />);

      expect(screen.getByText('Cancelling...')).toBeInTheDocument();
    });

    it('should show cancelling subtitle', () => {
      render(<UploadProgress {...defaultProps} isCancelling={true} />);

      expect(
        screen.getByText('Please wait while we stop the import process...')
      ).toBeInTheDocument();
    });

    it('should hide cancel button when cancelling', () => {
      render(<UploadProgress {...defaultProps} isCancelling={true} />);

      expect(screen.queryByRole('button', { name: /cancel import/i })).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onCancel when clicking cancel button', async () => {
      render(<UploadProgress {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: /cancel import/i }));

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Optional Props', () => {
    it('should render without current item', () => {
      render(<UploadProgress current={5} total={10} />);

      expect(screen.getByText('Processing your file...')).toBeInTheDocument();
    });

    it('should render without cancel button when onCancel not provided', () => {
      render(<UploadProgress current={5} total={10} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle large numbers', () => {
      render(<UploadProgress current={5000} total={10000} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });
});
