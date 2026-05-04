import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { SkipLink } from './SkipLink';

describe('SkipLink Component', () => {
  const mockTargetId = 'main-content';
  const mockTargetContent = 'Main Content Area';

  beforeEach(() => {
    // Create a target element in the DOM
    const targetElement = document.createElement('div');
    targetElement.id = mockTargetId;
    targetElement.textContent = mockTargetContent;
    document.body.appendChild(targetElement);
  });

  afterEach(() => {
    // Clean up the DOM
    const targetElement = document.getElementById(mockTargetId);
    if (targetElement) {
      document.body.removeChild(targetElement);
    }
    vi.restoreAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('renders skip link with default text', () => {
      render(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink.tagName).toBe('A');
    });

    it('renders skip link with custom text', () => {
      const customText = 'Jump to content';
      render(<SkipLink targetId={mockTargetId} text={customText} />);

      const skipLink = screen.getByText(customText);
      expect(skipLink).toBeInTheDocument();
    });

    it('has correct href attribute pointing to target', () => {
      render(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', `#${mockTargetId}`);
    });

    it('applies custom className', () => {
      const customClass = 'custom-skip-class';
      render(<SkipLink targetId={mockTargetId} className={customClass} />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveClass('skip-link');
      expect(skipLink).toHaveClass(customClass);
    });

    it('renders without custom className', () => {
      render(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveClass('skip-link');
    });
  });

  describe('User Interaction Tests', () => {
    it('focuses target element when clicked', () => {
      render(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      const targetElement = document.getElementById(mockTargetId);

      // Mock focus method
      const focusSpy = vi.spyOn(targetElement!, 'focus');

      fireEvent.click(skipLink);

      expect(focusSpy).toHaveBeenCalledTimes(1);
    });

    it('sets and removes tabindex on target element when clicked', () => {
      render(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      const targetElement = document.getElementById(mockTargetId);

      // Before click, no tabindex
      expect(targetElement).not.toHaveAttribute('tabindex');

      fireEvent.click(skipLink);

      // After click, tabindex should be removed (set to -1 then removed)
      expect(targetElement).not.toHaveAttribute('tabindex');
    });

    it('prevents default anchor behavior', () => {
      render(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      const preventDefaultSpy = vi.spyOn(Event.prototype, 'preventDefault');

      fireEvent.click(skipLink);

      expect(preventDefaultSpy).toHaveBeenCalled();
      preventDefaultSpy.mockRestore();
    });

    it('handles keyboard activation (Enter key)', () => {
      render(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      const targetElement = document.getElementById(mockTargetId);
      const focusSpy = vi.spyOn(targetElement!, 'focus');

      fireEvent.keyDown(skipLink, { key: 'Enter' });
      fireEvent.click(skipLink);

      expect(focusSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing target element gracefully', () => {
      // Remove the target element
      const targetElement = document.getElementById(mockTargetId);
      if (targetElement) {
        document.body.removeChild(targetElement);
      }

      render(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');

      // Should not throw an error when clicked
      expect(() => fireEvent.click(skipLink)).not.toThrow();
    });

    it('handles empty targetId', () => {
      render(<SkipLink targetId="" />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', '#');

      // Should not throw when clicked
      expect(() => fireEvent.click(skipLink)).not.toThrow();
    });

    it('handles special characters in targetId', () => {
      const specialTargetId = 'main-content-123_test';
      const specialTarget = document.createElement('div');
      specialTarget.id = specialTargetId;
      document.body.appendChild(specialTarget);

      render(<SkipLink targetId={specialTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', `#${specialTargetId}`);

      // Clean up
      document.body.removeChild(specialTarget);
    });

    it('handles very long text', () => {
      const longText = 'Skip to the main content area of this page immediately';
      render(<SkipLink targetId={mockTargetId} text={longText} />);

      const skipLink = screen.getByText(longText);
      expect(skipLink).toBeInTheDocument();
    });

    it('handles empty text', () => {
      render(<SkipLink targetId={mockTargetId} text="" />);

      // Empty string should still render the anchor
      const skipLink = document.querySelector('a.skip-link');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveTextContent('');
    });
  });

  describe('Accessibility Tests', () => {
    it('is focusable via keyboard', () => {
      render(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      skipLink.focus();

      expect(skipLink).toHaveFocus();
    });

    it('has correct role as link', () => {
      render(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByRole('link');
      expect(skipLink).toBeInTheDocument();
    });

    it('target element receives focus management after click', () => {
      render(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      const targetElement = document.getElementById(mockTargetId);
      const focusSpy = vi.spyOn(targetElement!, 'focus');

      fireEvent.click(skipLink);

      // The focus method should have been called
      expect(focusSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Tests', () => {
    it('works with multiple skip links on same page', () => {
      const secondTargetId = 'secondary-content';
      const secondTarget = document.createElement('div');
      secondTarget.id = secondTargetId;
      document.body.appendChild(secondTarget);

      render(
        <>
          <SkipLink targetId={mockTargetId} text="Skip to main" />
          <SkipLink targetId={secondTargetId} text="Skip to secondary" />
        </>
      );

      const firstLink = screen.getByText('Skip to main');
      const secondLink = screen.getByText('Skip to secondary');

      expect(firstLink).toHaveAttribute('href', `#${mockTargetId}`);
      expect(secondLink).toHaveAttribute('href', `#${secondTargetId}`);

      // Clean up
      document.body.removeChild(secondTarget);
    });

    it('maintains tabindex cleanup even with rapid clicks', () => {
      render(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      const targetElement = document.getElementById(mockTargetId);

      // Click multiple times rapidly
      fireEvent.click(skipLink);
      fireEvent.click(skipLink);
      fireEvent.click(skipLink);

      // Final state should have no tabindex
      expect(targetElement).not.toHaveAttribute('tabindex');
    });
  });
});
