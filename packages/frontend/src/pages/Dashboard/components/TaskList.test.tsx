import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { TaskList, type TaskListProps } from './TaskList';
import { TaskStatus } from '../../../types';

const mockTasks: Array<{
  id: string;
  sprintId: string;
  pbiId: string;
  title: string;
  status: TaskStatus;
  assigneeId: string;
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: 'task-1',
    sprintId: 'sprint-1',
    pbiId: 'pbi-1',
    title: 'Implement login',
    status: TaskStatus.DONE,
    assigneeId: 'user-1',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'task-2',
    sprintId: 'sprint-1',
    pbiId: 'pbi-1',
    title: 'Implement logout',
    status: TaskStatus.IN_PROGRESS,
    assigneeId: 'user-1',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'task-3',
    sprintId: 'sprint-1',
    pbiId: 'pbi-2',
    title: 'Write tests',
    status: TaskStatus.TODO,
    assigneeId: 'user-2',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
];

describe('TaskList Component', () => {
  const defaultProps: TaskListProps = {
    tasks: mockTasks,
    emptyMessage: 'No tasks assigned to you yet.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render task list with tasks', () => {
      render(<TaskList {...defaultProps} />);

      expect(screen.getByText('Implement login')).toBeInTheDocument();
      expect(screen.getByText('Implement logout')).toBeInTheDocument();
      expect(screen.getByText('Write tests')).toBeInTheDocument();
    });

    it('should display task status badges', () => {
      render(<TaskList {...defaultProps} />);

      const doneBadges = screen.getAllByText('DONE');
      const inProgressBadges = screen.getAllByText('IN PROGRESS');
      expect(doneBadges.length).toBeGreaterThan(0);
      expect(inProgressBadges.length).toBeGreaterThan(0);
    });

    it('should render all tasks with correct structure', () => {
      render(<TaskList {...defaultProps} />);

      expect(screen.getByText('Implement login')).toBeInTheDocument();
      expect(screen.getByText('Implement logout')).toBeInTheDocument();
      expect(screen.getByText('Write tests')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem').length).toBe(mockTasks.length);
    });

    it('should render empty message when no tasks', () => {
      render(<TaskList {...defaultProps} tasks={[]} />);

      expect(screen.getByText('No tasks assigned to you yet.')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<TaskList {...defaultProps} />);

      const list = screen.getByRole('list', { name: 'Task list' });
      expect(list).toBeInTheDocument();
    });
  });

  describe('Task Click Handler', () => {
    it('should call onTaskClick when task is clicked', async () => {
      const mockOnTaskClick = vi.fn();
      render(<TaskList {...defaultProps} onTaskClick={mockOnTaskClick} />);

      const taskItem = screen.getByText('Implement login').closest('[role="button"]');
      if (taskItem) {
        taskItem.click();
      }

      await waitFor(() => {
        expect(mockOnTaskClick).toHaveBeenCalledWith('task-1');
      });
    });

    it('should not make tasks clickable when onTaskClick is not provided', () => {
      render(<TaskList {...defaultProps} />);

      const taskItem = screen.getByText('Implement login').closest('li');
      expect(taskItem).not.toHaveAttribute('role', 'button');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should not have keyboard navigation when onTaskClick is not provided', () => {
      render(<TaskList {...defaultProps} />);

      const list = screen.getByRole('list', { name: 'Task list' });
      expect(list).not.toHaveAttribute('aria-activedescendant');
    });

    it('should have aria-activedescendant when onTaskClick is provided', () => {
      const mockOnTaskClick = vi.fn();
      render(<TaskList {...defaultProps} onTaskClick={mockOnTaskClick} />);

      const list = screen.getByRole('list', { name: 'Task list' });
      expect(list).toHaveAttribute('aria-activedescendant');
    });

    it('should navigate down with ArrowDown key and loop around', async () => {
      const user = userEvent.setup();
      const mockOnTaskClick = vi.fn();
      render(<TaskList {...defaultProps} onTaskClick={mockOnTaskClick} />);

      const list = screen.getByRole('list', { name: 'Task list' });
      const firstItem = screen
        .getByText('Implement login')
        .closest('[role="button"]') as HTMLElement;

      firstItem.focus();
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      expect(list).toHaveAttribute('aria-activedescendant', 'task-item-2');

      await user.keyboard('{ArrowDown}');
      expect(list).toHaveAttribute('aria-activedescendant', 'task-item-0');
    });

    it('should navigate up with ArrowUp key and loop around', async () => {
      const user = userEvent.setup();
      const mockOnTaskClick = vi.fn();
      render(<TaskList {...defaultProps} onTaskClick={mockOnTaskClick} />);

      const firstItem = screen
        .getByText('Implement login')
        .closest('[role="button"]') as HTMLElement;
      firstItem.focus();

      const list = screen.getByRole('list', { name: 'Task list' });

      await user.keyboard('{ArrowUp}');
      expect(list).toHaveAttribute('aria-activedescendant', 'task-item-2');
    });

    it('should jump to first item with Home key', async () => {
      const user = userEvent.setup();
      const mockOnTaskClick = vi.fn();
      render(<TaskList {...defaultProps} onTaskClick={mockOnTaskClick} />);

      const list = screen.getByRole('list', { name: 'Task list' });

      await user.keyboard('{End}');
      await user.keyboard('{Home}');
      expect(list).toHaveAttribute('aria-activedescendant', 'task-item-0');
    });

    it('should jump to last item with End key', async () => {
      const user = userEvent.setup();
      const mockOnTaskClick = vi.fn();
      render(<TaskList {...defaultProps} onTaskClick={mockOnTaskClick} />);

      const list = screen.getByRole('list', { name: 'Task list' });
      await user.keyboard('{End}');
      expect(list).toHaveAttribute('aria-activedescendant', 'task-item-2');
    });

    it('should trigger click action with Enter key', async () => {
      const user = userEvent.setup();
      const mockOnTaskClick = vi.fn();
      render(<TaskList {...defaultProps} onTaskClick={mockOnTaskClick} />);

      const firstItem = screen
        .getByText('Implement login')
        .closest('[role="button"]') as HTMLElement;
      firstItem.focus();

      await user.keyboard('{Enter}');
      expect(mockOnTaskClick).toHaveBeenCalledWith('task-1');
    });

    it('should trigger click action with Space key', async () => {
      const user = userEvent.setup();
      const mockOnTaskClick = vi.fn();
      render(<TaskList {...defaultProps} onTaskClick={mockOnTaskClick} />);

      const firstItem = screen
        .getByText('Implement login')
        .closest('[role="button"]') as HTMLElement;
      firstItem.focus();

      await user.keyboard(' ');
      expect(mockOnTaskClick).toHaveBeenCalledWith('task-1');
    });

    it('should blur list with Escape key', async () => {
      const user = userEvent.setup();
      const mockOnTaskClick = vi.fn();
      render(<TaskList {...defaultProps} onTaskClick={mockOnTaskClick} />);

      const firstItem = screen
        .getByText('Implement login')
        .closest('[role="button"]') as HTMLElement;
      firstItem.focus();

      await user.keyboard('{Escape}');

      expect(document.activeElement).not.toBe(screen.getByRole('list', { name: 'Task list' }));
    });
  });

  describe('Task Filtering', () => {
    it('should only display tasks that match filter criteria', () => {
      const filteredTasks = mockTasks.filter((task) => task.assigneeId === 'user-1');
      render(<TaskList {...defaultProps} tasks={filteredTasks} />);

      expect(screen.getByText('Implement login')).toBeInTheDocument();
      expect(screen.getByText('Implement logout')).toBeInTheDocument();
      expect(screen.queryByText('Write tests')).not.toBeInTheDocument();
    });
  });
});
