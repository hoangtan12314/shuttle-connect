import { RequestRow, useSessionRequests } from '@/entities/request';
import { ApproveButton, RejectButton } from '@/features/decide-request';
import { Skeleton } from '@/shared/ui/skeleton';

export function HostRequestPanel({ sessionId }: { sessionId: string }) {
  const { data: requests, isLoading } = useSessionRequests(sessionId);

  if (isLoading) {
    return <Skeleton></Skeleton>;
  }

  if (!requests || requests.length === 0) {
    return <div>There's currently no request</div>;
  }

  return requests.map((r) => (
    <RequestRow
      request={r}
      key={r.user.id}
      action={
        <>
          <ApproveButton request={r} />
          <RejectButton request={r} />
        </>
      }
    />
  ));
}
