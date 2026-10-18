import type { SessionItemResponse } from '@shuttle-connect/types';
import { SessionCard } from '@/entities/session';
import { useT } from '@/shared/i18n';

// Deliberately doesn't render widgets/host-requests-panel itself -- a widget importing another
// widget is the same sideways-import problem as one entity importing another (see the FSD
// checkpoint question on SessionCard/myLevel). pages/session-detail composes this with
// HostRequestPanel instead.
export function HostSessionView({ session }: { session: SessionItemResponse }) {
  const t = useT();

  return (
    <div className="flex flex-col gap-4">
      <SessionCard session={session} />

      <div className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium">{t.notesL}</p>
        <p>{session.description || t.descEmptyT}</p>
      </div>
    </div>
  );
}
