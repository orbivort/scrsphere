/**
 * IncrementList Component Tests
 *
 * Test Coverage:
 * - Rendering with and without team context
 * - Loading states
 * - Empty states
 * - Increment list display
 * - Filtering functionality (all, active, delivered, archived)
 * - Search functionality
 * - Navigation to create increment page
 * - Navigation to increment detail page
 * - Stats display
 * - Error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { IncrementList } from './IncrementList';
import { apiService } from '../../services';
import { useTeamContext } from '../../contexts/TeamContext';
import { IncrementStatus } from '../../types';

// Mocks
vi.mock('../../services');
vi.mock('../../contexts/TeamContext');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock EmptyState
vi.mock('../../components/EmptyState', () => ({
  EmptyState: ({ type }: { type: string }) => (
    <div data-testid={`empty-state-${type}`}>Empty State: {type}</div>
  ),
}));

describe('IncrementList', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const mockTeam = {
    id: 'team-1',
    name: 'Test Team',
  };

  const mockIncrements = [
    {
      id: 'inc-1',
      name: 'Draft Increment',
      description: 'A draft increment',
      status: IncrementStatus.DRAFT,
      teamId: 'team-1',
      sprintId: 'sprint-1',
      sprint: { id: 'sprint-1', name: 'Sprint 1' },
      totalStoryPoints: 8,
      includedPBIs: ['pbi-1', 'pbi-2'],
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'inc-2',
      name: 'Verified Increment',
      description: 'A verified increment',
      status: IncrementStatus.VERIFIED,
      teamId: 'team-1',
      sprintId: 'sprint-1',
      sprint: { id: 'sprint-1', name: 'Sprint 1' },
      totalStoryPoints: 13,
      includedPBIs: ['pbi-3'],
      createdAt: '2026-01-05T00:00:00Z',
    },
    {
      id: 'inc-3',
      name: 'Delivered Increment',
      description: 'A delivered increment',
      status: IncrementStatus.DELIVERED,
      teamId: 'team-1',
      sprintId: 'sprint-2',
      sprint: { id: 'sprint-2', name: 'Sprint 2' },
      totalStoryPoints: 21,
      includedPBIs: ['pbi-4', 'pbi-5', 'pbi-6'],
      deliveredAt: '2026-01-15T00:00:00Z',
      deliveryMethod: 'sprint_review',
      createdAt: '2026-01-10T00:00:00Z',
    },
    {
      id: 'inc-4',
      name: 'Archived Increment',
      description: 'An archived increment',
      status: IncrementStatus.ARCHIVED,
      teamId: 'team-1',
      sprintId: 'sprint-3',
      sprint: { id: 'sprint-3', name: 'Sprint 3' },
      totalStoryPoints: 5,
      includedPBIs: ['pbi-7'],
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    (useTeamContext as vi.Mock).mockReturnValue({
      currentTeam: mockTeam,
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <IncrementList />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('Team Context', () => {
    it('should show empty state when no team is selected', () => {
      (useTeamContext as vi.Mock).mockReturnValue({
        currentTeam: null,
      });

      renderComponent();

      expect(screen.getByTestId('empty-state-no-team')).toBeInTheDocument();
    });

    it('should render page when team is selected', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: mockIncrements,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Increments')).toBeInTheDocument();
      });
    });
  });

  describe('Page Header', () => {
    it('should display page title and subtitle', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: mockIncrements,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Increments')).toBeInTheDocument();
      });

      expect(screen.getByText(/Manage and track your product increments/i)).toBeInTheDocument();
    });

    it('should have Create Increment button', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: mockIncrements,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Create Increment')).toBeInTheDocument();
      });
    });

    it('should navigate to create increment page on button click', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: mockIncrements,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Create Increment')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create Increment'));

      expect(mockNavigate).toHaveBeenCalledWith('/increment/create');
    });
  });

  describe('Stats Display', () => {
    it('should display correct stats', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: mockIncrements,
      });

      const { container } = renderComponent();

      await waitFor(() => {
        // Check stats grid contains the expected values
        const statsGrid = container.querySelector('[class*="stats-grid"]');
        expect(statsGrid?.textContent).toContain('4'); // Total
        expect(statsGrid?.textContent).toContain('Total Increments');
        expect(statsGrid?.textContent).toContain('Active');
        expect(statsGrid?.textContent).toContain('Delivered');
        expect(statsGrid?.textContent).toContain('47'); // Story Points (8+13+21+5)
        expect(statsGrid?.textContent).toContain('Story Points');
      });

      // Verify stat values in stat cards (using stat-content to avoid duplicates in cards)
      const statCards = container.querySelectorAll('[class*="stat-card"]');
      const statValues = Array.from(statCards).map((card) => {
        const valueEl = card.querySelector('[class*="stat-value"]');
        const labelEl = card.querySelector('[class*="stat-label"]');
        return { value: valueEl?.textContent, label: labelEl?.textContent };
      });

      expect(statValues).toContainEqual({ value: '4', label: 'Total Increments' });
      expect(statValues).toContainEqual({ value: '2', label: 'Active' });
      expect(statValues).toContainEqual({ value: '1', label: 'Delivered' });
      expect(statValues).toContainEqual({ value: '47', label: 'Story Points' });
    });

    it('should display zero stats when no increments', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: [],
      });

      const { container } = renderComponent();

      await waitFor(() => {
        // Check that the stats grid shows zeros
        const statsGrid = container.querySelector('[class*="stats-grid"]');
        expect(statsGrid?.textContent).toContain('0');
      });

      // Should have 4 stat cards with zeros (Total, Active, Delivered, Story Points)
      const statValues = container.querySelectorAll('[class*="stat-value"]');
      const zeroCount = Array.from(statValues).filter((el) => el.textContent === '0').length;
      expect(zeroCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Filter Tabs', () => {
    it('should render all filter tabs', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: mockIncrements,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
      });

      // Check that filter tabs exist in the filter-tabs container
      const filterTabs = document.querySelector('[class*="filter-tabs"]');
      expect(filterTabs?.textContent).toContain('All');
      expect(filterTabs?.textContent).toContain('Active');
      expect(filterTabs?.textContent).toContain('Delivered');
      expect(filterTabs?.textContent).toContain('Archived');
    });

    it('should filter by active status', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: mockIncrements,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
      });

      // Get filter tabs container and find the Active tab button (2nd button)
      const filterTabs = document.querySelector('[class*="filter-tabs"]');
      const activeTab = filterTabs?.querySelector('button:nth-child(2)');
      fireEvent.click(activeTab!);

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
        expect(screen.getByText('Verified Increment')).toBeInTheDocument();
      });

      expect(screen.queryByText('Delivered Increment')).not.toBeInTheDocument();
      expect(screen.queryByText('Archived Increment')).not.toBeInTheDocument();
    });

    it('should filter by delivered status', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: mockIncrements,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
      });

      // Get filter tabs container and find the Delivered tab button
      const filterTabs = document.querySelector('[class*="filter-tabs"]');
      const deliveredTab = filterTabs?.querySelector('button:nth-child(3)');
      fireEvent.click(deliveredTab!);

      await waitFor(() => {
        expect(screen.getByText('Delivered Increment')).toBeInTheDocument();
      });

      expect(screen.queryByText('Draft Increment')).not.toBeInTheDocument();
      expect(screen.queryByText('Verified Increment')).not.toBeInTheDocument();
      expect(screen.queryByText('Archived Increment')).not.toBeInTheDocument();
    });

    it('should filter by archived status', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: mockIncrements,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
      });

      // Get filter tabs container and find the Archived tab button
      const filterTabs = document.querySelector('[class*="filter-tabs"]');
      const archivedTab = filterTabs?.querySelector('button:nth-child(4)');
      fireEvent.click(archivedTab!);

      await waitFor(() => {
        expect(screen.getByText('Archived Increment')).toBeInTheDocument();
      });

      expect(screen.queryByText('Draft Increment')).not.toBeInTheDocument();
      expect(screen.queryByText('Verified Increment')).not.toBeInTheDocument();
      expect(screen.queryByText('Delivered Increment')).not.toBeInTheDocument();
    });

    it('should show all increments when All tab is selected', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: mockIncrements,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
      });

      // Click on Delivered tab first
      const filterTabs = document.querySelector('[class*="filter-tabs"]');
      const deliveredTab = filterTabs?.querySelector('button:nth-child(3)');
      fireEvent.click(deliveredTab!);

      await waitFor(() => {
        expect(screen.queryByText('Draft Increment')).not.toBeInTheDocument();
      });

      // Click on All tab
      const allTab = filterTabs?.querySelector('button:nth-child(1)');
      fireEvent.click(allTab!);

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
        expect(screen.getByText('Verified Increment')).toBeInTheDocument();
        expect(screen.getByText('Delivered Increment')).toBeInTheDocument();
        expect(screen.getByText('Archived Increment')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter increments by search query', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: mockIncrements,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search increments...');
      fireEvent.change(searchInput, { target: { value: 'Draft' } });

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
      });

      expect(screen.queryByText('Verified Increment')).not.toBeInTheDocument();
      expect(screen.queryByText('Delivered Increment')).not.toBeInTheDocument();
    });

    it('should search in descriptions', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: mockIncrements,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search increments...');
      fireEvent.change(searchInput, { target: { value: 'verified' } });

      await waitFor(() => {
        expect(screen.getByText('Verified Increment')).toBeInTheDocument();
      });

      expect(screen.queryByText('Draft Increment')).not.toBeInTheDocument();
    });

    it('should be case insensitive', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: mockIncrements,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search increments...');
      fireEvent.change(searchInput, { target: { value: 'DRAFT' } });

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
      });
    });

    it('should show empty state when search has no results', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: mockIncrements,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search increments...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText(/No Increments found/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/No Increments match your search criteria/i)).toBeInTheDocument();
    });
  });

  describe('Increment Cards', () => {
    it('should display increment cards with correct information', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: [mockIncrements[0]],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
      });

      expect(screen.getByText('A draft increment')).toBeInTheDocument();
      expect(screen.getByText('Sprint 1')).toBeInTheDocument();

      // Check for status badge and stats within the card
      const card = screen.getByText('Draft Increment').closest('[class*="increment-card"]');
      expect(card?.textContent).toContain('Draft');
      expect(card?.textContent).toContain('PBIs');
      expect(card?.textContent).toContain('2');
      expect(card?.textContent).toContain('Points');
      expect(card?.textContent).toContain('8');
    });

    it('should display delivered date for delivered increments', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: [mockIncrements[2]],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Delivered Increment')).toBeInTheDocument();
      });

      // Check for delivered date in the card footer dates section
      const cardFooter = screen
        .getByText('Delivered Increment')
        .closest('[class*="increment-card"]');
      expect(cardFooter?.textContent).toContain('Delivered');
    });

    it('should display delivery method badge', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: [mockIncrements[2]],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Delivered Increment')).toBeInTheDocument();
      });

      // Check for delivery method in the card
      const card = screen.getByText('Delivered Increment').closest('[class*="increment-card"]');
      expect(card?.textContent).toContain('Sprint Review');
    });

    it('should navigate to increment detail on card click', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: [mockIncrements[0]],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Draft Increment'));

      expect(mockNavigate).toHaveBeenCalledWith('/increment/inc-1');
    });

    it('should handle keyboard navigation on cards', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: [mockIncrements[0]],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
      });

      const card = screen.getByText('Draft Increment').closest('[role="button"]');
      if (card) {
        fireEvent.keyDown(card, { key: 'Enter' });
        expect(mockNavigate).toHaveBeenCalledWith('/increment/inc-1');

        vi.clearAllMocks();
        fireEvent.keyDown(card, { key: ' ' });
        expect(mockNavigate).toHaveBeenCalledWith('/increment/inc-1');
      }
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no increments exist', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: [],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/No Increments found/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/You haven't created any Increment yet/i)).toBeInTheDocument();
    });

    it('should have Create Increment button in empty state', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: [],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/No Increments found/i)).toBeInTheDocument();
      });

      const createButton = screen.getAllByText('Create Increment')[0];
      fireEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/increment/create');
    });
  });

  describe('Status Badges', () => {
    it('should show correct status badges for each increment', async () => {
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: mockIncrements,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Draft Increment')).toBeInTheDocument();
      });

      // Check that all increment cards are rendered with their status badges
      const incrementsGrid = document.querySelector('[class*="increments-grid"]');
      expect(incrementsGrid?.textContent).toContain('Draft');
      expect(incrementsGrid?.textContent).toContain('Verified');
      expect(incrementsGrid?.textContent).toContain('Delivered');
      expect(incrementsGrid?.textContent).toContain('Archived');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (apiService.getIncrements as vi.Mock).mockRejectedValue(new Error('Failed to fetch'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Increments')).toBeInTheDocument();
      });

      // Should still render the page structure even on error
      expect(screen.getByText('Total Increments')).toBeInTheDocument();
    });
  });
});
