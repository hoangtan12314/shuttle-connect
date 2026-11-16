import { CoverPhoto, useSession } from '@/entities/session';
import { useMe } from '@/entities/user';
import { useAuthUser } from '@/features/auth';
import { EditSessionForm } from '@/features/edit-session';
import { ChangeCoverButton } from '@/features/upload-session-cover';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { useT } from '@/shared/i18n';
import { Link, useParams } from '@tanstack/react-router';
import { RefreshCw } from 'lucide-react';
import { SessionStatus } from '@shuttle-connect/types';

// Standalone, not inlined in the component body -- Date.now() called directly during render trips
// the React Compiler's purity rule (same pattern as ManageSessionPage's hasStarted).
function hasStarted(startTime: string): boolean {
  return new Date(startTime).getTime() <= Date.now();
}

// pages/edit-session: host-only. Same host-authorization shape as pages/manage-session -- it's
// reachable directly by URL, so it doesn't trust the page that linked here. The cover photo lives
// here (not on the requests page): it's a property of the session, and uploads on its own,
// separately from the form's Save.
export function EditSessionPage() {
  const { sessionId } = useParams({ from: '/sessions/$sessionId_/edit' });
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
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
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

  if (me?.id !== session.host.id) {
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

  if (
    session.status === SessionStatus.CANCELLED ||
    hasStarted(session.startTime)
  ) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <div className="space-y-1">
          <p className="font-semibold">{t.notEditableT}</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            {t.notEditableB}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/sessions/$sessionId" params={{ sessionId: session.id }}>
            {t.backList}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <PageHeader title={t.editSessionT} />
      <EditSessionForm
        session={session}
        coverField={
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium">{t.coverL}</span>
            <CoverPhoto
              courtId={session.court.id}
              imageUrl={session.coverUrl}
              className="aspect-[5/2] rounded-xl"
            />
            <div className="self-start">
              <ChangeCoverButton sessionId={session.id} />
            </div>
          </div>
        }
      />
    </div>
  );
}
