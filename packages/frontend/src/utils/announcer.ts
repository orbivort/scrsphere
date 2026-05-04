/**
 * ScreenReaderAnnouncer - A utility for managing ARIA live regions and screen reader announcements
 *
 * This class provides a centralized way to announce dynamic content changes to screen readers
 * using ARIA live regions. It handles queuing of announcements and ensures proper timing
 * between sequential announcements.
 */

/**
 * Priority levels for screen reader announcements
 * - 'polite': Announcements will be made when the user is idle (default)
 * - 'assertive': Announcements will be made immediately, potentially interrupting the user
 */
export type AnnouncerPriority = 'polite' | 'assertive';

/**
 * Configuration options for creating an announcer
 */
export interface AnnouncerConfig {
  /** Delay in milliseconds between sequential announcements */
  delayBetweenAnnouncements?: number;
  /** Custom ID for the live region element */
  liveRegionId?: string;
}

interface QueuedAnnouncement {
  message: string;
  priority: AnnouncerPriority;
}

const DEFAULT_DELAY = 100;
const DEFAULT_LIVE_REGION_ID = 'sr-announcer';

/**
 * ScreenReaderAnnouncer class for managing ARIA live regions
 *
 * @example
 * ```typescript
 * const announcer = createAnnouncer();
 *
 * // Polite announcement (waits for user to be idle)
 * announcer.announce('Item added to cart');
 *
 * // Assertive announcement (interrupts immediately)
 * announcer.announce('Error: Form validation failed', 'assertive');
 *
 * // Clean up when done
 * announcer.destroyLiveRegion();
 * ```
 */
export class ScreenReaderAnnouncer {
  private announcementElement: HTMLElement | null = null;
  private announcementQueue: QueuedAnnouncement[] = [];
  private isProcessing: boolean = false;
  private delayBetweenAnnouncements: number;
  private liveRegionId: string;
  private processingTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private clearTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(config: AnnouncerConfig = {}) {
    this.delayBetweenAnnouncements = config.delayBetweenAnnouncements ?? DEFAULT_DELAY;
    this.liveRegionId = config.liveRegionId ?? DEFAULT_LIVE_REGION_ID;
  }

  /**
   * Announces a message to screen readers
   *
   * @param message - The message to announce
   * @param priority - The priority level ('polite' or 'assertive')
   */
  announce(message: string, priority: AnnouncerPriority = 'polite'): void {
    if (!message.trim()) {
      return;
    }

    this.announcementQueue.push({ message: message.trim(), priority });

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Creates the live region element and adds it to the DOM
   *
   * @returns The created live region element
   */
  createLiveRegion(): HTMLElement {
    // Return existing element if already created
    if (this.announcementElement) {
      return this.announcementElement;
    }

    // Check if element already exists in DOM
    const existingElement = document.getElementById(this.liveRegionId);
    if (existingElement) {
      this.announcementElement = existingElement;
      return existingElement;
    }

    const element = document.createElement('div');
    element.id = this.liveRegionId;
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    element.setAttribute('aria-atomic', 'true');

    // Apply visually hidden styles inline to ensure availability
    // These styles match the .visually-hidden class pattern
    element.style.position = 'absolute';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.padding = '0';
    element.style.margin = '-1px';
    element.style.overflow = 'hidden';
    element.style.clipPath = 'inset(50%)';
    element.style.whiteSpace = 'nowrap';
    element.style.border = '0';

    document.body.appendChild(element);
    this.announcementElement = element;

    return element;
  }

  /**
   * Removes the live region element from the DOM
   */
  destroyLiveRegion(): void {
    // Clear any pending timeouts
    if (this.processingTimeoutId) {
      clearTimeout(this.processingTimeoutId);
      this.processingTimeoutId = null;
    }
    if (this.clearTimeoutId) {
      clearTimeout(this.clearTimeoutId);
      this.clearTimeoutId = null;
    }

    // Clear the queue
    this.announcementQueue = [];
    this.isProcessing = false;

    // Remove element from DOM
    if (this.announcementElement && this.announcementElement.parentNode) {
      this.announcementElement.parentNode.removeChild(this.announcementElement);
    }
    this.announcementElement = null;
  }

  /**
   * Processes the announcement queue sequentially
   * Each announcement is processed with a delay between them
   */
  private processQueue(): void {
    if (this.announcementQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    // Ensure live region exists
    const liveRegion = this.createLiveRegion();

    const { message, priority } = this.announcementQueue.shift()!;

    // Update aria-live attribute based on priority
    liveRegion.setAttribute('aria-live', priority);

    // Update role based on priority
    // 'assertive' uses 'alert' role, 'polite' uses 'status' role
    liveRegion.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');

    // Clear previous content first (helps trigger announcement)
    liveRegion.textContent = '';

    // Use a microtask to ensure the clear is processed before setting new content
    // This helps screen readers detect the change
    this.clearTimeoutId = setTimeout(() => {
      if (this.announcementElement) {
        this.announcementElement.textContent = message;
      }

      // Schedule next announcement
      this.processingTimeoutId = setTimeout(() => {
        this.clearAnnouncement();
        this.processQueue();
      }, this.delayBetweenAnnouncements);
    }, 50); // Small delay to ensure clear is processed
  }

  /**
   * Clears the current announcement from the live region
   */
  private clearAnnouncement(): void {
    if (this.announcementElement) {
      this.announcementElement.textContent = '';
    }
  }

  /**
   * Gets the current queue length (useful for testing)
   */
  getQueueLength(): number {
    return this.announcementQueue.length;
  }

  /**
   * Checks if the announcer is currently processing (useful for testing)
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Gets the live region element (useful for testing)
   */
  getLiveRegion(): HTMLElement | null {
    return this.announcementElement;
  }
}

// Singleton instance for convenience
let defaultAnnouncer: ScreenReaderAnnouncer | null = null;

/**
 * Factory function to create a ScreenReaderAnnouncer instance
 *
 * @param config - Optional configuration options
 * @returns A new ScreenReaderAnnouncer instance
 *
 * @example
 * ```typescript
 * const announcer = createAnnouncer({ delayBetweenAnnouncements: 150 });
 * announcer.announce('Welcome to the application');
 * ```
 */
export function createAnnouncer(config?: AnnouncerConfig): ScreenReaderAnnouncer {
  const announcer = new ScreenReaderAnnouncer(config);
  return announcer;
}

/**
 * Gets the default singleton announcer instance
 * Creates one if it doesn't exist
 *
 * @param config - Optional configuration (only used on first call)
 * @returns The default ScreenReaderAnnouncer instance
 */
export function getDefaultAnnouncer(config?: AnnouncerConfig): ScreenReaderAnnouncer {
  if (!defaultAnnouncer) {
    defaultAnnouncer = createAnnouncer(config);
  }
  return defaultAnnouncer;
}

/**
 * Destroys the default singleton announcer instance
 * Useful for cleanup in tests or when the application unmounts
 */
export function destroyDefaultAnnouncer(): void {
  if (defaultAnnouncer) {
    defaultAnnouncer.destroyLiveRegion();
    defaultAnnouncer = null;
  }
}
