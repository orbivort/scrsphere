import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { StatusChangeModal, type StatusChangeModalProps } from './StatusChangeModal';

import type { StatusConfig } from '@/components/StatusSelector';
import type { StatusChangeHistoryItem } from '@/components/StatusHistorySection';

// Mock the StatusHistorySection component
vi.mock('@/components/StatusHistorySection', () => ({
  StatusHistorySection: vi.fn(({ history, isLoading }) => (
    <div data-testid="status-history-section">
      {isLoading ? 'Loading...' : `History items: ${history.length}`}
    </div>
  )),
}));

type TestStatus = 'new' | 'active' | 'completed' | 'abandoned';

const mockStatuses: TestStatus[] = ['new', 'active', 'completed', 'abandoned'];

const mockStatusConfig: Record<TestStatus, StatusConfig> = {
  new: {
    label: 'New',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    borderColor: '#d1d5db',
    icon: 'M12 4v16m8-8H4',
    description: 'Goal is newly created and not yet started',
  },
  active: {
    label: 'Active',
    color: '#2563eb',
    bgColor: '#dbeafe',
    borderColor: '#93c5fd',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    description: 'Goal is currently being worked on',
  },
  completed: {
    label: 'Completed',
    color: '#059669',
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
    icon: 'M5 13l4 4L19 7',
    description: 'Goal has been successfully achieved',
  },
  abandoned: {
    label: 'Abandoned',
    color: '#dc2626',
    bgColor: '#fee2e2',
    borderColor: '#fca5a5',
    icon: 'M6 18L18 6M6 6l12 12',
    description: 'Goal has been discontinued',
  },
};

const mockHistory: StatusChangeHistoryItem[] = [
  {
    id: 'history-1',
    status: 'new',
    changedAt: '2024-01-01T00:00:00Z',
    changedBy: { name: 'John Doe' },
  },
  {
    id: 'history-2',
    status: 'active',
    changedAt: '2024-01-15T00:00:00Z',
    changedBy: { name: 'Jane Smith' },
  },
];

const defaultProps: StatusChangeModalProps<TestStatus> = {
  isOpen: true,
  onClose: vi.fn(),
  onStatusChange: vi.fn(),
  entityTitle: 'Test Goal',
  entityType: 'goal',
  currentStatus: 'new',
  statuses: mockStatuses,
  statusConfig: mockStatusConfig,
  statusHistory: mockHistory,
  isLoading: false,
  isHistoryLoading: false,
  error: null,
  validationMessage: null,
  isViewOnly: false,
};

const setup = (overrides: Partial<StatusChangeModalProps<TestStatus>> = {}) => {
  const props = { ...defaultProps, ...overrides };
  return {
    render: () => render(<StatusChangeModal {...props} />),
    props,
  };
};

