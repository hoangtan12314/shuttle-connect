import {
  RequestStatus,
  SessionStatus,
  type SessionItemResponse,
} from '@shuttle-connect/types';
import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { useSessionRequests } from '@/entities/request';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { useT } from '@/shared/i18n';
import { SessionDetailView } from './SessionDetailView';
import { DetailActionBar } from './DetailActionBar';

// Standalone, not inlined in the component body -- Date.now() called directly during render trips
// the React Compiler's purity rule (same pattern as ManageSessionPage's hasStarted).
function hasStarted(startTime: string): boolean {
  return new Date(startTime).getTime() <= Date.now();
}

// Deliberately doesn't render widgets/host-requests-panel itself -- a widget importing another
// widget is the same sideways-import problem as one entity importing another, and the requests
// have their own page (pages/manage-session) anyway. This is the session's own facts plus a
// way to get to that page.
export function HostSessionView({ session }: { session: SessionItemResponse }) {
  const t = useT();
  const { data: requests } = useSessionRequests(session.id);

  const pendingCount =
    requests?.filter((r) => r.status === RequestStatus.PENDING).length ?? 0;
  // The server refuses edits once the session has started or been cancelled.
  const canEdit =
    session.status !== SessionStatus.CANCELLED &&
    !hasStarted(session.startTime);

  return (
    <SessionDetailView
      session={session}
      badge={<Badge variant="primary">{t.tagHosted}</Badge>}
      actionBar={
        <DetailActionBar>
          <Button asChild size="lg" className="min-h-12 justify-between">
            <Link
              to="/sessions/$sessionId/manage"
              params={{ sessionId: session.id }}
            >
              {pendingCount > 0 ? `${t.manageT} (${pendingCount})` : t.manageT}
              <ArrowRight />
            </Link>
          </Button>
          {canEdit && (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-12 justify-start"
            >
              <Link
                to="/sessions/$sessionId/edit"
                params={{ sessionId: session.id }}
              >
                {t.editSessionT}
              </Link>
            </Button>
          )}
        </DetailActionBar>
      }
    />
  );
}
