import {
  RequestStatus,
  SessionStatus,
  type SessionOverview,
} from '@shuttle-connect/types';
import { useJoinSession } from '../api/use-join-session';
import { Button } from '@/shared/ui/button';
import { useMyRequests } from '@/entities/request';
import { Skeleton } from '@/shared/ui/skeleton';

export function JoinSessionButton({
  session,
  isAuthenticated,
}: {
  session: SessionOverview;
  isAuthenticated: boolean;
}) {
  const { mutate, isPending } = useJoinSession();
  const { data: myRequests, isLoading: isMyRequestLoading } =
    useMyRequests(isAuthenticated);

  const existingRequest = myRequests?.find((r) => r.session.id === session.id);
  const alreadyRequested =
    existingRequest?.status === RequestStatus.APPROVED ||
    existingRequest?.status === RequestStatus.PENDING;

  const disabled =
    session.status !== SessionStatus.OPEN || isPending || alreadyRequested;

  const label = isPending
    ? 'Joining...'
    : alreadyRequested
      ? existingRequest?.status === RequestStatus.PENDING
        ? 'Requested'
        : 'Joined'
      : session.status === SessionStatus.OPEN
        ? 'Join'
        : 'Full';

  if (isMyRequestLoading) {
    return <Skeleton className="h-9 w-full" />;
  }

  return (
    <Button
      disabled={disabled}
      onClick={() => mutate({ sessionId: session.id })}
    >
      {label}
    </Button>
  );
}
