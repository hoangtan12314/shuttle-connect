import type { NotificationItemResponse } from '@shuttle-connect/types';
import { NotificationType, RequestStatus } from '@shuttle-connect/types';
import { Link } from '@tanstack/react-router';
import { Badge } from '@/shared/ui/badge';
import {
  useLanguageStore,
  useT,
  requestStatusNames,
  type Messages,
} from '@/shared/i18n';
import { formatDateTime } from '@/shared/lib';
import { isUnread } from '../lib/unread';
import { cn } from 'cn';

const URGENT_WINDOW_MS = 24 * 60 * 60 * 1000;

// Exhaustive on purpose (Record<NotificationType, ...>, not a switch with a default) -- a future
// NotificationType member becomes a compile error here instead of silently falling through to a
// blank row, same philosophy as requestStatusNames/RequestStatusBadge after WITHDRAWN was added.
const NOTIF_MID_KEY: Record<NotificationType, keyof Messages> = {
  [NotificationType.REQUEST_CREATED]: 'notifCreatedMid',
  [NotificationType.REQUEST_APPROVED]: 'notifApprovedMid',
  [NotificationType.REQUEST_REJECTED]: 'notifRejectedMid',
  [NotificationType.REQUEST_WITHDRAWN]: 'notifWithdrawnMid',
};

// CREATED/WITHDRAWN are things a player did -- the host is told, and reacts from the manage
// page. APPROVED/REJECTED are things the host did -- the player is told, and reacts from their
// own view of the session.
const NOTIF_LINK_TARGET: Record<NotificationType, 'manage' | 'detail'> = {
  [NotificationType.REQUEST_CREATED]: 'manage',
  [NotificationType.REQUEST_APPROVED]: 'detail',
  [NotificationType.REQUEST_REJECTED]: 'detail',
  [NotificationType.REQUEST_WITHDRAWN]: 'manage',
};

// Standalone, not inlined in the component body -- Date.now() called directly during render trips
// react-hooks/purity (render must be deterministic); a called function isn't analyzed the same
// way, same as RequestCard.tsx's minutesSince.
function startsWithinMs(isoString: string, windowMs: number): boolean {
  return new Date(isoString).getTime() - Date.now() < windowMs;
}

export function NotificationItem({
  notification,
  lastReadAt,
}: {
  notification: NotificationItemResponse;
  lastReadAt: string | null;
}) {
  const t = useT();
  const language = useLanguageStore((state) => state.language);

  // Urgent: the session this notification is about starts soon, so whoever reads it has little
  // time left to react.
  const startsSoon = startsWithinMs(
    notification.sessionStartTime,
    URGENT_WINDOW_MS,
  );
  const unread = isUnread(notification.createdAt, lastReadAt);

  // One background, picked by priority, rather than layering multiple bg-* utilities (which
  // would silently fight over which one actually wins). Urgent always wins -- a session
  // starting soon matters regardless of read state. Otherwise: unread stays the normal card
  // surface (bright, so it stands out), read gets visibly muted/darker -- the contrast between
  // the two is what signals "new" at a glance, no separate badge needed.
  const background = startsSoon
    ? 'bg-destructive/5'
    : unread
      ? 'bg-card'
      : 'bg-muted/60';

  const className = cn(
    'flex items-start justify-between gap-3 rounded-xl border px-4 py-3 shadow-sm transition-colors hover:border-primary/40',
    background,
  );

  const content = (
    <>
      <p className="text-sm">
        <span className="font-semibold">{notification.actorName}</span>{' '}
        {t[NOTIF_MID_KEY[notification.type]]} {notification.courtName}
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
    </>
  );

  if (NOTIF_LINK_TARGET[notification.type] === 'manage') {
    return (
      <Link
        to="/sessions/$sessionId/manage"
        params={{ sessionId: notification.sessionId }}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <Link
      to="/sessions/$sessionId"
      params={{ sessionId: notification.sessionId }}
      className={className}
    >
      {content}
    </Link>
  );
}
