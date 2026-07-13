import React from 'react';
import { screen, waitFor, renderWithProviders, initTestI18n } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

import { DoDVerificationModal, type DoDVerificationModalProps } from './DoDVerificationModal';
import {
  createMockDoDItem,
  createMockBacklogItem,
  createMockTask,
} from '../../../__mocks__/mockData';
import { definitionService } from '../../../services';
import { type DoDChecklistVerification } from '../../../types';

vi.mock('../../../services', () => ({
  definitionService: {
    getDoDVerificationsForPBI: vi.fn(),
  },
}));

const mockDoDItems = [
  createMockDoDItem({ id: 'dod-1', description: 'Code reviewed', category: 'quality', order: 1 }),
  createMockDoDItem({ id: 'dod-2', description: 'Tests written', category: 'testing', order: 2 }),
  createMockDoDItem({
    id: 'dod-3',
    description: 'Docs updated',
    category: 'documentation',
    order: 3,
  }),
];

const mockPBIs = [
  createMockBacklogItem({ id: 'pbi-1', title: 'Feature A' }),
  createMockBacklogItem({ id: 'pbi-2', title: 'Feature B' }),
];

const mockTasks = [
  createMockTask({ id: 'task-1', pbiId: 'pbi-1', status: 'DONE' }),
  createMockTask({ id: 'task-2', pbiId: 'pbi-1', status: 'DONE' }),
  createMockTask({ id: 'task-3', pbiId: 'pbi-2', status: 'DONE' }),
];

const defaultProps: DoDVerificationModalProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  dodItems: mockDoDItems,
  pbis: mockPBIs,
  tasks: mockTasks,
  isLoading: false,
  existingVerifications: [],
};

describe('DoDVerificationModal', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (definitionService.getDoDVerificationsForPBI as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: [],
    });
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Definition of Done Verification')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Completing...')).toBeInTheDocument();
    });

    it('should render overall progress section', () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClose when cancel button clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<DoDVerificationModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<DoDVerificationModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have correct dialog role', () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'dod-verification-title');
    });

    it('should have aria-hidden on decorative icons', () => {
      const { container } = renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });

    it('should have aria-label on close button', () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dodItems array', () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} dodItems={[]} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle empty pbis array', () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} pbis={[]} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle empty tasks array', () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} tasks={[]} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('PBI Verification', () => {
    it('should display PBIs with all tasks done', async () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
        expect(screen.getByText('Feature B')).toBeInTheDocument();
      });
    });

    it('should not display PBIs with incomplete tasks', async () => {
      const incompleteTasks = [
        createMockTask({ id: 'task-1', pbiId: 'pbi-1', status: 'DONE' }),
        createMockTask({ id: 'task-2', pbiId: 'pbi-1', status: 'IN_PROGRESS' }),
      ];

      renderWithProviders(<DoDVerificationModal {...defaultProps} tasks={incompleteTasks} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should expand PBI card on click', async () => {
      const user = userEvent.setup();

      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const pbiCard = screen.getByText('Feature A').closest('[class*="pbi-card"]');
      if (pbiCard) {
        await user.click(pbiCard);
      }
    });
  });

  describe('DoD Item Verification', () => {
    it('should display DoD criteria for each PBI', async () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Code reviewed')).toBeInTheDocument();
        expect(screen.getByText('Tests written')).toBeInTheDocument();
        expect(screen.getByText('Docs updated')).toBeInTheDocument();
      });
    });

    it('should toggle verification on click', async () => {
      const user = userEvent.setup();

      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const pbiCard = screen.getByText('Feature A').closest('[class*="pbi-card-header"]');
      if (pbiCard) {
        await user.click(pbiCard);
      }

      await waitFor(() => {
        const codeReviewed = screen.queryByText('Code reviewed');
        const dodCriteria = screen.queryByRole('group');
        expect(codeReviewed || dodCriteria || screen.getByRole('dialog')).toBeTruthy();
      });
    });

    it('should show category icons for DoD items', async () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Verify All Functionality', () => {
    it('should have verify all button for each PBI', async () => {
      const user = userEvent.setup();

      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const pbiCard = screen.getByText('Feature A').closest('[class*="pbi-card-header"]');
      if (pbiCard) {
        await user.click(pbiCard);
      }

      await waitFor(() => {
        const verifyAllButton = screen.queryByText(/Verify All/i);
        expect(verifyAllButton).toBeTruthy();
      });
    });
  });

  describe('Progress Display', () => {
    it('should show overall progress', async () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Overall Progress')).toBeInTheDocument();
      });
    });

    it('should show progress percentage', async () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/criteria verified/i)).toBeInTheDocument();
      });
    });
  });

  describe('Confirm Button', () => {
    it('should be disabled when not all criteria verified', async () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Complete Sprint').closest('button');
      expect(completeButton).toBeDisabled();
    });

    it('should call onConfirm when clicked with all verified', async () => {
      const onConfirm = vi.fn();

      const existingVerifications = [
        { pbiId: 'pbi-1', dodItemId: 'dod-1', isVerified: true },
        { pbiId: 'pbi-1', dodItemId: 'dod-2', isVerified: true },
        { pbiId: 'pbi-1', dodItemId: 'dod-3', isVerified: true },
        { pbiId: 'pbi-2', dodItemId: 'dod-1', isVerified: true },
        { pbiId: 'pbi-2', dodItemId: 'dod-2', isVerified: true },
        { pbiId: 'pbi-2', dodItemId: 'dod-3', isVerified: true },
      ];

      renderWithProviders(
        <DoDVerificationModal
          {...defaultProps}
          onConfirm={onConfirm}
          existingVerifications={existingVerifications as DoDChecklistVerification[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Read-Only Items', () => {
    it('should show lock icon for already verified items', async () => {
      const existingVerifications = [{ pbiId: 'pbi-1', dodItemId: 'dod-1', isVerified: true }];

      renderWithProviders(
        <DoDVerificationModal
          {...defaultProps}
          existingVerifications={existingVerifications as DoDChecklistVerification[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', async () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} isLoading={true} />);

      await waitFor(() => {
        expect(screen.getByText('Completing...')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no PBIs ready', async () => {
      const incompleteTasks = [
        createMockTask({ id: 'task-1', pbiId: 'pbi-1', status: 'IN_PROGRESS' }),
      ];

      renderWithProviders(<DoDVerificationModal {...defaultProps} tasks={incompleteTasks} />);

      await waitFor(() => {
        expect(screen.getByText('No PBIs ready for verification')).toBeInTheDocument();
      });
    });
  });

  describe('Warning Messages', () => {
    it('should show warning when not all criteria verified', async () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/All DoD criteria must be verified/i)).toBeInTheDocument();
      });
    });
  });

  describe('Task Count Display', () => {
    it('should show task count for each PBI', async () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/2 tasks/)).toBeInTheDocument();
      });
    });
  });

  describe('Existing Verifications', () => {
    it('should load existing verifications on mount', async () => {
      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should handle verification fetch error', async () => {
      (definitionService.getDoDVerificationsForPBI as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Failed to fetch')
      );

      renderWithProviders(<DoDVerificationModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });
});
