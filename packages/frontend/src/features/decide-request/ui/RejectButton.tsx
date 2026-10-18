import { Button } from '@/shared/ui/button';
import {
  RequestStatus,
  type RequestItemResponse,
} from '@shuttle-connect/types';
import { useDecideRequest } from '../api/use-decide-request';
import { useT } from '@/shared/i18n';

export function RejectButton({ request }: { request: RequestItemResponse }) {
  const { mutate, isPending } = useDecideRequest();
  const t = useT();

  const disabled = request.status !== RequestStatus.PENDING || isPending;

  const label = isPending
    ? t.rejectingBtn
    : request.status === RequestStatus.REJECTED
      ? t.rejectedBtn
      : t.reject;

  return (
    <Button
      variant="outline"
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
