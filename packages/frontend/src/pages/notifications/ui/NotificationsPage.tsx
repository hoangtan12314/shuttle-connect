import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuthUser } from '@/features/auth';
import {
  NotificationItem,
  unreadCount,
  useNotifications,
} from '@/entities/notification';
import { useMarkNotificationsRead } from '@/features/mark-notifications-read';
import { Skeleton } from '@/shared/ui/skeleton';
import { Card } from '@/shared/ui/card';
import { useT } from '@/shared/i18n';

// pages/notifications: entities/notification (list) + features/mark-notifications-read.
// Marks everything read as soon as the list has loaded and anything is unread -- no explicit
// "Mark all read" button, matching the design's always-cleared-on-open badge behavior.
export function NotificationsPage() {
  const t = useT();
  const { isAuthenticated } = useAuthUser();
  const { data, isLoading } = useNotifications(isAuthenticated);
  const { mutate: markRead } = useMarkNotificationsRead();

  const unread = data ? unreadCount(data.items, data.lastReadAt) : 0;

  useEffect(() => {
    if (unread > 0) markRead();
  }, [unread, markRead]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
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
      <Card className="gap-0 overflow-hidden py-0">
        {data.items.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </Card>
    </div>
  );
}
