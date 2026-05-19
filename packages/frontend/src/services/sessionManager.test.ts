import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sessionManager, type SessionConfig, type SessionEventHandlers } from './sessionManager';

const STORAGE_KEY_SESSION_CONFIG = 'sessionConfig';
const STORAGE_KEY_LAST_ACTIVITY = 'lastActivity';
const STORAGE_KEY_SESSION_EVENTS = 'sessionEvents';

const createMockHandlers = (): SessionEventHandlers => ({
  onWarning: vi.fn(),
  onTimeout: vi.fn(),
  onActivityUpdate: vi.fn(),
});

const testConfig: SessionConfig = {
  idleTimeoutMs: 180000,
  absoluteTimeoutMs: 86400000,
  warningThresholdMs: 60000,
  expiresAt: new Date(Date.now() + 86400000),
};

describe('SessionManager', () => {
  let mockHandlers: SessionEventHandlers;

  beforeEach(() => {
    vi.useFakeTimers();
    mockHandlers = createMockHandlers();
    localStorage.clear();
  });

  afterEach(() => {
    sessionManager.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with provided config', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      expect(sessionManager.getTimeUntilTimeout()).toBeLessThanOrEqual(180000);
      expect(sessionManager.getTimeUntilWarning()).toBeLessThanOrEqual(120000);
    });

    it('should clean up previous session when re-initialized', () => {
      const config1: SessionConfig = { ...testConfig, idleTimeoutMs: 180000 };
      const config2: SessionConfig = { ...testConfig, idleTimeoutMs: 300000 };

      sessionManager.initialize(config1, mockHandlers);
      expect(sessionManager.getTimeUntilTimeout()).toBeLessThanOrEqual(180000);

      sessionManager.initialize(config2, mockHandlers);
      expect(sessionManager.getTimeUntilTimeout()).toBeLessThanOrEqual(300000);
    });

    it('should start activity tracking on initialization', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      sessionManager.initialize(testConfig, mockHandlers);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function),
        expect.objectContaining({ passive: true, capture: true })
      );
    });
  });

  describe('Timer Race Condition Fix - Critical Bug Test', () => {
    it('should NOT show warning when timer is reset during active use (race condition fix)', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(100);

      sessionManager.resetIdleTimer();

      vi.advanceTimersByTime(60000);

      expect(mockHandlers.onWarning).not.toHaveBeenCalled();
    });

    it('should skip stale timer callbacks after timer reset', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(59999);

      sessionManager.resetIdleTimer();

      vi.advanceTimersByTime(60000);

      expect(mockHandlers.onWarning).not.toHaveBeenCalled();
    });

    it('should only show warning after actual inactivity period', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(120000);

      expect(mockHandlers.onWarning).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid successive timer resets without showing false warning', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(10000);
        sessionManager.resetIdleTimer();
      }

      vi.advanceTimersByTime(119999);

      expect(mockHandlers.onWarning).not.toHaveBeenCalled();
    });

    it('should show warning exactly at warning threshold time', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(120000);

      expect(mockHandlers.onWarning).toHaveBeenCalledTimes(1);

      const timeRemaining = mockHandlers.onWarning.mock.calls[0][0];
      expect(timeRemaining).toBeLessThanOrEqual(60000);
      expect(timeRemaining).toBeGreaterThanOrEqual(59000);
    });

    it('should show warning at 1 minute with 3 min timeout and 2 min threshold', () => {
      const userConfig: SessionConfig = {
        idleTimeoutMs: 180000,
        absoluteTimeoutMs: 86400000,
        warningThresholdMs: 120000,
        expiresAt: new Date(Date.now() + 86400000),
      };

      sessionManager.initialize(userConfig, mockHandlers);

      vi.advanceTimersByTime(59000);
      expect(mockHandlers.onWarning).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2000);
      expect(mockHandlers.onWarning).toHaveBeenCalledTimes(1);

      const timeRemaining = mockHandlers.onWarning.mock.calls[0][0];
      expect(timeRemaining).toBeLessThanOrEqual(120000);
      expect(timeRemaining).toBeGreaterThanOrEqual(118000);

      vi.advanceTimersByTime(119000);
      expect(mockHandlers.onTimeout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Warning State Management', () => {
    it('should set isWarningShown when warning is displayed', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(120000);

      expect(mockHandlers.onWarning).toHaveBeenCalled();
    });

    it('should reset warning state when resetIdleTimer is called', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(120000);
      expect(mockHandlers.onWarning).toHaveBeenCalled();

      sessionManager.resetIdleTimer();

      vi.advanceTimersByTime(10000);

      expect(mockHandlers.onWarning).toHaveBeenCalledTimes(1);
    });

    it('should reset warning state via resetWarningState method', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(120000);
      expect(mockHandlers.onWarning).toHaveBeenCalledTimes(1);

      sessionManager.resetIdleTimer();

      vi.advanceTimersByTime(120000);
      expect(mockHandlers.onWarning).toHaveBeenCalledTimes(2);
    });
  });

  describe('Session Timeout', () => {
    it('should call onTimeout after idle timeout period', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(180000);

      expect(mockHandlers.onTimeout).toHaveBeenCalledTimes(1);
    });

    it('should destroy session on timeout', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(180000);

      expect(mockHandlers.onTimeout).toHaveBeenCalled();
      expect(sessionManager.isSessionExpired()).toBe(true);
    });

    it('should not timeout if user is active', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(30000);
        sessionManager.resetIdleTimer();
      }

      vi.advanceTimersByTime(10000);

      expect(mockHandlers.onTimeout).not.toHaveBeenCalled();
      expect(mockHandlers.onWarning).not.toHaveBeenCalled();
    });
  });

  describe('Time Calculations', () => {
    it('should calculate correct time until timeout', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(50000);

      const timeUntilTimeout = sessionManager.getTimeUntilTimeout();
      expect(timeUntilTimeout).toBeLessThanOrEqual(130000);
      expect(timeUntilTimeout).toBeGreaterThan(129000);
    });

    it('should calculate correct time until warning', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(50000);

      const timeUntilWarning = sessionManager.getTimeUntilWarning();
      expect(timeUntilWarning).toBeLessThanOrEqual(70000);
      expect(timeUntilWarning).toBeGreaterThanOrEqual(69000);
    });

    it('should return 0 when session is expired', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(200000);

      expect(sessionManager.getTimeUntilTimeout()).toBe(0);
      expect(sessionManager.isSessionExpired()).toBe(true);
    });
  });

  describe('Session Age', () => {
    it('should track session age correctly', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(5000);

      expect(sessionManager.getSessionAge()).toBeGreaterThanOrEqual(5000);
    });

    it('should reset session age on re-initialization', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(10000);

      const firstAge = sessionManager.getSessionAge();

      sessionManager.initialize(testConfig, mockHandlers);

      const secondAge = sessionManager.getSessionAge();

      expect(secondAge).toBeLessThan(firstAge);
    });
  });

  describe('Config Updates', () => {
    it('should update config and restart timers', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      sessionManager.updateConfig({ idleTimeoutMs: 300000 });

      expect(sessionManager.getTimeUntilTimeout()).toBeLessThanOrEqual(300000);
    });

    it('should handle partial config updates', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      sessionManager.updateConfig({ warningThresholdMs: 120000 });

      expect(sessionManager.getTimeUntilWarning()).toBeLessThanOrEqual(60000);
    });
  });

  describe('Destroy', () => {
    it('should clear all timers on destroy', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(50000);

      sessionManager.destroy();

      vi.advanceTimersByTime(200000);

      expect(mockHandlers.onWarning).not.toHaveBeenCalled();
      expect(mockHandlers.onTimeout).not.toHaveBeenCalled();
    });

    it('should stop activity tracking on destroy', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      sessionManager.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });

    it('should mark session as not initialized after destroy', () => {
      sessionManager.initialize(testConfig, mockHandlers);
      sessionManager.destroy();

      expect(sessionManager.isSessionExpired()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero timeout gracefully', () => {
      const config: SessionConfig = {
        ...testConfig,
        idleTimeoutMs: 0,
      };

      expect(() => {
        sessionManager.initialize(config, mockHandlers);
      }).not.toThrow();
    });

    it('should handle very short warning threshold', () => {
      const config: SessionConfig = {
        ...testConfig,
        idleTimeoutMs: 10000,
        warningThresholdMs: 5000,
      };

      sessionManager.initialize(config, mockHandlers);

      vi.advanceTimersByTime(5000);

      expect(mockHandlers.onWarning).toHaveBeenCalled();
    });

    it('should not show warning twice for same session', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(120000);
      expect(mockHandlers.onWarning).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(mockHandlers.onWarning).toHaveBeenCalledTimes(1);
    });

    it('should handle resetIdleTimer when not initialized', () => {
      expect(() => {
        sessionManager.resetIdleTimer();
      }).not.toThrow();
    });

    it('should handle resetWarningState when not initialized', () => {
      expect(() => {
        sessionManager.resetWarningState();
      }).not.toThrow();
    });
  });

  describe('Activity Events', () => {
    it('should track mousedown events', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      sessionManager.initialize(testConfig, mockHandlers);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function),
        expect.objectContaining({ passive: true, capture: true })
      );
    });

    it('should track keydown events', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      sessionManager.initialize(testConfig, mockHandlers);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        expect.objectContaining({ passive: true, capture: true })
      );
    });

    it('should track mousemove events', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      sessionManager.initialize(testConfig, mockHandlers);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function),
        expect.objectContaining({ passive: true, capture: true })
      );
    });

    it('should track scroll events', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      sessionManager.initialize(testConfig, mockHandlers);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        expect.objectContaining({ passive: true, capture: true })
      );
    });

    it('should track touchstart events', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      sessionManager.initialize(testConfig, mockHandlers);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        expect.objectContaining({ passive: true, capture: true })
      );
    });

    it('should track click events', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      sessionManager.initialize(testConfig, mockHandlers);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
        expect.objectContaining({ passive: true, capture: true })
      );
    });
  });

  describe('Activity Notifier', () => {
    it('should set activity notifier', () => {
      const mockNotifier = vi.fn().mockResolvedValue(undefined);
      sessionManager.setActivityNotifier(mockNotifier);
    });

    it('should call activity notifier on user activity via event', async () => {
      const mockNotifier = vi.fn().mockResolvedValue(undefined);
      sessionManager.setActivityNotifier(mockNotifier);
      sessionManager.initialize(testConfig, mockHandlers);

      const activityHandler = vi
        .spyOn(document, 'addEventListener')
        .mock.calls.find((call) => call[0] === 'mousedown')?.[1] as () => void;

      if (activityHandler) {
        vi.advanceTimersByTime(6000);
        activityHandler();
        await vi.advanceTimersByTimeAsync(100);
        expect(mockNotifier).toHaveBeenCalled();
      }
    });
  });

  describe('Storage Operations', () => {
    it('should store session config in localStorage on initialize', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      sessionManager.initialize(testConfig, mockHandlers);

      expect(setItemSpy).toHaveBeenCalledWith(
        STORAGE_KEY_SESSION_CONFIG,
        expect.stringContaining('idleTimeoutMs')
      );
    });

    it('should store last activity time in localStorage', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      sessionManager.initialize(testConfig, mockHandlers);

      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY_LAST_ACTIVITY, expect.any(String));
    });

    it('should update stored config when updateConfig is called', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      sessionManager.initialize(testConfig, mockHandlers);

      setItemSpy.mockClear();

      sessionManager.updateConfig({ idleTimeoutMs: 300000 });

      expect(setItemSpy).toHaveBeenCalledWith(
        STORAGE_KEY_SESSION_CONFIG,
        expect.stringContaining('300000')
      );
    });

    it('should store last activity when resetIdleTimer is called', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      vi.advanceTimersByTime(1000);
      sessionManager.resetIdleTimer();

      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY_LAST_ACTIVITY, expect.any(String));
    });

    it('should store session events on session start', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      sessionManager.initialize(testConfig, mockHandlers);

      expect(setItemSpy).toHaveBeenCalledWith(
        STORAGE_KEY_SESSION_EVENTS,
        expect.stringContaining('session-start')
      );
    });

    it('should store session events on session end', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      sessionManager.destroy();

      expect(setItemSpy).toHaveBeenCalledWith(
        STORAGE_KEY_SESSION_EVENTS,
        expect.stringContaining('session-end')
      );
    });

    it('should store activity event on user activity', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockClear();

      sessionManager.resetIdleTimer();

      expect(setItemSpy).toHaveBeenCalledWith(
        STORAGE_KEY_SESSION_EVENTS,
        expect.stringContaining('activity')
      );
    });
  });

  describe('Visibility Change Handling', () => {
    it('should add visibilitychange event listener on initialize', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      sessionManager.initialize(testConfig, mockHandlers);

      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('should remove visibilitychange event listener on destroy', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      sessionManager.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });
  });

  describe('Storage Change Handling (Cross-tab Sync)', () => {
    it('should add storage event listener on initialize', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      sessionManager.initialize(testConfig, mockHandlers);

      expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    });

    it('should remove storage event listener on destroy', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      sessionManager.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    });
  });

  describe('Event Broadcasting', () => {
    it('should broadcast events with correct structure', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      sessionManager.initialize(testConfig, mockHandlers);

      const sessionStartCalls = setItemSpy.mock.calls.filter(
        (call) => call[0] === STORAGE_KEY_SESSION_EVENTS
      );

      expect(sessionStartCalls.length).toBeGreaterThan(0);

      const eventData = JSON.parse(sessionStartCalls[0][1] as string);
      expect(eventData.timestamp).toBeDefined();
      expect(typeof eventData.timestamp).toBe('number');
      expect(eventData.type).toBeDefined();
    });

    it('should include timestamp in broadcasted events', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      sessionManager.initialize(testConfig, mockHandlers);

      const sessionStartCalls = setItemSpy.mock.calls.filter(
        (call) => call[0] === STORAGE_KEY_SESSION_EVENTS
      );

      expect(sessionStartCalls.length).toBeGreaterThan(0);

      const eventData = JSON.parse(sessionStartCalls[0][1] as string);
      expect(eventData.timestamp).toBeDefined();
      expect(typeof eventData.timestamp).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage setItem errors gracefully', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        sessionManager.initialize(testConfig, mockHandlers);
      }).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe('Warning at Initialization', () => {
    it('should show warning immediately when timeUntilWarning is 0 or less', () => {
      const config: SessionConfig = {
        idleTimeoutMs: 60000,
        absoluteTimeoutMs: 86400000,
        warningThresholdMs: 60000,
        expiresAt: new Date(Date.now() + 86400000),
      };

      sessionManager.initialize(config, mockHandlers);

      vi.advanceTimersByTime(0);

      expect(mockHandlers.onWarning).toHaveBeenCalled();
    });

    it('should calculate correct time remaining when warning is shown immediately', () => {
      const config: SessionConfig = {
        idleTimeoutMs: 60000,
        absoluteTimeoutMs: 86400000,
        warningThresholdMs: 60000,
        expiresAt: new Date(Date.now() + 86400000),
      };

      sessionManager.initialize(config, mockHandlers);

      vi.advanceTimersByTime(0);

      expect(mockHandlers.onWarning).toHaveBeenCalledTimes(1);
      const timeRemaining = mockHandlers.onWarning.mock.calls[0][0];
      expect(timeRemaining).toBeLessThanOrEqual(60000);
    });
  });

  describe('Timer Precision and Edge Cases', () => {
    it('should handle very long idle timeout', () => {
      const config: SessionConfig = {
        idleTimeoutMs: 24 * 60 * 60 * 1000,
        absoluteTimeoutMs: 7 * 24 * 60 * 60 * 1000,
        warningThresholdMs: 60 * 60 * 1000,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      sessionManager.initialize(config, mockHandlers);

      expect(sessionManager.getTimeUntilTimeout()).toBeLessThanOrEqual(config.idleTimeoutMs);
      expect(sessionManager.getTimeUntilWarning()).toBeLessThanOrEqual(
        config.idleTimeoutMs - config.warningThresholdMs
      );
    });

    it('should handle warning threshold equal to idle timeout', () => {
      const config: SessionConfig = {
        idleTimeoutMs: 60000,
        absoluteTimeoutMs: 86400000,
        warningThresholdMs: 60000,
        expiresAt: new Date(Date.now() + 86400000),
      };

      sessionManager.initialize(config, mockHandlers);

      vi.advanceTimersByTime(0);

      expect(mockHandlers.onWarning).toHaveBeenCalled();
    });

    it('should handle warning threshold greater than idle timeout', () => {
      const config: SessionConfig = {
        idleTimeoutMs: 60000,
        absoluteTimeoutMs: 86400000,
        warningThresholdMs: 120000,
        expiresAt: new Date(Date.now() + 86400000),
      };

      sessionManager.initialize(config, mockHandlers);

      const timeUntilWarning = sessionManager.getTimeUntilWarning();
      expect(timeUntilWarning).toBe(0);

      vi.advanceTimersByTime(0);
      expect(mockHandlers.onWarning).toHaveBeenCalled();
    });
  });

  describe('onActivityUpdate Handler', () => {
    it('should call onActivityUpdate when resetIdleTimer is called', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      sessionManager.resetIdleTimer();

      expect(mockHandlers.onActivityUpdate).toHaveBeenCalled();
    });

    it('should not call onActivityUpdate when not initialized', () => {
      sessionManager.resetIdleTimer();

      expect(mockHandlers.onActivityUpdate).not.toHaveBeenCalled();
    });
  });

  describe('resetWarningState', () => {
    it('should reset warning state and restart timers', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(120000);
      expect(mockHandlers.onWarning).toHaveBeenCalledTimes(1);

      sessionManager.resetWarningState();

      vi.advanceTimersByTime(120000);
      expect(mockHandlers.onWarning).toHaveBeenCalledTimes(2);
    });

    it('should update lastActivityTime', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(5000);

      sessionManager.resetWarningState();

      const timeUntilTimeout = sessionManager.getTimeUntilTimeout();
      expect(timeUntilTimeout).toBeLessThanOrEqual(180000);
    });
  });

  describe('handleUserActivity additional tests', () => {
    it('should not reset idle timer when warning is shown', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(120000);
      expect(mockHandlers.onWarning).toHaveBeenCalledTimes(1);

      const activityHandler = vi
        .spyOn(document, 'addEventListener')
        .mock.calls.find((call) => call[0] === 'mousedown')?.[1] as () => void;

      if (activityHandler) {
        activityHandler();
        vi.advanceTimersByTime(60000);
        expect(mockHandlers.onTimeout).toHaveBeenCalled();
      }
    });

    it('should throttle idle reset calls', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const activityHandler = vi
        .spyOn(document, 'addEventListener')
        .mock.calls.find((call) => call[0] === 'mousedown')?.[1] as () => void;

      if (activityHandler) {
        activityHandler();
        activityHandler();
        activityHandler();
      }
    });
  });

  describe('storage event handling', () => {
    it('should handle storage event for last activity', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const newerActivity = Date.now() + 10000;
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, newerActivity.toString());

      const storageEvent = new StorageEvent('storage', {
        key: STORAGE_KEY_LAST_ACTIVITY,
        newValue: newerActivity.toString(),
      });

      window.dispatchEvent(storageEvent);
    });

    it('should ignore storage event for other keys', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const storageEvent = new StorageEvent('storage', {
        key: 'other-key',
        newValue: 'value',
      });

      window.dispatchEvent(storageEvent);
    });

    it('should handle invalid last activity value', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, 'invalid');

      const storageEvent = new StorageEvent('storage', {
        key: STORAGE_KEY_LAST_ACTIVITY,
        newValue: 'invalid',
      });

      window.dispatchEvent(storageEvent);
    });

    it('should sync lastActivityTime when stored activity is newer', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const timeoutBefore = sessionManager.getTimeUntilTimeout();
      const newerActivity = Date.now() + 10000;
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, newerActivity.toString());

      const storageEvent = new StorageEvent('storage', {
        key: STORAGE_KEY_LAST_ACTIVITY,
        newValue: newerActivity.toString(),
      });

      window.dispatchEvent(storageEvent);

      const timeoutAfter = sessionManager.getTimeUntilTimeout();
      expect(timeoutAfter).toBeGreaterThanOrEqual(timeoutBefore - 5000);
    });

    it('should ignore stored activity when it is not newer', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const timeoutBefore = sessionManager.getTimeUntilTimeout();
      const olderActivity = Date.now() - 5000;
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, olderActivity.toString());

      const storageEvent = new StorageEvent('storage', {
        key: STORAGE_KEY_LAST_ACTIVITY,
        newValue: olderActivity.toString(),
      });

      window.dispatchEvent(storageEvent);

      const timeoutAfter = sessionManager.getTimeUntilTimeout();
      expect(timeoutAfter).toBe(timeoutBefore);
    });
  });

  describe('visibility change handling', () => {
    it('should check for session update when visible', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));
    });

    it('should not check for session update when hidden', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));
    });
  });

  describe('checkForSessionUpdate', () => {
    it('should handle invalid JSON in stored config', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      localStorage.setItem(STORAGE_KEY_SESSION_CONFIG, 'invalid-json');

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));
    });

    it('should update config when expiresAt differs', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const newConfig = {
        ...testConfig,
        expiresAt: new Date(Date.now() + 172800000).toISOString(),
      };
      localStorage.setItem(STORAGE_KEY_SESSION_CONFIG, JSON.stringify(newConfig));

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));
    });
  });

  describe('notifyServerOfActivity', () => {
    it('should handle activity notifier error', async () => {
      const mockNotifier = vi.fn().mockRejectedValue(new Error('Network error'));
      sessionManager.setActivityNotifier(mockNotifier);
      sessionManager.initialize(testConfig, mockHandlers);

      const activityHandler = vi
        .spyOn(document, 'addEventListener')
        .mock.calls.find((call) => call[0] === 'mousedown')?.[1] as () => void;

      if (activityHandler) {
        vi.advanceTimersByTime(6000);
        activityHandler();
        await vi.advanceTimersByTimeAsync(100);
      }
    });

    it('should not call notifier when not set', async () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const activityHandler = vi
        .spyOn(document, 'addEventListener')
        .mock.calls.find((call) => call[0] === 'mousedown')?.[1] as () => void;

      if (activityHandler) {
        vi.advanceTimersByTime(6000);
        activityHandler();
        await vi.advanceTimersByTimeAsync(100);
      }
    });

    it('should skip notifier call when no notifier is set', async () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const activityHandler = vi
        .spyOn(document, 'addEventListener')
        .mock.calls.find((call) => call[0] === 'mousedown')?.[1] as () => void;

      if (activityHandler) {
        vi.advanceTimersByTime(6000);
        activityHandler();
        await vi.advanceTimersByTimeAsync(100);
      }

      const storedEvents = localStorage.getItem('sessionEvents');
      expect(storedEvents).toBeTruthy();
    });
  });

  describe('activity throttle', () => {
    it('should throttle consecutive activity notifications', () => {
      const mockNotifier = vi.fn().mockResolvedValue(undefined);
      sessionManager.setActivityNotifier(mockNotifier);
      sessionManager.initialize(testConfig, mockHandlers);

      const activityHandler = vi
        .spyOn(document, 'addEventListener')
        .mock.calls.find((call) => call[0] === 'mousedown')?.[1] as () => void;

      if (activityHandler) {
        vi.advanceTimersByTime(10000);
        activityHandler();
        expect(mockNotifier).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(10000);
        mockNotifier.mockClear();
        activityHandler();
        expect(mockNotifier).not.toHaveBeenCalled();
      }
    });
  });

  describe('handleTimeout additional tests', () => {
    it('should restart idle timer if time remaining', () => {
      const config: SessionConfig = {
        ...testConfig,
        idleTimeoutMs: 180000,
      };

      sessionManager.initialize(config, mockHandlers);

      vi.advanceTimersByTime(170000);

      sessionManager.resetIdleTimer();

      vi.advanceTimersByTime(10000);
    });
  });

  describe('getSessionAge', () => {
    it('should return age greater than 0 after initialization', () => {
      sessionManager.initialize(testConfig, mockHandlers);
      vi.advanceTimersByTime(1000);
      expect(sessionManager.getSessionAge()).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('handleTimeout when not initialized', () => {
    it('should not throw when timeout fires without initialization', () => {
      expect(() => {
        sessionManager.destroy();
      }).not.toThrow();
    });

    it('should not call onTimeout when timeout fires after destroy', () => {
      sessionManager.initialize(testConfig, mockHandlers);
      sessionManager.destroy();

      vi.advanceTimersByTime(180000);

      expect(mockHandlers.onTimeout).not.toHaveBeenCalled();
    });
  });

  describe('handleTimeout with time remaining', () => {
    it('should restart idle timer if time remains when handler fires', () => {
      const config: SessionConfig = {
        ...testConfig,
        idleTimeoutMs: 60000,
        warningThresholdMs: 30000,
        expiresAt: new Date(Date.now() + 86400000),
      };

      sessionManager.initialize(config, mockHandlers);

      vi.advanceTimersByTime(30000);
      expect(mockHandlers.onWarning).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(30000);
      expect(mockHandlers.onTimeout).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleUserActivity edge cases', () => {
    it('should not throw when activity occurs without initialization', () => {
      const mockNotifier = vi.fn().mockResolvedValue(undefined);
      sessionManager.setActivityNotifier(mockNotifier);

      const event = new MouseEvent('mousedown', { bubbles: true });
      document.dispatchEvent(event);

      expect(mockNotifier).not.toHaveBeenCalled();
    });

    it('should throttle activity timer and skip consecutive notification', () => {
      const mockNotifier = vi.fn().mockResolvedValue(undefined);
      sessionManager.setActivityNotifier(mockNotifier);
      sessionManager.initialize(testConfig, mockHandlers);

      const activityHandler = vi
        .spyOn(document, 'addEventListener')
        .mock.calls.find((call) => call[0] === 'mousedown')?.[1] as () => void;

      if (activityHandler) {
        vi.advanceTimersByTime(10000);
        activityHandler();
        expect(mockNotifier).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(0);
        activityHandler();
        expect(mockNotifier).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('showWarning when not initialized', () => {
    it('should not throw when warning fires after destroy', () => {
      sessionManager.initialize(testConfig, mockHandlers);
      sessionManager.destroy();

      vi.advanceTimersByTime(120000);

      expect(mockHandlers.onWarning).not.toHaveBeenCalled();
    });
  });

  describe('checkForSessionUpdate edge cases', () => {
    it('should handle missing stored config gracefully', () => {
      localStorage.removeItem('sessionConfig');

      sessionManager.initialize(testConfig, mockHandlers);

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockHandlers.onWarning).not.toHaveBeenCalled();
    });

    it('should handle unchanged config on visibility change', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      localStorage.setItem(
        'sessionConfig',
        JSON.stringify({
          ...testConfig,
          expiresAt: testConfig.expiresAt.toISOString(),
        })
      );

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));
    });

    it('should not update timers when stored activity is not newer', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const timeoutBefore = sessionManager.getTimeUntilTimeout();

      const olderActivity = Date.now() - 10000;
      localStorage.setItem('lastActivity', olderActivity.toString());

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));

      const timeoutAfter = sessionManager.getTimeUntilTimeout();
      expect(timeoutAfter).toBe(timeoutBefore);
    });
  });

  describe('handleStorageChange edge cases', () => {
    it('should handle storage event with null stored activity', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      localStorage.removeItem('lastActivity');

      const storageEvent = new StorageEvent('storage', {
        key: 'lastActivity',
        newValue: null,
      });

      window.dispatchEvent(storageEvent);
    });
  });

  describe('stale timer callback safety net', () => {
    it('should skip stale idle timer callback via generation check', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(50000);

      sessionManager.updateConfig({ idleTimeoutMs: 300000 });

      vi.advanceTimersByTime(130000);

      expect(mockHandlers.onWarning).not.toHaveBeenCalled();
    });

    it('should handle timer generation check in warning timer path', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      vi.advanceTimersByTime(50000);

      sessionManager.resetIdleTimer();

      vi.advanceTimersByTime(120000);

      expect(mockHandlers.onWarning).toHaveBeenCalledTimes(1);

      const timeRemaining = mockHandlers.onWarning.mock.calls[0][0];
      expect(timeRemaining).toBeGreaterThan(0);
    });
  });

  describe('broadcastSessionEvent error handling', () => {
    it('should handle localStorage error when broadcasting events', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      sessionManager.destroy();

      setItemSpy.mockRestore();
    });
  });

  describe('storeSessionConfig error handling', () => {
    it('should handle localStorage error when storing config', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      sessionManager.initialize(testConfig, mockHandlers);

      setItemSpy.mockRestore();
    });
  });

  describe('storeLastActivity error handling', () => {
    it('should handle localStorage error when storing last activity', () => {
      sessionManager.initialize(testConfig, mockHandlers);

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      sessionManager.resetIdleTimer();

      setItemSpy.mockRestore();
    });
  });
});
