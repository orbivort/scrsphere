import type { Notification as NotificationType } from '../types/notification.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TFunction signature varies by i18next version
type AnyTFunction = any;

/**
 * Get localized notification title
 * Uses messageKey + params for display-time translation if available,
 * otherwise falls back to the stored title
 */
export function getNotificationTitle(notification: NotificationType, t: AnyTFunction): string {
  if (notification.messageKey && notification.params) {
    // Use canonical data for display-time translation
    // Note: t() is already using 'notifications' namespace, so no prefix needed
    return t(notification.messageKey, notification.params);
  }
  // Fall back to stored title (for backward compatibility and email/push)
  return notification.title;
}

/**
 * Get localized notification message
 * Uses messageKey + params for display-time translation if available,
 * otherwise falls back to the stored message
 */
export function getNotificationMessage(
  notification: NotificationType,
  t: AnyTFunction
): string | undefined {
  if (notification.messageKey && notification.params) {
    // Try to get the message key (titleKey + 'Message')
    const messageKey = `${notification.messageKey}Message`;
    const message = t(messageKey, notification.params);
    // If the message key doesn't exist, i18next returns the key itself
    // We check if it's a valid translation by checking if it's different from the key
    if (message !== messageKey) {
      return message;
    }
  }
  // Fall back to stored message (for backward compatibility and email/push)
  return notification.message;
}
