import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import type { PendingDeletion } from '../../types/auth.types';

import { GracePeriodProgress } from './GracePeriodProgress';

vi.mock('./GracePeriodProgress.module.css', () => ({
  default: {
    'grace-period-progress': 'grace-period-progress',
    'grace-period-title': 'grace-period-title',
    'grace-period-dates': 'grace-period-dates',
    'grace-period-date-item': 'grace-period-date-item',
    'grace-period-date-label': 'grace-period-date-label',
    'grace-period-date-value': 'grace-period-date-value',
    'grace-period-bar-container': 'grace-period-bar-container',
    'grace-period-bar': 'grace-period-bar',
  },
}));

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 14);

const mockPendingDeletion: PendingDeletion = {
  requestedAt: new Date().toISOString(),
  scheduledDeletionAt: futureDate.toISOString(),
  gracePeriodDays: 14,
};

describe('GracePeriodProgress', () => {
  it('should render deletion scheduled title', () => {
    render(<GracePeriodProgress pendingDeletion={mockPendingDeletion} />);
    expect(screen.getByText('Deletion Scheduled')).toBeInTheDocument();
  });

  it('should display requested date', () => {
    render(<GracePeriodProgress pendingDeletion={mockPendingDeletion} />);
    expect(screen.getByText('Requested')).toBeInTheDocument();
  });

  it('should display deletion date label', () => {
    render(<GracePeriodProgress pendingDeletion={mockPendingDeletion} />);
    expect(screen.getByText('Deletion date')).toBeInTheDocument();
  });

  it('should display days remaining label', () => {
    render(<GracePeriodProgress pendingDeletion={mockPendingDeletion} />);
    expect(screen.getByText('Days remaining')).toBeInTheDocument();
  });

  it('should render progress bar with proper aria attributes', () => {
    render(<GracePeriodProgress pendingDeletion={mockPendingDeletion} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });
});
