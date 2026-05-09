/**
 * TaskCard Component Tests
 *
 * Tests for keyboard drag-and-drop operations, ARIA attributes,
 * screen reader announcements, and WIP limit validation.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { TaskCard, type TaskCardProps } from './TaskCard';
import { AnnouncerProvider } from '../../../components/LiveAnnouncer';
import { TaskStatus, type Task } from '../../../types';

// Mock task data
const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: 'task-123',
  sprintId: 'sprint-1',
  pbiId: 'pbi-1',
  title: 'Test Task',
  description: 'Test description',
  status: TaskStatus.TODO,
  estimatedHours: 8,
  remainingHours: 8,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  assignee: {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  },
  pbi: {
    id: 'pbi-1',
    title: 'Test PBI',
    storyPoints: 5,
  },
  ...overrides,
});

// Default props
const defaultProps: TaskCardProps = {
  task: createMockTask(),
  onDragStart: vi.fn(),
  onDragEnd: vi.fn(),
  onClick: vi.fn(),
  onKeyDown: vi.fn(),
  onFocus: vi.fn(),
  onBlur: vi.fn(),
};

// Test wrapper with AnnouncerProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AnnouncerProvider>{children}</AnnouncerProvider>
);

describe('TaskCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any live regions
    const existingAnnouncer = document.getElementById('sr-announcer');
    if (existingAnnouncer) existingAnnouncer.remove();
  });

  describe('Rendering', () => {
    it('should render task information correctly', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('#-123')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render status badge correctly', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('TODO')).toBeInTheDocument();
    });

    it('should render PBI information when present', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('PBI:')).toBeInTheDocument();
      expect(screen.getByText('Test PBI')).toBeInTheDocument();
      expect(screen.getByText('5 pts')).toBeInTheDocument();
    });

    it('should render hours information correctly', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('8h')).toBeInTheDocument();
    });

    it('should render unassigned when no assignee', () => {
      const task = createMockTask({ assignee: undefined });
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} task={task} />
        </TestWrapper>
      );

      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });
  });

  describe('ARIA Attributes', () => {
    it('should have correct role attribute', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      expect(card).toBeInTheDocument();
    });

    it('should have tabIndex={0}', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should have aria-roledescription="draggable task"', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      expect(card).toHaveAttribute('aria-roledescription', 'draggable task');
    });

    it('should have aria-grabbed attribute', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      expect(card).toHaveAttribute('aria-grabbed', 'false');
    });

    it('should have aria-label with task information', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      const ariaLabel = card.getAttribute('aria-label');
      expect(ariaLabel).toContain('Test Task');
      expect(ariaLabel).toContain('To Do');
      expect(ariaLabel).toContain('John Doe');
    });

    it('should have data-status attribute', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      expect(card).toHaveAttribute('data-status', 'TODO');
    });
  });

  describe('Visual States', () => {
    it('should apply dragging class when isDragging is true', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} isDragging />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      expect(card.className).toMatch(/dragging/);
    });

    it('should apply focused class when isFocused is true', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} isFocused />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      expect(card.className).toMatch(/focused/);
    });

    it('should apply grabbed class when isGrabbed is true (external prop)', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} isGrabbed />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      expect(card.className).toMatch(/grabbed/);
    });

    it('should apply drop-target class when isDropTarget is true (external prop)', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} isDropTarget />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      expect(card.className).toMatch(/drop-target/);
    });
  });

  describe('Keyboard Grab Mode', () => {
    it('should enter grab mode on Space key when onMoveStatus is provided', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();
      await user.keyboard(' ');

      expect(card.className).toMatch(/grabbed/);
      expect(card).toHaveAttribute('aria-grabbed', 'true');
    });

    it('should enter grab mode on Enter key when onMoveStatus is provided', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();
      await user.keyboard('{Enter}');

      expect(card.className).toMatch(/grabbed/);
    });

    it('should not enter grab mode when onMoveStatus is not provided', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();
      await user.keyboard(' ');

      expect(card.className).not.toMatch(/grabbed/);
    });

    it('should show grab indicator when grabbed', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();
      await user.keyboard(' ');

      expect(screen.getByText('Use Arrow keys to move')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation in Grab Mode', () => {
    it('should change target status on ArrowRight', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      // Enter grab mode
      await user.keyboard(' ');

      // Press ArrowRight to change target status
      await user.keyboard('{ArrowRight}');

      // Should show "Moving to In Progress"
      await waitFor(() => {
        expect(screen.getByText('Moving to In Progress')).toBeInTheDocument();
      });
    });

    it('should change target status on ArrowLeft', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();
      const task = createMockTask({ status: TaskStatus.IN_PROGRESS });

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} task={task} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      // Enter grab mode
      await user.keyboard(' ');

      // Press ArrowLeft to change target status
      await user.keyboard('{ArrowLeft}');

      // Should show "Moving to To Do"
      await waitFor(() => {
        expect(screen.getByText('Moving to To Do')).toBeInTheDocument();
      });
    });

    it('should call onMoveStatus on Enter when target status is different', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      // Enter grab mode
      await user.keyboard(' ');

      // Change target status
      await user.keyboard('{ArrowRight}');

      // Complete drop
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(onMoveStatus).toHaveBeenCalledWith('task-123', TaskStatus.IN_PROGRESS);
      });
    });

    it('should cancel grab mode on Escape', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      // Enter grab mode
      await user.keyboard(' ');

      expect(card.className).toMatch(/grabbed/);

      // Cancel
      await user.keyboard('{Escape}');

      expect(card.className).not.toMatch(/grabbed/);
      expect(card).toHaveAttribute('aria-grabbed', 'false');
    });
  });

  describe('Quick-Action Shortcuts (Ctrl+Arrow)', () => {
    it('should move to next status on Ctrl+ArrowRight', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      await user.keyboard('{Control>}{ArrowRight}{/Control}');

      await waitFor(() => {
        expect(onMoveStatus).toHaveBeenCalledWith('task-123', TaskStatus.IN_PROGRESS);
      });
    });

    it('should move to previous status on Ctrl+ArrowLeft', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();
      const task = createMockTask({ status: TaskStatus.IN_PROGRESS });

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} task={task} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      await user.keyboard('{Control>}{ArrowLeft}{/Control}');

      await waitFor(() => {
        expect(onMoveStatus).toHaveBeenCalledWith('task-123', TaskStatus.TODO);
      });
    });

    it('should not trigger quick-action when onMoveStatus is not provided', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      await user.keyboard('{Control>}{ArrowRight}{/Control}');

      // Should call parent onKeyDown instead
      expect(defaultProps.onKeyDown).toHaveBeenCalled();
    });
  });

  describe('WIP Limit Validation', () => {
    const wipLimits = {
      todo: Infinity,
      in_progress: 2,
      done: Infinity,
    };

    const tasksByStatus = {
      todo: [createMockTask({ id: 'task-1' })],
      in_progress: [
        createMockTask({ id: 'task-2', status: TaskStatus.IN_PROGRESS }),
        createMockTask({ id: 'task-3', status: TaskStatus.IN_PROGRESS }),
      ],
      done: [],
    };

    it('should prevent move when WIP limit is reached', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();

      render(
        <TestWrapper>
          <TaskCard
            {...defaultProps}
            onMoveStatus={onMoveStatus}
            wipLimits={wipLimits}
            tasksByStatus={tasksByStatus}
          />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      // Try to move to IN_PROGRESS (which has reached WIP limit)
      await user.keyboard('{Control>}{ArrowRight}{/Control}');

      // Should not call onMoveStatus
      expect(onMoveStatus).not.toHaveBeenCalled();
    });

    it('should allow move when WIP limit is not reached', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();

      const availableTasksByStatus = {
        todo: [createMockTask({ id: 'task-1' })],
        in_progress: [createMockTask({ id: 'task-2', status: TaskStatus.IN_PROGRESS })],
        done: [],
      };

      render(
        <TestWrapper>
          <TaskCard
            {...defaultProps}
            onMoveStatus={onMoveStatus}
            wipLimits={wipLimits}
            tasksByStatus={availableTasksByStatus}
          />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      await user.keyboard('{Control>}{ArrowRight}{/Control}');

      await waitFor(() => {
        expect(onMoveStatus).toHaveBeenCalledWith('task-123', TaskStatus.IN_PROGRESS);
      });
    });

    it('should validate WIP limit during grab mode navigation', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();

      render(
        <TestWrapper>
          <TaskCard
            {...defaultProps}
            onMoveStatus={onMoveStatus}
            wipLimits={wipLimits}
            tasksByStatus={tasksByStatus}
          />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      // Enter grab mode
      await user.keyboard(' ');

      // Try to change target status to IN_PROGRESS
      await user.keyboard('{ArrowRight}');

      // Should not change target status (WIP limit reached)
      expect(screen.getByText('Use Arrow keys to move')).toBeInTheDocument();
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce when task is grabbed', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();
      await user.keyboard(' ');

      // Wait for announcement
      await waitFor(() => {
        const liveRegion = document.getElementById('sr-announcer');
        expect(liveRegion?.textContent).toContain('grabbed');
      });
    });

    it('should announce when task is dropped', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      // Enter grab mode and complete drop
      await user.keyboard(' ');
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{Enter}');

      // Wait for announcement
      await waitFor(() => {
        const liveRegion = document.getElementById('sr-announcer');
        expect(liveRegion?.textContent).toContain('moved to');
      });
    });

    it('should announce when drag is cancelled', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      // Enter grab mode and cancel
      await user.keyboard(' ');
      await user.keyboard('{Escape}');

      // Wait for announcement
      await waitFor(() => {
        const liveRegion = document.getElementById('sr-announcer');
        expect(liveRegion?.textContent).toContain('cancelled');
      });
    });

    it('should announce WIP limit error', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();

      const wipLimits = {
        todo: Infinity,
        in_progress: 2,
        done: Infinity,
      };

      const tasksByStatus = {
        todo: [createMockTask({ id: 'task-1' })],
        in_progress: [
          createMockTask({ id: 'task-2', status: TaskStatus.IN_PROGRESS }),
          createMockTask({ id: 'task-3', status: TaskStatus.IN_PROGRESS }),
        ],
        done: [],
      };

      render(
        <TestWrapper>
          <TaskCard
            {...defaultProps}
            onMoveStatus={onMoveStatus}
            wipLimits={wipLimits}
            tasksByStatus={tasksByStatus}
          />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      // Try to move to IN_PROGRESS (WIP limit reached)
      await user.keyboard('{Control>}{ArrowRight}{/Control}');

      // Wait for error announcement
      await waitFor(() => {
        const liveRegion = document.getElementById('sr-announcer');
        expect(liveRegion?.textContent).toContain('WIP limit');
      });
    });
  });

  describe('Event Handlers', () => {
    it('should call onDragStart when drag starts', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      fireEvent.dragStart(card);

      expect(defaultProps.onDragStart).toHaveBeenCalled();
    });

    it('should call onDragEnd when drag ends', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      fireEvent.dragEnd(card);

      expect(defaultProps.onDragEnd).toHaveBeenCalled();
    });

    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      await user.click(card);

      expect(defaultProps.onClick).toHaveBeenCalled();
    });

    it('should call onFocus when focused', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      fireEvent.focus(card);

      expect(defaultProps.onFocus).toHaveBeenCalled();
    });

    it('should call onBlur when blurred', () => {
      render(
        <TestWrapper>
          <TaskCard {...defaultProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      fireEvent.focus(card);
      fireEvent.blur(card);

      expect(defaultProps.onBlur).toHaveBeenCalled();
    });
  });

  describe('Status Transitions', () => {
    it('should allow TODO to IN_PROGRESS transition', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();
      const task = createMockTask({ status: TaskStatus.TODO });

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} task={task} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      await user.keyboard('{Control>}{ArrowRight}{/Control}');

      await waitFor(() => {
        expect(onMoveStatus).toHaveBeenCalledWith('task-123', TaskStatus.IN_PROGRESS);
      });
    });

    it('should allow IN_PROGRESS to DONE transition', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();
      const task = createMockTask({ status: TaskStatus.IN_PROGRESS });

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} task={task} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      await user.keyboard('{Control>}{ArrowRight}{/Control}');

      await waitFor(() => {
        expect(onMoveStatus).toHaveBeenCalledWith('task-123', TaskStatus.DONE);
      });
    });

    it('should allow IN_PROGRESS to TODO transition', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();
      const task = createMockTask({ status: TaskStatus.IN_PROGRESS });

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} task={task} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      await user.keyboard('{Control>}{ArrowLeft}{/Control}');

      await waitFor(() => {
        expect(onMoveStatus).toHaveBeenCalledWith('task-123', TaskStatus.TODO);
      });
    });

    it('should allow DONE to IN_PROGRESS transition', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();
      const task = createMockTask({ status: TaskStatus.DONE });

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} task={task} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      await user.keyboard('{Control>}{ArrowLeft}{/Control}');

      await waitFor(() => {
        expect(onMoveStatus).toHaveBeenCalledWith('task-123', TaskStatus.IN_PROGRESS);
      });
    });

    it('should not allow TODO to DONE direct transition', async () => {
      const user = userEvent.setup();
      const onMoveStatus = vi.fn();
      const task = createMockTask({ status: TaskStatus.TODO });

      render(
        <TestWrapper>
          <TaskCard {...defaultProps} task={task} onMoveStatus={onMoveStatus} />
        </TestWrapper>
      );

      const card = screen.getByRole('listitem');
      card.focus();

      // Enter grab mode
      await user.keyboard(' ');

      // Try to move right twice (TODO -> IN_PROGRESS -> DONE)
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowRight}');

      // Should still be at IN_PROGRESS (can't skip)
      expect(screen.getByText('Moving to In Progress')).toBeInTheDocument();
    });
  });
});
