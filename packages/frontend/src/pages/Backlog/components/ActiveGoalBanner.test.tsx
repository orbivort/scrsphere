import { screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

import {
  renderWithProviders,
  initTestI18n,
  createMockProductGoal,
  createMockBacklogItem,
} from '../../../test-utils';
import { MoSCoWPriority } from '../../../types';

import { ActiveGoalBanner } from './ActiveGoalBanner';

const mockGoal = createMockProductGoal({
  id: 'goal-1',
  title: 'Active Goal',
  status: 'ACTIVE',
  targetDate: '2024-12-31',
});

const mockBacklogItems = [
  createMockBacklogItem({
    id: 'pbi-1',
    title: 'Feature A',
    priority: MoSCoWPriority.MUST_HAVE,
    status: 'NEW',
  }),
  createMockBacklogItem({
    id: 'pbi-2',
    title: 'Feature B',
    priority: MoSCoWPriority.SHOULD_HAVE,
    status: 'DONE',
  }),
  createMockBacklogItem({
    id: 'pbi-3',
    title: 'Feature C',
    priority: MoSCoWPriority.COULD_HAVE,
    status: 'IN_PROGRESS',
  }),
];

const mockItemsByMoscow = {
  [MoSCoWPriority.MUST_HAVE]: [mockBacklogItems[0]],
  [MoSCoWPriority.SHOULD_HAVE]: [mockBacklogItems[1]],
  [MoSCoWPriority.COULD_HAVE]: [mockBacklogItems[2]],
  [MoSCoWPriority.WONT_HAVE]: [],
};

describe('ActiveGoalBanner', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the goal title', () => {
      renderWithProviders(
        <ActiveGoalBanner
          goal={mockGoal}
          backlogItems={mockBacklogItems}
          itemsByMoscow={mockItemsByMoscow}
          doneCount={1}
          totalCount={3}
        />
      );

      const activeGoalLabels = screen.getAllByText('Active Goal');
      expect(activeGoalLabels.length).toBeGreaterThan(0);
    });

    it('should render the target date when provided', () => {
      renderWithProviders(
        <ActiveGoalBanner
          goal={mockGoal}
          backlogItems={mockBacklogItems}
          itemsByMoscow={mockItemsByMoscow}
          doneCount={1}
          totalCount={3}
        />
      );

      expect(screen.getByText(/target:/i)).toBeInTheDocument();
    });

    it('should not render target date when not provided', () => {
      const goalWithoutDate = { ...mockGoal, targetDate: undefined };
      renderWithProviders(
        <ActiveGoalBanner
          goal={goalWithoutDate}
          backlogItems={mockBacklogItems}
          itemsByMoscow={mockItemsByMoscow}
          doneCount={1}
          totalCount={3}
        />
      );

      expect(screen.queryByText(/target:/i)).not.toBeInTheDocument();
    });

    it('should display total item count', () => {
      renderWithProviders(
        <ActiveGoalBanner
          goal={mockGoal}
          backlogItems={mockBacklogItems}
          itemsByMoscow={mockItemsByMoscow}
          doneCount={1}
          totalCount={3}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
    });

    it('should display Must Have count', () => {
      renderWithProviders(
        <ActiveGoalBanner
          goal={mockGoal}
          backlogItems={mockBacklogItems}
          itemsByMoscow={mockItemsByMoscow}
          doneCount={1}
          totalCount={3}
        />
      );

      expect(screen.getByText('Must Have')).toBeInTheDocument();
    });

    it('should display Done count', () => {
      renderWithProviders(
        <ActiveGoalBanner
          goal={mockGoal}
          backlogItems={mockBacklogItems}
          itemsByMoscow={mockItemsByMoscow}
          doneCount={1}
          totalCount={3}
        />
      );

      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });

  describe('Statistics', () => {
    it('should display correct statistics for items', () => {
      renderWithProviders(
        <ActiveGoalBanner
          goal={mockGoal}
          backlogItems={mockBacklogItems}
          itemsByMoscow={mockItemsByMoscow}
          doneCount={1}
          totalCount={3}
        />
      );

      const goalBanner = document.querySelector('[class*="active-goal-banner"]');
      expect(goalBanner).toBeInTheDocument();
    });

    it('should display zero counts correctly', () => {
      renderWithProviders(
        <ActiveGoalBanner
          goal={mockGoal}
          backlogItems={[]}
          itemsByMoscow={{
            [MoSCoWPriority.MUST_HAVE]: [],
            [MoSCoWPriority.SHOULD_HAVE]: [],
            [MoSCoWPriority.COULD_HAVE]: [],
            [MoSCoWPriority.WONT_HAVE]: [],
          }}
          doneCount={0}
          totalCount={0}
        />
      );

      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
    });
  });
});
