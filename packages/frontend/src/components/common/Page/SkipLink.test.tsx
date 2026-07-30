import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { screen, fireEvent, renderWithProviders, initTestI18n } from '../../../test-utils';

import { SkipLink } from './SkipLink';

describe('SkipLink Component', () => {
  const mockTargetId = 'main-content';
  const mockTargetContent = 'Main Content Area';

  beforeAll(async () => {
    await initTestI18n();
  });

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
      renderWithProviders(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink.tagName).toBe('A');
    });

    it('renders skip link with custom text', () => {
      const customText = 'Jump to content';
      renderWithProviders(<SkipLink targetId={mockTargetId} text={customText} />);

      const skipLink = screen.getByText(customText);
      expect(skipLink).toBeInTheDocument();
    });

    it('has correct href attribute pointing to target', () => {
      renderWithProviders(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', `#${mockTargetId}`);
    });

    it('applies custom className', () => {
      const customClass = 'custom-skip-class';
      renderWithProviders(<SkipLink targetId={mockTargetId} className={customClass} />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveClass('skip-link');
      expect(skipLink).toHaveClass(customClass);
    });

    it('renders without custom className', () => {
      renderWithProviders(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveClass('skip-link');
    });
  });

  describe('User Interaction Tests', () => {
    it('focuses target element when clicked', () => {
      renderWithProviders(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      const targetElement = document.getElementById(mockTargetId);

      // Mock focus method
      const focusSpy = vi.spyOn(targetElement!, 'focus');

      fireEvent.click(skipLink);

      expect(focusSpy).toHaveBeenCalledTimes(1);
    });

    it('sets and removes tabindex on target element when clicked', () => {
      renderWithProviders(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      const targetElement = document.getElementById(mockTargetId);

      // Before click, no tabindex
      expect(targetElement).not.toHaveAttribute('tabindex');

      fireEvent.click(skipLink);

      // After click, tabindex should be removed (set to -1 then removed)
      expect(targetElement).not.toHaveAttribute('tabindex');
    });

    it('prevents default anchor behavior', () => {
      renderWithProviders(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      const preventDefaultSpy = vi.spyOn(Event.prototype, 'preventDefault');

      fireEvent.click(skipLink);

      expect(preventDefaultSpy).toHaveBeenCalled();
      preventDefaultSpy.mockRestore();
    });

    it('handles keyboard activation (Enter key)', () => {
      renderWithProviders(<SkipLink targetId={mockTargetId} />);

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

      renderWithProviders(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');

      // Should not throw an error when clicked
      expect(() => fireEvent.click(skipLink)).not.toThrow();
    });

    it('handles empty targetId', () => {
      renderWithProviders(<SkipLink targetId="" />);

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

      renderWithProviders(<SkipLink targetId={specialTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', `#${specialTargetId}`);

      // Clean up
      document.body.removeChild(specialTarget);
    });

    it('handles very long text', () => {
      const longText = 'Skip to the main content area of this page immediately';
      renderWithProviders(<SkipLink targetId={mockTargetId} text={longText} />);

      const skipLink = screen.getByText(longText);
      expect(skipLink).toBeInTheDocument();
    });

    it('handles empty text', () => {
      renderWithProviders(<SkipLink targetId={mockTargetId} text="" />);

      // Empty string should still render the anchor
      const skipLink = document.querySelector('a.skip-link');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveTextContent('');
    });
  });

  describe('Accessibility Tests', () => {
    it('is focusable via keyboard', () => {
      renderWithProviders(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByText('Skip to main content');
      skipLink.focus();

      expect(skipLink).toHaveFocus();
    });

    it('has correct role as link', () => {
      renderWithProviders(<SkipLink targetId={mockTargetId} />);

      const skipLink = screen.getByRole('link');
      expect(skipLink).toBeInTheDocument();
    });

    it('target element receives focus management after click', () => {
      renderWithProviders(<SkipLink targetId={mockTargetId} />);

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

      renderWithProviders(
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
      renderWithProviders(<SkipLink targetId={mockTargetId} />);

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
