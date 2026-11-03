import type { NotificationItemResponse } from '@shuttle-connect/types';

// null lastReadAt = the user has never read any notifications -- everything is unread.
export function isUnread(
  createdAt: string,
  lastReadAt: string | null,
): boolean {
  if (!lastReadAt) return true;
  return new Date(createdAt).getTime() > new Date(lastReadAt).getTime();
}

export function unreadCount(
  items: NotificationItemResponse[],
  lastReadAt: string | null,
): number {
  return items.filter((item) => isUnread(item.createdAt, lastReadAt)).length;
}
