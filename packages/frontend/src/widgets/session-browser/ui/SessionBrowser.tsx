import { useSessions, SessionCard, useMySessions } from '@/entities/session';
import { JoinSessionButton } from '@/features/join-session';
import { useAuthUser } from '@/features/auth';
import { Skeleton } from '@/shared/ui/skeleton';
import { Area, City } from '@shuttle-connect/types';
import { Button } from '@/shared/ui/button';
import { Link } from '@tanstack/react-router';
import { useT } from '@/shared/i18n';
import { CalendarX, RefreshCw, Plus } from 'lucide-react';

export function SessionBrowser() {
  const { data, isLoading, isError, refetch } = useSessions(
    City.HO_CHI_MINH,
    Area.HCM_DISTRICT_10,
  );
  const { isAuthenticated } = useAuthUser();
  const t = useT();

  const { data: mySessions } = useMySessions(isAuthenticated);
  const hostedSessionIds = new Set(mySessions?.map((s) => s.id));

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (isError) {
    return (
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
    );
  }

  if (!data || data.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((session) => (
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
  );
}
