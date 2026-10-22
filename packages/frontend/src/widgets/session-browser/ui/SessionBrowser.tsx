import { useSessions, SessionCard, useMySessions } from '@/entities/session';
import { JoinSessionButton } from '@/features/join-session';
import { useAuthUser } from '@/features/auth';
import { SessionFilters, useSessionFilters } from '@/features/filter-sessions';
import { useMe } from '@/entities/user';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { Link } from '@tanstack/react-router';
import { useT } from '@/shared/i18n';
import { CalendarX, RefreshCw, Plus, SlidersHorizontal } from 'lucide-react';
import type { SessionOverview } from '@shuttle-connect/types';

function matchesPrice(session: SessionOverview, maxPrice: number): boolean {
  if (maxPrice === 0) return true;
  return Math.min(session.priceMale, session.priceFemale) <= maxPrice;
}

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

// Diacritic-insensitive so "gia tuong" matches "Gia Tương" -- normalize both sides to NFD and
// strip the combining marks, rather than requiring the user to type Vietnamese tone marks.
function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function matchesQuery(session: SessionOverview, query: string): boolean {
  if (query.trim() === '') return true;
  return normalizeForSearch(session.court.name).includes(
    normalizeForSearch(query),
  );
}

export function SessionBrowser() {
  const { city, area, day, timeOfDay, maxPrice, maxLevel, query, clear } =
    useSessionFilters();
  const { data, isLoading, isError, refetch } = useSessions(city, area);
  const { isAuthenticated } = useAuthUser();
  const t = useT();

  const { data: mySessions } = useMySessions(isAuthenticated);
  const hostedSessionIds = new Set(mySessions?.map((s) => s.id));

  const { data: me } = useMe(isAuthenticated);
  const myLevel = me?.skillLevel;

  const courtNames = Array.from(
    new Set(data?.map((session) => session.court.name)),
  );

  const filtered = data?.filter(
    (session) =>
      matchesDay(session, day) &&
      matchesTimeOfDay(session, timeOfDay) &&
      matchesPrice(session, maxPrice) &&
      matchesQuery(session, query) &&
      (maxLevel === null || session.minSkillLevel <= maxLevel),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Sticky lives here, not inside SessionFilters: where the bar sits while scrolling is a page
          layout decision. The wrapper bleeds out over <main>'s padding (-mx/-mt, matching main's
          p-4 / md:p-6) with an opaque background, so cards scrolling up disappear behind a full-
          width strip instead of peeking out around the filter card's rounded corners. Works
          because AppShell clips overflow with `overflow-x-clip`, not `hidden` -- `hidden` would
          make it a scroll container and break `sticky`. */}
      <div className="bg-background sticky top-0 z-20 -mx-4 -mt-4 px-4 pt-4 pb-2 md:-mx-6 md:-mt-6 md:px-6 md:pt-6">
        <SessionFilters
          myLevel={myLevel}
          courtNames={courtNames}
          matchCount={
            isLoading || isError ? undefined : (filtered?.length ?? 0)
          }
        />
      </div>

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
              myLevel={myLevel}
              linkToDetail
              action={
                hostedSessionIds.has(session.id) ? (
                  <Link
                    to="/sessions/$sessionId/manage"
                    params={{ sessionId: session.id }}
                  >
                    <Button variant="outline">{t.manageT}</Button>
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
