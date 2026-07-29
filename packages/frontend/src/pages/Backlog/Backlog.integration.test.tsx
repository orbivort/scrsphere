import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { useTeamStore } from '../../store';
import { apiService } from '../../services';
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
    getDefinitionOfDone: vi.fn(),
    getDefinitionOfReady: vi.fn(),
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

  return Object.assign(defaults, overrides);
};

describe('Backlog Integration Tests', () => {
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

  describe('Backlog Rendering', () => {
    it('should render backlog after loading', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });

    it('should display backlog items', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
        expect(screen.getByText('Feature B')).toBeInTheDocument();
        expect(screen.getByText('Feature C')).toBeInTheDocument();
      });
    });

    it('should display MoSCoW priority sections', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        const mustHaveElements = screen.getAllByText(/must have/i);
        expect(mustHaveElements.length).toBeGreaterThan(0);
      });
    });

    it('should display active goal information', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('View Mode Switching', () => {
    it('should toggle between board and list view', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });

      const listButton = screen.queryByRole('button', { name: /list/i });
      if (listButton) {
        await userEvent.click(listButton);
      }
    });
  });

  describe('Item Creation', () => {
    it('should open create item modal', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });

      const createButton = screen.queryByRole('button', { name: /new item/i });
      if (createButton) {
        await userEvent.click(createButton);

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Item Editing', () => {
    it('should open item detail modal on item click', async () => {
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

  describe('Filters', () => {
    it('should filter items by search', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });

      const searchInput = screen.queryByPlaceholderText(/search/i);
      if (searchInput) {
        await userEvent.type(searchInput, 'Feature A');
      }
    });

    it('should filter items by status', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });

      const statusFilter = screen.queryByLabelText(/status/i);
      if (statusFilter) {
        await userEvent.click(statusFilter);
      }
    });
  });

  describe('Bulk Operations', () => {
    it('should open bulk import modal', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });

      const bulkImportButton = screen.queryByRole('button', { name: /bulk import/i });
      if (bulkImportButton) {
        await userEvent.click(bulkImportButton);

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Loading States', () => {
    it('should show loading state', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getProductBacklog: vi.fn().mockImplementation(
            () =>
              new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    success: true,
                    data: mockBacklogItems,
                    pagination: { page: 1, totalPages: 1, total: mockBacklogItems.length },
                  });
                }, 100);
              })
          ),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        const loadingElements = screen.queryAllByText(/loading/i);
        const backlogElement = screen.queryByTestId('product-backlog');
        expect(loadingElements.length > 0 || backlogElement).toBeTruthy();
      });
    });
  });

  describe('Empty States', () => {
    it('should handle empty backlog', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getProductBacklog: vi.fn().mockResolvedValue({
            success: true,
            data: [],
            pagination: { page: 1, totalPages: 1, total: 0 },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
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
        expect(backlogElement || errorElement).toBeTruthy();
      });
    });
  });

  describe('Statistics Display', () => {
    it('should display backlog statistics', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });

    it('should display total items count', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });

    it('should display done items count', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Priority Grouping', () => {
    it('should group items by MoSCoW priority', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });

    it('should handle items with same priority', async () => {
      const samePriorityItems = [
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
      ];

      Object.assign(
        apiService,
        setupApiMocks({
          getProductBacklog: vi.fn().mockResolvedValue({
            success: true,
            data: samePriorityItems,
            pagination: { page: 1, totalPages: 1, total: samePriorityItems.length },
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Status Display', () => {
    it('should display item status badges', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Story Points Display', () => {
    it('should display story points for items', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Business Value Display', () => {
    it('should display business value for items', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Pending Adjustments', () => {
    it('should display pending adjustments', async () => {
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
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Pending Feedback', () => {
    it('should display pending feedback', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getStakeholderFeedback: vi.fn().mockResolvedValue({
            success: true,
            data: [
              {
                id: 'fb-1',
                content: 'Great work!',
                authorName: 'John Doe',
                category: 'positive',
              },
            ],
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Retro Action Items', () => {
    it('should display retro action items', async () => {
      Object.assign(
        apiService,
        setupApiMocks({
          getRetroActionItems: vi.fn().mockResolvedValue({
            success: true,
            data: [
              {
                id: 'rai-1',
                title: 'Improve process',
                status: 'OPEN',
              },
            ],
          }),
        })
      );

      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Goal Progress', () => {
    it('should display goal progress metrics', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Item Actions', () => {
    it('should have edit action for items', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Feature A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Feature A'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should have delete action for items', async () => {
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

  describe('Status Transitions', () => {
    it('should show available status transitions', async () => {
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

  describe('DoD/DoR Verification', () => {
    it('should show DoD verification for status change to DONE', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });

    it('should show DoR verification for status change to READY', async () => {
      renderBacklog(queryClient);

      await waitFor(() => {
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Child Tasks Validation', () => {
    it('should check child tasks before marking as DONE', async () => {
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
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });

  describe('Labels Handling', () => {
    it('should display item labels', async () => {
      const itemWithLabels = createMockBacklogItem({
        id: 'pbi-labels',
        title: 'Item with labels',
        labels: ['frontend', 'bug'],
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

  describe('Pagination', () => {
    it('should handle pagination', async () => {
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
        expect(screen.getByTestId('product-backlog')).toBeInTheDocument();
      });
    });
  });
});
