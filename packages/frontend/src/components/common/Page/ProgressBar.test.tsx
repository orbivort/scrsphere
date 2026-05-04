import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProgressBar } from './ProgressBar';

// Mock CSS modules - use kebab-case to match the actual CSS module exports
vi.mock('./ProgressBar.module.css', () => ({
  default: {
    'progress-container': 'progress-container',
    'progress-track': 'progress-track',
    'progress-fill': 'progress-fill',
    'progress-text': 'progress-text',
    small: 'small',
    medium: 'medium',
    large: 'large',
    primary: 'primary',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
  },
}));

describe('ProgressBar Component', () => {
  describe('Component Rendering Tests', () => {
    it('renders with required value prop', () => {
      render(<ProgressBar value={50} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('renders progress track', () => {
      const { container } = render(<ProgressBar value={50} />);

      const track = container.querySelector('.progress-track');
      expect(track).toBeInTheDocument();
    });

    it('renders progress fill', () => {
      const { container } = render(<ProgressBar value={50} />);

      const fill = container.querySelector('.progress-fill');
      expect(fill).toBeInTheDocument();
    });

    it('renders percentage text by default', () => {
      render(<ProgressBar value={50} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('does not render percentage text when showPercentage is false', () => {
      render(<ProgressBar value={50} showPercentage={false} />);

      const percentageText = screen.queryByText('50%');
      expect(percentageText).not.toBeInTheDocument();
    });
  });

  describe('Value Calculation Tests', () => {
    it('calculates percentage correctly with default min/max', () => {
      render(<ProgressBar value={50} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('calculates percentage with custom min/max', () => {
      render(<ProgressBar value={75} min={50} max={150} />);

      const progressBar = screen.getByRole('progressbar');
      // (75 - 50) / (150 - 50) * 100 = 25%
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('clamps value to max when exceeding', () => {
      render(<ProgressBar value={150} max={100} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('clamps value to min when below', () => {
      render(<ProgressBar value={-20} min={0} max={100} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles value at exact minimum', () => {
      render(<ProgressBar value={0} min={0} max={100} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles value at exact maximum', () => {
      render(<ProgressBar value={100} min={0} max={100} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('rounds percentage to nearest integer', () => {
      render(<ProgressBar value={33.7} />);

      expect(screen.getByText('34%')).toBeInTheDocument();
    });
  });

  describe('Size Variant Tests', () => {
    it('renders with medium size by default', () => {
      const { container } = render(<ProgressBar value={50} />);

      const progressBar = container.querySelector('.progress-container');
      expect(progressBar).toHaveClass('medium');
    });

    it('renders with small size', () => {
      const { container } = render(<ProgressBar value={50} size="small" />);

      const progressBar = container.querySelector('.progress-container');
      expect(progressBar).toHaveClass('small');
    });

    it('renders with large size', () => {
      const { container } = render(<ProgressBar value={50} size="large" />);

      const progressBar = container.querySelector('.progress-container');
      expect(progressBar).toHaveClass('large');
    });
  });

  describe('Color Variant Tests', () => {
    it('renders with primary variant by default', () => {
      const { container } = render(<ProgressBar value={50} />);

      const fill = container.querySelector('.progress-fill');
      expect(fill).toHaveClass('primary');
    });

    it('renders with success variant', () => {
      const { container } = render(<ProgressBar value={50} variant="success" />);

      const fill = container.querySelector('.progress-fill');
      expect(fill).toHaveClass('success');
    });

    it('renders with warning variant', () => {
      const { container } = render(<ProgressBar value={50} variant="warning" />);

      const fill = container.querySelector('.progress-fill');
      expect(fill).toHaveClass('warning');
    });

    it('renders with danger variant', () => {
      const { container } = render(<ProgressBar value={50} variant="danger" />);

      const fill = container.querySelector('.progress-fill');
      expect(fill).toHaveClass('danger');
    });

    it('renders with primary variant explicitly', () => {
      const { container } = render(<ProgressBar value={50} variant="primary" />);

      const fill = container.querySelector('.progress-fill');
      expect(fill).toHaveClass('primary');
    });
  });

  describe('Accessibility Tests', () => {
    it('has role="progressbar"', () => {
      render(<ProgressBar value={50} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('has aria-valuenow attribute', () => {
      render(<ProgressBar value={75} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    it('has aria-valuemin attribute with default value', () => {
      render(<ProgressBar value={50} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    });

    it('has aria-valuemin attribute with custom value', () => {
      render(<ProgressBar value={50} min={10} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '10');
    });

    it('has aria-valuemax attribute with default value', () => {
      render(<ProgressBar value={50} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('has aria-valuemax attribute with custom value', () => {
      render(<ProgressBar value={50} max={200} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemax', '200');
    });

    it('has default aria-label when label not provided', () => {
      render(<ProgressBar value={50} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Progress: 50%');
    });

    it('has custom aria-label when label provided', () => {
      render(<ProgressBar value={50} label="Upload progress" />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Upload progress');
    });

    it('has tabindex="0" for keyboard accessibility', () => {
      render(<ProgressBar value={50} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('tabindex', '0');
    });

    it('is focusable via keyboard', async () => {
      const user = userEvent.setup();
      render(<ProgressBar value={50} />);

      const progressBar = screen.getByRole('progressbar');
      await user.tab();

      expect(progressBar).toHaveFocus();
    });

    it('percentage text has aria-hidden="true"', () => {
      render(<ProgressBar value={50} />);

      const percentageText = screen.getByText('50%');
      expect(percentageText).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('CSS Styling Tests', () => {
    it('applies correct width style to progress fill', () => {
      const { container } = render(<ProgressBar value={75} />);

      const fill = container.querySelector('.progress-fill');
      expect(fill).toHaveStyle({ width: '75%' });
    });

    it('applies progress-container class', () => {
      const { container } = render(<ProgressBar value={50} />);

      const progressBar = container.querySelector('.progress-container');
      expect(progressBar).toBeInTheDocument();
    });

    it('applies progress-track class', () => {
      const { container } = render(<ProgressBar value={50} />);

      const track = container.querySelector('.progress-track');
      expect(track).toBeInTheDocument();
    });

    it('applies progress-text class to percentage', () => {
      const { container } = render(<ProgressBar value={50} />);

      const text = container.querySelector('.progress-text');
      expect(text).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<ProgressBar value={50} className="custom-progress" />);

      const progressBar = container.querySelector('.progress-container');
      expect(progressBar).toHaveClass('custom-progress');
    });
  });

  describe('Edge Cases', () => {
    it('handles value of 0', () => {
      render(<ProgressBar value={0} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles value of 100', () => {
      render(<ProgressBar value={100} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('handles negative min value', () => {
      render(<ProgressBar value={-25} min={-50} max={50} />);

      // (-25 - (-50)) / (50 - (-50)) * 100 = 25 / 100 * 100 = 25%
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('handles decimal values', () => {
      render(<ProgressBar value={66.666} />);

      expect(screen.getByText('67%')).toBeInTheDocument();
    });

    it('handles very large max value', () => {
      render(<ProgressBar value={1000} max={10000} />);

      expect(screen.getByText('10%')).toBeInTheDocument();
    });

    it('handles min equal to max (edge case)', () => {
      render(<ProgressBar value={50} min={50} max={50} />);

      // Avoid division by zero - should handle gracefully
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('handles negative values with positive min/max', () => {
      render(<ProgressBar value={-10} min={0} max={100} />);

      // Should clamp to 0
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles values greater than max', () => {
      render(<ProgressBar value={200} min={0} max={100} />);

      // Should clamp to 100
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('falls back to default label when label is empty', () => {
      render(<ProgressBar value={50} label="" />);

      const progressBar = screen.getByRole('progressbar');
      // Empty label falls back to default
      expect(progressBar).toHaveAttribute('aria-label', 'Progress: 50%');
    });

    it('handles very long label', () => {
      const longLabel = 'Progress '.repeat(50);
      render(<ProgressBar value={50} label={longLabel} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', longLabel);
    });
  });

  describe('Integration Tests', () => {
    it('renders correctly with all props combined', () => {
      const { container } = render(
        <ProgressBar
          value={75}
          min={0}
          max={100}
          label="File upload"
          showPercentage={true}
          size="large"
          variant="success"
          className="upload-progress"
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      expect(progressBar).toHaveAttribute('aria-label', 'File upload');
      expect(progressBar).toHaveClass('large');

      const fill = container.querySelector('.progress-fill');
      expect(fill).toHaveClass('success');
      expect(fill).toHaveStyle({ width: '75%' });

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('updates when value prop changes', () => {
      const { rerender } = render(<ProgressBar value={25} />);

      expect(screen.getByText('25%')).toBeInTheDocument();

      rerender(<ProgressBar value={75} />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('updates when min/max props change', () => {
      const { rerender } = render(<ProgressBar value={50} min={0} max={100} />);

      expect(screen.getByText('50%')).toBeInTheDocument();

      rerender(<ProgressBar value={50} min={0} max={200} />);

      expect(screen.getByText('25%')).toBeInTheDocument();
    });
  });
});
