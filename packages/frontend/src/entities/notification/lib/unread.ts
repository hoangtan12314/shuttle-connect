import type { NotificationItemResponse } from '@shuttle-connect/types';

// null lastReadAt = the user has never read any notifications -- everything is unread.
export function unreadCount(
  items: NotificationItemResponse[],
  lastReadAt: string | null,
): number {
  if (!lastReadAt) return items.length;
  const readAtMs = new Date(lastReadAt).getTime();
  return items.filter((item) => new Date(item.createdAt).getTime() > readAtMs)
    .length;
}
