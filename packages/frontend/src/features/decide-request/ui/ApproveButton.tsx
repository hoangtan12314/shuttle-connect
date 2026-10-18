import { Button } from '@/shared/ui/button';
import {
  RequestStatus,
  type RequestItemResponse,
} from '@shuttle-connect/types';
import { useDecideRequest } from '../api/use-decide-request';
import { useT } from '@/shared/i18n';

export function ApproveButton({ request }: { request: RequestItemResponse }) {
  const { mutate, isPending } = useDecideRequest();
  const t = useT();

  const disabled = request.status !== RequestStatus.PENDING || isPending;

  const label = isPending
    ? t.approvingBtn
    : request.status === RequestStatus.APPROVED
      ? t.approvedBtn
      : t.approveBtn;

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
