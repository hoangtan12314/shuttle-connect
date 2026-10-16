import { useSessions, SessionCard, useMySessions } from '@/entities/session';
import { JoinSessionButton } from '@/features/join-session';
import { useAuthUser } from '@/features/auth';
import { Skeleton } from '@/shared/ui/skeleton';
import { Area, City } from '@shuttle-connect/types';
import { Button } from '@/shared/ui/button';
import { Link } from '@tanstack/react-router';

export function SessionBrowser() {
  const { data, isLoading, isError, error } = useSessions(
    City.HO_CHI_MINH,
    Area.HCM_DISTRICT_10,
  );
  const { isAuthenticated } = useAuthUser();

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
    return <div>{error.message}</div>;
  }

  if (!data || data.length === 0) {
    return <div>No sessions found in this area</div>;
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
