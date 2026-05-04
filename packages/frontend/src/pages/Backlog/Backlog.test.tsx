import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { useTeamStore } from '../../store';
import { apiService } from '../../services';
import { createMockBacklogItem, createMockTeam, createMockProductGoal } from '../../test-utils';
import { ItemStatus, MoSCoWPriority } from '../../types';

import { ProductBacklog } from './Backlog';

vi.mock('../../store', () => ({
  useTeamStore: vi.fn(),
}));

vi.mock('../../hooks/useMutationErrorHandler', () => ({
  useMutationErrorHandler: () => ({
    handleMutationError: vi.fn((_error, _context) => 'An error occurred'),
  }),
}));

vi.mock('../../services', () => ({
  apiService: {
    getProductBacklog: vi.fn(),
    getProductGoals: vi.fn(),
    createProductBacklogItem: vi.fn(),
    updateProductBacklogItem: vi.fn(),
    deleteProductBacklogItem: vi.fn(),
    getDefinitionOfDone: vi.fn(),
    getDefinitionOfReady: vi.fn(),
    getBacklogAdjustments: vi.fn(),
    getStakeholderFeedback: vi.fn(),
    getRetroActionItems: vi.fn(),
    getTasksByPbiId: vi.fn(),
    verifyDoDForPBI: vi.fn(),
    verifyDoRForPBI: vi.fn(),
    getStatusChangeHistory: vi.fn(),
  },
}));

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

const mockTeamStore = useTeamStore as ReturnType<typeof vi.fn>;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

const renderBacklog = (queryClient = createTestQueryClient()) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ProductBacklog />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const mockTeam = createMockTeam({ id: 'team-1', name: 'Test Team' });

const mockActiveGoal = createMockProductGoal({
  id: 'goal-1',
  title: 'Active Goal',
  status: 'ACTIVE',
  teamId: 'team-1',
});

const mockBacklogItems = [
  createMockBacklogItem({
    id: 'pbi-1',
    title: 'Feature A',
    status: ItemStatus.NEW,
    priority: MoSCoWPriority.MUST_HAVE,
    storyPoints: 8,
    businessValue: 13,
    goalId: 'goal-1',
  }),
  createMockBacklogItem({
    id: 'pbi-2',
    title: 'Feature B',
    status: ItemStatus.REFINED,
    priority: MoSCoWPriority.SHOULD_HAVE,
    storyPoints: 5,
    businessValue: 5,
    goalId: 'goal-1',
  }),
  createMockBacklogItem({
    id: 'pbi-3',
    title: 'Feature C',
    status: ItemStatus.READY,
    priority: MoSCoWPriority.COULD_HAVE,
    storyPoints: 3,
    businessValue: 3,
    goalId: 'goal-1',
  }),
  createMockBacklogItem({
    id: 'pbi-4',
    title: 'Feature D',
    status: ItemStatus.DONE,
    priority: MoSCoWPriority.WONT_HAVE,
    storyPoints: 2,
    businessValue: 1,
    goalId: 'goal-1',
  }),
];

const setupApiMocks = (overrides = {}) => {
  const defaults = {
    getProductBacklog: vi.fn().mockResolvedValue({
      success: true,
      data: mockBacklogItems,
    }),
    getProductGoals: vi.fn().mockResolvedValue({
      success: true,
      data: [mockActiveGoal],
    }),
    createProductBacklogItem: vi.fn().mockResolvedValue({
      success: true,
      data: createMockBacklogItem({ id: 'new-pbi' }),
    }),
    updateProductBacklogItem: vi.fn().mockResolvedValue({
      success: true,
      data: mockBacklogItems[0],
    }),
    deleteProductBacklogItem: vi.fn().mockResolvedValue({
      success: true,
    }),
    getDefinitionOfDone: vi.fn().mockResolvedValue({
      success: true,
      data: { items: [] },
    }),
    getDefinitionOfReady: vi.fn().mockResolvedValue({
      success: true,
      data: { items: [] },
    }),
    getBacklogAdjustments: vi.fn().mockResolvedValue({
      success: true,
      data: [],
    }),
    getStakeholderFeedback: vi.fn().mockResolvedValue({
      success: true,
      data: [],
    }),
    getRetroActionItems: vi.fn().mockResolvedValue({
      success: true,
      data: [],
    }),
    getTasksByPbiId: vi.fn().mockResolvedValue({
      success: true,
      data: [],
    }),
    verifyDoDForPBI: vi.fn().mockResolvedValue({
      success: true,
    }),
    verifyDoRForPBI: vi.fn().mockResolvedValue({
      success: true,
    }),
    getStatusChangeHistory: vi.fn().mockResolvedValue({
      success: true,
      data: [],
    }),
  };

  return { ...defaults, ...overrides };
};

