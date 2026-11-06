import { useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { EventContentArg } from '@fullcalendar/core';
import viLocale from '@fullcalendar/core/locales/vi';
import { useLanguageStore, useT } from '@/shared/i18n';
import {
  clusterOverlappingEvents,
  eventsOnDay,
  type MySessionEvent,
} from '../lib/to-calendar-events';
import { SessionEventCard } from './SessionEventCard';
import { OverlapDisclosure } from './OverlapDisclosure';

// Day view only (initialView: 'timeGridDay'), with its own built-in header/day-row hidden --
// DayStrip is the real day picker, so FullCalendar is used purely as the hour-by-hour timeline
// renderer for whichever single day is selected, not as a full scheduling widget.
export function DayTimeGrid({
  selectedDay,
  events,
}: {
  selectedDay: Date;
  events: MySessionEvent[];
}) {
  const t = useT();
  const language = useLanguageStore((state) => state.language);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    calendarRef.current?.getApi().gotoDate(selectedDay);
  }, [selectedDay]);

  const dayEvents = eventsOnDay(events, selectedDay);
  // One FullCalendar event per CLUSTER, positioned at its primary session's own real start/end
  // -- not one event per session. Clusters are built so no two of them overlap in time (see
  // clusterOverlappingEvents), which means FullCalendar never has to lay out two boxes
  // side-by-side at all: there's nothing left for its own overlap-splitting logic to do, so a
  // 4-way overlap can't squeeze into unreadable slivers the way it did before this. Anything
  // beyond the primary shows up through OverlapDisclosure instead, inside the same box.
  const clusters = clusterOverlappingEvents(dayEvents);
  const fcEvents = clusters.map(({ primary, overflow }) => ({
    id: primary.id,
    start: primary.start,
    end: primary.end,
    extendedProps: { primary, overflow },
  }));

  // Open scrolled to roughly the first session's hour (one hour of lead-in) rather than
  // midnight, since the grid now covers the full 24h and most days only have content in a
  // narrow band of it. Falls back to a mid-morning default on an empty day.
  const firstHour = dayEvents[0]?.start.getHours() ?? 8;
  const scrollTime = `${String(Math.max(0, firstHour - 1)).padStart(2, '0')}:00:00`;

  return (
    <div className="relative h-[380px] sm:h-[480px] md:h-[600px]">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin]}
        initialView="timeGridDay"
        initialDate={selectedDay}
        headerToolbar={false}
        dayHeaders={false}
        allDaySlot={false}
        nowIndicator
        // Full 24h, but in a fixed-height, internally-scrolling viewport (not height="auto",
        // which let the page itself grow to show every hour and pushed the overlap-cluster case
        // below into too little room -- see slotDuration/the .fc-timegrid-slot CSS override in
        // index.css for the other half of that fix: each hour now gets enough pixel height for
        // a 3-line card plus the overlap disclosure, which a 1-hour session's slot didn't have
        // room for before).
        // height="100%" (fills the responsive wrapper above) instead of a single hardcoded
        // px number -- a fixed 600px was taller than the actual space available on a phone
        // viewport once the header/tabs/strip above it were accounted for, so the calendar's
        // own box extended past the visible area and rendered underneath the fixed bottom nav
        // bar (caught live via a screenshot showing an event card overlapping "Browse/Activity/
        // Host/Alerts"). The wrapper's height now shrinks on narrow screens instead.
        height="100%"
        expandRows={false}
        slotDuration="01:00:00"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        scrollTime={scrollTime}
        locale={language === 'vi' ? viLocale : undefined}
        events={fcEvents}
        eventContent={(arg: EventContentArg) => {
          const { primary, overflow } = arg.event.extendedProps as {
            primary: MySessionEvent;
            overflow: MySessionEvent[];
          };
          return (
            <div className="flex h-full flex-col gap-1">
              <SessionEventCard event={primary} />
              {overflow.length > 0 && (
                <OverlapDisclosure cluster={[primary, ...overflow]} />
              )}
            </div>
          );
        }}
      />
      {dayEvents.length === 0 && (
        <div className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm">
          {t.emptyDayT}
        </div>
      )}
    </div>
  );
}
