import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { SprintOverview, type SprintOverviewProps } from './SprintOverview';

const defaultProps: SprintOverviewProps = {
  sprintGoal: 'Complete user authentication feature',
  totalTasks: 10,
  todoTasks: 3,
  inProgressTasks: 4,
  doneTasks: 3,
  totalEstimatedHours: 80,
  totalRemainingHours: 40,
  progressPercentage: 50,
  totalPbis: 5,
  completedPbis: 2,
  totalStoryPoints: 40,
  completedStoryPoints: 16,
};

describe('SprintOverview', () => {
  describe('Rendering', () => {
    it('should render sprint goal correctly', () => {
      render(<SprintOverview {...defaultProps} />);

      expect(screen.getByText('Sprint Goal')).toBeInTheDocument();
      expect(screen.getByText('Complete user authentication feature')).toBeInTheDocument();
    });

    it('should render fallback text when no sprint goal', () => {
      render(<SprintOverview {...defaultProps} sprintGoal={undefined} />);

      expect(screen.getByText('No sprint goal set')).toBeInTheDocument();
    });

    it('should render progress percentage', () => {
      render(<SprintOverview {...defaultProps} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should render tasks statistics', () => {
      render(<SprintOverview {...defaultProps} />);

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should render remaining hours', () => {
      render(<SprintOverview {...defaultProps} />);

      expect(screen.getByText('40h')).toBeInTheDocument();
    });

    it('should render PBI statistics', () => {
      render(<SprintOverview {...defaultProps} />);

      // PBI stats show as "2/5" for completed/total (without spaces)
      expect(
        screen.getByText((content) => content.includes('2') && content.includes('5'))
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label on section', () => {
      render(<SprintOverview {...defaultProps} />);

      const section = screen.getByLabelText('Sprint Overview');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values correctly', () => {
      render(
        <SprintOverview
          {...defaultProps}
          totalTasks={0}
          todoTasks={0}
          inProgressTasks={0}
          doneTasks={0}
          progressPercentage={0}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle large numbers correctly', () => {
      render(
        <SprintOverview
          {...defaultProps}
          totalTasks={999}
          totalEstimatedHours={10000}
          totalRemainingHours={5000}
        />
      );

      expect(screen.getByText('999')).toBeInTheDocument();
      expect(screen.getByText('5000h')).toBeInTheDocument();
    });

    it('should handle empty sprint goal', () => {
      render(<SprintOverview {...defaultProps} sprintGoal="" />);

      expect(screen.getByText('No sprint goal set')).toBeInTheDocument();
    });

    it('should handle all tasks completed', () => {
      render(
        <SprintOverview
          {...defaultProps}
          todoTasks={0}
          inProgressTasks={0}
          doneTasks={10}
          progressPercentage={100}
          totalRemainingHours={0}
        />
      );

      expect(screen.getByText('0h')).toBeInTheDocument();
    });
  });
});
