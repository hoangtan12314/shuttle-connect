import { Button } from '@/shared/ui/button';
import {
  RequestStatus,
  type RequestItemResponse,
} from '@shuttle-connect/types';
import { useDecideRequest } from '../api/use-decide-request';

export function ApproveButton({ request }: { request: RequestItemResponse }) {
  const { mutate, isPending } = useDecideRequest();

  const disabled = request.status !== RequestStatus.PENDING || isPending;

  const label = isPending
    ? 'Approving...'
    : request.status === RequestStatus.APPROVED
      ? 'Approved'
      : 'Approve';

  return (
    <Button
      disabled={disabled}
      onClick={() =>
        mutate({
          sessionId: request.session.id,
          userId: request.user.id,
          status: RequestStatus.APPROVED,
        })
      }
    >
      {label}
    </Button>
  );
}