describe('StatusChangeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render modal with correct title in edit mode', () => {
      const { render } = setup({ isViewOnly: false });
      render();

      expect(screen.getByText('Change Status')).toBeInTheDocument();
      expect(screen.getByText('Update the status of this product goal')).toBeInTheDocument();
    });

    test('should render modal with correct title in view-only mode', () => {
      const { render } = setup({ isViewOnly: true });
      render();

      expect(screen.getByText('Status History')).toBeInTheDocument();
      expect(screen.getByText('View status history for this product goal')).toBeInTheDocument();
    });

    test('should not render when isOpen is false', () => {
      const { render } = setup({ isOpen: false });
      render();

      expect(screen.queryByText('Change Status')).not.toBeInTheDocument();
      expect(screen.queryByText('Status History')).not.toBeInTheDocument();
    });

    test('should display entity title', () => {
      const { render } = setup({ entityTitle: 'My Test Goal' });
      render();

      expect(screen.getByText('My Test Goal')).toBeInTheDocument();
    });

    test('should display entity type label', () => {
      const { render } = setup({ entityType: 'goal' });
      render();

      expect(screen.getByText('Product Goal')).toBeInTheDocument();
    });

    test('should display backlog item entity type label', () => {
      const { render } = setup({ entityType: 'backlog-item' });
      render();

      expect(screen.getByText('Backlog Item')).toBeInTheDocument();
    });
  });

  describe('Status Options', () => {
    test('should render all status options', () => {
      const { render } = setup();
      render();

      // Status labels are inside spans, use more flexible matching
      expect(screen.getByRole('radio', { name: /New/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Active/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Completed/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Abandoned/i })).toBeInTheDocument();
    });

    test('should mark current status', () => {
      const { render } = setup({ currentStatus: 'active' });
      render();

      expect(screen.getByText('Active (Current)')).toBeInTheDocument();
    });

    test('should allow selecting a new status', () => {
      const { render } = setup();
      render();

      const activeOption = screen.getByRole('radio', { name: /Active/i });
      fireEvent.click(activeOption);

      expect(activeOption).toHaveAttribute('aria-checked', 'true');
    });

    test('should not show status selection in view-only mode', () => {
      const { render } = setup({ isViewOnly: true });
      render();

      expect(screen.queryByText('Select New Status')).not.toBeInTheDocument();
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    });
  });

  describe('Status History', () => {
    test('should render status history section', () => {
      const { render } = setup();
      render();

      expect(screen.getByTestId('status-history-section')).toBeInTheDocument();
    });

    test('should pass history data to StatusHistorySection', () => {
      const { render } = setup({ statusHistory: mockHistory });
      render();

      expect(screen.getByTestId('status-history-section')).toHaveTextContent('History items: 2');
    });

    test('should show loading state for history', () => {
      const { render } = setup({ isHistoryLoading: true });
      render();

      expect(screen.getByTestId('status-history-section')).toHaveTextContent('Loading...');
    });
  });

  describe('Error Handling', () => {
    test('should display error message when provided', () => {
      const { render } = setup({ error: 'Failed to change status' });
      render();

      expect(screen.getByText('Failed to change status')).toBeInTheDocument();
    });

    test('should display validation message when provided', () => {
      const { render } = setup({ validationMessage: 'Warning: This action cannot be undone' });
      render();

      expect(screen.getByText('Warning: This action cannot be undone')).toBeInTheDocument();
    });

    test('should not display error banner when no error', () => {
      const { render } = setup({ error: null });
      render();

      // Error banner uses a specific role or class - checking by absence of error text
      expect(screen.queryByText('Failed to change status')).not.toBeInTheDocument();
    });
  });

  describe('Modal Actions', () => {
    test('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      const { render } = setup({ onClose });
      render();

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    test('should call onClose when cancel button is clicked', () => {
      const onClose = vi.fn();
      const { render } = setup({ onClose });
      render();

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    test('should show Close button in view-only mode instead of Cancel', () => {
      const { render } = setup({ isViewOnly: true });
      render();

      expect(screen.getByText('Close')).toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  describe('Status Change Submission', () => {
    test('should call onStatusChange when confirming status change', async () => {
      const onStatusChange = vi.fn();
      const { render } = setup({ onStatusChange });
      render();

      // Select a different status
      const activeOption = screen.getByRole('radio', { name: /Active/i });
      fireEvent.click(activeOption);

      // Click confirm
      const confirmButton = screen.getByText('Confirm Change');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(onStatusChange).toHaveBeenCalledWith('active');
      });
    });

    test('should not allow confirming when no status change', () => {
      const { render } = setup({
        currentStatus: 'new',
      });
      render();

      // Confirm button should be disabled when no change is made
      const confirmButton = screen.getByText('Confirm Change').closest('button');
      expect(confirmButton).toBeDisabled();
    });

    test('should disable confirm button when no changes', () => {
      const { render } = setup({ currentStatus: 'new' });
      render();

      // Don't change the status - keep it as 'new'
      const confirmButton = screen.getByText('Confirm Change').closest('button');
      expect(confirmButton).toBeDisabled();
    });

    test('should disable status options when submitting', async () => {
      const onStatusChange = vi.fn(() => new Promise(() => {})); // Never resolves
      const { render } = setup({ onStatusChange });
      render();

      // Select a different status to enable confirm button
      const activeOption = screen.getByRole('radio', { name: /Active/i });
      fireEvent.click(activeOption);

      // Click confirm to start submitting
      const confirmButton = screen.getByText('Confirm Change').closest('button');
      if (confirmButton) {
        fireEvent.click(confirmButton);
      }

      // Wait for submitting state
      await waitFor(() => {
        expect(screen.getByText('Updating...')).toBeInTheDocument();
      });

      // Status options should be disabled during submission
      const statusOptions = screen.getAllByRole('radio');
      statusOptions.forEach((option) => {
        expect(option).toBeDisabled();
      });
    });

    test('should not show confirm button in view-only mode', () => {
      const { render } = setup({ isViewOnly: true });
      render();

      expect(screen.queryByText('Confirm Change')).not.toBeInTheDocument();
    });

    test('should show loading text when submitting', () => {
      const onStatusChange = vi.fn(() => new Promise(() => {})); // Never resolves
      const { render } = setup({ onStatusChange });
      render();

      // Select a different status
      const activeOption = screen.getByRole('radio', { name: /Active/i });
      fireEvent.click(activeOption);

      // Click confirm
      const confirmButton = screen.getByText('Confirm Change');
      fireEvent.click(confirmButton);

      expect(screen.getByText('Updating...')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    test('should close on Escape key', () => {
      const onClose = vi.fn();
      const { render } = setup({ onClose });
      render();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });

    test('should not close on Escape when submitting', () => {
      const onClose = vi.fn();
      const onStatusChange = vi.fn(() => new Promise(() => {}));
      const { render } = setup({ onClose, onStatusChange });
      render();

      // Start submitting
      const activeOption = screen.getByRole('radio', { name: /Active/i });
      fireEvent.click(activeOption);
      const confirmButton = screen.getByText('Confirm Change');
      fireEvent.click(confirmButton);

      // Try to close with Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Overlay Click', () => {
    test('should close when clicking overlay', () => {
      const onClose = vi.fn();
      const { render } = setup({ onClose });
      render();

      const overlay = screen.getByRole('dialog').parentElement;
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(onClose).toHaveBeenCalled();
    });

    test('should not close when clicking modal content', () => {
      const onClose = vi.fn();
      const { render } = setup({ onClose });
      render();

      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
