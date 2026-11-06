import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useT } from '@/shared/i18n';
import type { MySessionEvent } from '../lib/to-calendar-events';
import { SessionEventCard } from './SessionEventCard';

export function UpcomingSessionsCard({ events }: { events: MySessionEvent[] }) {
  const t = useT();
  const upcoming = [...events]
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="size-4" />
          {t.upcomingT}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {upcoming.map((event) => (
          <SessionEventCard key={event.id} event={event} />
        ))}
      </CardContent>
    </Card>
  );
}
