import { Link } from '@tanstack/react-router';
import { RequestStatus } from '@shuttle-connect/types';
import { MapPin, Users } from 'lucide-react';
import { RequestStatusBadge } from '@/entities/request';
import { Badge } from '@/shared/ui/badge';
import { useLanguageStore, useT, areaNames } from '@/shared/i18n';
import { formatTimeRange } from '@/shared/lib';
import type { MySessionEvent } from '../lib/to-calendar-events';

// Three stacked lines (badge+time, court name, location), per the reference mock
// (sample-ui-images/"ShuttleConnect Overlapping Sessions Dashboard.png") -- no photo thumbnail.
// Replaces the first version's single horizontal row (photo + text + badge), which had nothing
// left to give up once FullCalendar shrank an overlapping event's box width: the photo and the
// right-aligned slot/status indicator still claimed fixed space regardless, squeezing the
// middle text to nothing. Stacked lines only ever need to fit ONE thing's width at a time, so
// each line degrades independently (truncating its own text) instead of the whole row collapsing.
export function SessionEventCard({ event }: { event: MySessionEvent }) {
  const t = useT();
  const language = useLanguageStore((state) => state.language);
  const isHosted = event.kind === 'hosted';

  return (
    <Link
      to="/sessions/$sessionId"
      params={{ sessionId: event.sessionId }}
      className="border-border hover:border-primary/40 bg-card flex min-w-0 flex-col gap-1 overflow-hidden rounded-lg border px-3 py-2 transition-colors"
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Badge
            variant={isHosted ? 'primary' : 'neutral'}
            className="shrink-0"
          >
            {isHosted ? t.tagHosted : t.tagJoined}
          </Badge>
          <span className="text-muted-foreground truncate text-xs">
            {formatTimeRange(
              event.start.toISOString(),
              event.end.toISOString(),
              language,
            )}
          </span>
        </div>
        {isHosted ? (
          <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
            <Users className="size-3.5" />
            {event.slotsTotal! - event.slotsRemaining!}/{event.slotsTotal}
          </span>
        ) : (
          <span className="shrink-0">
            <RequestStatusBadge
              status={event.requestStatus ?? RequestStatus.PENDING}
            />
          </span>
        )}
      </div>
      <p className="text-foreground truncate text-sm font-semibold">
        {event.courtName}
      </p>
      <p className="text-muted-foreground flex min-w-0 items-center gap-1 text-xs">
        <MapPin className="size-3 shrink-0" />
        <span className="truncate">{areaNames[event.district][language]}</span>
      </p>
    </Link>
  );
}
