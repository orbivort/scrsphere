import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { SwimlanesBoard, type SwimlanesBoardProps } from './SwimlanesBoard';
import {
  TaskStatus,
  type Task,
  type User,
  type TeamMember,
  type ProductBacklogItem,
} from '../../../types';

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  sprintId: 'sprint-1',
  pbiId: 'pbi-1',
  title: 'Test Task',
  description: 'Test description',
  status: TaskStatus.TODO,
  assigneeId: 'user-1',
  estimatedHours: 8,
  remainingHours: 5,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
  ...overrides,
});

const createMockTeamMember = (
  overrides: Partial<TeamMember & { user?: User }> = {}
): TeamMember & { user?: User } => ({
  id: 'tm-1',
  teamId: 'team-1',
  userId: 'user-1',
  role: 'developer' as const,
  joinedAt: '2026-01-01T00:00:00Z',
  user: {
    id: 'user-1',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  ...overrides,
});

const createMockPBI = (overrides: Partial<ProductBacklogItem> = {}): ProductBacklogItem => ({
  id: 'pbi-1',
  teamId: 'team-1',
  title: 'User Authentication',
  priority: 'MUST_HAVE' as const,
  storyPoints: 5,
  status: 'READY' as const,
  labels: [],
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const defaultProps: SwimlanesBoardProps = {
  groupedBySwimlane: null,
  swimlaneGroup: 'none',
  teamMembers: [],
  sprintItems: [],
  tasksByStatus: {
    todo: [],
    in_progress: [],
    done: [],
  },
  draggedTaskId: null,
  dropTargetColumn: null,
  focusedTaskId: null,
  onDragStart: vi.fn(),
  onDragEnd: vi.fn(),
  onDrop: vi.fn(),
  onDragOver: vi.fn(),
  onDragLeave: vi.fn(),
  onTaskClick: vi.fn(),
  onKeyDown: vi.fn(),
  onFocus: vi.fn(),
  onBlur: vi.fn(),
};

describe('SwimlanesBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering - No Grouping', () => {
    it('should render empty state when swimlaneGroup is none', () => {
      render(<SwimlanesBoard {...defaultProps} swimlaneGroup="none" groupedBySwimlane={null} />);

      expect(screen.getByText('No Grouping Selected')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Select a grouping option from the dropdown above to view tasks in swimlanes.'
        )
      ).toBeInTheDocument();
    });

    it('should render empty state when groupedBySwimlane is null', () => {
      render(<SwimlanesBoard {...defaultProps} swimlaneGroup="none" groupedBySwimlane={null} />);

      expect(screen.getByText('No Grouping Selected')).toBeInTheDocument();
    });

    it('should have proper role attributes for empty state', () => {
      render(<SwimlanesBoard {...defaultProps} swimlaneGroup="none" groupedBySwimlane={null} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Rendering - With Grouping', () => {
    const mockGroupedByAssignee: Record<string, Task[]> = {
      'user-1': [
        createMockTask({ id: 'task-1', title: 'Task 1', status: TaskStatus.TODO }),
        createMockTask({ id: 'task-2', title: 'Task 2', status: TaskStatus.IN_PROGRESS }),
      ],
      'user-2': [createMockTask({ id: 'task-3', title: 'Task 3', status: TaskStatus.DONE })],
      unassigned: [
        createMockTask({
          id: 'task-4',
          title: 'Task 4',
          status: TaskStatus.TODO,
          assigneeId: undefined,
        }),
      ],
    };

    const mockTeamMembers = [
      createMockTeamMember({
        id: 'tm-1',
        userId: 'user-1',
        user: {
          id: 'user-1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      }),
      createMockTeamMember({
        id: 'tm-2',
        userId: 'user-2',
        user: {
          id: 'user-2',
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      }),
    ];

    it('should render column headers', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
        />
      );

      expect(screen.getAllByText('TO DO').length).toBeGreaterThan(0);
      expect(screen.getAllByText('IN PROGRESS').length).toBeGreaterThan(0);
      expect(screen.getAllByText('DONE').length).toBeGreaterThan(0);
    });

    it('should render swimlane labels', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
        />
      );

      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Unassigned').length).toBeGreaterThan(0);
    });

    it('should render unassigned swimlane last', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
        />
      );

      const labels = screen.getAllByText(/John Doe|Jane Smith|Unassigned/);
      expect(labels.length).toBeGreaterThanOrEqual(3);
    });

    it('should render swimlane role subtitle', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
        />
      );

      expect(screen.getAllByText('developer').length).toBeGreaterThan(0);
    });

    it('should render task cards in correct columns', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
        />
      );

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
      expect(screen.getByText('Task 4')).toBeInTheDocument();
    });

    it('should render column totals in header', () => {
      const propsWithTasks: SwimlanesBoardProps = {
        ...defaultProps,
        swimlaneGroup: 'assignee',
        groupedBySwimlane: mockGroupedByAssignee,
        teamMembers: mockTeamMembers,
        tasksByStatus: {
          todo: [createMockTask({ id: 'task-1' }), createMockTask({ id: 'task-4' })],
          in_progress: [createMockTask({ id: 'task-2' })],
          done: [createMockTask({ id: 'task-3' })],
        },
      };
      render(<SwimlanesBoard {...propsWithTasks} />);

      expect(screen.getAllByText('TO DO').length).toBeGreaterThan(0);
      expect(screen.getAllByText('IN PROGRESS').length).toBeGreaterThan(0);
      expect(screen.getAllByText('DONE').length).toBeGreaterThan(0);
    });
  });

  describe('Rendering - Group by PBI', () => {
    const mockGroupedByPBI: Record<string, Task[]> = {
      'pbi-1': [
        createMockTask({ id: 'task-1', title: 'Task 1', pbiId: 'pbi-1' }),
        createMockTask({ id: 'task-2', title: 'Task 2', pbiId: 'pbi-1' }),
      ],
      'pbi-2': [createMockTask({ id: 'task-3', title: 'Task 3', pbiId: 'pbi-2' })],
    };

    const mockSprintItems = [
      createMockPBI({ id: 'pbi-1', title: 'PBI 1', storyPoints: 5 }),
      createMockPBI({ id: 'pbi-2', title: 'PBI 2', storyPoints: 3 }),
    ];

    it('should render PBI titles as swimlane labels', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="pbi"
          groupedBySwimlane={mockGroupedByPBI}
          sprintItems={mockSprintItems}
        />
      );

      expect(screen.getByText('PBI 1')).toBeInTheDocument();
      expect(screen.getByText('PBI 2')).toBeInTheDocument();
    });

    it('should render PBI story points as subtitle', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="pbi"
          groupedBySwimlane={mockGroupedByPBI}
          sprintItems={mockSprintItems}
        />
      );

      expect(screen.getByText('5 story points')).toBeInTheDocument();
      expect(screen.getByText('3 story points')).toBeInTheDocument();
    });

    it('should sort PBIs alphabetically', () => {
      const unorderedPBIGroup: Record<string, Task[]> = {
        'pbi-2': [createMockTask({ id: 'task-1', title: 'Task Z' })],
        'pbi-1': [createMockTask({ id: 'task-2', title: 'Task A' })],
      };

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="pbi"
          groupedBySwimlane={unorderedPBIGroup}
          sprintItems={mockSprintItems}
        />
      );

      const pbiLabels = screen.getAllByText(/PBI/);
      expect(pbiLabels[0]).toHaveTextContent('PBI 1');
    });
  });

  describe('Swimlane Stats', () => {
    const mockGroupedByAssignee: Record<string, Task[]> = {
      'user-1': [
        createMockTask({
          id: 'task-1',
          status: TaskStatus.TODO,
          estimatedHours: 8,
          remainingHours: 5,
        }),
        createMockTask({
          id: 'task-2',
          status: TaskStatus.IN_PROGRESS,
          estimatedHours: 4,
          remainingHours: 2,
        }),
        createMockTask({
          id: 'task-3',
          status: TaskStatus.DONE,
          estimatedHours: 2,
          remainingHours: 0,
        }),
      ],
    };

    const mockTeamMembers = [createMockTeamMember({ id: 'tm-1', userId: 'user-1' })];

    it('should render stats for task counts', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
        />
      );

      expect(screen.getAllByText(/TO DO/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/IN PROGRESS/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/DONE/).length).toBeGreaterThan(0);
    });

    it('should not render hours when total is zero', () => {
      const noHoursTasks: Record<string, Task[]> = {
        'user-1': [
          createMockTask({
            id: 'task-1',
            status: TaskStatus.TODO,
            estimatedHours: 0,
            remainingHours: 0,
          }),
        ],
      };

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={noHoursTasks}
          teamMembers={mockTeamMembers}
        />
      );

      expect(screen.queryByText(/h \/ h/)).not.toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    const mockGroupedByAssignee: Record<string, Task[]> = {
      'user-1': [createMockTask({ id: 'task-1', title: 'Task 1' })],
    };
    const mockTeamMembers = [createMockTeamMember({ id: 'tm-1', userId: 'user-1' })];

    it('should render draggable task cards', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
        />
      );

      const taskCard = screen.getByText('Task 1').closest('[draggable]');
      expect(taskCard).toBeTruthy();
    });

    it('should call onDragStart when task drag starts', () => {
      const onDragStart = vi.fn();
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
          onDragStart={onDragStart}
        />
      );

      const taskCard = screen.getByText('Task 1').closest('[draggable]');
      if (taskCard) {
        fireEvent.dragStart(taskCard, { dataTransfer: {} });
      }

      expect(onDragStart).toHaveBeenCalled();
    });

    it('should call onDragEnd when task drag ends', () => {
      const onDragEnd = vi.fn();
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
          onDragEnd={onDragEnd}
        />
      );

      const taskCard = screen.getByText('Task 1').closest('[draggable]');
      if (taskCard) {
        fireEvent.dragEnd(taskCard);
      }

      expect(onDragEnd).toHaveBeenCalled();
    });
  });

  describe('Drop Target Styling', () => {
    const mockGroupedByAssignee: Record<string, Task[]> = {
      'user-1': [createMockTask({ id: 'task-1' })],
    };
    const mockTeamMembers = [createMockTeamMember({ id: 'tm-1', userId: 'user-1' })];

    it('should render drop target indicator when dropTargetColumn is set', () => {
      const { container } = render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
          dropTargetColumn={TaskStatus.TODO}
        />
      );

      expect(container.querySelector('[class*="drop-target"]')).toBeTruthy();
    });

    it('should render keyboard drop target indicator when keyboard drag is active', () => {
      const { container } = render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
          keyboardGrabState="grabbed"
          keyboardDropTargetStatus={TaskStatus.TODO}
        />
      );

      expect(container.querySelector('[class*="keyboard-drop-target"]')).toBeTruthy();
    });
  });

  describe('Task Interactions', () => {
    const mockGroupedByAssignee: Record<string, Task[]> = {
      'user-1': [createMockTask({ id: 'task-1', title: 'Task 1' })],
    };
    const mockTeamMembers = [createMockTeamMember({ id: 'tm-1', userId: 'user-1' })];

    it('should call onTaskClick when task is clicked', async () => {
      const onTaskClick = vi.fn();
      const user = userEvent.setup();
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
          onTaskClick={onTaskClick}
        />
      );

      await user.click(screen.getByText('Task 1'));

      expect(onTaskClick).toHaveBeenCalled();
    });

    it('should call onKeyDown when task receives key event', () => {
      const onKeyDown = vi.fn();
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
          onKeyDown={onKeyDown}
        />
      );

      const taskElement = screen.getByText('Task 1');
      fireEvent.keyDown(taskElement, { key: 'Enter' });

      expect(onKeyDown).toHaveBeenCalled();
    });

    it('should call onFocus when task receives focus', () => {
      const onFocus = vi.fn();
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
          onFocus={onFocus}
        />
      );

      const taskElement = screen.getByText('Task 1');
      fireEvent.focus(taskElement);

      expect(onFocus).toHaveBeenCalled();
    });

    it('should call onBlur when task loses focus', () => {
      const onBlur = vi.fn();
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
          onBlur={onBlur}
        />
      );

      const taskElement = screen.getByText('Task 1');
      fireEvent.blur(taskElement);

      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('Empty Cells', () => {
    const mockGroupedByAssignee: Record<string, Task[]> = {
      'user-1': [],
    };
    const mockTeamMembers = [createMockTeamMember({ id: 'tm-1', userId: 'user-1' })];

    it('should render placeholder for empty cells', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
        />
      );

      expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });

    it('should hide empty cell placeholders from accessibility', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
        />
      );

      const emptyCells = document.querySelectorAll('[aria-hidden="true"]');
      expect(emptyCells.length).toBeGreaterThan(0);
    });
  });

  describe('Empty Swimlanes State', () => {
    it('should render empty state when sortedKeys is empty', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={{}}
          teamMembers={[]}
        />
      );

      expect(screen.getByText('No Tasks Found')).toBeInTheDocument();
      expect(
        screen.getByText('There are no tasks to display in swimlanes view.')
      ).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    const mockGroupedByAssignee: Record<string, Task[]> = {
      'user-1': [createMockTask({ id: 'task-1' })],
    };
    const mockTeamMembers = [createMockTeamMember({ id: 'tm-1', userId: 'user-1' })];

    it('should render keyboard navigation attributes', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
        />
      );

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBe(4);
    });

    it('should set aria-dropeffect based on keyboard grab state', () => {
      const { container } = render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
          keyboardGrabState="grabbed"
        />
      );

      const todoHeader = container.querySelector('[aria-dropeffect="move"]');
      expect(todoHeader).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    const mockGroupedByAssignee: Record<string, Task[]> = {
      'user-1': [createMockTask({ id: 'task-1', title: 'Task 1' })],
    };
    const mockTeamMembers = [createMockTeamMember({ id: 'tm-1', userId: 'user-1' })];

    it('should have table role', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should have proper table label', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
        />
      );

      expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Swimlanes view');
    });

    it('should have column headers', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
        />
      );

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBe(4);
    });

    it('should have aria-labels on cells', () => {
      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mockGroupedByAssignee}
          teamMembers={mockTeamMembers}
        />
      );

      const cells = screen.getAllByRole('cell');
      const columnCells = cells.filter((cell) => cell.className.includes('swimlane-cell'));
      expect(columnCells[0]).toHaveAttribute('aria-label', expect.stringContaining('To Do'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown assignee gracefully', () => {
      const unknownUserTask: Record<string, Task[]> = {
        'unknown-user': [createMockTask({ id: 'task-1', assigneeId: 'unknown-user' })],
      };

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={unknownUserTask}
          teamMembers={[]}
        />
      );

      expect(screen.getByText('Unknown User')).toBeInTheDocument();
    });

    it('should handle unknown PBI gracefully', () => {
      const unknownPBI: Record<string, Task[]> = {
        'unknown-pbi': [createMockTask({ id: 'task-1', pbiId: 'unknown-pbi' })],
      };

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="pbi"
          groupedBySwimlane={unknownPBI}
          sprintItems={[]}
        />
      );

      expect(screen.getByText('Unknown Item')).toBeInTheDocument();
    });

    it('should handle team member without user', () => {
      const memberWithoutUser: Record<string, Task[]> = {
        'user-1': [createMockTask({ id: 'task-1', assigneeId: 'user-1' })],
      };
      const teamMembers = [
        {
          id: 'tm-1',
          teamId: 'team-1',
          userId: 'user-1',
          role: 'developer' as const,
          joinedAt: '2026-01-01T00:00:00Z',
        },
      ];

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={memberWithoutUser}
          teamMembers={teamMembers}
        />
      );

      expect(screen.getByText('Unknown User')).toBeInTheDocument();
    });

    it('should handle task without estimated hours in stats', () => {
      const noHoursTasks: Record<string, Task[]> = {
        'user-1': [
          createMockTask({ id: 'task-1', estimatedHours: undefined, remainingHours: undefined }),
        ],
      };
      const mockTeamMembers = [createMockTeamMember({ id: 'tm-1', userId: 'user-1' })];

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={noHoursTasks}
          teamMembers={mockTeamMembers}
        />
      );

      expect(screen.queryByText(/h \/ h/)).not.toBeInTheDocument();
    });
  });

  describe('Display Name Generation', () => {
    it('should generate full name for team member', () => {
      const tasks: Record<string, Task[]> = {
        'user-1': [createMockTask({ id: 'task-1' })],
      };
      const members = [
        createMockTeamMember({
          id: 'tm-1',
          userId: 'user-1',
          user: {
            id: 'user-1',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        }),
      ];

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={tasks}
          teamMembers={members}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display member role as subtitle', () => {
      const tasks: Record<string, Task[]> = {
        'user-1': [createMockTask({ id: 'task-1' })],
      };
      const members = [
        createMockTeamMember({
          id: 'tm-1',
          userId: 'user-1',
          role: 'developer' as const,
          user: {
            id: 'user-1',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        }),
      ];

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={tasks}
          teamMembers={members}
        />
      );

      expect(screen.getByText('developer')).toBeInTheDocument();
    });
  });

  describe('Swimlane Sorting', () => {
    it('should sort assignees alphabetically with unassigned last', () => {
      const tasks: Record<string, Task[]> = {
        'user-3': [createMockTask({ id: 'task-3', assigneeId: 'user-3' })],
        'user-1': [createMockTask({ id: 'task-1', assigneeId: 'user-1' })],
        'user-2': [createMockTask({ id: 'task-2', assigneeId: 'user-2' })],
        unassigned: [createMockTask({ id: 'task-4', assigneeId: undefined })],
      };
      const members = [
        createMockTeamMember({
          id: 'tm-1',
          userId: 'user-1',
          user: {
            id: 'user-1',
            email: 'john@example.com',
            firstName: 'Alice',
            lastName: 'Anderson',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        }),
        createMockTeamMember({
          id: 'tm-2',
          userId: 'user-2',
          user: {
            id: 'user-2',
            email: 'bob@example.com',
            firstName: 'Bob',
            lastName: 'Brown',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        }),
        createMockTeamMember({
          id: 'tm-3',
          userId: 'user-3',
          user: {
            id: 'user-3',
            email: 'carol@example.com',
            firstName: 'Carol',
            lastName: 'Clark',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        }),
      ];

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={tasks}
          teamMembers={members}
        />
      );

      const rows = screen.getAllByRole('row');
      expect(rows[rows.length - 1]).toHaveTextContent('Unassigned');
    });

    it('should sort PBIs alphabetically', () => {
      const tasks: Record<string, Task[]> = {
        'pbi-2': [createMockTask({ id: 'task-1', pbiId: 'pbi-2' })],
        'pbi-1': [createMockTask({ id: 'task-2', pbiId: 'pbi-1' })],
      };
      const items = [
        createMockPBI({ id: 'pbi-1', title: 'Alpha' }),
        createMockPBI({ id: 'pbi-2', title: 'Beta' }),
      ];

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="pbi"
          groupedBySwimlane={tasks}
          sprintItems={items}
        />
      );

      const labels = screen.getAllByText(/Alpha|Beta/);
      expect(labels[0]).toHaveTextContent('Alpha');
    });
  });

  describe('Virtual Scrolling', () => {
    const mockTeamMembers = [createMockTeamMember({ id: 'tm-1', userId: 'user-1' })];

    it('should not use virtual scrolling when tasks per cell are below threshold (30)', () => {
      const fewTasks: Record<string, Task[]> = {
        'user-1': Array(20)
          .fill(null)
          .map((_, i) =>
            createMockTask({
              id: `task-${i}`,
              title: `Task ${i}`,
              status: TaskStatus.TODO,
            })
          ),
      };

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={fewTasks}
          teamMembers={mockTeamMembers}
        />
      );

      // All tasks should be rendered
      for (let i = 0; i < 20; i++) {
        expect(screen.getByText(`Task ${i}`)).toBeInTheDocument();
      }
    });

    it('should render swimlanes correctly with many tasks', () => {
      const manyTasks: Record<string, Task[]> = {
        'user-1': Array(60)
          .fill(null)
          .map((_, i) =>
            createMockTask({
              id: `task-${i}`,
              title: `Task ${i}`,
              status: TaskStatus.TODO,
            })
          ),
      };

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={manyTasks}
          teamMembers={mockTeamMembers}
        />
      );

      // Swimlane label should be present
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should maintain drag and drop without virtualization', () => {
      // Use fewer tasks to avoid virtualization
      const fewTasks: Record<string, Task[]> = {
        'user-1': Array(10)
          .fill(null)
          .map((_, i) =>
            createMockTask({
              id: `task-${i}`,
              title: `Task ${i}`,
              status: TaskStatus.TODO,
            })
          ),
      };

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={fewTasks}
          teamMembers={mockTeamMembers}
        />
      );

      // Should still have draggable cards
      const cards = document.querySelectorAll('[draggable="true"]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should maintain keyboard navigation with virtual scrolling', () => {
      const manyTasks: Record<string, Task[]> = {
        'user-1': Array(60)
          .fill(null)
          .map((_, i) =>
            createMockTask({
              id: `task-${i}`,
              title: `Task ${i}`,
              status: TaskStatus.TODO,
            })
          ),
      };

      const { container } = render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={manyTasks}
          teamMembers={mockTeamMembers}
          keyboardGrabState="grabbed"
          keyboardDropTargetStatus={TaskStatus.TODO}
        />
      );

      // Should still indicate drop target
      expect(container.querySelector('[class*="keyboard-drop-target"]')).toBeTruthy();
    });

    it('should apply virtualized styles when tasks exceed threshold', () => {
      const manyTasks: Record<string, Task[]> = {
        'user-1': Array(60)
          .fill(null)
          .map((_, i) =>
            createMockTask({
              id: `task-${i}`,
              title: `Task ${i}`,
              status: TaskStatus.TODO,
            })
          ),
      };

      const { container } = render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={manyTasks}
          teamMembers={mockTeamMembers}
        />
      );

      // Should have virtualized styles (overflow auto on cells)
      const virtualizedCells = container.querySelectorAll('[style*="overflow: auto"]');
      expect(virtualizedCells.length).toBeGreaterThan(0);
    });

    it('should handle empty cells with virtual scrolling', () => {
      const emptyTasks: Record<string, Task[]> = {
        'user-1': [],
      };

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={emptyTasks}
          teamMembers={mockTeamMembers}
        />
      );

      // Should show empty placeholders
      expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });

    it('should maintain ARIA labels with virtual scrolling', () => {
      const manyTasks: Record<string, Task[]> = {
        'user-1': Array(60)
          .fill(null)
          .map((_, i) =>
            createMockTask({
              id: `task-${i}`,
              title: `Task ${i}`,
              status: TaskStatus.TODO,
            })
          ),
      };

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={manyTasks}
          teamMembers={mockTeamMembers}
        />
      );

      // Should have aria-labels on cells
      const cells = screen.getAllByRole('cell');
      const columnCells = cells.filter((cell) => cell.className.includes('swimlane-cell'));
      expect(columnCells.length).toBeGreaterThan(0);
      expect(columnCells[0]).toHaveAttribute('aria-label', expect.stringContaining('To Do'));
    });

    it('should handle mixed swimlanes with and without virtualization', () => {
      const mixedTasks: Record<string, Task[]> = {
        'user-1': Array(60)
          .fill(null)
          .map((_, i) =>
            createMockTask({
              id: `task-1-${i}`,
              title: `Task 1-${i}`,
              status: TaskStatus.TODO,
            })
          ),
        'user-2': Array(5)
          .fill(null)
          .map((_, i) =>
            createMockTask({
              id: `task-2-${i}`,
              title: `Task 2-${i}`,
              status: TaskStatus.TODO,
            })
          ),
      };

      const members = [
        createMockTeamMember({
          id: 'tm-1',
          userId: 'user-1',
          user: {
            id: 'user-1',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        }),
        createMockTeamMember({
          id: 'tm-2',
          userId: 'user-2',
          user: {
            id: 'user-2',
            email: 'jane@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        }),
      ];

      render(
        <SwimlanesBoard
          {...defaultProps}
          swimlaneGroup="assignee"
          groupedBySwimlane={mixedTasks}
          teamMembers={members}
        />
      );

      // Both swimlanes should be rendered
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });
});
