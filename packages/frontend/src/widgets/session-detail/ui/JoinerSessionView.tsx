import type { SessionItemResponse } from '@shuttle-connect/types';
import {
  RequestStatus,
  SessionStatus,
  SkillLevel,
} from '@shuttle-connect/types';
import { Link } from '@tanstack/react-router';
import { Ban, Check, Clock, Lock, Users, X } from 'lucide-react';
import { useMyRequests } from '@/entities/request';
import { SessionCard } from '@/entities/session';
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
import { StatusCallout } from './StatusCallout';

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

  return (
    <div className="flex flex-col gap-4">
      <SessionCard session={session} myLevel={myLevel} />

      <div className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium">
          {t.hostedByL}
        </p>
        <p>{session.host.name}</p>
      </div>

      <div className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium">{t.notesL}</p>
        <p>{session.description || t.descEmptyT}</p>
      </div>

      {session.status === SessionStatus.CANCELLED && (
        <StatusCallout icon={Ban} title={t.cancelledT} tone="destructive" />
      )}

      {session.status !== SessionStatus.CANCELLED &&
        existingRequest?.status === RequestStatus.APPROVED && (
          <StatusCallout
            icon={Check}
            title={t.approvedT}
            body={t.approvedB}
            tone="primary"
          >
            <div className="flex flex-col items-center gap-2">
              <WithdrawConfirmDialog
                joinCount={existingRequest.joinCount}
                disabled={isPastCutoff}
                isWithdrawing={isWithdrawing}
                onConfirm={() => withdraw(session.id)}
              />
              {isPastCutoff && (
                <p className="text-muted-foreground max-w-sm text-center text-xs">
                  {t.withdrawClosedNote}
                </p>
              )}
            </div>
          </StatusCallout>
        )}

      {session.status !== SessionStatus.CANCELLED &&
        existingRequest?.status === RequestStatus.PENDING && (
          <StatusCallout icon={Clock} title={t.pendingT} body={t.pendingB}>
            <WithdrawConfirmDialog
              joinCount={existingRequest.joinCount}
              isWithdrawing={isWithdrawing}
              onConfirm={() => withdraw(session.id)}
            />
          </StatusCallout>
        )}

      {session.status !== SessionStatus.CANCELLED &&
        existingRequest?.status === RequestStatus.REJECTED && (
          <StatusCallout
            icon={X}
            title={t.rejectedT}
            body={t.rejectedB}
            tone="destructive"
          >
            <Button asChild variant="outline">
              <Link to="/">{t.findAnother}</Link>
            </Button>
          </StatusCallout>
        )}

      {session.status !== SessionStatus.CANCELLED &&
        isFreeToJoin &&
        myLevel !== undefined &&
        myLevel < session.minSkillLevel && (
          <StatusCallout
            icon={Lock}
            title={t.belowLevel}
            body={t.belowLevelB}
            tone="destructive"
          >
            <Button asChild onClick={() => setMaxLevel(myLevel ?? null)}>
              <Link to="/">{t.seeAtMyLevel}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/profile">{t.updateMyLevel}</Link>
            </Button>
          </StatusCallout>
        )}

      {session.status === SessionStatus.FULL &&
        isFreeToJoin &&
        (myLevel === undefined || myLevel >= session.minSkillLevel) && (
          <StatusCallout
            icon={Users}
            title={sessionStatusNames[SessionStatus.FULL][language]}
            body={t.sessionFullB}
          >
            <Button asChild variant="outline">
              <Link to="/">{t.findAnother}</Link>
            </Button>
          </StatusCallout>
        )}

      {session.status === SessionStatus.OPEN &&
        isFreeToJoin &&
        (myLevel === undefined || myLevel >= session.minSkillLevel) && (
          <div className="flex flex-col items-center gap-2">
            {!isCapped && (
              <JoinSessionButton
                session={session}
                isAuthenticated={isAuthenticated}
              />
            )}
            <p className="text-muted-foreground text-center text-xs">
              {isCapped
                ? t.joinLimitReachedNote
                : cooldownMinutes !== null
                  ? `${t.rejoinCooldownNote} ${cooldownMinutes} ${t.minUnit}`
                  : existingRequest?.status === RequestStatus.WITHDRAWN
                    ? t.withdrawnNoteT
                    : t.joinNote}
            </p>
          </div>
        )}
    </div>
  );
}
