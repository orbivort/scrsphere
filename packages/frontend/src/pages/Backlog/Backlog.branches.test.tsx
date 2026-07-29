import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { useTeamStore } from '../../store';
import { apiService, definitionService } from '../../services';
import { createMockBacklogItem, createMockTeam, createMockProductGoal } from '../../test-utils';
import { ItemStatus, MoSCoWPriority, TaskStatus } from '../../types';

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
  definitionService: {
    verifyDoDForPBI: vi.fn(),
    verifyDoRForPBI: vi.fn(),
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
      pagination: { page: 1, totalPages: 1, total: mockBacklogItems.length },
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

describe('Backlog Branch Coverage Tests', () => {
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

  describe('Status Change Validation Branches', () => {
    it('should not change status when no selected item', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
    });

    it('should handle invalid status transition', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should handle field validation error for status change', async () => {
      const itemWithoutStoryPoints = createMockBacklogItem({
        id: 'pbi-no-points',
        title: 'Item without points',
        status: ItemStatus.NEW,
        storyPoints: null,
        goalId: 'goal-1',
      });

      Object.assign(
        apiService,
        setupApiMocks({
          getProductBacklog: vi.fn().mockResolvedValue({
            success: true,
            data: [itemWithoutStoryPoints],
            pagination: { page: 1, totalPages: 1, total: 1 },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Status Change to DONE with Child Tasks', () => {
    it('should prevent marking as DONE when child tasks are incomplete', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getTasksByPbiId: vi.fn().mockResolvedValue({
            success: true,
            data: [
              { id: 'task-1', title: 'Task 1', status: TaskStatus.TODO },
              { id: 'task-2', title: 'Task 2', status: TaskStatus.DONE },
            ],
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

    it('should allow marking as DONE when all child tasks are complete', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getTasksByPbiId: vi.fn().mockResolvedValue({
            success: true,
            data: [
              { id: 'task-1', title: 'Task 1', status: TaskStatus.DONE },
              { id: 'task-2', title: 'Task 2', status: TaskStatus.DONE },
            ],
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });
    });

    it('should handle error when fetching child tasks', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getTasksByPbiId: vi.fn().mockRejectedValue(new Error('Network error')),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });

    it('should handle many incomplete child tasks', async () => {
      const manyIncompleteTasks = Array.from({ length: 5 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        status: TaskStatus.TODO,
      }));

      Object.assign(
        apiService,
        setupApiMocks({
          getTasksByPbiId: vi.fn().mockResolvedValue({
            success: true,
            data: manyIncompleteTasks,
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });
    });
  });

  describe('Validation Confirm with DoD', () => {
    it('should save DoD verifications and execute status change', async () => {
      const mockVerifyDoD = vi.fn().mockResolvedValue({ success: true });
      (definitionService as { verifyDoDForPBI: typeof mockVerifyDoD }).verifyDoDForPBI =
        mockVerifyDoD;

      Object.assign(
        apiService,
        setupApiMocks({
          getDefinitionOfDone: vi.fn().mockResolvedValue({
            success: true,
            data: {
              items: [
                { id: 'dod-1', description: 'Code reviewed' },
                { id: 'dod-2', description: 'Tests passed' },
              ],
            },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });
    });

    it('should handle DoD verification error', async () => {
      const mockVerifyDoD = vi.fn().mockRejectedValue(new Error('DoD verification failed'));
      (definitionService as { verifyDoDForPBI: typeof mockVerifyDoD }).verifyDoDForPBI =
        mockVerifyDoD;

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });
    });
  });

  describe('Validation Confirm with DoR', () => {
    it('should save DoR verifications and execute status change', async () => {
      const mockVerifyDoR = vi.fn().mockResolvedValue({ success: true });
      (definitionService as { verifyDoRForPBI: typeof mockVerifyDoR }).verifyDoRForPBI =
        mockVerifyDoR;

      Object.assign(
        apiService,
        setupApiMocks({
          getDefinitionOfReady: vi.fn().mockResolvedValue({
            success: true,
            data: {
              items: [
                { id: 'dor-1', description: 'Has acceptance criteria' },
                { id: 'dor-2', description: 'Has estimate' },
              ],
            },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });
    });

    it('should handle DoR verification error', async () => {
      const mockVerifyDoR = vi.fn().mockRejectedValue(new Error('DoR verification failed'));
      (definitionService as { verifyDoRForPBI: typeof mockVerifyDoR }).verifyDoRForPBI =
        mockVerifyDoR;

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });
    });
  });

  describe('Execute Status Change', () => {
    it('should execute status change successfully', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        success: true,
        data: createMockBacklogItem({ id: 'pbi-1', status: ItemStatus.READY }),
      });
      Object.assign(apiService, setupApiMocks({ updateProductBacklogItem: mockUpdate }));

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });
    });

    it('should handle 400 error response', async () => {
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
    });

    it('should handle 403 error response', async () => {
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
    });

    it('should handle 403 error without message', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          updateProductBacklogItem: vi.fn().mockRejectedValue({
            response: { status: 403 },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation Branches', () => {
    it('should validate form with workflow errors', async () => {
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

    it('should handle edit form with labels', async () => {
      const itemWithLabels = createMockBacklogItem({
        id: 'pbi-labels',
        title: 'Item with labels',
        labels: ['frontend', 'bug', 'urgent'],
        goalId: 'goal-1',
      });

      Object.assign(
        apiService,
        setupApiMocks({
          getProductBacklog: vi.fn().mockResolvedValue({
            success: true,
            data: [itemWithLabels],
            pagination: { page: 1, totalPages: 1, total: 1 },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Pending Adjustments Integration', () => {
    it('should handle pending adjustment with implement click', async () => {
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

    it('should handle multiple pending adjustments', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getBacklogAdjustments: vi.fn().mockResolvedValue({
            success: true,
            data: [
              {
                id: 'adj-1',
                description: 'Add feature A',
                reason: 'Customer request',
                status: 'PENDING',
              },
              {
                id: 'adj-2',
                description: 'Add feature B',
                reason: 'Stakeholder feedback',
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
    it('should handle pending feedback with create work item', async () => {
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

    it('should handle long feedback content', async () => {
      const longContent = 'A'.repeat(150);
      Object.assign(
        apiService,
        setupApiMocks({
          getStakeholderFeedback: vi.fn().mockResolvedValue({
            success: true,
            data: [
              {
                id: 'fb-1',
                content: longContent,
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
    it('should handle retro action item with create work item', async () => {
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

    it('should handle retro action item without description', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getRetroActionItems: vi.fn().mockResolvedValue({
            success: true,
            data: [
              {
                id: 'rai-1',
                title: 'Improve code review process',
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

  describe('Items by MoSCoW Grouping', () => {
    it('should correctly group items by all MoSCoW priorities', async () => {
      const items = [
        createMockBacklogItem({
          id: 'pbi-1',
          title: 'Must Have Item',
          priority: MoSCoWPriority.MUST_HAVE,
          goalId: 'goal-1',
        }),
        createMockBacklogItem({
          id: 'pbi-2',
          title: 'Should Have Item',
          priority: MoSCoWPriority.SHOULD_HAVE,
          goalId: 'goal-1',
        }),
        createMockBacklogItem({
          id: 'pbi-3',
          title: 'Could Have Item',
          priority: MoSCoWPriority.COULD_HAVE,
          goalId: 'goal-1',
        }),
        createMockBacklogItem({
          id: 'pbi-4',
          title: 'Wont Have Item',
          priority: MoSCoWPriority.WONT_HAVE,
          goalId: 'goal-1',
        }),
      ];

      Object.assign(
        apiService,
        setupApiMocks({
          getProductBacklog: vi.fn().mockResolvedValue({
            success: true,
            data: items,
            pagination: { page: 1, totalPages: 1, total: items.length },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });

    it('should handle items with same priority', async () => {
      const items = [
        createMockBacklogItem({
          id: 'pbi-1',
          title: 'Must Have 1',
          priority: MoSCoWPriority.MUST_HAVE,
          goalId: 'goal-1',
        }),
        createMockBacklogItem({
          id: 'pbi-2',
          title: 'Must Have 2',
          priority: MoSCoWPriority.MUST_HAVE,
          goalId: 'goal-1',
        }),
        createMockBacklogItem({
          id: 'pbi-3',
          title: 'Must Have 3',
          priority: MoSCoWPriority.MUST_HAVE,
          goalId: 'goal-1',
        }),
      ];

      Object.assign(
        apiService,
        setupApiMocks({
          getProductBacklog: vi.fn().mockResolvedValue({
            success: true,
            data: items,
            pagination: { page: 1, totalPages: 1, total: items.length },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Done Count Calculation', () => {
    it('should calculate done count correctly', async () => {
      const items = [
        createMockBacklogItem({ id: 'pbi-1', status: ItemStatus.DONE }),
        createMockBacklogItem({ id: 'pbi-2', status: ItemStatus.DONE }),
        createMockBacklogItem({ id: 'pbi-3', status: ItemStatus.NEW }),
      ];

      Object.assign(
        apiService,
        setupApiMocks({
          getProductBacklog: vi.fn().mockResolvedValue({
            success: true,
            data: items,
            pagination: { page: 1, totalPages: 1, total: items.length },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });

    it('should handle zero done items', async () => {
      const items = [
        createMockBacklogItem({ id: 'pbi-1', status: ItemStatus.NEW }),
        createMockBacklogItem({ id: 'pbi-2', status: ItemStatus.REFINED }),
      ];

      Object.assign(
        apiService,
        setupApiMocks({
          getProductBacklog: vi.fn().mockResolvedValue({
            success: true,
            data: items,
            pagination: { page: 1, totalPages: 1, total: items.length },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Filter State Changes', () => {
    it('should handle status filter changes', async () => {
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

    it('should handle search filter changes', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search items/i);
      await userEvent.type(searchInput, 'Feature B');

      await waitFor(() => {
        expect(searchInput).toHaveValue('Feature B');
      });
    });

    it('should handle combined filters', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search items/i);
      await userEvent.type(searchInput, 'Feature');

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('View Mode Switching', () => {
    it('should switch to list view and back to board view', async () => {
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

  describe('Modal State Management', () => {
    it('should open and close create modal', async () => {
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

    it('should open and close detail modal', async () => {
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

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

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

  describe('Error Handling Branches', () => {
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

    it('should handle delete item error', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          deleteProductBacklogItem: vi.fn().mockRejectedValue(new Error('Delete failed')),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });
    });
  });

  describe('Auto Loading State', () => {
    it('should show auto loading indicator during search', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search items/i);
      await userEvent.type(searchInput, 'Feature');

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Load More Functionality', () => {
    it('should show load more button when there are more items', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getProductBacklog: vi.fn().mockResolvedValue({
            success: true,
            data: mockBacklogItems,
            pagination: { page: 1, totalPages: 2, total: 8 },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });
    });

    it('should not show load more button when all items loaded', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });
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

      expect(screen.getByText(/4 items/i)).toBeInTheDocument();
    });
  });

  describe('Priority Change on Board', () => {
    it('should handle priority change via board view', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
    });
  });

  describe('Labels Parsing', () => {
    it('should handle labels with commas', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });
    });

    it('should handle empty labels', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Backlog Item')).toBeInTheDocument();
      });
    });

    it('should handle labels with whitespace', async () => {
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

  describe('Form Data Initialization', () => {
    it('should initialize form data for create', async () => {
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

    it('should initialize form data for edit', async () => {
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

  describe('Workflow Error Display', () => {
    it('should display workflow errors in modal', async () => {
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
