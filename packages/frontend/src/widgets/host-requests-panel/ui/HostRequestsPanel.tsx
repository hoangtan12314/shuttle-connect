import { RequestRow, useSessionRequests } from '@/entities/request';
import { ApproveButton, RejectButton } from '@/features/decide-request';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { useT } from '@/shared/i18n';

export function HostRequestPanel({ sessionId }: { sessionId: string }) {
  const { data: requests, isLoading } = useSessionRequests(sessionId);
  const t = useT();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.manageT}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 px-0">
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
                  <>
                    <ApproveButton request={r} />
                    <RejectButton request={r} />
                  </>
                }
              />
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
