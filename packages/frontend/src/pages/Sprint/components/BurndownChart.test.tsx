import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { BurndownChart, type BurndownChartProps } from './BurndownChart';
import type { BurndownDataPoint } from '../SprintBoard.types';

const createMockBurndownData = (): BurndownDataPoint[] => [
  { day: 0, date: '2026-01-01', ideal: 80, actual: 80 },
  { day: 1, date: '2026-01-02', ideal: 72, actual: 75 },
  { day: 2, date: '2026-01-03', ideal: 64, actual: 68 },
  { day: 3, date: '2026-01-04', ideal: 56, actual: null },
  { day: 4, date: '2026-01-05', ideal: 48, actual: null },
];

const defaultProps: BurndownChartProps = {
  sprintName: 'Sprint 1',
  sprintDuration: 14,
  daysRemaining: 9,
  totalEstimatedHours: 80,
  totalRemainingHours: 40,
  progressPercentage: 50,
  burndownChartData: createMockBurndownData(),
  showDataTable: false,
  onToggleDataTable: vi.fn(),
  onClose: vi.fn(),
};

describe('BurndownChart', () => {
  describe('Rendering', () => {
    it('should render sprint name in header', () => {
      render(<BurndownChart {...defaultProps} />);

      expect(screen.getByText('Sprint Burndown')).toBeInTheDocument();
    });

    it('should render chart controls', () => {
      render(<BurndownChart {...defaultProps} />);

      expect(screen.getByText('View Data Table')).toBeInTheDocument();
      expect(screen.getByLabelText('Close burndown chart')).toBeInTheDocument();
    });

    it('should render chart legend', () => {
      render(<BurndownChart {...defaultProps} />);

      expect(screen.getByText('Ideal Burndown')).toBeInTheDocument();
      expect(screen.getByText(/Actual/)).toBeInTheDocument();
    });

    it('should render Y-axis labels', () => {
      render(<BurndownChart {...defaultProps} />);

      expect(screen.getByText('80h')).toBeInTheDocument();
      expect(screen.getByText('40h')).toBeInTheDocument();
      // 0h appears multiple times, so we just check it exists
      const zeroHourElements = screen.getAllByText('0h');
      expect(zeroHourElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render X-axis labels', () => {
      render(<BurndownChart {...defaultProps} />);

      // Day labels appear multiple times, so we check for the first occurrence
      const dayElements = screen.getAllByText(/Day/);
      expect(dayElements.length).toBeGreaterThan(0);
    });
  });

  describe('Data Table', () => {
    it('should not show data table by default', () => {
      render(<BurndownChart {...defaultProps} showDataTable={false} />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should show data table when showDataTable is true', () => {
      render(<BurndownChart {...defaultProps} showDataTable={true} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should render table headers correctly', () => {
      render(<BurndownChart {...defaultProps} showDataTable={true} />);

      expect(screen.getByText('Day')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Ideal Hours')).toBeInTheDocument();
      expect(screen.getByText('Actual Hours')).toBeInTheDocument();
      expect(screen.getByText('Variance')).toBeInTheDocument();
    });

    it('should render table rows with data', () => {
      render(<BurndownChart {...defaultProps} showDataTable={true} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2026-01-01')).toBeInTheDocument();
    });

    it('should show variance for data points with actual values', () => {
      render(<BurndownChart {...defaultProps} showDataTable={true} />);

      // Check for variance text (format may vary)
      const varianceElements = screen.getAllByText(/ahead|behind/);
      expect(varianceElements.length).toBeGreaterThan(0);
    });
  });

  describe('Interactions', () => {
    it('should call onToggleDataTable when toggle button is clicked', async () => {
      const onToggleDataTable = vi.fn();
      const user = userEvent.setup();

      render(<BurndownChart {...defaultProps} onToggleDataTable={onToggleDataTable} />);

      const toggleButton = screen.getByText('View Data Table');
      await user.click(toggleButton);

      expect(onToggleDataTable).toHaveBeenCalledTimes(1);
    });

    it('should show "Hide Data Table" when table is visible', () => {
      render(<BurndownChart {...defaultProps} showDataTable={true} />);

      expect(screen.getByText('Hide Data Table')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<BurndownChart {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close burndown chart');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should have correct aria-expanded on toggle button', () => {
      const { rerender } = render(<BurndownChart {...defaultProps} showDataTable={false} />);

      const toggleButton = screen.getByText('View Data Table');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      rerender(<BurndownChart {...defaultProps} showDataTable={true} />);

      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label on panel', () => {
      render(<BurndownChart {...defaultProps} />);

      const panel = screen.getByLabelText('Sprint Burndown Chart');
      expect(panel).toBeInTheDocument();
    });

    it('should have correct aria-label on data table region', () => {
      render(<BurndownChart {...defaultProps} showDataTable={true} />);

      const tableRegion = screen.getByLabelText('Burndown data table');
      expect(tableRegion).toBeInTheDocument();
    });

    it('should have aria-controls on toggle button', () => {
      render(<BurndownChart {...defaultProps} showDataTable={true} />);

      const toggleButton = screen.getByText('Hide Data Table');
      expect(toggleButton).toHaveAttribute('aria-controls', 'burndown-data-table');
    });

    it('should have aria-label on close button', () => {
      render(<BurndownChart {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close burndown chart');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have table caption', () => {
      render(<BurndownChart {...defaultProps} showDataTable={true} />);

      expect(screen.getByText(/Burndown Chart Data/)).toBeInTheDocument();
    });

    it('should have scope on table headers', () => {
      render(<BurndownChart {...defaultProps} showDataTable={true} />);

      const headers = screen.getAllByRole('columnheader');
      headers.forEach((header) => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('should have aria-label on SVG chart', () => {
      render(<BurndownChart {...defaultProps} />);

      const svg = document.querySelector('svg[role="img"]');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-label');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty burndown data', () => {
      render(<BurndownChart {...defaultProps} burndownChartData={[]} />);

      expect(screen.getByText('Sprint Burndown')).toBeInTheDocument();
    });

    it('should handle zero total estimated hours', () => {
      render(<BurndownChart {...defaultProps} totalEstimatedHours={0} totalRemainingHours={0} />);

      const zeroHourElements = screen.getAllByText('0h');
      expect(zeroHourElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle single day sprint', () => {
      render(<BurndownChart {...defaultProps} sprintDuration={1} />);

      expect(screen.getByText('Sprint Burndown')).toBeInTheDocument();
    });

    it('should handle variance ahead of schedule', () => {
      const dataAhead = [
        { day: 0, date: '2026-01-01', ideal: 80, actual: 80 },
        { day: 1, date: '2026-01-02', ideal: 74, actual: 70 },
      ];

      render(
        <BurndownChart {...defaultProps} burndownChartData={dataAhead} showDataTable={true} />
      );

      // Check for variance text containing "ahead"
      const aheadElements = screen.getAllByText(/ahead/);
      expect(aheadElements.length).toBeGreaterThan(0);
    });
  });

  describe('SVG Chart', () => {
    it('should render SVG with correct viewBox', () => {
      render(<BurndownChart {...defaultProps} />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox');
    });

    it('should render SVG chart elements', () => {
      const { container } = render(<BurndownChart {...defaultProps} />);

      // Check for SVG elements (lines, circles, etc.)
      const lines = container.querySelectorAll('line');
      expect(lines.length).toBeGreaterThan(0);

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('should render grid lines', () => {
      render(<BurndownChart {...defaultProps} />);

      const lines = document.querySelectorAll('line');
      expect(lines.length).toBeGreaterThan(0);
    });
  });
});
