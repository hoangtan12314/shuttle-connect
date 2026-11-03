import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuthUser } from '@/features/auth';
import {
  NotificationItem,
  unreadCount,
  useNotifications,
} from '@/entities/notification';
import { useMarkNotificationsRead } from '@/features/mark-notifications-read';
import { Skeleton } from '@/shared/ui/skeleton';
import { useT } from '@/shared/i18n';

// pages/notifications: entities/notification (list) + features/mark-notifications-read.
// Marks everything read as soon as the list has loaded and anything is unread -- no explicit
// "Mark all read" button, matching the design's always-cleared-on-open badge behavior.
export function NotificationsPage() {
  const t = useT();
  const { isAuthenticated } = useAuthUser();
  const { data, isLoading } = useNotifications(isAuthenticated);
  const { mutate: markRead } = useMarkNotificationsRead();

  // markRead's onSuccess writes a new lastReadAt into the cache almost immediately, which would
  // make every "new" item's highlight disappear within a fraction of a second of the page
  // opening if items were styled against the live value. Capturing it once, the first time data
  // loads, and never updating it again, keeps the highlighting stable for the whole visit, while
  // the server-side watermark still advances normally (so the bell badge is correctly clear next
  // time). setState called directly in the render body -- not in an effect, and not a ref read
  // during render -- is React's own documented pattern for "store a value from a previous
  // render": https://react.dev/reference/react/useState#storing-information-from-previous-renders.
  const [frozen, setFrozen] = useState<{ value: string | null } | null>(null);
  if (data && frozen === null) {
    setFrozen({ value: data.lastReadAt });
  }
  const frozenLastReadAt = frozen?.value ?? null;

  const isReady = data !== undefined && frozen !== null;
  const unread = isReady ? unreadCount(data.items, frozenLastReadAt) : 0;

  useEffect(() => {
    if (isReady && unread > 0) markRead();
  }, [isReady, unread, markRead]);

  if (isLoading || !isReady) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <Bell className="text-muted-foreground size-8" />
        <div className="space-y-1">
          <p className="font-semibold">{t.notifEmptyT}</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            {t.notifEmptyB}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">{t.notifsT}</h1>
      <div className="flex flex-col gap-2">
        {data.items.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            lastReadAt={frozenLastReadAt}
          />
        ))}
      </div>
    </div>
  );
}
