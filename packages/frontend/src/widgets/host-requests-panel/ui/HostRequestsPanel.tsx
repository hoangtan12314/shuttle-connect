import { RequestRow, useSessionRequests } from '@/entities/request';
import {
  ApproveButton,
  RejectButton,
  UndoButton,
} from '@/features/decide-request';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { useT } from '@/shared/i18n';
import { RequestStatus } from '@shuttle-connect/types';
import { Users } from 'lucide-react';

export function HostRequestPanel({
  sessionId,
  isFull = false,
}: {
  sessionId: string;
  /** Shows the "session is full" banner above the list -- the host can still see/undo existing
   *  decisions, just can't approve anyone new until a slot frees up. */
  isFull?: boolean;
}) {
  const { data: requests, isLoading } = useSessionRequests(sessionId);
  const t = useT();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.manageT}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        {isFull && (
          <div className="mx-6 flex items-start gap-3 rounded-lg border border-dashed p-4">
            <Users className="text-muted-foreground mt-0.5 size-5 flex-none" />
            <div className="space-y-1">
              <p className="font-semibold">{t.fullT}</p>
              <p className="text-muted-foreground text-sm">{t.fullB}</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col gap-3 px-6">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {!isLoading && (!requests || requests.length === 0) && (
          <p className="text-muted-foreground px-6 text-sm">{t.noRequestsT}</p>
        )}

        {!isLoading &&
          requests &&
          requests.length > 0 &&
          requests.map((r) => (
            <div key={r.user.id} className="px-6">
              <RequestRow
                request={r}
                action={
                  r.status === RequestStatus.PENDING ? (
                    <>
                      <ApproveButton request={r} />
                      <RejectButton request={r} />
                    </>
                  ) : r.status === RequestStatus.WITHDRAWN ? null : (
                    <UndoButton request={r} />
                  )
                }
              />
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
