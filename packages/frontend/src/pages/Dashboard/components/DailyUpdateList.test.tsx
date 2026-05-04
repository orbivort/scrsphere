import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DailyUpdateList, type DailyUpdateListProps } from './DailyUpdateList';

const mockUser1 = {
  id: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockUser2 = {
  id: 'user-2',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockUpdates = [
  {
    id: 'update-1',
    sprintId: 'sprint-1',
    userId: 'user-1',
    updateDate: '2026-02-05',
    yesterdayWork: 'Completed login feature',
    todayWork: 'Working on logout',
    impediment: null,
    createdAt: '2026-02-05T09:00:00Z',
    user: mockUser1,
  },
  {
    id: 'update-2',
    sprintId: 'sprint-1',
    userId: 'user-2',
    updateDate: '2026-02-05',
    yesterdayWork: 'Code review',
    todayWork: 'Testing',
    impediment: 'Waiting for API response',
    createdAt: '2026-02-05T09:15:00Z',
    user: mockUser2,
  },
];

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('DailyUpdateList Component', () => {
  const defaultProps: DailyUpdateListProps = {
    updates: mockUpdates,
    emptyMessage: 'No daily updates for today yet.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render daily updates when available', () => {
      renderWithRouter(<DailyUpdateList {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should display yesterday work', () => {
      renderWithRouter(<DailyUpdateList {...defaultProps} />);

      expect(screen.getByText('Completed login feature')).toBeInTheDocument();
      expect(screen.getByText('Code review')).toBeInTheDocument();
    });

    it('should display today work', () => {
      renderWithRouter(<DailyUpdateList {...defaultProps} />);

      expect(screen.getByText('Working on logout')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
    });

    it('should display impediment when present', () => {
      renderWithRouter(<DailyUpdateList {...defaultProps} />);

      expect(screen.getByText('Waiting for API response')).toBeInTheDocument();
    });

    it('should not display impediment section when null', () => {
      renderWithRouter(<DailyUpdateList {...defaultProps} />);

      const impedimentSections = screen.queryAllByText(/🚧 Impediment:/);
      expect(impedimentSections.length).toBe(1);
    });

    it('should render empty message when no updates', () => {
      renderWithRouter(<DailyUpdateList {...defaultProps} updates={[]} />);

      expect(screen.getByText('No daily updates for today yet.')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      renderWithRouter(<DailyUpdateList {...defaultProps} />);

      const list = screen.getByRole('list', { name: 'Daily updates list' });
      expect(list).toBeInTheDocument();
    });
  });

  describe('Submit Button', () => {
    it('should not show submit button by default', () => {
      renderWithRouter(<DailyUpdateList {...defaultProps} />);

      expect(screen.queryByLabelText('Submit your daily scrum update')).not.toBeInTheDocument();
    });

    it('should show submit button when showSubmitButton is true and no updates', () => {
      renderWithRouter(<DailyUpdateList {...defaultProps} updates={[]} showSubmitButton={true} />);

      const submitButton = screen.getByLabelText('Submit your daily scrum update');
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('href', '/daily-scrum');
    });

    it('should show submit button when showSubmitButton is true even with empty updates', () => {
      renderWithRouter(<DailyUpdateList {...defaultProps} updates={[]} showSubmitButton={true} />);

      const submitButton = screen.getByLabelText('Submit your daily scrum update');
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format update date correctly', () => {
      renderWithRouter(<DailyUpdateList {...defaultProps} />);

      const dates = screen.getAllByText(/2026/);
      expect(dates.length).toBeGreaterThan(0);
    });
  });

  describe('User Information', () => {
    it('should display Unknown User when user is null', () => {
      const updatesWithNullUser = [
        {
          ...mockUpdates[0],
          user: null as unknown as typeof mockUser1,
        },
      ];

      renderWithRouter(<DailyUpdateList {...defaultProps} updates={updatesWithNullUser} />);

      expect(screen.getByText('Unknown User')).toBeInTheDocument();
    });

    it('should display full user name when user exists', () => {
      renderWithRouter(<DailyUpdateList {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });
});
