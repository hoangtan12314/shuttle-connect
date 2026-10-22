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
import { JoinSessionButton } from '@/features/join-session';
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
  const existingRequest = myRequests?.find((r) => r.session.id === session.id);

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
            <Button variant="outline" disabled>
              {t.withdrawBtn}
            </Button>
          </StatusCallout>
        )}

      {session.status !== SessionStatus.CANCELLED &&
        existingRequest?.status === RequestStatus.PENDING && (
          <StatusCallout icon={Clock} title={t.pendingT} body={t.pendingB}>
            <Button variant="outline" disabled>
              {t.withdrawBtn}
            </Button>
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
        !existingRequest &&
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
        !existingRequest &&
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
        !existingRequest &&
        (myLevel === undefined || myLevel >= session.minSkillLevel) && (
          <div className="flex flex-col items-center gap-2">
            <JoinSessionButton
              session={session}
              isAuthenticated={isAuthenticated}
            />
            <p className="text-muted-foreground text-center text-xs">
              {t.joinNote}
            </p>
          </div>
        )}
    </div>
  );
}