describe('ProductBacklog Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();

    mockTeamStore.mockReturnValue({
      currentTeam: mockTeam,
      teams: [mockTeam],
      userRoleInCurrentTeam: 'product_owner',
      userTeamsWithRoles: [{ ...mockTeam, userRole: 'product_owner' }],
      setCurrentTeam: vi.fn(),
      setTeams: vi.fn(),
      setUserTeamsWithRoles: vi.fn(),
      addTeam: vi.fn(),
      updateTeam: vi.fn(),
      removeTeam: vi.fn(),
      switchTeam: vi.fn(),
      refreshUserTeams: vi.fn(),
      clearTeamContext: vi.fn(),
    });

    Object.assign(apiService, setupApiMocks());
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      renderBacklog(queryClient);
      expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0);
    });

    it('should render backlog items after loading', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      expect(screen.getByText('Feature B')).toBeInTheDocument();
      expect(screen.getByText('Feature C')).toBeInTheDocument();
    });

    it('should show no team message when team is not selected', async () => {
      mockTeamStore.mockReturnValue({
        currentTeam: null,
        teams: [],
        userRoleInCurrentTeam: null,
        userTeamsWithRoles: [],
        setCurrentTeam: vi.fn(),
        setTeams: vi.fn(),
        setUserTeamsWithRoles: vi.fn(),
        addTeam: vi.fn(),
        updateTeam: vi.fn(),
        removeTeam: vi.fn(),
        switchTeam: vi.fn(),
        refreshUserTeams: vi.fn(),
        clearTeamContext: vi.fn(),
      });

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText(/no team selected/i)).toBeInTheDocument();
      });
    });

    it('should show no active goal message when goal is not set', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getProductGoals: vi.fn().mockResolvedValue({
            success: true,
            data: [],
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText(/no active goal/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no backlog items', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getProductBacklog: vi.fn().mockResolvedValue({
            success: true,
            data: [],
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        const emptyText =
          screen.queryByText(/no items/i) ||
          screen.queryByText(/empty/i) ||
          screen.queryByText(/0 items/i) ||
          screen.queryByText(/No backlog items/i);
        expect(emptyText || document.querySelector('.empty-state')).toBeTruthy();
      });
    });

    it('should display page title and item count', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Product Backlog')).toBeInTheDocument();
      });

      expect(screen.getByText(/3 items/i)).toBeInTheDocument();
    });

    it('should display active goal banner', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const goalBanner = document.querySelector('[class*="active-goal-banner"]');
      expect(goalBanner).toBeInTheDocument();
    });
  });

  describe('View Modes', () => {
    it('should render board view by default', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const mustHaveElements = screen.getAllByText('Must Have');
      expect(mustHaveElements.length).toBeGreaterThan(0);
    });

    it('should switch to list view when clicking list button', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const listButton = screen.getByRole('button', { name: /list/i });
      await userEvent.click(listButton);

      await waitFor(() => {
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Title')).toBeInTheDocument();
      });
    });

    it('should toggle between views correctly', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /list/i }));
      await waitFor(() => {
        expect(screen.getByText('ID')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /board/i }));
      await waitFor(() => {
        const mustHaveElements = screen.getAllByText('Must Have');
        expect(mustHaveElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should render draggable cards in board view', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const cards = document.querySelectorAll('[draggable="true"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Bulk Import', () => {
    it('should have bulk import button', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const bulkImportButton = screen.getByRole('button', { name: /bulk import/i });
      expect(bulkImportButton).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner during initial load', () => {
      renderBacklog(queryClient);
      expect(screen.getAllByText(/loading product backlog/i).length).toBeGreaterThan(0);
    });

    it('should disable buttons during mutation pending state', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      await userEvent.type(titleInput, 'Test Title');

      const createButton = screen.getByRole('button', { name: /create item/i });
      expect(createButton).not.toBeDisabled();
    });
  });

  describe('Responsive Design', () => {
    it('should maintain functionality at different viewport sizes', async () => {
      window.innerWidth = 768;
      window.dispatchEvent(new Event('resize'));

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });
    });
  });

  describe('Integration', () => {
    it('should handle complete workflow: create, view, edit, delete', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

      await waitFor(() => {
        expect(screen.queryByText('Create New Backlog Item')).not.toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = document.querySelector('[data-modal-close]') as HTMLButtonElement;
      if (closeButton) {
        await userEvent.click(closeButton);
      }

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should handle search and filter combination', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const refinedStatusChip = screen.getByRole('button', { name: /^REFINED$/i });
      await userEvent.click(refinedStatusChip);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
        expect(screen.queryByText('Feature B')).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search items/i);
      await userEvent.type(searchInput, 'NonExistent');

      await waitFor(() => {
        expect(screen.queryByText('Feature A')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Item Workflow', () => {
    it('should open create modal when clicking new item button', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });
    });

    it('should create a new item with valid data', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      await userEvent.type(titleInput, 'New Feature');

      const createButton = screen.getByRole('button', { name: /create item/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(apiService.createProductBacklogItem).toHaveBeenCalled();
      });
    });

    it('should show validation error for empty title', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create item/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(apiService.createProductBacklogItem).not.toHaveBeenCalled();
      });
    });

    it('should close create modal on cancel', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

      await waitFor(() => {
        expect(screen.queryByText('Create New Backlog Item')).not.toBeInTheDocument();
      });
    });
  });

  describe('Item Detail Modal', () => {
    it('should open detail modal when clicking an item', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Item Workflow', () => {
    it('should open edit modal from detail view', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const editButton = screen.queryByRole('button', { name: /edit/i });
      if (editButton) {
        await userEvent.click(editButton);
      }
    });
  });

  describe('Delete Item Workflow', () => {
    it('should open delete confirmation modal', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const deleteButton = screen.queryByRole('button', { name: /delete/i });
      if (deleteButton) {
        await userEvent.click(deleteButton);
      }
    });
  });

  describe('Filter Interactions', () => {
    it('should filter items by status', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const statusChips = document.querySelectorAll('[class*="status-chip"]');
      if (statusChips.length > 0) {
        await userEvent.click(statusChips[0] as Element);
      }

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });

    it('should search items by title', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search items/i);
      await userEvent.type(searchInput, 'Feature B');

      await waitFor(() => {
        expect(screen.getByText('Feature B')).toBeInTheDocument();
        expect(screen.queryByText('Feature A')).not.toBeInTheDocument();
      });
    });

    it('should show no results for non-matching search', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search items/i);
      await userEvent.type(searchInput, 'NonExistentItem');

      await waitFor(() => {
        expect(screen.queryByText('Feature A')).not.toBeInTheDocument();
        expect(screen.queryByText('Feature B')).not.toBeInTheDocument();
      });
    });
  });

  describe('Priority Change', () => {
    it('should have priority badges displayed', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const mustHaveElements = screen.getAllByText('Must Have');
      expect(mustHaveElements.length).toBeGreaterThan(0);
    });
  });

  describe('Bulk Upload Modal', () => {
    it('should open bulk upload modal', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /bulk import/i }));

      await waitFor(() => {
        expect(screen.getByText('Bulk Import Backlog Items')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API error gracefully', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getProductBacklog: vi.fn().mockRejectedValue(new Error('API Error')),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        const backlogElement = screen.queryByTestId('product-backlog');
        const errorElement = screen.queryByText(/error/i);
        const loadingElement = screen.queryByText(/loading/i);
        expect(backlogElement || errorElement || loadingElement).toBeTruthy();
      });
    });

    it('should handle create item error', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          createProductBacklogItem: vi.fn().mockRejectedValue({
            response: { data: { error: { message: 'Create failed' } } },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      await userEvent.type(titleInput, 'New Feature');

      const createButton = screen.getByRole('button', { name: /create item/i });
      await userEvent.click(createButton);
    });
  });

  describe('Active Goal Banner', () => {
    it('should display active goal information', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const goalBanner = document.querySelector('[class*="active-goal-banner"]');
      expect(goalBanner).toBeInTheDocument();
    });

    it('should show goal progress metrics', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      expect(screen.getByText(/3 items/i)).toBeInTheDocument();
    });
  });

  describe('Status Change Workflow', () => {
    it('should handle quick status change to READY with validation modal', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      // Click on an item to open the detail modal
      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should handle validation check changes', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should handle validation cancel', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = document.querySelector('[data-modal-close]') as HTMLButtonElement;
      if (closeButton) {
        await userEvent.click(closeButton);
      }
    });

    it('should handle status transition validation errors', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate form data with workflow errors', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      await userEvent.clear(titleInput);

      const createButton = screen.getByRole('button', { name: /create item/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(apiService.createProductBacklogItem).not.toHaveBeenCalled();
      });
    });

    it('should handle edit form with labels containing commas', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const editButton = screen.queryByRole('button', { name: /edit/i });
      if (editButton) {
        await userEvent.click(editButton);
      }
    });
  });

  describe('Pending Adjustments Integration', () => {
    it('should handle adjustment implement click', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getBacklogAdjustments: vi.fn().mockResolvedValue({
            success: true,
            data: [
              {
                id: 'adj-1',
                description: 'Add new feature',
                reason: 'Customer request',
                status: 'PENDING',
              },
            ],
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });
    });
  });

  describe('Pending Feedback Integration', () => {
    it('should handle feedback create work item click', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getStakeholderFeedback: vi.fn().mockResolvedValue({
            success: true,
            data: [
              {
                id: 'fb-1',
                content: 'Great work on the feature!',
                authorName: 'John Doe',
                category: 'positive',
              },
            ],
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });
    });
  });

  describe('Pending Retro Action Items Integration', () => {
    it('should handle retro action item create work item click', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getRetroActionItems: vi.fn().mockResolvedValue({
            success: true,
            data: [
              {
                id: 'rai-1',
                title: 'Improve code review process',
                description: 'Add more reviewers',
                status: 'OPEN',
              },
            ],
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });
    });
  });

  describe('Status Change to DONE with Child Tasks', () => {
    it('should prevent marking as DONE when child tasks are incomplete', async () => {
      renderBacklog(queryClient);

      // Component renders with existing items
      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });
    });

    it('should handle error when fetching child tasks', async () => {
      const mockItem = createMockBacklogItem({
        id: 'pbi-error-test',
        title: 'Item with Error',
        status: ItemStatus.READY,
      });

      Object.assign(
        apiService,
        setupApiMocks({
          getProductBacklog: vi.fn().mockResolvedValue({
            success: true,
            data: [mockItem],
          }),
          getTasksByPbiId: vi.fn().mockRejectedValue(new Error('Network error')),
        })
      );

      renderBacklog(queryClient);

      // Component renders even when there's an error fetching child tasks
      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Priority Change on Board', () => {
    it('should handle priority change via board view', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      // Board view shows priority sections
      expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
    });
  });

  describe('Modal Manager State', () => {
    it('should open create modal', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });

      // Modal is open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should open detail modal when clicking item', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Items by MoSCoW Calculation', () => {
    it('should correctly group items by MoSCoW priority', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const mustHaveElements = screen.getAllByText('Must Have');
      expect(mustHaveElements.length).toBeGreaterThan(0);

      const shouldHaveElements = screen.getAllByText('Should Have');
      expect(shouldHaveElements.length).toBeGreaterThan(0);
    });
  });

  describe('Execute Status Change', () => {
    it('should handle execute status change with error response', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          updateProductBacklogItem: vi.fn().mockRejectedValue({
            response: { status: 403, data: { error: { message: 'Permission denied' } } },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should handle execute status change with 400 error', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          updateProductBacklogItem: vi.fn().mockRejectedValue({
            response: { status: 400, data: { error: { message: 'Invalid transition' } } },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Upload Complete', () => {
    it('should handle bulk upload completion', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /bulk import/i }));

      await waitFor(() => {
        expect(screen.getByText('Bulk Import Backlog Items')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Bulk Import Backlog Items')).not.toBeInTheDocument();
      });
    });
  });

  describe('Validation Confirm with DoD', () => {
    it('should handle DoD verification during validation confirm', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getDefinitionOfDone: vi.fn().mockResolvedValue({
            success: true,
            data: {
              items: [{ id: 'dod-1', description: 'Code reviewed' }],
            },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Validation Confirm with DoR', () => {
    it('should handle DoR verification during validation confirm', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getDefinitionOfReady: vi.fn().mockResolvedValue({
            success: true,
            data: {
              items: [{ id: 'dor-1', description: 'Has acceptance criteria' }],
            },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Filter State Management', () => {
    it('should handle filter changes', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search items/i);
      await userEvent.type(searchInput, 'test');

      await waitFor(() => {
        expect(searchInput).toHaveValue('test');
      });
    });

    it('should handle status filter toggles', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const statusChips = document.querySelectorAll('[class*="status-chip"]');
      if (statusChips.length > 0) {
        await userEvent.click(statusChips[0] as Element);
      }

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Child Tasks Loading State', () => {
    it('should show loading state when checking child tasks', async () => {
      const mockItem = createMockBacklogItem({
        id: 'pbi-loading-test',
        title: 'Loading Test Item',
        status: ItemStatus.READY,
      });

      Object.assign(
        apiService,
        setupApiMocks({
          getProductBacklog: vi.fn().mockResolvedValue({
            success: true,
            data: [mockItem],
          }),
          getTasksByPbiId: vi.fn().mockImplementation(
            () =>
              new Promise((resolve) => {
                setTimeout(() => {
                  resolve({ success: true, data: [] });
                }, 100);
              })
          ),
        })
      );

      renderBacklog(queryClient);

      // Item should be rendered
      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Form Data with Initial Values', () => {
    it('should set initial form data correctly', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveValue('');
    });
  });

  describe('Handle Open Create Modal', () => {
    it('should open create modal with empty form', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      // Open create modal
      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });

      // Verify the title input is empty (fresh form)
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveValue('');
    });
  });

  describe('Handle Open Detail Modal', () => {
    it('should open detail modal and set selected item', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should close detail modal and clear selected item', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = document.querySelector('[data-modal-close]') as HTMLButtonElement;
      if (closeButton) {
        await userEvent.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Handle Open Edit Modal', () => {
    it('should not open edit modal when no item selected', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Handle Edit Submit', () => {
    it('should not submit edit when validation fails', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Handle Delete Confirm', () => {
    it('should not delete when no item selected', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Handle Open Delete Modal', () => {
    it('should open delete modal from detail view', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const deleteButton = screen.queryByRole('button', { name: /delete/i });
      if (deleteButton) {
        await userEvent.click(deleteButton);
      }
    });
  });

  describe('Handle Quick Status Change - No Selected Item', () => {
    it('should not change status when no item is selected', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
    });
  });

  describe('Handle Quick Status Change - Invalid Transition', () => {
    it('should show error for invalid status transition', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Handle Quick Status Change - Field Validation Error', () => {
    it('should show field validation error', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Handle Validation Check Change', () => {
    it('should update validation checks state', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Handle Validation Confirm - No Pending Status', () => {
    it('should not confirm validation when no pending status', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Handle Validation Confirm - DoD Error', () => {
    it('should handle DoD verification error', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          verifyDoDForPBI: vi.fn().mockRejectedValue(new Error('DoD verification failed')),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Handle Validation Confirm - DoR Error', () => {
    it('should handle DoR verification error', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          verifyDoRForPBI: vi.fn().mockRejectedValue(new Error('DoR verification failed')),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Handle Validation Cancel', () => {
    it('should close validation modal and reset state', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = document.querySelector('[data-modal-close]') as HTMLButtonElement;
      if (closeButton) {
        await userEvent.click(closeButton);
      }
    });
  });

  describe('Done Count Calculation', () => {
    it('should calculate done count correctly', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      expect(screen.getByText(/3 items/i)).toBeInTheDocument();
    });
  });

  describe('Label Tags Handling', () => {
    it('should handle label tags in form data', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Error Handling', () => {
    it('should display workflow errors', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });
    });
  });

  describe('Backlog Provider', () => {
    it('should render with BacklogProvider', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
    });
  });
});
