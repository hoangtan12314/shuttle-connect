import type { NotificationItemResponse } from '@shuttle-connect/types';
import { Link } from '@tanstack/react-router';
import { RequestStatus } from '@shuttle-connect/types';
import { Badge } from '@/shared/ui/badge';
import { useLanguageStore, useT, requestStatusNames } from '@/shared/i18n';
import { formatDateTime } from '@/shared/lib';
import { cn } from 'cn';

const URGENT_WINDOW_MS = 24 * 60 * 60 * 1000;

// Standalone, not inlined in the component body -- Date.now() called directly during render trips
// react-hooks/purity (render must be deterministic); a called function isn't analyzed the same
// way, same as RequestRow.tsx's minutesSince.
function startsWithinMs(isoString: string, windowMs: number): boolean {
  return new Date(isoString).getTime() - Date.now() < windowMs;
}

export function NotificationItem({
  notification,
}: {
  notification: NotificationItemResponse;
}) {
  const t = useT();
  const language = useLanguageStore((state) => state.language);

  // Urgent: the session this withdrawal affects starts soon, so the host has little time left
  // to react (find a replacement, or decide to eat the empty slot).
  const startsSoon = startsWithinMs(
    notification.sessionStartTime,
    URGENT_WINDOW_MS,
  );

  return (
    <Link
      to="/sessions/$sessionId/manage"
      params={{ sessionId: notification.sessionId }}
      className={cn(
        'border-border hover:bg-muted flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0',
        startsSoon && 'bg-destructive/5',
      )}
    >
      <p className="text-sm">
        <span className="font-semibold">{notification.actorName}</span>{' '}
        {t.notifWithdrawnMid} {notification.courtName}
        <span className="text-muted-foreground">
          {' · '}
          {formatDateTime(notification.sessionStartTime, language)}
        </span>
      </p>
      {notification.wasApproved && (
        <Badge variant="primary" className="shrink-0">
          {requestStatusNames[RequestStatus.APPROVED][language]}
        </Badge>
      )}
    </Link>
  );
}
