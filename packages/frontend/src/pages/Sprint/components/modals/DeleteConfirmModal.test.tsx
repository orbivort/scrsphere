import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { DeleteConfirmModal, type DeleteConfirmModalProps } from './DeleteConfirmModal';
import { TaskStatus, type Task } from '../../../../types';

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  sprintId: 'sprint-1',
  pbiId: 'pbi-1',
  title: 'Test Task',
  description: 'Test description',
  status: TaskStatus.TODO,
  assigneeId: 'user-1',
  estimatedHours: 8,
  remainingHours: 5,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const defaultProps: DeleteConfirmModalProps = {
  task: createMockTask(),
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  isDeleting: false,
  modalRef: { current: null },
};

describe('DeleteConfirmModal', () => {
  describe('Rendering', () => {
    it('should render modal with alertdialog role', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('should render modal title', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      // "Delete Task" appears multiple times (title, button, warning)
      const titleElements = screen.getAllByText('Delete Task');
      expect(titleElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render warning message', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.getByText(/This action is permanent and cannot be undone/)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      // "Delete Task" appears in both the button and the warning subtitle
      const deleteElements = screen.getAllByText('Delete Task');
      expect(deleteElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render task title in warning', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.getByText(/Test Task/)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onConfirm when delete button clicked', async () => {
      const onConfirm = vi.fn();
      const user = userEvent.setup();

      render(<DeleteConfirmModal {...defaultProps} onConfirm={onConfirm} />);

      // Find the delete button by its class (it has button-danger class)
      const deleteButton = document.querySelector('button[class*="danger"]');
      expect(deleteButton).toBeInTheDocument();

      if (deleteButton) {
        await user.click(deleteButton);
        expect(onConfirm).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Loading State', () => {
    it('should show loading text when deleting', () => {
      render(<DeleteConfirmModal {...defaultProps} isDeleting={true} />);

      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });

    it('should disable delete button when deleting', () => {
      render(<DeleteConfirmModal {...defaultProps} isDeleting={true} />);

      const deleteButton = document.querySelector('button[class*="danger"]');
      expect(deleteButton).toBeDisabled();
    });

    it('should disable cancel button when deleting', () => {
      render(<DeleteConfirmModal {...defaultProps} isDeleting={true} />);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct alertdialog role', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'delete-modal-title');
    });

    it('should have aria-describedby pointing to description', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'delete-modal-desc');
    });

    it('should have aria-hidden on decorative icons', () => {
      const { container } = render(<DeleteConfirmModal {...defaultProps} />);

      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });

    it('should have aria-label on close button', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle long task titles', () => {
      const longTitle = 'A'.repeat(100);
      render(<DeleteConfirmModal {...defaultProps} task={createMockTask({ title: longTitle })} />);

      expect(screen.getByText(new RegExp(longTitle))).toBeInTheDocument();
    });

    it('should handle empty task title', () => {
      render(<DeleteConfirmModal {...defaultProps} task={createMockTask({ title: '' })} />);

      expect(screen.getByText(/Unknown Task/)).toBeInTheDocument();
    });
  });
});
