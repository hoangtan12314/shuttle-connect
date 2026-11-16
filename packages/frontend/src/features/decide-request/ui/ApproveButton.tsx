import { Button } from '@/shared/ui/button';
import {
  RequestStatus,
  type RequestItemResponse,
} from '@shuttle-connect/types';
import { useDecideRequest } from '../api/use-decide-request';
import { useT } from '@/shared/i18n';

export function ApproveButton({
  request,
  isFull = false,
  className,
}: {
  request: RequestItemResponse;
  /** The session has no open slot left: approving would fail server-side, so say so up front
   *  instead of offering a button that can only error. */
  isFull?: boolean;
  className?: string;
}) {
  const { mutate, isPending } = useDecideRequest();
  const t = useT();

  const disabled =
    request.status !== RequestStatus.PENDING || isPending || isFull;

  const label = isPending
    ? t.approvingBtn
    : request.status === RequestStatus.APPROVED
      ? t.approvedBtn
      : isFull
        ? t.fullBtn
        : t.approveBtn;

  return (
    <Button
      disabled={disabled}
      className={className}
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
