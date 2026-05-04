/**
 * LiveAnnouncer Component Tests
 *
 * Tests for the LiveAnnouncer component, AnnouncerProvider, and hooks.
 */

import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  LiveAnnouncer,
  AnnouncerProvider,
  useAnnouncement,
  useAnnounce,
  AnnouncerContext,
  type AnnouncerPriority,
} from './LiveAnnouncer';

// Test component that uses the useAnnouncement hook
const TestComponent: React.FC<{
  onAnnounce?: (announce: (message: string, priority?: AnnouncerPriority) => void) => void;
}> = ({ onAnnounce }) => {
  const { announce } = useAnnouncement();

  const handleClick = () => {
    if (onAnnounce) {
      onAnnounce(announce);
    }
  };

  return (
    <button type="button" onClick={handleClick}>
      Test Button
    </button>
  );
};

// Test component that uses the useAnnounce hook
const TestComponentWithUseAnnounce: React.FC<{
  onAnnounce?: (announce: (message: string, priority?: AnnouncerPriority) => void) => void;
}> = ({ onAnnounce }) => {
  const announce = useAnnounce();

  const handleClick = () => {
    if (onAnnounce) {
      onAnnounce(announce);
    }
  };

  return (
    <button type="button" onClick={handleClick}>
      Test Button
    </button>
  );
};

// Test component that tries to use useAnnouncement outside provider
const TestComponentOutsideProvider: React.FC = () => {
  useAnnouncement();
  return <div>Should not render</div>;
};

