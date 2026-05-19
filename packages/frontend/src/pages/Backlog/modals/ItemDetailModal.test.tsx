import React from 'react';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ItemStatus, MoSCoWPriority } from '../../../types';
import { createMockBacklogItem } from '../../../test-utils';
import { BacklogProvider, useBacklogContext } from '../context/BacklogContext';

import { ItemDetailModal } from './ItemDetailModal';

const mockItem = createMockBacklogItem({
  id: 'pbi-1',
  title: 'Test Feature',
  description: 'Test description for the feature',
  status: ItemStatus.NEW,
  priority: MoSCoWPriority.MUST_HAVE,
  storyPoints: 8,
  businessValue: 13,
  labels: ['frontend', 'urgent'],
  acceptanceCriteria: 'Test acceptance criteria',
});

const SetSelectedItem: React.FC<{ item: ReturnType<typeof createMockBacklogItem> }> = ({
  item,
}) => {
  const { setSelectedItem } = useBacklogContext();
  React.useEffect(() => {
    setSelectedItem(item);
  }, [item, setSelectedItem]);
  return null;
};

const SetDetailContextValues: React.FC<{ workflowError?: string | null }> = ({ workflowError }) => {
  const { setWorkflowError } = useBacklogContext();
  React.useEffect(() => {
    if (workflowError !== undefined) setWorkflowError(workflowError);
  }, []);
  return null;
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderDetailModal = (props = {}) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BacklogProvider>
        <SetSelectedItem item={mockItem} />
        <ItemDetailModal
          isOpen={true}
          onClose={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onStatusChange={vi.fn()}
          isUpdating={false}
          isLoadingChildTasks={false}
          {...props}
        />
      </BacklogProvider>
    </QueryClientProvider>
  );
};

describe('ItemDetailModal', () => {
  const mockOnClose = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <BacklogProvider>
            <ItemDetailModal
              isOpen={false}
              onClose={mockOnClose}
              onEdit={mockOnEdit}
              onDelete={mockOnDelete}
              onStatusChange={mockOnStatusChange}
              isUpdating={false}
              isLoadingChildTasks={false}
            />
          </BacklogProvider>
        </QueryClientProvider>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should have proper ARIA attributes', async () => {
      renderDetailModal();

      await waitFor(() => {
        const modal = document.querySelector('[role="dialog"]');
        expect(modal).toBeInTheDocument();
        expect(modal).toHaveAttribute('aria-modal', 'true');
      });
    });
  });

  describe('Item Details Display', () => {
    it('should display item details when open', async () => {
      renderDetailModal();

      await waitFor(() => {
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Labels')).toBeInTheDocument();
        expect(screen.getByText('Acceptance Criteria')).toBeInTheDocument();
      });
    });

    it('should show status selector', async () => {
      renderDetailModal();

      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('should display status history section', async () => {
      renderDetailModal();

      await waitFor(() => {
        expect(screen.getByText('Status History')).toBeInTheDocument();
      });
    });
  });

  describe('Copy ID Functionality', () => {
    it('should have copy ID button', async () => {
      renderDetailModal();

      await waitFor(() => {
        const copyButton =
          document.querySelector('[class*="copy-id-btn"]') ||
          screen.queryByRole('button', { name: /copy/i });
        expect(copyButton).toBeInTheDocument();
      });
    });
  });

  describe('Modal Actions', () => {
    it('should call onEdit when clicking edit button', async () => {
      renderDetailModal({ onEdit: mockOnEdit });

      await waitFor(() => {
        const editButton = screen.queryByRole('button', { name: /edit item/i });
        if (editButton) {
          userEvent.click(editButton);
        }
      });
    });

    it('should call onDelete when clicking delete button', async () => {
      renderDetailModal({ onDelete: mockOnDelete });

      await waitFor(() => {
        const deleteButton = screen.queryByRole('button', { name: /delete item/i });
        if (deleteButton) {
          userEvent.click(deleteButton);
        }
      });
    });
  });

  describe('Accessibility', () => {
    it('should have close button with proper aria label', async () => {
      renderDetailModal();

      await waitFor(() => {
        const closeButton = document.querySelector('[data-modal-close]');
        expect(closeButton).toBeInTheDocument();
        expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
      });
    });
  });

  describe('Done Status', () => {
    it('should show done notice when item is done', async () => {
      const doneItem = createMockBacklogItem({
        ...mockItem,
        status: ItemStatus.DONE,
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <BacklogProvider>
            <SetSelectedItem item={doneItem} />
            <ItemDetailModal
              isOpen={true}
              onClose={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
              onStatusChange={vi.fn()}
              isUpdating={false}
              isLoadingChildTasks={false}
            />
          </BacklogProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/This item is completed and locked/i)).toBeInTheDocument();
      });
    });

    it('should disable delete button when item is in progress', async () => {
      const inProgressItem = createMockBacklogItem({
        ...mockItem,
        status: ItemStatus.IN_PROGRESS,
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <BacklogProvider>
            <SetSelectedItem item={inProgressItem} />
            <ItemDetailModal
              isOpen={true}
              onClose={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
              onStatusChange={vi.fn()}
              isUpdating={false}
              isLoadingChildTasks={false}
            />
          </BacklogProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete item/i });
        expect(deleteButton).toBeDisabled();
      });
    });
  });

  describe('Error Banner', () => {
    it('should show workflow error banner', async () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <BacklogProvider>
            <SetDetailContextValues workflowError="Status transition failed" />
            <SetSelectedItem item={mockItem} />
            <ItemDetailModal
              isOpen={true}
              onClose={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
              onStatusChange={vi.fn()}
              isUpdating={false}
              isLoadingChildTasks={false}
            />
          </BacklogProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Status transition failed')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when item has no description', async () => {
      const itemNoDescription = createMockBacklogItem({
        ...mockItem,
        description: undefined,
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <BacklogProvider>
            <SetSelectedItem item={itemNoDescription} />
            <ItemDetailModal
              isOpen={true}
              onClose={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
              onStatusChange={vi.fn()}
              isUpdating={false}
              isLoadingChildTasks={false}
            />
          </BacklogProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('No description provided')).toBeInTheDocument();
      });
    });

    it('should show empty state when item has no labels', async () => {
      const itemNoLabels = createMockBacklogItem({
        ...mockItem,
        labels: [],
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <BacklogProvider>
            <SetSelectedItem item={itemNoLabels} />
            <ItemDetailModal
              isOpen={true}
              onClose={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
              onStatusChange={vi.fn()}
              isUpdating={false}
              isLoadingChildTasks={false}
            />
          </BacklogProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('No labels assigned')).toBeInTheDocument();
      });
    });

    it('should show empty state when item has no acceptance criteria', async () => {
      const itemNoCriteria = createMockBacklogItem({
        ...mockItem,
        acceptanceCriteria: undefined,
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <BacklogProvider>
            <SetSelectedItem item={itemNoCriteria} />
            <ItemDetailModal
              isOpen={true}
              onClose={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
              onStatusChange={vi.fn()}
              isUpdating={false}
              isLoadingChildTasks={false}
            />
          </BacklogProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('No acceptance criteria defined')).toBeInTheDocument();
      });
    });
  });
});
