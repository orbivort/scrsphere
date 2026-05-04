import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  type ScreenReaderAnnouncer,
  createAnnouncer,
  getDefaultAnnouncer,
  destroyDefaultAnnouncer,
  type AnnouncerPriority,
} from './announcer';

describe('ScreenReaderAnnouncer', () => {
  let announcer: ScreenReaderAnnouncer;

  beforeEach(() => {
    vi.useFakeTimers();
    announcer = createAnnouncer();
  });

  afterEach(() => {
    announcer.destroyLiveRegion();
    vi.useRealTimers();
  });

  describe('createLiveRegion', () => {
    it('should create a live region element with correct attributes', () => {
      const liveRegion = announcer.createLiveRegion();

      expect(liveRegion).toBeDefined();
      expect(liveRegion.id).toBe('sr-announcer');
      expect(liveRegion.getAttribute('role')).toBe('status');
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
    });

    it('should apply visually hidden styles', () => {
      const liveRegion = announcer.createLiveRegion();

      expect(liveRegion.style.position).toBe('absolute');
      expect(liveRegion.style.width).toBe('1px');
      expect(liveRegion.style.height).toBe('1px');
      expect(liveRegion.style.overflow).toBe('hidden');
      expect(liveRegion.style.clipPath).toBe('inset(50%)');
    });

    it('should append live region to document body', () => {
      const liveRegion = announcer.createLiveRegion();

      expect(document.body.contains(liveRegion)).toBe(true);
    });

    it('should return existing element if already created', () => {
      const liveRegion1 = announcer.createLiveRegion();
      const liveRegion2 = announcer.createLiveRegion();

      expect(liveRegion1).toBe(liveRegion2);
    });

    it('should use custom live region ID when provided', () => {
      const customAnnouncer = createAnnouncer({ liveRegionId: 'custom-announcer' });
      const liveRegion = customAnnouncer.createLiveRegion();

      expect(liveRegion.id).toBe('custom-announcer');

      customAnnouncer.destroyLiveRegion();
    });
  });

  describe('destroyLiveRegion', () => {
    it('should remove live region from DOM', () => {
      const liveRegion = announcer.createLiveRegion();
      expect(document.body.contains(liveRegion)).toBe(true);

      announcer.destroyLiveRegion();

      expect(document.body.contains(liveRegion)).toBe(false);
    });

    it('should clear the queue when destroyed', () => {
      announcer.announce('Message 1');
      announcer.announce('Message 2');

      announcer.destroyLiveRegion();

      expect(announcer.getQueueLength()).toBe(0);
    });

    it('should reset processing state when destroyed', () => {
      announcer.announce('Message 1');
      vi.advanceTimersByTime(50);

      announcer.destroyLiveRegion();

      expect(announcer.isCurrentlyProcessing()).toBe(false);
    });

    it('should handle multiple destroy calls gracefully', () => {
      announcer.createLiveRegion();
      announcer.destroyLiveRegion();
      announcer.destroyLiveRegion();

      expect(announcer.getLiveRegion()).toBeNull();
    });
  });

  describe('announce', () => {
    it('should process message immediately when not already processing', () => {
      announcer.announce('Test message');

      // First message is immediately processed, so queue is empty
      expect(announcer.getQueueLength()).toBe(0);
      expect(announcer.isCurrentlyProcessing()).toBe(true);
    });

    it('should not add empty messages to queue', () => {
      announcer.announce('');
      announcer.announce('   ');

      expect(announcer.getQueueLength()).toBe(0);
      expect(announcer.isCurrentlyProcessing()).toBe(false);
    });

    it('should trim whitespace from messages', () => {
      announcer.announce('  Test message  ');

      // Process the queue to see the actual message
      vi.advanceTimersByTime(50);
      const liveRegion = announcer.getLiveRegion();

      expect(liveRegion?.textContent).toBe('Test message');
    });

    it('should default to polite priority', () => {
      announcer.announce('Test message');
      vi.advanceTimersByTime(50);

      const liveRegion = announcer.getLiveRegion();
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion?.getAttribute('role')).toBe('status');
    });

    it('should use assertive priority when specified', () => {
      announcer.announce('Test message', 'assertive');
      vi.advanceTimersByTime(50);

      const liveRegion = announcer.getLiveRegion();
      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
      expect(liveRegion?.getAttribute('role')).toBe('alert');
    });
  });

  describe('announcement queuing', () => {
    it('should queue multiple announcements when processing', () => {
      announcer.announce('Message 1');
      announcer.announce('Message 2');
      announcer.announce('Message 3');

      // First message is immediately processed, remaining 2 are queued
      expect(announcer.getQueueLength()).toBe(2);
    });

    it('should process announcements sequentially', () => {
      announcer.announce('Message 1');
      announcer.announce('Message 2');

      // First announcement clears and sets content
      vi.advanceTimersByTime(50);
      const liveRegion = announcer.getLiveRegion();
      expect(liveRegion?.textContent).toBe('Message 1');

      // After delay, announcement clears
      vi.advanceTimersByTime(100);
      expect(liveRegion?.textContent).toBe('');

      // Second announcement
      vi.advanceTimersByTime(50);
      expect(liveRegion?.textContent).toBe('Message 2');
    });

    it('should respect custom delay between announcements', () => {
      const customAnnouncer = createAnnouncer({ delayBetweenAnnouncements: 200 });
      customAnnouncer.announce('Message 1');
      customAnnouncer.announce('Message 2');

      vi.advanceTimersByTime(50);
      const liveRegion = customAnnouncer.getLiveRegion();
      expect(liveRegion?.textContent).toBe('Message 1');

      // Custom delay is 200ms, so after 100ms more, we're still processing first message
      vi.advanceTimersByTime(100);
      expect(liveRegion?.textContent).toBe('Message 1');

      // After 200ms total delay (50ms clear + 200ms between), second message appears
      vi.advanceTimersByTime(150);
      expect(liveRegion?.textContent).toBe('Message 2');

      customAnnouncer.destroyLiveRegion();
    });
  });

  describe('sequential processing', () => {
    it('should set isProcessing to true while processing', () => {
      announcer.announce('Message 1');
      vi.advanceTimersByTime(50);

      expect(announcer.isCurrentlyProcessing()).toBe(true);
    });

    it('should set isProcessing to false when queue is empty', () => {
      announcer.announce('Message 1');

      // Process complete cycle
      vi.advanceTimersByTime(50); // Clear delay
      vi.advanceTimersByTime(100); // Between announcements delay
      vi.advanceTimersByTime(50); // Next clear delay

      expect(announcer.isCurrentlyProcessing()).toBe(false);
    });

    it('should clear announcement between messages', () => {
      announcer.announce('Message 1');
      announcer.announce('Message 2');

      vi.advanceTimersByTime(50);
      const liveRegion = announcer.getLiveRegion();
      expect(liveRegion?.textContent).toBe('Message 1');

      // After the delay, the announcement should be cleared
      vi.advanceTimersByTime(100);
      expect(liveRegion?.textContent).toBe('');
    });
  });

  describe('priority handling', () => {
    it('should update aria-live attribute based on priority', () => {
      announcer.announce('Polite message', 'polite');
      vi.advanceTimersByTime(50);

      let liveRegion = announcer.getLiveRegion();
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');

      // Wait for processing to complete
      vi.advanceTimersByTime(150);

      announcer.announce('Assertive message', 'assertive');
      vi.advanceTimersByTime(50);

      liveRegion = announcer.getLiveRegion();
      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should update role attribute based on priority', () => {
      announcer.announce('Polite message', 'polite');
      vi.advanceTimersByTime(50);

      let liveRegion = announcer.getLiveRegion();
      expect(liveRegion?.getAttribute('role')).toBe('status');

      // Wait for processing to complete
      vi.advanceTimersByTime(150);

      announcer.announce('Assertive message', 'assertive');
      vi.advanceTimersByTime(50);

      liveRegion = announcer.getLiveRegion();
      expect(liveRegion?.getAttribute('role')).toBe('alert');
    });

    it('should handle mixed priority announcements', () => {
      announcer.announce('Polite 1', 'polite');
      announcer.announce('Assertive 1', 'assertive');
      announcer.announce('Polite 2', 'polite');

      vi.advanceTimersByTime(50);
      const liveRegion = announcer.getLiveRegion();
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion?.textContent).toBe('Polite 1');

      vi.advanceTimersByTime(150);
      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
      expect(liveRegion?.textContent).toBe('Assertive 1');

      vi.advanceTimersByTime(150);
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion?.textContent).toBe('Polite 2');
    });
  });

  describe('createAnnouncer factory', () => {
    it('should create a new announcer instance', () => {
      const announcer1 = createAnnouncer();
      const announcer2 = createAnnouncer();

      expect(announcer1).not.toBe(announcer2);

      announcer1.destroyLiveRegion();
      announcer2.destroyLiveRegion();
    });

    it('should apply custom configuration', () => {
      const customAnnouncer = createAnnouncer({
        delayBetweenAnnouncements: 500,
        liveRegionId: 'custom-id',
      });

      const liveRegion = customAnnouncer.createLiveRegion();
      expect(liveRegion.id).toBe('custom-id');

      customAnnouncer.destroyLiveRegion();
    });
  });

  describe('singleton functions', () => {
    afterEach(() => {
      destroyDefaultAnnouncer();
    });

    it('should return the same instance from getDefaultAnnouncer', () => {
      const instance1 = getDefaultAnnouncer();
      const instance2 = getDefaultAnnouncer();

      expect(instance1).toBe(instance2);
    });

    it('should destroy the default announcer', () => {
      const instance = getDefaultAnnouncer();
      instance.createLiveRegion();

      destroyDefaultAnnouncer();

      expect(instance.getLiveRegion()).toBeNull();
    });

    it('should create new instance after destroy', () => {
      const instance1 = getDefaultAnnouncer();
      destroyDefaultAnnouncer();
      const instance2 = getDefaultAnnouncer();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid announcements', () => {
      for (let i = 0; i < 10; i++) {
        announcer.announce(`Message ${i}`);
      }

      // First message is immediately processed, remaining 9 are queued
      expect(announcer.getQueueLength()).toBe(9);
    });

    it('should handle announce after destroy', () => {
      announcer.destroyLiveRegion();
      announcer.announce('New message');

      // Message is immediately processed, queue is empty
      expect(announcer.getQueueLength()).toBe(0);
      expect(announcer.isCurrentlyProcessing()).toBe(true);

      // Should create a new live region
      vi.advanceTimersByTime(50);
      const liveRegion = announcer.getLiveRegion();
      expect(liveRegion).not.toBeNull();
      expect(liveRegion?.textContent).toBe('New message');
    });

    it('should handle special characters in messages', () => {
      const specialMessage =
        'Message with <script>alert("xss")</script> & "quotes" and \'apostrophes\'';
      announcer.announce(specialMessage);

      vi.advanceTimersByTime(50);
      const liveRegion = announcer.getLiveRegion();

      expect(liveRegion?.textContent).toBe(specialMessage);
    });

    it('should handle unicode characters in messages', () => {
      const unicodeMessage = 'Message with emoji 🎉 and unicode \u00e9\u00e8\u00ea';
      announcer.announce(unicodeMessage);

      vi.advanceTimersByTime(50);
      const liveRegion = announcer.getLiveRegion();

      expect(liveRegion?.textContent).toBe(unicodeMessage);
    });
  });

  describe('accessibility compliance', () => {
    it('should have aria-atomic set to true', () => {
      const liveRegion = announcer.createLiveRegion();
      expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
    });

    it('should use appropriate role for polite announcements', () => {
      announcer.announce('Polite message', 'polite');
      vi.advanceTimersByTime(50);

      const liveRegion = announcer.getLiveRegion();
      expect(liveRegion?.getAttribute('role')).toBe('status');
    });

    it('should use appropriate role for assertive announcements', () => {
      announcer.announce('Assertive message', 'assertive');
      vi.advanceTimersByTime(50);

      const liveRegion = announcer.getLiveRegion();
      expect(liveRegion?.getAttribute('role')).toBe('alert');
    });
  });
});

describe('AnnouncerPriority type', () => {
  it('should accept polite priority', () => {
    const priority: AnnouncerPriority = 'polite';
    expect(priority).toBe('polite');
  });

  it('should accept assertive priority', () => {
    const priority: AnnouncerPriority = 'assertive';
    expect(priority).toBe('assertive');
  });
});