describe('LiveAnnouncer', () => {
  beforeEach(() => {
    // Clean up any existing live regions
    const existingPolite = document.getElementById('sr-announcer-polite');
    const existingAssertive = document.getElementById('sr-announcer-assertive');
    const existingAnnouncer = document.getElementById('sr-announcer');
    if (existingPolite) existingPolite.remove();
    if (existingAssertive) existingAssertive.remove();
    if (existingAnnouncer) existingAnnouncer.remove();
  });

  afterEach(() => {
    cleanup();
    // Clean up any live regions created during tests
    const existingPolite = document.getElementById('sr-announcer-polite');
    const existingAssertive = document.getElementById('sr-announcer-assertive');
    const existingAnnouncer = document.getElementById('sr-announcer');
    if (existingPolite) existingPolite.remove();
    if (existingAssertive) existingAssertive.remove();
    if (existingAnnouncer) existingAnnouncer.remove();
  });

  describe('AnnouncerProvider', () => {
    it('should provide the announcer context to children', () => {
      render(
        <AnnouncerProvider>
          <div data-testid="child">Child</div>
        </AnnouncerProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should create a live region on mount', () => {
      render(
        <AnnouncerProvider>
          <div>Child</div>
        </AnnouncerProvider>
      );

      // The ScreenReaderAnnouncer creates a live region with id 'sr-announcer'
      const liveRegion = document.getElementById('sr-announcer');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion?.getAttribute('role')).toBe('status');
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
    });

    it('should remove the live region on unmount', () => {
      const { unmount } = render(
        <AnnouncerProvider>
          <div>Child</div>
        </AnnouncerProvider>
      );

      expect(document.getElementById('sr-announcer')).toBeInTheDocument();

      unmount();

      expect(document.getElementById('sr-announcer')).not.toBeInTheDocument();
    });

    it('should accept custom configuration', () => {
      const config = { delayBetweenAnnouncements: 200 };

      render(
        <AnnouncerProvider config={config}>
          <div>Child</div>
        </AnnouncerProvider>
      );

      // Live region should still be created
      expect(document.getElementById('sr-announcer')).toBeInTheDocument();
    });
  });

  describe('useAnnouncement hook', () => {
    it('should return an announce function', () => {
      const onAnnounce = vi.fn();

      render(
        <AnnouncerProvider>
          <TestComponent onAnnounce={onAnnounce} />
        </AnnouncerProvider>
      );

      const announceMock = vi.fn();
      onAnnounce.mockImplementation((announce) => {
        announce('Test message');
        announceMock();
      });

      screen.getByRole('button').click();

      expect(onAnnounce).toHaveBeenCalled();
    });

    it('should throw an error when used outside of AnnouncerProvider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestComponentOutsideProvider />)).toThrow(
        'useAnnouncement must be used within an AnnouncerProvider'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should allow announcing messages with polite priority', async () => {
      const user = userEvent.setup();
      let capturedAnnounce: ((message: string, priority?: AnnouncerPriority) => void) | null = null;

      render(
        <AnnouncerProvider>
          <TestComponent
            onAnnounce={(announce) => {
              capturedAnnounce = announce;
            }}
          />
        </AnnouncerProvider>
      );

      await user.click(screen.getByRole('button'));

      expect(capturedAnnounce).toBeDefined();

      // Call the announce function
      capturedAnnounce?.('Test polite message', 'polite');

      // Wait for the announcement to be processed
      await waitFor(() => {
        const liveRegion = document.getElementById('sr-announcer');
        expect(liveRegion?.textContent).toBe('Test polite message');
      });
    });

    it('should allow announcing messages with assertive priority', async () => {
      let capturedAnnounce: ((message: string, priority?: AnnouncerPriority) => void) | null = null;

      render(
        <AnnouncerProvider>
          <TestComponent
            onAnnounce={(announce) => {
              capturedAnnounce = announce;
            }}
          />
        </AnnouncerProvider>
      );

      screen.getByRole('button').click();

      expect(capturedAnnounce).toBeDefined();

      // Call the announce function with assertive priority
      capturedAnnounce?.('Test assertive message', 'assertive');

      // Wait for the announcement to be processed
      await waitFor(() => {
        const liveRegion = document.getElementById('sr-announcer');
        expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
        expect(liveRegion?.getAttribute('role')).toBe('alert');
      });
    });

    it('should default to polite priority when not specified', async () => {
      let capturedAnnounce: ((message: string, priority?: AnnouncerPriority) => void) | null = null;

      render(
        <AnnouncerProvider>
          <TestComponent
            onAnnounce={(announce) => {
              capturedAnnounce = announce;
            }}
          />
        </AnnouncerProvider>
      );

      screen.getByRole('button').click();

      // Call the announce function without priority
      capturedAnnounce?.('Test default message');

      // Wait for the announcement to be processed
      await waitFor(() => {
        const liveRegion = document.getElementById('sr-announcer');
        expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
      });
    });
  });

  describe('useAnnounce hook', () => {
    it('should return the announce function directly', () => {
      const onAnnounce = vi.fn();

      render(
        <AnnouncerProvider>
          <TestComponentWithUseAnnounce onAnnounce={onAnnounce} />
        </AnnouncerProvider>
      );

      screen.getByRole('button').click();

      expect(onAnnounce).toHaveBeenCalled();
      expect(typeof onAnnounce.mock.calls[0][0]).toBe('function');
    });
  });

  describe('LiveAnnouncer component', () => {
    it('should render nothing when not using separate regions', () => {
      const { container } = render(<LiveAnnouncer />);

      // Should render an empty fragment
      expect(container.firstChild).toBeNull();
    });

    it('should create a live region via the utility when not using separate regions', () => {
      render(<LiveAnnouncer />);

      // The ScreenReaderAnnouncer creates a live region
      expect(document.getElementById('sr-announcer')).toBeInTheDocument();
    });

    it('should remove the live region on unmount', () => {
      const { unmount } = render(<LiveAnnouncer />);

      expect(document.getElementById('sr-announcer')).toBeInTheDocument();

      unmount();

      expect(document.getElementById('sr-announcer')).not.toBeInTheDocument();
    });

    it('should render separate live regions when separateRegions is true', () => {
      render(<LiveAnnouncer separateRegions />);

      // Should render separate polite and assertive regions
      const politeRegion = document.getElementById('sr-announcer-polite');
      const assertiveRegion = document.getElementById('sr-announcer-assertive');

      expect(politeRegion).toBeInTheDocument();
      expect(assertiveRegion).toBeInTheDocument();

      // Check attributes
      expect(politeRegion?.getAttribute('role')).toBe('status');
      expect(politeRegion?.getAttribute('aria-live')).toBe('polite');
      expect(politeRegion?.getAttribute('aria-atomic')).toBe('true');

      expect(assertiveRegion?.getAttribute('role')).toBe('alert');
      expect(assertiveRegion?.getAttribute('aria-live')).toBe('assertive');
      expect(assertiveRegion?.getAttribute('aria-atomic')).toBe('true');
    });

    it('should apply visually hidden styles to separate regions', () => {
      render(<LiveAnnouncer separateRegions />);

      const politeRegion = document.getElementById('sr-announcer-polite');
      const assertiveRegion = document.getElementById('sr-announcer-assertive');

      // Check that sr-only class is applied
      expect(politeRegion).toHaveClass('sr-only');
      expect(assertiveRegion).toHaveClass('sr-only');
    });

    it('should accept custom configuration', () => {
      const config = { delayBetweenAnnouncements: 300 };

      render(<LiveAnnouncer config={config} />);

      // Live region should still be created
      expect(document.getElementById('sr-announcer')).toBeInTheDocument();
    });
  });

  describe('AnnouncerContext', () => {
    it('should be exportable for advanced use cases', () => {
      expect(AnnouncerContext).toBeDefined();
      expect(AnnouncerContext.Provider).toBeDefined();
      expect(AnnouncerContext.Consumer).toBeDefined();
    });

    it('should allow direct context consumption', () => {
      let contextValue: {
        announce: (message: string, priority?: AnnouncerPriority) => void;
      } | null = null;

      render(
        <AnnouncerProvider>
          <AnnouncerContext.Consumer>
            {(value) => {
              contextValue = value ?? null;
              return <div>Consumer</div>;
            }}
          </AnnouncerContext.Consumer>
        </AnnouncerProvider>
      );

      expect(contextValue).not.toBeNull();
      expect(typeof contextValue?.announce).toBe('function');
    });
  });

  describe('Integration tests', () => {
    it('should handle multiple announcements in sequence', async () => {
      let capturedAnnounce: ((message: string, priority?: AnnouncerPriority) => void) | null = null;

      render(
        <AnnouncerProvider config={{ delayBetweenAnnouncements: 50 }}>
          <TestComponent
            onAnnounce={(announce) => {
              capturedAnnounce = announce;
            }}
          />
        </AnnouncerProvider>
      );

      screen.getByRole('button').click();

      // Queue multiple announcements
      capturedAnnounce?.('First message');
      capturedAnnounce?.('Second message');
      capturedAnnounce?.('Third message');

      // Wait for announcements to be processed
      await waitFor(
        () => {
          const liveRegion = document.getElementById('sr-announcer');
          // The last message should eventually be announced
          expect(liveRegion?.textContent).toBe('Third message');
        },
        { timeout: 1000 }
      );
    });

    it('should handle empty messages gracefully', () => {
      let capturedAnnounce: ((message: string, priority?: AnnouncerPriority) => void) | null = null;

      render(
        <AnnouncerProvider>
          <TestComponent
            onAnnounce={(announce) => {
              capturedAnnounce = announce;
            }}
          />
        </AnnouncerProvider>
      );

      screen.getByRole('button').click();

      // Should not throw when announcing empty message
      expect(() => {
        capturedAnnounce?.('');
        capturedAnnounce?.('   ');
      }).not.toThrow();
    });

    it('should work with nested providers (last provider wins)', () => {
      const onAnnounce = vi.fn();

      render(
        <AnnouncerProvider>
          <AnnouncerProvider>
            <TestComponent onAnnounce={onAnnounce} />
          </AnnouncerProvider>
        </AnnouncerProvider>
      );

      screen.getByRole('button').click();

      expect(onAnnounce).toHaveBeenCalled();
    });
  });
});
