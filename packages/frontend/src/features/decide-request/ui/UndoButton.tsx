import { Button } from '@/shared/ui/button';
import {
  RequestStatus,
  type RequestItemResponse,
} from '@shuttle-connect/types';
import { useDecideRequest } from '../api/use-decide-request';
import { useT } from '@/shared/i18n';

// Reuses useDecideRequest -- the mutation is already generic over `status`, and undoing a
// decision is just PATCHing the same route back to PENDING (UndoDecisionUseCase on the backend,
// selected by the controller when status === PENDING). No separate mutation needed.
export function UndoButton({ request }: { request: RequestItemResponse }) {
  const { mutate, isPending } = useDecideRequest();
  const t = useT();

  const disabled =
    (request.status !== RequestStatus.APPROVED &&
      request.status !== RequestStatus.REJECTED) ||
    isPending;

  return (
    <Button
      variant="outline"
      disabled={disabled}
      onClick={() =>
        mutate({
          sessionId: request.session.id,
          userId: request.user.id,
          status: RequestStatus.PENDING,
        })
      }
    >
      {isPending ? '...' : t.undo}
    </Button>
  );
}
