import type {
  RequestItemResponse,
  SessionOverview,
} from '@shuttle-connect/types';
import { RequestStatus } from '@shuttle-connect/types';

// One shape for both a hosted SessionOverview and a joined RequestItemResponse, so the UI
// (DayStrip's "does this day have anything" dot, SessionEventCard, SessionList) never has to
// branch on which entity it came from -- only on `kind`, for the one or two fields that
// genuinely differ (slots vs. request status).
export type MySessionEvent = {
  id: string;
  sessionId: string;
  courtName: string;
  district: SessionOverview['court']['district'];
  start: Date;
  end: Date;
  kind: 'hosted' | 'joined';
  // hosted only
  slotsRemaining?: number;
  slotsTotal?: number;
  // joined only -- PENDING or APPROVED, since a WITHDRAWN/REJECTED request was already filtered
  // out by the caller (see hostedToEvents/joinedToEvents below).
  requestStatus?: RequestStatus;
};

export function hostedToEvents(sessions: SessionOverview[]): MySessionEvent[] {
  return sessions.map((session) => ({
    id: `hosted-${session.id}`,
    sessionId: session.id,
    courtName: session.court.name,
    district: session.court.district,
    start: new Date(session.startTime),
    end: new Date(session.endTime),
    kind: 'hosted',
    slotsRemaining: session.slotsRemaining,
    slotsTotal: session.slotsTotal,
  }));
}

// Only PENDING/APPROVED count as "a session you're in" -- a WITHDRAWN or REJECTED request isn't
// one, same filter JoinSessionButton/JoinerSessionView already apply to existingRequest.
export function joinedToEvents(
  requests: RequestItemResponse[],
): MySessionEvent[] {
  return requests
    .filter(
      (r) =>
        r.status === RequestStatus.PENDING ||
        r.status === RequestStatus.APPROVED,
    )
    .map((r) => ({
      id: `joined-${r.session.id}`,
      sessionId: r.session.id,
      courtName: r.court.name,
      district: r.court.district,
      start: new Date(r.session.startTime),
      end: new Date(r.session.endTime),
      kind: 'joined' as const,
      requestStatus: r.status,
    }));
}

// Same calendar day, in the viewer's local timezone -- not a UTC/epoch comparison, since a
// session's startTime is a UTC instant that can land on a different local date.
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function eventsOnDay(
  events: MySessionEvent[],
  day: Date,
): MySessionEvent[] {
  return events
    .filter((e) => isSameDay(e.start, day))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export type SessionCluster = {
  // Whichever event in the cluster starts first -- the one actually rendered in the grid; the
  // rest only ever appear via the "N sessions at this time" disclosure (see DayTimeGrid). Ties
  // (same start) fall back to the shorter session, so the one that frees up the slot sooner is
  // what's shown.
  primary: MySessionEvent;
  overflow: MySessionEvent[];
};

// Classic "merge overlapping intervals": sort by start, then fold any event whose start is
// before the running cluster's latest end into that same cluster. Two events in different
// clusters are guaranteed NOT to overlap -- this is what lets DayTimeGrid hand FullCalendar one
// non-overlapping box per cluster instead of relying on its own lane-splitting (which has no
// floor on how narrow a lane gets once there are 3+ events at once -- see the mock's "Overlapping
// Sessions" card for the alternative this replaces: one visible card + a count, not N squeezed
// side by side).
export function clusterOverlappingEvents(
  events: MySessionEvent[],
): SessionCluster[] {
  const sorted = [...events].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const clusters: MySessionEvent[][] = [];

  for (const event of sorted) {
    const current = clusters.at(-1);
    const currentLatestEnd = current
      ? Math.max(...current.map((e) => e.end.getTime()))
      : -Infinity;
    if (current && event.start.getTime() < currentLatestEnd) {
      current.push(event);
    } else {
      clusters.push([event]);
    }
  }

  return clusters.map((cluster) => {
    const [primary, ...overflow] = [...cluster].sort(
      (a, b) =>
        a.start.getTime() - b.start.getTime() ||
        a.end.getTime() - b.end.getTime(),
    );
    return { primary, overflow };
  });
}
