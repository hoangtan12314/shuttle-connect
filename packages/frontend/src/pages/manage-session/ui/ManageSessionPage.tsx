import { useSession } from '@/entities/session';
import { useMe } from '@/entities/user';
import { useAuthUser } from '@/features/auth';
import { HostRequestPanel } from '@/widgets/host-requests-panel';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';
import { areaNames, useLanguageStore, useT } from '@/shared/i18n';
import { formatDayHeader, formatTimeRange } from '@/shared/lib';
import { Link, useParams } from '@tanstack/react-router';
import { RefreshCw } from 'lucide-react';
import { SessionStatus } from '@shuttle-connect/types';

// Standalone, not inlined in the component body -- Date.now() called directly during render trips
// the React Compiler's purity rule (same pattern as entities/request's RequestCard).
function hasStarted(startTime: string): boolean {
  return new Date(startTime).getTime() <= Date.now();
}

// pages/manage-session: host-only. Same host-authorization shape as pages/session-detail (fetch
// session + me, compare ids) -- this page doesn't trust SessionDetailPage's own check, since it's
// reachable directly by URL, not only via that page's "Manage requests" link. The cover photo no
// longer lives here: it's a property of the session, so it moved to the edit page.
export function ManageSessionPage() {
  const { sessionId } = useParams({ from: '/sessions/$sessionId_/manage' });
  const t = useT();
  const language = useLanguageStore((state) => state.language);

  const {
    data: session,
    isLoading: isSessionLoading,
    isError: isSessionError,
    refetch,
  } = useSession(sessionId);

  const { isAuthenticated } = useAuthUser();
  const { data: me, isLoading: isMeLoading } = useMe(isAuthenticated);

  if (isSessionLoading || isMeLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (isSessionError || !session) {
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

  const isHost = me?.id === session.host.id;

  if (!isHost) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <p className="font-semibold">{t.notHostT}</p>
        <Button asChild variant="outline">
          <Link to="/sessions/$sessionId" params={{ sessionId: session.id }}>
            {t.backList}
          </Link>
        </Button>
      </div>
    );
  }

  // The server refuses edits once the session has started or been cancelled, so don't offer one.
  const canEdit =
    session.status !== SessionStatus.CANCELLED &&
    !hasStarted(session.startTime);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PageHeader
        title={t.manageT}
        action={
          canEdit && (
            <Button asChild variant="ghost">
              <Link
                to="/sessions/$sessionId/edit"
                params={{ sessionId: session.id }}
              >
                {t.editSession}
              </Link>
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-1">
        <span className="text-primary-700 text-xs font-extrabold tracking-wider uppercase">
          {formatDayHeader(new Date(session.startTime), language)}
        </span>
        <span className="text-3xl font-extrabold tracking-tight">
          {formatTimeRange(session.startTime, session.endTime, language)}
        </span>
        <span className="text-sm">
          <b className="font-extrabold">
            {areaNames[session.court.district][language]}
          </b>{' '}
          · {session.court.name}
        </span>
      </div>

      <HostRequestPanel session={session} />
    </div>
  );
}
