import { useSessions, SessionCard, useMySessions } from '@/entities/session';
import { JoinSessionButton } from '@/features/join-session';
import { useAuthUser } from '@/features/auth';
import { SessionFilters, useSessionFilters } from '@/features/filter-sessions';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { Link } from '@tanstack/react-router';
import { useT } from '@/shared/i18n';
import { CalendarX, RefreshCw, Plus, SlidersHorizontal } from 'lucide-react';
import type { SessionOverview } from '@shuttle-connect/types';

function matchesDay(session: SessionOverview, day: number | null): boolean {
  if (day === null) return true;
  const target = new Date();
  target.setDate(target.getDate() + day);
  const start = new Date(session.startTime);
  return (
    target.getFullYear() === start.getFullYear() &&
    target.getMonth() === start.getMonth() &&
    target.getDate() === start.getDate()
  );
}

function matchesTimeOfDay(
  session: SessionOverview,
  timeOfDay: 'all' | 'am' | 'pm' | 'eve',
): boolean {
  if (timeOfDay === 'all') return true;
  const hour = new Date(session.startTime).getHours();
  if (timeOfDay === 'am') return hour < 11;
  if (timeOfDay === 'pm') return hour >= 11 && hour < 17;
  return hour >= 17;
}

export function SessionBrowser() {
  const { city, area, day, timeOfDay, clear } = useSessionFilters();
  const { data, isLoading, isError, refetch } = useSessions(city, area);
  const { isAuthenticated } = useAuthUser();
  const t = useT();

  const { data: mySessions } = useMySessions(isAuthenticated);
  const hostedSessionIds = new Set(mySessions?.map((s) => s.id));

  const filtered = data?.filter(
    (session) =>
      matchesDay(session, day) && matchesTimeOfDay(session, timeOfDay),
  );

  return (
    <div className="flex flex-col gap-4">
      <SessionFilters />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <RefreshCw className="text-muted-foreground size-8" />
          <div className="space-y-1">
            <p className="font-semibold">{t.browseErrorT}</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              {t.browseErrorB}
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw /> {t.tryAgain}
          </Button>
        </div>
      )}

      {!isLoading && !isError && (!data || data.length === 0) && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <CalendarX className="text-muted-foreground size-8" />
          <div className="space-y-1">
            <p className="font-semibold">{t.browseEmptyT}</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              {t.browseEmptyB}
            </p>
          </div>
          <Link to="/sessions/new">
            <Button>
              <Plus /> {t.hostSession}
            </Button>
          </Link>
        </div>
      )}

      {!isLoading &&
        !isError &&
        data &&
        data.length > 0 &&
        filtered &&
        filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
            <SlidersHorizontal className="text-muted-foreground size-8" />
            <div className="space-y-1">
              <p className="font-semibold">{t.noMatchT}</p>
            </div>
            <Button variant="outline" onClick={clear}>
              {t.clear}
            </Button>
          </div>
        )}

      {!isLoading && !isError && filtered && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              action={
                hostedSessionIds.has(session.id) ? (
                  <Link
                    to="/sessions/$sessionId"
                    params={{ sessionId: session.id }}
                  >
                    <Button variant="outline" className="w-full">
                      Manage
                    </Button>
                  </Link>
                ) : (
                  <JoinSessionButton
                    session={session}
                    isAuthenticated={isAuthenticated}
                  />
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
