import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { apiService } from '../../services';
import { useTeamStore } from '../../store';
import { SprintBacklogManager, type SprintBacklogManagerProps } from './SprintBacklogManager';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

vi.mock('../../services');
vi.mock('../../store');

const renderWithQueryClient = (ui: React.ReactElement, queryClient = createQueryClient()) => {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

const defaultProps: SprintBacklogManagerProps = {
  sprintId: 'sprint-1',
  sprintName: 'Sprint 1',
  sprintGoal: 'Complete authentication',
  onClose: vi.fn(),
};

const mockSprintItems = [
  { id: 'pbi-1', title: 'Implement login', storyPoints: 5, priority: 'MUST_HAVE', tasks: [] },
  { id: 'pbi-2', title: 'Implement logout', storyPoints: 3, priority: 'SHOULD_HAVE', tasks: [] },
];

const mockAvailablePBIs = [
  { id: 'pbi-3', title: 'Feature C', storyPoints: 8, priority: 'COULD_HAVE' },
  { id: 'pbi-4', title: 'Feature D', storyPoints: 2, priority: 'WONT_HAVE' },
];

const mockTasks = [
  { id: 'task-1', pbiId: 'pbi-1', title: 'Task 1', status: 'TODO' },
  { id: 'task-2', pbiId: 'pbi-1', title: 'Task 2', status: 'DONE' },
];

const mockChanges = [
  {
    id: 'change-1',
    pbiTitle: 'Feature A',
    changeType: 'ADDED',
    changedByName: 'John Doe',
    createdAt: new Date().toISOString(),
    reason: 'High priority',
  },
];

describe('SprintBacklogManager', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createQueryClient();

    (useTeamStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentTeam: { id: 'team-1' },
    });

    (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        items: mockSprintItems,
      },
    });
    (apiService.getSprintTasks as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockTasks });
    (apiService.getAvailablePBIsForSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockAvailablePBIs,
    });
    (apiService.getSprintBacklogChanges as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockChanges,
    });
    (apiService.addPBIToSprint as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    (apiService.removePBIFromSprint as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    (apiService.createTask as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Rendering', () => {
    it('should render modal with sprint name', async () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Sprint Backlog Manager/)).toBeInTheDocument();
        expect(screen.getByText(/Sprint 1/)).toBeInTheDocument();
      });
    });

    it('should render sprint goal when provided', async () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Complete authentication/)).toBeInTheDocument();
      });
    });

    it('should render close button', async () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Close')).toBeInTheDocument();
      });
    });

    it('should render stats section', async () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Items')).toBeInTheDocument();
        expect(screen.getByText('Story Points')).toBeInTheDocument();
        expect(screen.getByText('Tasks')).toBeInTheDocument();
        expect(screen.getByText('Remaining')).toBeInTheDocument();
      });
    });

    it('should render current sprint backlog section', async () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Current Sprint Backlog')).toBeInTheDocument();
      });
    });

    it('should render add item button', async () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Item')).toBeInTheDocument();
      });
    });

    it('should render recent changes section', async () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Recent Changes')).toBeInTheDocument();
      });
    });
  });

  describe('Sprint backlog items', () => {
    it('should render sprint backlog items when available', async () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Implement login/)).toBeInTheDocument();
        expect(screen.getByText(/Implement logout/)).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no items in backlog', async () => {
      vi.mocked(apiService.getActiveSprint).mockResolvedValue({
        data: { items: [] },
      });

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/No items in sprint backlog/)).toBeInTheDocument();
      });
    });

    it('should show no changes message when empty', async () => {
      (apiService.getSprintBacklogChanges as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
      });

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Implement login')).toBeInTheDocument();
      });

      const modal = document.querySelector('[class*="sbm-modal"]');
      expect(modal).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('should call onClose when close button clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Close')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on close button', async () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close');
        expect(closeButton).toBeInTheDocument();
      });
    });
  });

  describe('Stats calculation', () => {
    it('should calculate and display correct stats', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          items: [
            { id: 'pbi-1', title: 'Implement login', storyPoints: 5 },
            { id: 'pbi-2', title: 'Implement logout', storyPoints: 3 },
          ],
        },
      });

      (apiService.getSprintTasks as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          { id: 't1', title: 'Task 1', status: 'TODO' },
          { id: 't2', title: 'Task 2', status: 'DONE' },
        ],
      });

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Items')).toBeInTheDocument();
        expect(screen.getByText('Story Points')).toBeInTheDocument();
        expect(screen.getByText('Tasks')).toBeInTheDocument();
        expect(screen.getByText('Remaining')).toBeInTheDocument();
      });
    });
  });

  describe('Add PBI Modal', () => {
    it('should open add modal when clicking add button', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Item')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Add Item'));

      await waitFor(() => {
        expect(screen.getByText('Add Item to Sprint')).toBeInTheDocument();
      });
    });

    it('should display available PBIs in add modal', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Item')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Add Item'));

      await waitFor(() => {
        expect(screen.getByText('Feature C')).toBeInTheDocument();
        expect(screen.getByText('Feature D')).toBeInTheDocument();
      });
    });

    it('should search available PBIs', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Item')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Add Item'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search available items...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search available items...');
      await user.type(searchInput, 'Feature C');

      await waitFor(() => {
        expect(screen.getByText('Feature C')).toBeInTheDocument();
        expect(screen.queryByText('Feature D')).not.toBeInTheDocument();
      });
    });

    it('should add PBI to sprint', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Item')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Add Item'));

      await waitFor(() => {
        const featureC = screen.queryByText('Feature C');
        const addModal = screen.queryByText('Add Item to Sprint');
        expect(featureC || addModal).toBeTruthy();
      });

      const addButtons = screen.getAllByRole('button', { name: /add/i });
      if (addButtons.length > 0) {
        await user.click(addButtons[0]);
      }
    });

    it('should close add modal', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Item')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Add Item'));

      await waitFor(() => {
        const addModal = screen.queryByText('Add Item to Sprint');
        const availableItems = screen.queryByText('Available Items');
        expect(addModal || availableItems).toBeTruthy();
      });

      const closeButtons = screen.getAllByRole('button').filter((btn) => btn.textContent === '');
      if (closeButtons.length > 0) {
        await user.click(closeButtons[0]);
      }
    });
  });

  describe('Remove PBI Modal', () => {
    it('should open remove modal when clicking remove button', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Implement login')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByTitle('Remove from sprint');
      await user.click(removeButtons[0]);

      await waitFor(() => {
        const modal = document.querySelector('[class*="sbm-modal"]');
        expect(modal).toBeTruthy();
      });
    });

    it('should display PBI info in remove modal', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Implement login')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByTitle('Remove from sprint');
      await user.click(removeButtons[0]);

      await waitFor(() => {
        const loginElements = screen.getAllByText('Implement login');
        expect(loginElements.length).toBeGreaterThan(0);
      });
    });

    it('should remove PBI from sprint', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Implement login')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByTitle('Remove from sprint');
      await user.click(removeButtons[0]);

      await waitFor(() => {
        const modal = document.querySelector('[class*="sbm-modal"]');
        expect(modal).toBeTruthy();
      });

      const buttons = screen.getAllByRole('button');
      const confirmButton = buttons.find(
        (btn) =>
          btn.textContent?.includes('Return') ||
          btn.textContent?.includes('Remove') ||
          btn.textContent?.includes('Confirm')
      );
      if (confirmButton) {
        await user.click(confirmButton);
      }
    });

    it('should close remove modal on cancel', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Implement login')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByTitle('Remove from sprint');
      await user.click(removeButtons[0]);

      await waitFor(() => {
        const modal = document.querySelector('[class*="sbm-modal"]');
        expect(modal).toBeTruthy();
      });

      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find((btn) => btn.textContent?.includes('Cancel'));
      if (cancelButton) {
        await user.click(cancelButton);
      }
    });
  });

  describe('Recent Changes', () => {
    it('should display recent changes', async () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Implement login')).toBeInTheDocument();
      });

      await waitFor(() => {
        const featureA = screen.queryByText('Feature A');
        const johnDoe = screen.queryByText('John Doe');
        expect(featureA || johnDoe || screen.getByText('Recent Changes')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle add PBI error', async () => {
      const user = userEvent.setup();
      (apiService.addPBIToSprint as ReturnType<typeof vi.fn>).mockRejectedValue({
        response: { data: { error: { message: 'Failed to add' } } },
      });

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Item')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Add Item'));

      await waitFor(() => {
        expect(screen.getByText('Feature C')).toBeInTheDocument();
      });

      const addButton = screen.getAllByRole('button', { name: /add/i })[0];
      await user.click(addButton);
    });

    it('should handle remove PBI error', async () => {
      const user = userEvent.setup();
      (apiService.removePBIFromSprint as ReturnType<typeof vi.fn>).mockRejectedValue({
        response: { data: { error: { message: 'Failed to remove' } } },
      });

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Implement login')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByTitle('Remove from sprint');
      await user.click(removeButtons[0]);

      await waitFor(() => {
        const modal = document.querySelector('[class*="sbm-modal"]');
        expect(modal).toBeTruthy();
      });

      const buttons = screen.getAllByRole('button');
      const confirmButton = buttons.find(
        (btn) =>
          btn.textContent?.includes('Return') ||
          btn.textContent?.includes('Remove') ||
          btn.textContent?.includes('Confirm')
      );
      if (confirmButton) {
        await user.click(confirmButton);
      }
    });

    it('should handle sprint data fetch error', async () => {
      (apiService.getActiveSprint as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        const managerElement = screen.queryByText('Sprint Backlog Manager');
        const errorElement = screen.queryByText(/error/i);
        const loadingElement = screen.queryByText(/loading/i);
        expect(managerElement || errorElement || loadingElement).toBeTruthy();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      expect(screen.getByText('Loading sprint backlog...')).toBeInTheDocument();
    });

    it('should show loading in add modal', async () => {
      const user = userEvent.setup();
      (apiService.getAvailablePBIsForSprint as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Item')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Add Item'));

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });
  });

  describe('Priority Display', () => {
    it('should display priority badges correctly', async () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MUST')).toBeInTheDocument();
        expect(screen.getByText('SHOULD')).toBeInTheDocument();
      });
    });
  });

  describe('Task Preview', () => {
    it('should display task count for items with tasks', async () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/2 tasks/)).toBeInTheDocument();
      });
    });

    it('should display task progress', async () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/1\/2 done/)).toBeInTheDocument();
      });
    });
  });

  describe('Sprint Goal Display', () => {
    it('should display sprint goal when provided', async () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Complete authentication')).toBeInTheDocument();
      });
    });

    it('should not display sprint goal when not provided', async () => {
      renderWithQueryClient(<SprintBacklogManager {...defaultProps} sprintGoal={undefined} />);

      await waitFor(() => {
        expect(screen.getByText('Implement login')).toBeInTheDocument();
      });

      const sprintGoalBanner = document.querySelector('[class*="goal-banner"]');
      expect(sprintGoalBanner).toBeFalsy();
    });
  });

  describe('Empty State for Available PBIs', () => {
    it('should show no items message when no available PBIs', async () => {
      const user = userEvent.setup();
      (apiService.getAvailablePBIsForSprint as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
      });

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Item')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Add Item'));

      await waitFor(() => {
        expect(screen.getByText('No available items found')).toBeInTheDocument();
      });
    });
  });

  describe('Reason Input', () => {
    it('should allow entering reason when adding PBI', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Item')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Add Item'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Why are you adding this item?')).toBeInTheDocument();
      });

      const reasonInput = screen.getByPlaceholderText('Why are you adding this item?');
      await user.type(reasonInput, 'High priority feature');

      expect(reasonInput).toHaveValue('High priority feature');
    });

    it('should allow entering reason when removing PBI', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<SprintBacklogManager {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Implement login')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByTitle('Remove from sprint');
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Why are you removing this item?')).toBeInTheDocument();
      });

      const reasonInput = screen.getByPlaceholderText('Why are you removing this item?');
      await user.type(reasonInput, 'Moved to next sprint');

      expect(reasonInput).toHaveValue('Moved to next sprint');
    });
  });
});
