import { useEffect, useRef } from 'react';
import { cn } from 'cn';
import { useLanguageStore } from '@/shared/i18n';
import {
  dayPillClassName,
  formatCompactDate,
  formatWeekdayShort,
} from '@/shared/lib';
import { upcomingDays } from '../lib/days';
import { isSameDay, type MySessionEvent } from '../lib/to-calendar-events';

// One continuous scrollable list from today onward, not a week-at-a-time pager with prev/next
// arrows -- the paged version let the selected day scroll out of its visible 7-pill window with
// no indication of where it went, so a user landing on e.g. a Thursday a few weeks out had no
// way to tell which day they were looking at without manually paging back to find it. Scrolling
// the selected pill into view (below) replaces that entirely: the correct day is always visible
// the moment selectedDay changes, including on first load when MySessionsCalendar jumps to the
// nearest upcoming session.
export function DayStrip({
  selectedDay,
  onSelectedDayChange,
  events,
}: {
  selectedDay: Date;
  onSelectedDayChange: (date: Date) => void;
  events: MySessionEvent[];
}) {
  const language = useLanguageStore((state) => state.language);
  const days = upcomingDays();
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Imperative DOM scroll, not a state update -- belongs in an effect (synchronizing with the
  // scroll container, an "external system" in React's own terms) rather than during render.
  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [selectedDay]);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {days.map((day) => {
        const compactDate = formatCompactDate(day, language);
        const selected = isSameDay(day, selectedDay);
        const hasEvents = events.some((e) => isSameDay(e.start, day));
        return (
          <div
            key={day.toISOString()}
            className="flex flex-col items-center gap-1"
          >
            <button
              ref={selected ? selectedRef : undefined}
              type="button"
              onClick={() => onSelectedDayChange(day)}
              className={cn(
                dayPillClassName,
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
              )}
            >
              <span>{formatWeekdayShort(day, language)}</span>
              <span>{compactDate}</span>
            </button>
            <span
              aria-hidden
              className={cn(
                'size-1 rounded-full',
                hasEvents && !selected ? 'bg-primary' : 'bg-transparent',
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
