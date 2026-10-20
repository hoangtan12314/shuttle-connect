import { useSession } from '@/entities/session';
import { useMe } from '@/entities/user';
import { useAuthUser } from '@/features/auth';
import { HostRequestPanel } from '@/widgets/host-requests-panel';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { useT } from '@/shared/i18n';
import { Link, useParams } from '@tanstack/react-router';
import { RefreshCw } from 'lucide-react';
import { SessionStatus } from '@shuttle-connect/types';

// pages/manage-session: host-only. Same host-authorization shape as pages/session-detail (fetch
// session + me, compare ids) -- this page doesn't trust SessionDetailPage's own check, since it's
// reachable directly by URL, not only via that page's "Manage requests" link.
export function ManageSessionPage() {
  const { sessionId } = useParams({ from: '/sessions/$sessionId_/manage' });
  const t = useT();

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
      <div className="flex flex-col gap-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
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

  return (
    <HostRequestPanel
      sessionId={session.id}
      isFull={session.status === SessionStatus.FULL}
    />
  );
}
