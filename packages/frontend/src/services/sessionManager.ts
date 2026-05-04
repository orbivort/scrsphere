// Session Manager - Client-side session timeout handling

import { logger } from '../utils/logger';

export interface SessionConfig {
  idleTimeoutMs: number;
  absoluteTimeoutMs: number;
  warningThresholdMs: number;
  expiresAt: Date;
}

export interface SessionEventHandlers {
  onWarning: (timeRemaining: number) => void;
  onTimeout: () => void;
  onActivityUpdate: () => void;
}

type SessionEventType = 'warning' | 'timeout' | 'activity' | 'session-start' | 'session-end';

interface SessionEvent {
  type: SessionEventType;
  timestamp: number;
  data?: unknown;
}

const STORAGE_KEY_SESSION_CONFIG = 'sessionConfig';
const STORAGE_KEY_LAST_ACTIVITY = 'lastActivity';
const STORAGE_KEY_SESSION_EVENTS = 'sessionEvents';

const DEFAULT_CONFIG: SessionConfig = {
  idleTimeoutMs: 30 * 60 * 1000,
  absoluteTimeoutMs: 24 * 60 * 60 * 1000,
  warningThresholdMs: 2 * 60 * 1000,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

type ActivityNotifier = () => Promise<void>;

class SessionManager {
  private config: SessionConfig = DEFAULT_CONFIG;
  private handlers: SessionEventHandlers | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private activityThrottleTimer: ReturnType<typeof setTimeout> | null = null;
  private isInitialized = false;
  private isWarningShown = false;
  private lastActivityTime = Date.now();
  private activityThrottleMs = 60000;
  private idleResetThrottleMs = 5000;
  private lastIdleResetTime = 0;
  private boundActivityHandler: () => void;
  private boundVisibilityHandler: () => void;
  private boundStorageHandler: (e: StorageEvent) => void;
  private sessionStartTime: number | null = null;
  private activityNotifier: ActivityNotifier | null = null;
  private timerGeneration = 0;

  private static readonly ACTIVITY_EVENTS = [
    'mousemove',
    'mousedown',
    'keydown',
    'scroll',
    'touchstart',
    'click',
  ] as const;

  constructor() {
    this.boundActivityHandler = this.handleUserActivity.bind(this);
    this.boundVisibilityHandler = this.handleVisibilityChange.bind(this);
    this.boundStorageHandler = this.handleStorageChange.bind(this);
  }

  setActivityNotifier(notifier: ActivityNotifier): void {
    this.activityNotifier = notifier;
  }

  initialize(config: SessionConfig, handlers: SessionEventHandlers): void {
    if (this.isInitialized) {
      this.destroy();
    }

    this.config = config;
    this.handlers = handlers;
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.lastIdleResetTime = 0;
    this.isInitialized = true;
    this.isWarningShown = false;

    this.storeSessionConfig();
    this.storeLastActivity();

    this.startActivityTracking();
    this.startTimers();
    this.broadcastSessionEvent('session-start');
  }

  destroy(): void {
    this.stopActivityTracking();
    this.clearTimers();
    this.isInitialized = false;
    this.broadcastSessionEvent('session-end');
  }

  updateConfig(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };
    this.storeSessionConfig();
    this.restartTimers();
  }

  resetIdleTimer(): void {
    if (!this.isInitialized) return;

    this.lastActivityTime = Date.now();
    this.storeLastActivity();
    this.isWarningShown = false;
    this.restartTimers();
    this.handlers?.onActivityUpdate();
    this.broadcastSessionEvent('activity');
  }

  resetWarningState(): void {
    if (!this.isInitialized) return;
    this.isWarningShown = false;
    this.lastActivityTime = Date.now();
    this.storeLastActivity();
    this.restartTimers();
  }

  getTimeUntilTimeout(): number {
    const idleTime = Date.now() - this.lastActivityTime;
    return Math.max(0, this.config.idleTimeoutMs - idleTime);
  }

  getTimeUntilWarning(): number {
    const idleTime = Date.now() - this.lastActivityTime;
    return Math.max(0, this.config.idleTimeoutMs - this.config.warningThresholdMs - idleTime);
  }

  getSessionAge(): number {
    return this.sessionStartTime ? Date.now() - this.sessionStartTime : 0;
  }

  isSessionExpired(): boolean {
    return this.getTimeUntilTimeout() === 0;
  }

  private startActivityTracking(): void {
    SessionManager.ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, this.boundActivityHandler, {
        passive: true,
        capture: true,
      });
    });

    document.addEventListener('visibilitychange', this.boundVisibilityHandler);
    window.addEventListener('storage', this.boundStorageHandler);
  }

  private stopActivityTracking(): void {
    SessionManager.ACTIVITY_EVENTS.forEach((event) => {
      document.removeEventListener(event, this.boundActivityHandler, {
        capture: true,
      });
    });

    document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
    window.removeEventListener('storage', this.boundStorageHandler);
  }

  private handleUserActivity(): void {
    if (!this.isInitialized) return;

    if (this.isWarningShown) return;

    const now = Date.now();
    if (now - this.lastIdleResetTime < this.idleResetThrottleMs) return;
    this.lastIdleResetTime = now;

    this.resetIdleTimer();
    if (this.activityThrottleTimer) return;

    this.activityThrottleTimer = setTimeout(() => {
      this.activityThrottleTimer = null;
    }, this.activityThrottleMs);

    void this.notifyServerOfActivity();
  }

  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      this.checkForSessionUpdate();
    }
  }

  private handleStorageChange(event: StorageEvent): void {
    if (event.key === STORAGE_KEY_LAST_ACTIVITY) {
      const storedActivity = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
      if (storedActivity) {
        const lastActivity = parseInt(storedActivity, 10);
        if (lastActivity > this.lastActivityTime) {
          this.lastActivityTime = lastActivity;
          this.restartTimers();
        }
      }
    }
  }

  private checkForSessionUpdate(): void {
    const storedConfig = localStorage.getItem(STORAGE_KEY_SESSION_CONFIG);
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig) as SessionConfig;
        if (parsedConfig.expiresAt !== this.config.expiresAt) {
          this.config = {
            ...parsedConfig,
            expiresAt: new Date(parsedConfig.expiresAt),
          };
          this.restartTimers();
        }
      } catch {
        logger.error('[SessionManager] Failed to parse stored config');
      }
    }

    const storedActivity = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
    if (storedActivity) {
      const lastActivity = parseInt(storedActivity, 10);
      if (lastActivity > this.lastActivityTime) {
        this.lastActivityTime = lastActivity;
        this.restartTimers();
      }
    }
  }

  private startTimers(): void {
    this.startIdleTimer();
    this.startWarningTimer();
  }

  private clearTimers(): void {
    this.timerGeneration++;
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  private restartTimers(): void {
    this.clearTimers();
    this.startTimers();
  }

  private startIdleTimer(): void {
    const timeUntilTimeout = this.getTimeUntilTimeout();
    const currentGeneration = this.timerGeneration;

    this.idleTimer = setTimeout(() => {
      if (this.timerGeneration !== currentGeneration) return;
      this.handleTimeout();
    }, timeUntilTimeout);
  }

  private startWarningTimer(): void {
    const timeUntilWarning = this.getTimeUntilWarning();
    const currentGeneration = this.timerGeneration;

    if (timeUntilWarning <= 0) {
      this.showWarning();
      return;
    }

    this.warningTimer = setTimeout(() => {
      if (this.timerGeneration !== currentGeneration) return;
      this.showWarning();
    }, timeUntilWarning);
  }

  private showWarning(): void {
    if (this.isWarningShown || !this.isInitialized) return;

    this.isWarningShown = true;
    const timeRemaining = this.getTimeUntilTimeout();
    logger.warn('[SessionManager] Session warning shown', undefined, {
      timeRemaining: `${timeRemaining / 1000} seconds`,
      lastActivityTime: new Date(this.lastActivityTime).toISOString(),
      idleTimeoutMs: `${this.config.idleTimeoutMs / 1000} seconds`,
      warningThresholdMs: `${this.config.warningThresholdMs / 1000} seconds`,
    });
    this.handlers?.onWarning(timeRemaining);
  }

  private handleTimeout(): void {
    if (!this.isInitialized) return;

    if (this.getTimeUntilTimeout() > 0) {
      this.startIdleTimer();
      return;
    }

    logger.error('[SessionManager] Session timed out', undefined, {
      lastActivityTime: new Date(this.lastActivityTime).toISOString(),
      idleTime: `${(Date.now() - this.lastActivityTime) / 1000} seconds`,
      idleTimeoutMs: `${this.config.idleTimeoutMs / 1000} seconds`,
      wasWarningShown: this.isWarningShown,
    });
    this.handlers?.onTimeout();
    this.destroy();
  }

  private async notifyServerOfActivity(): Promise<void> {
    if (!this.activityNotifier) return;

    try {
      await this.activityNotifier();
    } catch (error) {
      logger.error('[SessionManager] Failed to notify server of activity', undefined, { error });
    }
  }

  private storeSessionConfig(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY_SESSION_CONFIG,
        JSON.stringify({
          ...this.config,
          expiresAt: this.config.expiresAt.toISOString(),
        })
      );
    } catch (error) {
      logger.error('[SessionManager] Failed to store session config', undefined, { error });
    }
  }

  private storeLastActivity(): void {
    try {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, this.lastActivityTime.toString());
    } catch (error) {
      logger.error('[SessionManager] Failed to store last activity', undefined, { error });
    }
  }

  private broadcastSessionEvent(type: SessionEventType, data?: unknown): void {
    try {
      const event: SessionEvent = {
        type,
        timestamp: Date.now(),
        data,
      };
      localStorage.setItem(STORAGE_KEY_SESSION_EVENTS, JSON.stringify(event));
    } catch (error) {
      logger.error('[SessionManager] Failed to broadcast event', undefined, { error });
    }
  }
}

export const sessionManager = new SessionManager();
export default sessionManager;
