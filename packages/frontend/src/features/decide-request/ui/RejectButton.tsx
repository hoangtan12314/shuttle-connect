import { Button } from '@/shared/ui/button';
import {
  RequestStatus,
  type RequestItemResponse,
} from '@shuttle-connect/types';
import { useDecideRequest } from '../api/use-decide-request';

export function RejectButton({ request }: { request: RequestItemResponse }) {
  const { mutate, isPending } = useDecideRequest();

  const disabled = request.status !== RequestStatus.PENDING || isPending;

  const label = isPending
    ? 'Rejecting...'
    : request.status === RequestStatus.REJECTED
      ? 'Rejected'
      : 'Reject';

  return (
    <Button
      disabled={disabled}
      onClick={() =>
        mutate({
          sessionId: request.session.id,
          userId: request.user.id,
          status: RequestStatus.REJECTED,
        })
      }
    >
      {label}
    </Button>
  );
}
