import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import { initTestI18n } from '@/test-utils';

import { ProductGoalProgress, type ProductGoalProgressData } from './ProductGoalProgress';

// Mock CSS module for this component.
vi.mock('./ProductGoalProgress.module.css', () => ({
  default: {
    container: 'container',
    header: 'header',
    title: 'title',
    status: 'status',
    description: 'description',
    metrics: 'metrics',
    'metric-label': 'metric-label',
    'metrics-text': 'metrics-text',
    'progress-group': 'progress-group',
    'progress-row': 'progress-row',
    'progress-label': 'progress-label',
    'progress-count': 'progress-count',
  },
}));

// Mock the ProgressBar child to keep assertions focused on this component's logic.
const progressBarProps: Array<Record<string, unknown>> = [];
vi.mock('../Page/ProgressBar', () => ({
  ProgressBar: (props: { value: number; size: string; variant: string; label: string }) => {
    progressBarProps.push(props);
    return (
      <div data-testid="mock-progressbar" data-value={props.value} data-variant={props.variant}>
        {props.label}
      </div>
    );
  },
}));

const createGoal = (overrides: Partial<ProductGoalProgressData> = {}): ProductGoalProgressData => ({
  id: 'goal-1',
  title: 'Release v1.0',
  status: 'ACTIVE',
  ...overrides,
});

describe('ProductGoalProgress Component', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    progressBarProps.length = 0;
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('renders the goal title', () => {
      render(<ProductGoalProgress goal={createGoal()} />);

      expect(screen.getByRole('heading', { level: 3, name: 'Release v1.0' })).toBeInTheDocument();
    });

    it('renders the goal status when provided', () => {
      render(<ProductGoalProgress goal={createGoal({ status: 'COMPLETED' })} />);

      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });

    it('does not render a status badge when status is empty', () => {
      render(<ProductGoalProgress goal={createGoal({ status: '' })} />);

      expect(screen.queryByText('COMPLETED')).not.toBeInTheDocument();
    });

    it('renders the description when provided', () => {
      render(<ProductGoalProgress goal={createGoal({ description: 'Ship the first version.' })} />);

      expect(screen.getByText('Ship the first version.')).toBeInTheDocument();
    });

    it('does not render description when it is null', () => {
      const { container } = render(
        <ProductGoalProgress goal={createGoal({ description: null })} />
      );

      expect(container.querySelector('.description')).not.toBeInTheDocument();
    });

    it('renders the success metrics section when provided', () => {
      render(
        <ProductGoalProgress goal={createGoal({ successMetrics: 'Adopted by 500 users.' })} />
      );

      expect(screen.getByText('Adopted by 500 users.')).toBeInTheDocument();
      expect(screen.getByText('Success Metrics')).toBeInTheDocument();
    });

    it('does not render success metrics when null', () => {
      const { container } = render(
        <ProductGoalProgress goal={createGoal({ successMetrics: null })} />
      );

      expect(container.querySelector('.metrics')).not.toBeInTheDocument();
    });
  });

  describe('Progress bars', () => {
    it('renders two progress bars (PBI and story points)', () => {
      render(<ProductGoalProgress goal={createGoal()} />);

      expect(screen.getAllByTestId('mock-progressbar')).toHaveLength(2);
    });

    it('passes success variant to the PBI progress bar', () => {
      render(<ProductGoalProgress goal={createGoal()} />);

      const pbiBar = progressBarProps[0];
      expect(pbiBar.variant).toBe('success');
      expect(pbiBar.size).toBe('small');
    });

    it('passes primary variant to the story points progress bar', () => {
      render(<ProductGoalProgress goal={createGoal()} />);

      const storyBar = progressBarProps[1];
      expect(storyBar.variant).toBe('primary');
      expect(storyBar.size).toBe('small');
    });
  });

  describe('PBI percentage calculation', () => {
    it('computes percentage from completed and total PBI counts', () => {
      render(<ProductGoalProgress goal={createGoal({ completedPbiCount: 3, totalPbiCount: 4 })} />);

      expect(progressBarProps[0].value).toBe(75);
    });

    it('rounds the PBI percentage', () => {
      render(<ProductGoalProgress goal={createGoal({ completedPbiCount: 1, totalPbiCount: 3 })} />);

      expect(progressBarProps[0].value).toBe(33);
    });

    it('defaults to 0 percent when total PBI count is missing', () => {
      render(<ProductGoalProgress goal={createGoal({ completedPbiCount: 5 })} />);

      expect(progressBarProps[0].value).toBe(0);
    });

    it('defaults to 0 percent when total PBI count is zero', () => {
      render(<ProductGoalProgress goal={createGoal({ completedPbiCount: 0, totalPbiCount: 0 })} />);

      expect(progressBarProps[0].value).toBe(0);
    });

    it('treats missing completed PBI count as zero', () => {
      render(<ProductGoalProgress goal={createGoal({ totalPbiCount: 4 })} />);

      expect(progressBarProps[0].value).toBe(0);
    });
  });

  describe('Story points percentage calculation', () => {
    it('computes percentage from completed and total story points', () => {
      render(
        <ProductGoalProgress
          goal={createGoal({ completedStoryPoints: 21, totalStoryPoints: 34 })}
        />
      );

      expect(progressBarProps[1].value).toBe(62);
    });

    it('rounds the story points percentage', () => {
      render(
        <ProductGoalProgress goal={createGoal({ completedStoryPoints: 1, totalStoryPoints: 3 })} />
      );

      expect(progressBarProps[1].value).toBe(33);
    });

    it('defaults to 0 percent when total story points is missing', () => {
      render(<ProductGoalProgress goal={createGoal({ completedStoryPoints: 10 })} />);

      expect(progressBarProps[1].value).toBe(0);
    });

    it('defaults to 0 percent when total story points is zero', () => {
      render(
        <ProductGoalProgress goal={createGoal({ completedStoryPoints: 0, totalStoryPoints: 0 })} />
      );

      expect(progressBarProps[1].value).toBe(0);
    });

    it('treats missing completed story points as zero', () => {
      render(<ProductGoalProgress goal={createGoal({ totalStoryPoints: 34 })} />);

      expect(progressBarProps[1].value).toBe(0);
    });

    it('renders 100 percent when all story points are completed', () => {
      render(
        <ProductGoalProgress
          goal={createGoal({ completedStoryPoints: 34, totalStoryPoints: 34 })}
        />
      );

      expect(progressBarProps[1].value).toBe(100);
    });
  });

  describe('Progress count display', () => {
    it('shows completed/total PBI count', () => {
      render(<ProductGoalProgress goal={createGoal({ completedPbiCount: 2, totalPbiCount: 5 })} />);

      expect(screen.getByText('2/5')).toBeInTheDocument();
    });

    it('shows 0/0 when counts are missing', () => {
      render(<ProductGoalProgress goal={createGoal()} />);

      expect(screen.getAllByText('0/0')).toHaveLength(2);
    });

    it('shows completed/total story points', () => {
      render(
        <ProductGoalProgress
          goal={createGoal({ completedStoryPoints: 13, totalStoryPoints: 21 })}
        />
      );

      expect(screen.getByText('13/21')).toBeInTheDocument();
    });
  });
});
