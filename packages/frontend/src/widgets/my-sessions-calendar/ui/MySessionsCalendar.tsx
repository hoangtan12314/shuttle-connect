import { useState } from 'react';
import { Users, Crown } from 'lucide-react';
import { useMySessions } from '@/entities/session';
import { useMyRequests } from '@/entities/request';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { Skeleton } from '@/shared/ui/skeleton';
import { Link } from '@tanstack/react-router';
import { Button } from '@/shared/ui/button';
import { useT } from '@/shared/i18n';
import {
  hostedToEvents,
  joinedToEvents,
  type MySessionEvent,
} from '../lib/to-calendar-events';
import { DayStrip } from './DayStrip';
import { DayTimeGrid } from './DayTimeGrid';
import { SessionList } from './SessionList';
import { UpcomingSessionsCard } from './UpcomingSessionsCard';
import { SessionStatsCard } from './SessionStatsCard';
import { TipCard } from './TipCard';

type Tab = 'joined' | 'hosted';
type View = 'schedule' | 'list';

export function MySessionsCalendar() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('joined');
  const [view, setView] = useState<View>('schedule');
  const [selectedDay, setSelectedDay] = useState(new Date());

  const { data: hostedSessions, isLoading: isHostedLoading } = useMySessions();
  const { data: joinedRequests, isLoading: isJoinedLoading } = useMyRequests();

  const hostedEvents = hostedToEvents(hostedSessions ?? []);
  const joinedEvents = joinedToEvents(joinedRequests ?? []);
  const activeEvents = tab === 'hosted' ? hostedEvents : joinedEvents;

  // Jump to the nearest upcoming session's day instead of leaving the strip on today, which is
  // very often empty -- "today" isn't a useful default when the whole point of this page is
  // showing what's coming up. Scoped per tab (jumpedTabs), and only the first time each tab's
  // data has loaded: once the user has picked a different day on their own, re-selecting the
  // same tab shouldn't snap them back to the nearest session again.
  // setState called directly in the render body, guarded by a condition that only holds once --
  // not inside a useEffect (react-hooks/set-state-in-effect disallows that here) and not a ref
  // read during render (react-hooks/refs disallows that too) -- this is React's own documented
  // "store info from a previous render" pattern, the same shape NotificationsPage's frozen-
  // lastReadAt already uses in this codebase.
  const [jumpedTabs, setJumpedTabs] = useState<Set<Tab>>(new Set());
  if (!isHostedLoading && !isJoinedLoading && !jumpedTabs.has(tab)) {
    setJumpedTabs(new Set(jumpedTabs).add(tab));
    const nearest = [...activeEvents].sort(
      (a: MySessionEvent, b: MySessionEvent) =>
        a.start.getTime() - b.start.getTime(),
    )[0];
    if (nearest) {
      setSelectedDay(nearest.start);
    }
  }

  if (isHostedLoading || isJoinedLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const isEmpty = activeEvents.length === 0;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList>
              <TabsTrigger value="joined" className="gap-1.5">
                <Users className="size-4" />
                {t.tagJoined} ({joinedEvents.length})
              </TabsTrigger>
              <TabsTrigger value="hosted" className="gap-1.5">
                <Crown className="size-4" />
                {t.tagHosted} ({hostedEvents.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <ToggleGroup
            type="single"
            variant="outline"
            value={view}
            onValueChange={(v) => v && setView(v as View)}
          >
            <ToggleGroupItem value="schedule">{t.viewSchedule}</ToggleGroupItem>
            <ToggleGroupItem value="list">{t.viewList}</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
            <p className="text-muted-foreground">
              {tab === 'joined' ? t.emptyJoinedT : t.emptyHostedT}
            </p>
            <Button asChild variant="outline">
              <Link to={tab === 'joined' ? '/' : '/sessions/new'}>
                {tab === 'joined' ? t.findAnother : t.createSession}
              </Link>
            </Button>
          </div>
        ) : view === 'schedule' ? (
          <div className="flex flex-col gap-4">
            <DayStrip
              selectedDay={selectedDay}
              onSelectedDayChange={setSelectedDay}
              events={activeEvents}
            />
            <DayTimeGrid selectedDay={selectedDay} events={activeEvents} />
          </div>
        ) : (
          <SessionList events={activeEvents} />
        )}
      </div>

      <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
        <UpcomingSessionsCard events={activeEvents} />
        <SessionStatsCard
          joinedCount={joinedEvents.length}
          hostedCount={hostedEvents.length}
        />
        <TipCard />
      </div>
    </div>
  );
}
