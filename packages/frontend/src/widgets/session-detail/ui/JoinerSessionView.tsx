import type { SessionItemResponse } from '@shuttle-connect/types';
import {
  RequestStatus,
  SessionStatus,
  SkillLevel,
} from '@shuttle-connect/types';
import { Link } from '@tanstack/react-router';
import { Check, Clock, Lock, Users, X } from 'lucide-react';
import { useMyRequests, RequestStatusBadge } from '@/entities/request';
import { SessionStatusBadge } from '@/entities/session';
import {
  hasReachedJoinLimit,
  isWithinRejoinCooldown,
  JoinSessionButton,
  remainingCooldownMinutes,
} from '@/features/join-session';
import {
  isWithinWithdrawCutoff,
  useWithdrawRequest,
  WithdrawConfirmDialog,
} from '@/features/withdraw-request';
import { useSessionFilters } from '@/features/filter-sessions';
import { Button } from '@/shared/ui/button';
import { useT, sessionStatusNames, useLanguageStore } from '@/shared/i18n';
import { SessionDetailView } from './SessionDetailView';
import { DetailActionBar } from './DetailActionBar';

export function JoinerSessionView({
  session,
  myLevel,
  isAuthenticated,
}: {
  session: SessionItemResponse;
  myLevel?: SkillLevel;
  isAuthenticated: boolean;
}) {
  const t = useT();
  const language = useLanguageStore((state) => state.language);
  const { data: myRequests } = useMyRequests(isAuthenticated);
  const setMaxLevel = useSessionFilters((state) => state.setMaxLevel);
  const { mutate: withdraw, isPending: isWithdrawing } = useWithdrawRequest();
  const existingRequest = myRequests?.find((r) => r.session.id === session.id);

  const isFreeToJoin =
    !existingRequest || existingRequest.status === RequestStatus.WITHDRAWN;
  // Computed once per render, not inline at each use site -- two separate Date.now() reads could
  // otherwise disagree right at the 6h boundary (button enabled while the note still shows, or
  // vice versa) for that one render.
  const isPastCutoff = isWithinWithdrawCutoff(session.startTime);

  // Anti-churn display state, display-only like isPastCutoff above -- only ever relevant for a
  // WITHDRAWN existing request (a brand-new joiner has no join_count/withdrawn_at to check).
  // The cap is checked first: it's permanent for this session, unlike the cooldown, which
  // resolves itself as time passes.
  const withdrawnAt =
    existingRequest?.status === RequestStatus.WITHDRAWN
      ? existingRequest.withdrawnAt
      : null;
  const isCapped =
    existingRequest?.status === RequestStatus.WITHDRAWN &&
    hasReachedJoinLimit(existingRequest.joinCount);
  const isCoolingDown = !isCapped && isWithinRejoinCooldown(withdrawnAt);
  const cooldownMinutes =
    isCoolingDown && withdrawnAt ? remainingCooldownMinutes(withdrawnAt) : null;

  const isCancelled = session.status === SessionStatus.CANCELLED;

  // Relation badge in the header: what this session currently means to the viewer, highest-
  // priority state first -- an existing request (it's about *you*) before the session's own
  // status (FULL/CANCELLED), same precedence JoinSessionButton already uses.
  const badge = isCancelled ? undefined : existingRequest ? (
    <RequestStatusBadge status={existingRequest.status} />
  ) : session.status === SessionStatus.FULL ? (
    <SessionStatusBadge status={session.status} />
  ) : undefined;

  let actionBar = null;
  if (!isCancelled && existingRequest?.status === RequestStatus.APPROVED) {
    actionBar = (
      <DetailActionBar
        icon={Check}
        title={t.approvedT}
        body={t.approvedB}
        tone="primary"
        note={isPastCutoff ? t.withdrawClosedNote : undefined}
      >
        <WithdrawConfirmDialog
          joinCount={existingRequest.joinCount}
          disabled={isPastCutoff}
          isWithdrawing={isWithdrawing}
          onConfirm={() => withdraw(session.id)}
          triggerClassName="min-h-12 w-full justify-center"
        />
      </DetailActionBar>
    );
  } else if (
    !isCancelled &&
    existingRequest?.status === RequestStatus.PENDING
  ) {
    actionBar = (
      <DetailActionBar icon={Clock} title={t.pendingT} body={t.pendingB}>
        <WithdrawConfirmDialog
          joinCount={existingRequest.joinCount}
          isWithdrawing={isWithdrawing}
          onConfirm={() => withdraw(session.id)}
          triggerClassName="min-h-12 w-full justify-center"
        />
      </DetailActionBar>
    );
  } else if (
    !isCancelled &&
    existingRequest?.status === RequestStatus.REJECTED
  ) {
    actionBar = (
      <DetailActionBar
        icon={X}
        title={t.rejectedT}
        body={t.rejectedB}
        tone="destructive"
      >
        <Button asChild size="lg" className="justify-start">
          <Link to="/">{t.findAnother}</Link>
        </Button>
      </DetailActionBar>
    );
  } else if (
    !isCancelled &&
    isFreeToJoin &&
    myLevel !== undefined &&
    myLevel < session.minSkillLevel
  ) {
    actionBar = (
      <DetailActionBar
        icon={Lock}
        title={t.belowLevel}
        body={t.belowLevelB}
        tone="destructive"
      >
        <Button
          asChild
          size="lg"
          className="justify-start"
          onClick={() => setMaxLevel(myLevel ?? null)}
        >
          <Link to="/">{t.seeAtMyLevel}</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="justify-start">
          <Link to="/profile">{t.updateMyLevel}</Link>
        </Button>
      </DetailActionBar>
    );
  } else if (
    session.status === SessionStatus.FULL &&
    isFreeToJoin &&
    (myLevel === undefined || myLevel >= session.minSkillLevel)
  ) {
    actionBar = (
      <DetailActionBar
        icon={Users}
        title={sessionStatusNames[SessionStatus.FULL][language]}
        body={t.sessionFullB}
      >
        <Button asChild variant="outline" size="lg" className="justify-start">
          <Link to="/">{t.findAnother}</Link>
        </Button>
      </DetailActionBar>
    );
  } else if (
    session.status === SessionStatus.OPEN &&
    isFreeToJoin &&
    (myLevel === undefined || myLevel >= session.minSkillLevel)
  ) {
    actionBar = (
      <DetailActionBar
        note={
          isCapped
            ? t.joinLimitReachedNote
            : cooldownMinutes !== null
              ? `${t.rejoinCooldownNote} ${cooldownMinutes} ${t.minUnit}`
              : existingRequest?.status === RequestStatus.WITHDRAWN
                ? t.withdrawnNoteT
                : t.joinNote
        }
      >
        {!isCapped && (
          <JoinSessionButton
            session={session}
            isAuthenticated={isAuthenticated}
            size="lg"
            className="justify-center"
          />
        )}
      </DetailActionBar>
    );
  }

  return (
    <SessionDetailView
      session={session}
      myLevel={myLevel}
      badge={badge}
      actionBar={actionBar}
    />
  );
}
