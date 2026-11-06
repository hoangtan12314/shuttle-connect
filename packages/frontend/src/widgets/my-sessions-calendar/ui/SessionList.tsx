import { useLanguageStore } from '@/shared/i18n';
import { formatDayHeader } from '@/shared/lib';
import { isSameDay, type MySessionEvent } from '../lib/to-calendar-events';
import { SessionEventCard } from './SessionEventCard';

// The mock's "List" toggle, grouped by day -- reuses SessionEventCard so a session looks
// identical whether you found it here or in the day grid. No FullCalendar list plugin: its
// built-in markup doesn't give enough control to match the app's card styling.
export function SessionList({ events }: { events: MySessionEvent[] }) {
  const language = useLanguageStore((state) => state.language);
  const sorted = [...events].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );

  const groups: { day: Date; events: MySessionEvent[] }[] = [];
  for (const event of sorted) {
    const lastGroup = groups.at(-1);
    if (lastGroup && isSameDay(lastGroup.day, event.start)) {
      lastGroup.events.push(event);
    } else {
      groups.push({ day: event.start, events: [event] });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.day.toISOString()} className="flex flex-col gap-2">
          <p className="text-muted-foreground text-sm font-medium">
            {formatDayHeader(group.day, language)}
          </p>
          <div className="flex flex-col gap-2">
            {group.events.map((event) => (
              <SessionEventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
