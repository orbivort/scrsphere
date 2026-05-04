/**
 * GoalProgressBar Component Tests
 *
 * Unit tests for the GoalProgressBar component using React Testing Library.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ItemStatus, MoSCoWPriority } from '../../../types';
import { GoalProgressBar } from './GoalProgressBar';

/**
 * Mock product goal for testing
 */
const mockGoal = {
  id: 'goal-1',
  title: 'Test Goal',
  description: 'Test goal description',
  status: 'ACTIVE' as const,
  teamId: 'team-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

/**
 * Mock backlog items for testing
 */
const mockBacklogItems = [
  {
    id: 'item-1',
    title: 'Item 1',
    description: 'Description 1',
    status: ItemStatus.DONE,
    priority: MoSCoWPriority.MUST_HAVE,
    storyPoints: 5,
    businessValue: 8,
    labels: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    teamId: 'team-1',
    goalId: 'goal-1',
  },
  {
    id: 'item-2',
    title: 'Item 2',
    description: 'Description 2',
    status: ItemStatus.IN_PROGRESS,
    priority: MoSCoWPriority.SHOULD_HAVE,
    storyPoints: 3,
    businessValue: 5,
    labels: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    teamId: 'team-1',
    goalId: 'goal-1',
  },
  {
    id: 'item-3',
    title: 'Item 3',
    description: 'Description 3',
    status: ItemStatus.NEW,
    priority: MoSCoWPriority.COULD_HAVE,
    storyPoints: 2,
    businessValue: 3,
    labels: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    teamId: 'team-1',
    goalId: 'goal-1',
  },
  {
    id: 'item-4',
    title: 'Item 4 (Other Goal)',
    description: 'Description 4',
    status: ItemStatus.DONE,
    priority: MoSCoWPriority.MUST_HAVE,
    storyPoints: 10,
    businessValue: 13,
    labels: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    teamId: 'team-1',
    goalId: 'goal-2',
  },
];

describe('GoalProgressBar', () => {
  it('should render progress percentage', () => {
    render(<GoalProgressBar goal={mockGoal} backlogItems={mockBacklogItems} />);

    // Total: 5 + 3 + 2 = 10, Completed: 5, Progress: 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should only count items for the specified goal', () => {
    render(<GoalProgressBar goal={mockGoal} backlogItems={mockBacklogItems} />);

    // Item 4 has goalId 'goal-2', so it should not be counted
    // Total for goal-1: 5 + 3 + 2 = 10, Completed: 5
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should show 0% when no items exist', () => {
    render(<GoalProgressBar goal={mockGoal} backlogItems={[]} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should show 0% when no items match the goal', () => {
    const otherGoal = { ...mockGoal, id: 'goal-999' };
    render(<GoalProgressBar goal={otherGoal} backlogItems={mockBacklogItems} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should show 100% when all items are done', () => {
    const allDoneItems = mockBacklogItems.map((item) => ({
      ...item,
      status: ItemStatus.DONE,
      goalId: 'goal-1',
    }));

    render(<GoalProgressBar goal={mockGoal} backlogItems={allDoneItems} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should handle items without story points', () => {
    const itemsWithoutPoints = [
      { ...mockBacklogItems[0], storyPoints: undefined },
      { ...mockBacklogItems[1], storyPoints: undefined },
    ];

    render(<GoalProgressBar goal={mockGoal} backlogItems={itemsWithoutPoints} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should render SVG progress ring', () => {
    const { container } = render(
      <GoalProgressBar goal={mockGoal} backlogItems={mockBacklogItems} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '60');
    expect(svg).toHaveAttribute('height', '60');
  });

  it('should render two circles for progress ring', () => {
    const { container } = render(
      <GoalProgressBar goal={mockGoal} backlogItems={mockBacklogItems} />
    );

    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(2);
  });

  it('should calculate progress based on story points not item count', () => {
    // Item 1: 5 pts done, Item 2: 3 pts in progress, Item 3: 2 pts new
    // Progress = 5 / (5 + 3 + 2) = 50%
    render(<GoalProgressBar goal={mockGoal} backlogItems={mockBacklogItems} />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
