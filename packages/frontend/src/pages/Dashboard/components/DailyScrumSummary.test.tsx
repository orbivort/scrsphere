import React from 'react';
import { screen, renderWithProviders } from '@/test-utils';
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';

import { initTestI18n } from '@/test-utils';
import { DailyScrumSummary, type DailyScrumSummaryProps } from './DailyScrumSummary';

const mockDailyScrum = {
  id: 'scrum-1',
  sprintId: 'sprint-1',
  scrumDate: '2026-02-05',
  progressNotes: 'Login module is nearly complete.',
  adaptationsNotes: 'Reassigned tests to user-2.',
  planForNextDay: 'Finish logout and start testing.',
  focusMode: 'goal' as const,
  sprintGoal: 'Complete authentication feature',
  participants: [
    {
      id: 'participant-1',
      userId: 'user-1',
      user: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
    },
  ],
  backlogAdjustments: [],
  createdAt: '2026-02-05T09:00:00Z',
  updatedAt: '2026-02-05T09:00:00Z',
};

const defaultProps: DailyScrumSummaryProps = {
  dailyScrum: mockDailyScrum,
  nonParticipants: [{ userId: 'user-2', userName: 'Jane Smith' }],
};

describe('DailyScrumSummary Component', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('No record state', () => {
    it('should render the not-started message when there is no record', () => {
      renderWithProviders(<DailyScrumSummary dailyScrum={null} nonParticipants={[]} />);

      expect(screen.getByText(/No Daily Scrum recorded for today yet\./)).toBeInTheDocument();
    });
  });

  describe('Record rendering', () => {
    it('should render the Inspect & Adapt record sections', () => {
      renderWithProviders(<DailyScrumSummary {...defaultProps} />);

      expect(screen.getByText('Finish logout and start testing.')).toBeInTheDocument();
      expect(screen.getByText('Login module is nearly complete.')).toBeInTheDocument();
      expect(screen.getByText('Reassigned tests to user-2.')).toBeInTheDocument();
    });

    it('should render participant count', () => {
      renderWithProviders(<DailyScrumSummary {...defaultProps} />);

      expect(screen.getByText(/1 participant/)).toBeInTheDocument();
    });

    it('should render the not-yet-joined participation line', () => {
      renderWithProviders(<DailyScrumSummary {...defaultProps} />);

      expect(screen.getByText(/1 Developer not yet joined/)).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should not render a section when a field is empty', () => {
      renderWithProviders(
        <DailyScrumSummary
          dailyScrum={{ ...mockDailyScrum, progressNotes: null, adaptationsNotes: null }}
          nonParticipants={[]}
        />
      );

      expect(screen.getByText('Finish logout and start testing.')).toBeInTheDocument();
    });
  });
});
