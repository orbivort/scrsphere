import React from 'react';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { BacklogProvider, useBacklogContext } from '../context/BacklogContext';
import { createMockBacklogItem } from '../../../test-utils';
import { ItemStatus, MoSCoWPriority } from '../../../types';

import { ValidationModal } from './ValidationModal';

const mockItem = createMockBacklogItem({
  id: 'pbi-1',
  title: 'Test Feature',
  status: ItemStatus.REFINED,
  priority: MoSCoWPriority.MUST_HAVE,
});

const SetSelectedItem: React.FC = () => {
  const { setSelectedItem } = useBacklogContext();
  React.useEffect(() => {
    setSelectedItem(mockItem);
  }, [setSelectedItem]);
  return null;
};

const mockDorItems = [
  { id: 'dor-1', label: 'Has description', description: 'Item has a clear description' },
  {
    id: 'dor-2',
    label: 'Has acceptance criteria',
    description: 'Item has defined acceptance criteria',
  },
];

const mockDodItems = [
  { id: 'dod-1', label: 'Code reviewed', description: 'Code has been reviewed' },
  { id: 'dod-2', label: 'Tests passed', description: 'All tests pass' },
];

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderValidationModal = (props = {}) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BacklogProvider>
        <SetSelectedItem />
        <ValidationModal
          isOpen={true}
          validationType="ready"
          dorItems={mockDorItems}
          dodItems={mockDodItems}
          validationChecks={{}}
          onCheckChange={vi.fn()}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isUpdating={false}
          {...props}
        />
      </BacklogProvider>
    </QueryClientProvider>
  );
};

describe('ValidationModal', () => {
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when closed', async () => {
      renderValidationModal({ isOpen: false });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should not render when validationType is null', async () => {
      renderValidationModal({ validationType: null });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should render Definition of Ready modal', async () => {
      renderValidationModal({ validationType: 'ready' });

      await waitFor(() => {
        expect(screen.getByText('Definition of Ready')).toBeInTheDocument();
      });
    });

    it('should render Definition of Done modal', async () => {
      renderValidationModal({ validationType: 'done' });

      await waitFor(() => {
        expect(screen.getByText('Definition of Done')).toBeInTheDocument();
      });
    });
  });

  describe('Checklist', () => {
    it('should display all checklist items', async () => {
      renderValidationModal({
        validationType: 'ready',
        dorItems: mockDorItems,
      });

      await waitFor(() => {
        expect(screen.getByText('Has description')).toBeInTheDocument();
        expect(screen.getByText('Has acceptance criteria')).toBeInTheDocument();
      });
    });

    it('should display progress indicator', async () => {
      renderValidationModal({
        validationType: 'ready',
        dorItems: mockDorItems,
        validationChecks: { 'dor-1': true },
      });

      await waitFor(() => {
        expect(screen.getByText(/criteria met/i)).toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    it('should call onCancel when clicking cancel button', async () => {
      renderValidationModal({ onCancel: mockOnCancel });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(mockOnCancel).toHaveBeenCalled();
      });
    });

    it('should disable confirm button when not all checks are complete', async () => {
      renderValidationModal({
        validationType: 'ready',
        dorItems: mockDorItems,
        validationChecks: {},
      });

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm status change/i });
        expect(confirmButton).toBeDisabled();
      });
    });

    it('should enable confirm button when all checks are complete', async () => {
      renderValidationModal({
        validationType: 'ready',
        dorItems: mockDorItems,
        validationChecks: { 'dor-1': true, 'dor-2': true },
      });

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm status change/i });
        expect(confirmButton).not.toBeDisabled();
      });
    });

    it('should show updating state', async () => {
      renderValidationModal({ isUpdating: true });

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /updating/i });
        expect(confirmButton).toBeDisabled();
      });
    });
  });

  describe('Warning Messages', () => {
    it('should show warning when not all criteria are met', async () => {
      renderValidationModal({
        validationType: 'ready',
        dorItems: mockDorItems,
        validationChecks: { 'dor-1': true },
      });

      await waitFor(() => {
        expect(screen.getByText(/criteria must be verified/i)).toBeInTheDocument();
      });
    });
  });
});
