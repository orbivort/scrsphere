import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { LoadingSpinner } from './LoadingSpinner';

// Mock CSS modules - use kebab-case to match the actual CSS module exports
vi.mock('./LoadingSpinner.module.css', () => ({
  default: {
    'spinner-container': 'spinner-container',
    spinner: 'spinner',
    'spinner-track': 'spinner-track',
    'spinner-arc': 'spinner-arc',
  },
}));

describe('LoadingSpinner Component', () => {
  describe('Component Rendering Tests', () => {
    it('renders with default props', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('progressbar');
      expect(spinner).toBeInTheDocument();
    });

    it('renders with custom size', () => {
      const customSize = 64;
      render(<LoadingSpinner size={customSize} />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', customSize.toString());
      expect(svg).toHaveAttribute('height', customSize.toString());
    });

    it('renders with default size of 48', () => {
      render(<LoadingSpinner />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '48');
      expect(svg).toHaveAttribute('height', '48');
    });

    it('renders with custom color', () => {
      const customColor = '#ff0000';
      render(<LoadingSpinner color={customColor} />);

      const arcCircle = document.querySelector('.spinner-arc');
      expect(arcCircle).toHaveAttribute('stroke', customColor);
    });

    it('renders with default color', () => {
      render(<LoadingSpinner />);

      const arcCircle = document.querySelector('.spinner-arc');
      expect(arcCircle).toHaveAttribute('stroke', '#1a66ff');
    });

    it('applies custom className', () => {
      const customClass = 'custom-spinner-class';
      render(<LoadingSpinner className={customClass} />);

      const spinner = screen.getByRole('progressbar');
      expect(spinner).toHaveClass(customClass);
    });

    it('renders SVG with correct viewBox', () => {
      const size = 64;
      render(<LoadingSpinner size={size} />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', `0 0 ${size} ${size}`);
    });

    it('renders two circles (track and arc)', () => {
      render(<LoadingSpinner />);

      const circles = document.querySelectorAll('circle');
      expect(circles.length).toBe(2);
    });
  });

  describe('Accessibility Tests', () => {
    it('has role="progressbar"', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('progressbar');
      expect(spinner).toBeInTheDocument();
    });

    it('has aria-busy="true"', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('progressbar');
      expect(spinner).toHaveAttribute('aria-busy', 'true');
    });

    it('has default aria-label', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('progressbar');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('has custom aria-label when provided', () => {
      const customLabel = 'Loading data...';
      render(<LoadingSpinner label={customLabel} />);

      const spinner = screen.getByRole('progressbar');
      expect(spinner).toHaveAttribute('aria-label', customLabel);
    });

    it('has aria-valuetext matching label', () => {
      const customLabel = 'Fetching results...';
      render(<LoadingSpinner label={customLabel} />);

      const spinner = screen.getByRole('progressbar');
      expect(spinner).toHaveAttribute('aria-valuetext', customLabel);
    });

    it('has visually hidden text for screen readers', () => {
      render(<LoadingSpinner />);

      const hiddenText = screen.getByText('Loading');
      expect(hiddenText).toHaveClass('visually-hidden');
    });

    it('SVG has aria-hidden="true"', () => {
      render(<LoadingSpinner />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('SVG Geometry Tests', () => {
    it('calculates correct stroke width based on size', () => {
      const size = 48;
      render(<LoadingSpinner size={size} />);

      const circles = document.querySelectorAll('circle');
      const expectedStrokeWidth = Math.max(2, size / 12).toString();

      circles.forEach((circle) => {
        expect(circle).toHaveAttribute('stroke-width', expectedStrokeWidth);
      });
    });

    it('calculates correct radius based on size', () => {
      const size = 48;
      render(<LoadingSpinner size={size} />);

      const circles = document.querySelectorAll('circle');
      const strokeWidth = Math.max(2, size / 12);
      const expectedRadius = (size - strokeWidth) / 2;

      circles.forEach((circle) => {
        expect(circle).toHaveAttribute('r', expectedRadius.toString());
      });
    });

    it('centers circles correctly', () => {
      const size = 64;
      render(<LoadingSpinner size={size} />);

      const circles = document.querySelectorAll('circle');
      const expectedCenter = (size / 2).toString();

      circles.forEach((circle) => {
        expect(circle).toHaveAttribute('cx', expectedCenter);
        expect(circle).toHaveAttribute('cy', expectedCenter);
      });
    });

    it('calculates correct stroke dasharray', () => {
      const size = 48;
      render(<LoadingSpinner size={size} />);

      const arcCircle = document.querySelector('.spinner-arc');
      const strokeWidth = Math.max(2, size / 12);
      const radius = (size - strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;

      expect(arcCircle).toHaveAttribute('stroke-dasharray', circumference.toString());
    });

    it('calculates correct stroke dashoffset', () => {
      const size = 48;
      render(<LoadingSpinner size={size} />);

      const arcCircle = document.querySelector('.spinner-arc');
      const strokeWidth = Math.max(2, size / 12);
      const radius = (size - strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;
      const expectedDashOffset = circumference * 0.75;

      expect(arcCircle).toHaveAttribute('stroke-dashoffset', expectedDashOffset.toString());
    });

    it('has round stroke linecap', () => {
      render(<LoadingSpinner />);

      const arcCircle = document.querySelector('.spinner-arc');
      expect(arcCircle).toHaveAttribute('stroke-linecap', 'round');
    });

    it('track circle has no fill', () => {
      render(<LoadingSpinner />);

      const trackCircle = document.querySelector('.spinner-track');
      expect(trackCircle).toHaveAttribute('fill', 'none');
    });

    it('arc circle has no fill', () => {
      render(<LoadingSpinner />);

      const arcCircle = document.querySelector('.spinner-arc');
      expect(arcCircle).toHaveAttribute('fill', 'none');
    });
  });

  describe('Edge Cases', () => {
    it('handles very small size', () => {
      const smallSize = 16;
      render(<LoadingSpinner size={smallSize} />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', smallSize.toString());
      expect(svg).toHaveAttribute('height', smallSize.toString());
    });

    it('handles very large size', () => {
      const largeSize = 200;
      render(<LoadingSpinner size={largeSize} />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', largeSize.toString());
      expect(svg).toHaveAttribute('height', largeSize.toString());
    });

    it('handles size of 0 (edge case)', () => {
      render(<LoadingSpinner size={0} />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '0');
      expect(svg).toHaveAttribute('height', '0');
    });

    it('handles negative size (edge case)', () => {
      render(<LoadingSpinner size={-10} />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '-10');
    });

    it('handles empty label', () => {
      render(<LoadingSpinner label="" />);

      const spinner = screen.getByRole('progressbar');
      expect(spinner).toHaveAttribute('aria-label', '');
    });

    it('handles special characters in label', () => {
      const specialLabel = 'Loading <data> & "results"';
      render(<LoadingSpinner label={specialLabel} />);

      const spinner = screen.getByRole('progressbar');
      expect(spinner).toHaveAttribute('aria-label', specialLabel);
    });

    it('handles very long label', () => {
      const longLabel = 'Loading '.repeat(50);
      render(<LoadingSpinner label={longLabel} />);

      const spinner = screen.getByRole('progressbar');
      expect(spinner).toHaveAttribute('aria-label', longLabel);
    });
  });

  describe('CSS Class Application', () => {
    it('applies spinner-container class', () => {
      const { container } = render(<LoadingSpinner />);

      const spinner = container.querySelector('.spinner-container');
      expect(spinner).toBeInTheDocument();
    });

    it('applies spinner class to SVG', () => {
      render(<LoadingSpinner />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveClass('spinner');
    });

    it('combines default and custom classes', () => {
      const customClass = 'my-custom-class';
      const { container } = render(<LoadingSpinner className={customClass} />);

      const spinner = container.querySelector('.spinner-container');
      expect(spinner).toHaveClass(customClass);
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly with different sizes', () => {
      const sizes = [16, 24, 32, 48, 64, 96, 128];

      sizes.forEach((size) => {
        const { container } = render(<LoadingSpinner size={size} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('width', size.toString());
      });
    });
  });
});
