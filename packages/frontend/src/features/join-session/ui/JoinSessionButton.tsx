import {
  RequestStatus,
  SessionStatus,
  type RequestItemResponse,
  type SessionOverview,
} from '@shuttle-connect/types';
import { useJoinSession } from '../api/use-join-session';
import {
  hasReachedJoinLimit,
  isWithinRejoinCooldown,
  remainingCooldownMinutes,
} from '../lib/rejoin-limits';
import { Button } from '@/shared/ui/button';
import { useMyRequests } from '@/entities/request';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  useT,
  sessionStatusNames,
  useLanguageStore,
  type Messages,
} from '@/shared/i18n';

// Every state the viewer's own request can be in, mapped once here so both call sites (the
// Browse card and JoinerSessionView) get it for free -- before this, only PENDING/APPROVED were
// recognized, so a REJECTED or rate-limited WITHDRAWN request rendered an enabled "Join" that
// was guaranteed to fail (409/429) on click. Request state takes priority over session status
// (it's about *you*, not the session), same precedence the old alreadyRequested check already
// had. Cap is checked before cooldown, matching Request.assertCanRejoin.
function requestButtonState(
  existingRequest: RequestItemResponse | undefined,
  t: Messages,
): { label: string; disabled: boolean; variant?: 'outline' } | null {
  if (!existingRequest) return null;

  switch (existingRequest.status) {
    case RequestStatus.PENDING:
      return { label: t.requestedBtn, disabled: true };
    case RequestStatus.APPROVED:
      return { label: t.joinedBtn, disabled: true };
    case RequestStatus.REJECTED:
      // outline, not the default filled style -- this reads as "here's what happened to your
      // request" (a status), not as an action the viewer could still take.
      return { label: t.declinedBtn, disabled: true, variant: 'outline' };
    case RequestStatus.WITHDRAWN: {
      if (hasReachedJoinLimit(existingRequest.joinCount)) {
        return { label: t.joinLimitBtn, disabled: true };
      }
      const { withdrawnAt } = existingRequest;
      if (withdrawnAt && isWithinRejoinCooldown(withdrawnAt)) {
        const minutes = remainingCooldownMinutes(withdrawnAt);
        return {
          label: `${t.rejoinInBtn} ${minutes} ${t.minUnit}`,
          disabled: true,
        };
      }
      return null;
    }
  }
}

export function JoinSessionButton({
  session,
  isAuthenticated,
  className,
  size,
}: {
  session: SessionOverview;
  isAuthenticated: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}) {
  const { mutate, isPending } = useJoinSession();
  const { data: myRequests, isLoading: isMyRequestLoading } =
    useMyRequests(isAuthenticated);
  const t = useT();
  const language = useLanguageStore((state) => state.language);

  const existingRequest = myRequests?.find((r) => r.session.id === session.id);
  const requestState = requestButtonState(existingRequest, t);

  const disabled =
    session.status !== SessionStatus.OPEN ||
    isPending ||
    !!requestState?.disabled;

  const label = isPending
    ? t.joiningBtn
    : requestState
      ? requestState.label
      : session.status === SessionStatus.OPEN
        ? t.joinBtn
        : sessionStatusNames[SessionStatus.FULL][language];

  if (isMyRequestLoading) {
    return <Skeleton className={className ?? 'h-9 w-full'} />;
  }

  return (
    <Button
      variant={requestState?.variant}
      size={size}
      disabled={disabled}
      className={className}
      onClick={() => mutate({ sessionId: session.id })}
    >
      {label}
    </Button>
  );
}
