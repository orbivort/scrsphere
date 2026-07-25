import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { initTestI18n } from '../test-utils';

import { getNotificationTitle, getNotificationMessage } from './notificationTranslation';
import type { Notification } from '../types/notification.types';

beforeAll(async () => {
  await initTestI18n();
});

describe('notificationTranslation', () => {
  const mockT = vi.fn((key: string, params?: Record<string, unknown>) => {
    // Simulate i18next behavior
    if (key === 'sprintStarted') {
      return `Sprint ${params?.sprintName ?? 'Unknown'} started`;
    }
    if (key === 'sprintStartedMessage') {
      return `Sprint ${params?.sprintName ?? 'Unknown'} has started successfully`;
    }
    if (key === 'taskCompleted') {
      return `Task ${params?.taskTitle ?? 'Unknown'} completed`;
    }
    // Return key itself when translation doesn't exist (i18next fallback)
    return key;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotificationTitle', () => {
    it('should return translated title when messageKey and params are present', () => {
      const notification = {
        id: '1',
        title: 'Stored Title',
        message: 'Stored Message',
        messageKey: 'sprintStarted',
        params: { sprintName: 'Sprint 1' },
      } as Notification;

      const result = getNotificationTitle(notification, mockT);

      expect(mockT).toHaveBeenCalledWith('sprintStarted', { sprintName: 'Sprint 1' });
      expect(result).toBe('Sprint Sprint 1 started');
    });

    it('should return stored title when messageKey is missing', () => {
      const notification = {
        id: '1',
        title: 'Stored Title',
        message: 'Stored Message',
      } as Notification;

      const result = getNotificationTitle(notification, mockT);

      expect(mockT).not.toHaveBeenCalled();
      expect(result).toBe('Stored Title');
    });

    it('should return stored title when params is missing', () => {
      const notification = {
        id: '1',
        title: 'Stored Title',
        message: 'Stored Message',
        messageKey: 'sprintStarted',
      } as Notification;

      const result = getNotificationTitle(notification, mockT);

      expect(mockT).not.toHaveBeenCalled();
      expect(result).toBe('Stored Title');
    });

    it('should return stored title when both messageKey and params are undefined', () => {
      const notification = {
        id: '1',
        title: 'Stored Title',
        message: 'Stored Message',
        messageKey: undefined,
        params: undefined,
      } as Notification;

      const result = getNotificationTitle(notification, mockT);

      expect(mockT).not.toHaveBeenCalled();
      expect(result).toBe('Stored Title');
    });
  });

  describe('getNotificationMessage', () => {
    it('should return translated message when messageKey exists and message key is found', () => {
      const notification = {
        id: '1',
        title: 'Stored Title',
        message: 'Stored Message',
        messageKey: 'sprintStarted',
        params: { sprintName: 'Sprint 1' },
      } as Notification;

      const result = getNotificationMessage(notification, mockT);

      expect(mockT).toHaveBeenCalledWith('sprintStartedMessage', { sprintName: 'Sprint 1' });
      expect(result).toBe('Sprint Sprint 1 has started successfully');
    });

    it('should return stored message when messageKey is missing', () => {
      const notification = {
        id: '1',
        title: 'Stored Title',
        message: 'Stored Message',
      } as Notification;

      const result = getNotificationMessage(notification, mockT);

      expect(mockT).not.toHaveBeenCalled();
      expect(result).toBe('Stored Message');
    });

    it('should return stored message when params is missing', () => {
      const notification = {
        id: '1',
        title: 'Stored Title',
        message: 'Stored Message',
        messageKey: 'sprintStarted',
      } as Notification;

      const result = getNotificationMessage(notification, mockT);

      expect(mockT).not.toHaveBeenCalled();
      expect(result).toBe('Stored Message');
    });

    it('should return stored message when message key translation does not exist', () => {
      const notification = {
        id: '1',
        title: 'Stored Title',
        message: 'Stored Message',
        messageKey: 'nonExistentKey',
        params: { someParam: 'value' },
      } as Notification;

      const result = getNotificationMessage(notification, mockT);

      // When translation doesn't exist, t() returns the key itself
      expect(mockT).toHaveBeenCalledWith('nonExistentKeyMessage', { someParam: 'value' });
      expect(result).toBe('Stored Message');
    });

    it('should return stored message when both messageKey and params are undefined', () => {
      const notification = {
        id: '1',
        title: 'Stored Title',
        message: 'Stored Message',
        messageKey: undefined,
        params: undefined,
      } as Notification;

      const result = getNotificationMessage(notification, mockT);

      expect(mockT).not.toHaveBeenCalled();
      expect(result).toBe('Stored Message');
    });

    it('should return undefined when stored message is undefined', () => {
      const notification = {
        id: '1',
        title: 'Stored Title',
        message: undefined,
      } as Notification;

      const result = getNotificationMessage(notification, mockT);

      expect(result).toBeUndefined();
    });

    it('should handle empty params object', () => {
      const notification = {
        id: '1',
        title: 'Stored Title',
        message: 'Stored Message',
        messageKey: 'sprintStarted',
        params: {},
      } as Notification;

      const result = getNotificationMessage(notification, mockT);

      expect(mockT).toHaveBeenCalledWith('sprintStartedMessage', {});
      expect(result).toBe('Sprint Unknown has started successfully');
    });
  });
});
