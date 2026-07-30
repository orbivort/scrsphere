import React from 'react';
import { renderWithProviders, screen, initTestI18n, i18nT } from '../../../test-utils';
import { describe, it, expect, beforeAll } from 'vitest';

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
  beforeAll(async () => {
    await initTestI18n();
  });

  describe('Rendering', () => {
    it('should render sprint goal correctly', () => {
      renderWithProviders(<SprintOverview {...defaultProps} />);

      expect(screen.getByText('Sprint Goal')).toBeInTheDocument();
      expect(screen.getByText('Complete user authentication feature')).toBeInTheDocument();
    });

    it('should render fallback text when no sprint goal', () => {
      renderWithProviders(<SprintOverview {...defaultProps} sprintGoal={undefined} />);

      expect(screen.getByText(i18nT('sprint:sprintOverview.noGoalDefined'))).toBeInTheDocument();
    });

    it('should render progress percentage', () => {
      renderWithProviders(<SprintOverview {...defaultProps} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should render tasks statistics', () => {
      renderWithProviders(<SprintOverview {...defaultProps} />);

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should render remaining hours', () => {
      renderWithProviders(<SprintOverview {...defaultProps} />);

      expect(screen.getByText('40h')).toBeInTheDocument();
    });

    it('should render PBI statistics', () => {
      renderWithProviders(<SprintOverview {...defaultProps} />);

      // PBI stats show as "2/5" for completed/total (without spaces)
      expect(
        screen.getByText((content) => content.includes('2') && content.includes('5'))
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label on section', () => {
      renderWithProviders(<SprintOverview {...defaultProps} />);

      const section = screen.getByLabelText('Sprint Overview');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values correctly', () => {
      renderWithProviders(
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
      renderWithProviders(
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
      renderWithProviders(<SprintOverview {...defaultProps} sprintGoal="" />);

      expect(screen.getByText(i18nT('sprint:sprintOverview.noGoalDefined'))).toBeInTheDocument();
    });

    it('should handle all tasks completed', () => {
      renderWithProviders(
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
