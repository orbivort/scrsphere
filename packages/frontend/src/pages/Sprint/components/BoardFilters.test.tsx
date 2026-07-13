import { renderWithProviders, screen, initTestI18n } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

import { BoardFilters } from './BoardFilters';
import type { BoardFiltersProps } from './BoardFilters';
import type { TeamMember, User, ProductBacklogItem } from '../../../types';

const mockUsers: User[] = [
  { id: 'user-1', email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
  { id: 'user-2', email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' },
];

const mockTeamMembers: (TeamMember & { user?: User })[] = [
  {
    id: 'member-1',
    teamId: 'team-1',
    userId: 'user-1',
    role: 'developer',
    joinedAt: '2026-01-01T00:00:00Z',
    user: mockUsers[0],
  },
  {
    id: 'member-2',
    teamId: 'team-1',
    userId: 'user-2',
    role: 'scrum_master',
    joinedAt: '2026-01-01T00:00:00Z',
    user: mockUsers[1],
  },
];

const mockSprintItems: ProductBacklogItem[] = [
  {
    id: 'pbi-1',
    teamId: 'team-1',
    title: 'User Authentication',
    description: 'Implement login',
    status: 'NEW',
    priority: 'MUST_HAVE',
    storyPoints: 8,
    businessValue: 10,
    labels: [],
    acceptanceCriteria: '',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'pbi-2',
    teamId: 'team-1',
    title: 'Dashboard',
    description: 'Create dashboard',
    status: 'IN_PROGRESS',
    priority: 'MUST_HAVE',
    storyPoints: 13,
    businessValue: 15,
    labels: [],
    acceptanceCriteria: '',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'user-1',
  },
];

describe('BoardFilters', () => {
  const mockOnFilterAssigneeChange = vi.fn();
  const mockOnFilterPbiChange = vi.fn();
  const mockOnSearchQueryChange = vi.fn();
  const mockOnViewModeChange = vi.fn();
  const mockOnSwimlaneGroupChange = vi.fn();

  const defaultProps: BoardFiltersProps = {
    filterAssignee: 'all',
    filterPbi: 'all',
    searchQuery: '',
    viewMode: 'kanban',
    swimlaneGroup: 'none',
    teamMembers: mockTeamMembers,
    sprintItems: mockSprintItems,
    onFilterAssigneeChange: mockOnFilterAssigneeChange,
    onFilterPbiChange: mockOnFilterPbiChange,
    onSearchQueryChange: mockOnSearchQueryChange,
    onViewModeChange: mockOnViewModeChange,
    onSwimlaneGroupChange: mockOnSwimlaneGroupChange,
  };

  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render assignee filter dropdown', () => {
      renderWithProviders(<BoardFilters {...defaultProps} />);

      expect(screen.getByLabelText('Filter by assignee')).toBeInTheDocument();
      expect(screen.getByText('All Assignees')).toBeInTheDocument();
    });

    it('should render PBI filter dropdown', () => {
      renderWithProviders(<BoardFilters {...defaultProps} />);

      expect(screen.getByLabelText('Filter by backlog item')).toBeInTheDocument();
      expect(screen.getByText('All Items')).toBeInTheDocument();
    });

    it('should render search input', () => {
      renderWithProviders(<BoardFilters {...defaultProps} />);

      expect(screen.getByLabelText('Search tasks')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
    });

    it('should render view mode toggle buttons', () => {
      renderWithProviders(<BoardFilters {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Kanban' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Swimlanes' })).toBeInTheDocument();
    });

    it('should render team members in assignee dropdown', () => {
      renderWithProviders(<BoardFilters {...defaultProps} />);

      const assigneeSelect = screen.getByLabelText('Filter by assignee');
      expect(assigneeSelect).toBeInTheDocument();

      // Open dropdown to see options
      const options = screen.getAllByRole('option');
      expect(options.some((opt) => opt.textContent?.includes('John Doe'))).toBe(true);
      expect(options.some((opt) => opt.textContent?.includes('Jane Smith'))).toBe(true);
    });

    it('should render sprint items in PBI dropdown', () => {
      renderWithProviders(<BoardFilters {...defaultProps} />);

      const pbiSelect = screen.getByLabelText('Filter by backlog item');
      expect(pbiSelect).toBeInTheDocument();

      const options = screen.getAllByRole('option');
      expect(options.some((opt) => opt.textContent?.includes('User Authentication'))).toBe(true);
      expect(options.some((opt) => opt.textContent?.includes('Dashboard'))).toBe(true);
    });

    it('should show story points in PBI options', () => {
      renderWithProviders(<BoardFilters {...defaultProps} />);

      const options = screen.getAllByRole('option');
      expect(options.some((opt) => opt.textContent?.includes('8 pts'))).toBe(true);
      expect(options.some((opt) => opt.textContent?.includes('13 pts'))).toBe(true);
    });
  });

  describe('View Mode Toggle', () => {
    it('should highlight kanban button when in kanban mode', () => {
      renderWithProviders(<BoardFilters {...defaultProps} viewMode="kanban" />);

      const kanbanButton = screen.getByRole('button', { name: 'Kanban' });
      expect(kanbanButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should highlight swimlanes button when in swimlanes mode', () => {
      renderWithProviders(<BoardFilters {...defaultProps} viewMode="swimlanes" />);

      const swimlanesButton = screen.getByRole('button', { name: 'Swimlanes' });
      expect(swimlanesButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should call onViewModeChange when clicking kanban button', async () => {
      renderWithProviders(<BoardFilters {...defaultProps} viewMode="swimlanes" />);

      await userEvent.click(screen.getByRole('button', { name: 'Kanban' }));

      expect(mockOnViewModeChange).toHaveBeenCalledWith('kanban');
    });

    it('should call onViewModeChange when clicking swimlanes button', async () => {
      renderWithProviders(<BoardFilters {...defaultProps} viewMode="kanban" />);

      await userEvent.click(screen.getByRole('button', { name: 'Swimlanes' }));

      expect(mockOnViewModeChange).toHaveBeenCalledWith('swimlanes');
    });
  });

  describe('Swimlane Grouping', () => {
    it('should show swimlane group select when in swimlanes mode', () => {
      renderWithProviders(<BoardFilters {...defaultProps} viewMode="swimlanes" />);

      expect(screen.getByLabelText('Group swimlanes by')).toBeInTheDocument();
    });

    it('should not show swimlane group select when in kanban mode', () => {
      renderWithProviders(<BoardFilters {...defaultProps} viewMode="kanban" />);

      expect(screen.queryByLabelText('Group swimlanes by')).not.toBeInTheDocument();
    });

    it('should render swimlane grouping options', () => {
      renderWithProviders(<BoardFilters {...defaultProps} viewMode="swimlanes" />);

      const options = screen.getAllByRole('option');
      expect(options.some((opt) => opt.textContent === 'No Grouping')).toBe(true);
      expect(options.some((opt) => opt.textContent === 'By Assignee')).toBe(true);
      expect(options.some((opt) => opt.textContent === 'By Backlog Item')).toBe(true);
    });

    it('should call onSwimlaneGroupChange when selecting different group', async () => {
      renderWithProviders(
        <BoardFilters {...defaultProps} viewMode="swimlanes" swimlaneGroup="none" />
      );

      const select = screen.getByLabelText('Group swimlanes by');
      await userEvent.selectOptions(select, 'assignee');

      expect(mockOnSwimlaneGroupChange).toHaveBeenCalledWith('assignee');
    });
  });

  describe('Filter Interactions', () => {
    it('should call onFilterAssigneeChange when selecting assignee', async () => {
      renderWithProviders(<BoardFilters {...defaultProps} />);

      const select = screen.getByLabelText('Filter by assignee');
      await userEvent.selectOptions(select, 'user-1');

      expect(mockOnFilterAssigneeChange).toHaveBeenCalledWith('user-1');
    });

    it('should call onFilterPbiChange when selecting PBI', async () => {
      renderWithProviders(<BoardFilters {...defaultProps} />);

      const select = screen.getByLabelText('Filter by backlog item');
      await userEvent.selectOptions(select, 'pbi-1');

      expect(mockOnFilterPbiChange).toHaveBeenCalledWith('pbi-1');
    });

    it('should call onSearchQueryChange on each keystroke', async () => {
      renderWithProviders(<BoardFilters {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search tasks...');
      await userEvent.type(input, 'test');

      // Each keystroke triggers the callback
      expect(mockOnSearchQueryChange).toHaveBeenCalledTimes(4);
      expect(mockOnSearchQueryChange).toHaveBeenNthCalledWith(1, 't');
      expect(mockOnSearchQueryChange).toHaveBeenNthCalledWith(2, 'e');
      expect(mockOnSearchQueryChange).toHaveBeenNthCalledWith(3, 's');
      expect(mockOnSearchQueryChange).toHaveBeenNthCalledWith(4, 't');
    });
  });

  describe('Search Clear Button', () => {
    it('should show clear button when search query is not empty', () => {
      renderWithProviders(<BoardFilters {...defaultProps} searchQuery="test" />);

      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('should not show clear button when search query is empty', () => {
      renderWithProviders(<BoardFilters {...defaultProps} searchQuery="" />);

      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('should clear search when clicking clear button', async () => {
      renderWithProviders(<BoardFilters {...defaultProps} searchQuery="test" />);

      await userEvent.click(screen.getByLabelText('Clear search'));

      expect(mockOnSearchQueryChange).toHaveBeenCalledWith('');
    });
  });

  describe('Accessibility', () => {
    it('should have correct role for toolbar', () => {
      renderWithProviders(<BoardFilters {...defaultProps} />);

      expect(screen.getByRole('toolbar')).toHaveAttribute('aria-label', 'Board controls');
    });

    it('should have correct role for view mode group', () => {
      renderWithProviders(<BoardFilters {...defaultProps} />);

      expect(screen.getByRole('group', { name: 'View Mode' })).toBeInTheDocument();
    });

    it('should have visually hidden labels for selects', () => {
      renderWithProviders(<BoardFilters {...defaultProps} />);

      // Labels should exist even if visually hidden
      expect(screen.getByLabelText('Filter by assignee')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by backlog item')).toBeInTheDocument();
      expect(screen.getByLabelText('Search tasks')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty team members array', () => {
      renderWithProviders(<BoardFilters {...defaultProps} teamMembers={[]} />);

      expect(screen.getByLabelText('Filter by assignee')).toBeInTheDocument();
      expect(screen.getByText('All Assignees')).toBeInTheDocument();
    });

    it('should handle empty sprint items array', () => {
      renderWithProviders(<BoardFilters {...defaultProps} sprintItems={[]} />);

      expect(screen.getByLabelText('Filter by backlog item')).toBeInTheDocument();
      expect(screen.getByText('All Items')).toBeInTheDocument();
    });

    it('should handle team members without user data', () => {
      const membersWithoutUser: (TeamMember & { user?: User })[] = [
        {
          id: 'member-1',
          teamId: 'team-1',
          userId: 'user-1',
          role: 'developer',
          joinedAt: '2026-01-01T00:00:00Z',
        },
      ];

      renderWithProviders(<BoardFilters {...defaultProps} teamMembers={membersWithoutUser} />);

      expect(screen.getByLabelText('Filter by assignee')).toBeInTheDocument();
    });

    it('should handle sprint items with zero story points', () => {
      const itemsWithZeroPoints: ProductBacklogItem[] = [{ ...mockSprintItems[0], storyPoints: 0 }];

      renderWithProviders(<BoardFilters {...defaultProps} sprintItems={itemsWithZeroPoints} />);

      const options = screen.getAllByRole('option');
      expect(options.some((opt) => opt.textContent?.includes('0 pts'))).toBe(true);
    });
  });
});
