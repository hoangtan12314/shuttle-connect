import { useState } from 'react';
import {
  RequestStatus,
  type SessionItemResponse,
} from '@shuttle-connect/types';
import { Users } from 'lucide-react';
import { RequestCard, useSessionRequests } from '@/entities/request';
import { SlotMeter } from '@/entities/session';
import {
  ApproveButton,
  RejectButton,
  UndoButton,
} from '@/features/decide-request';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useT } from '@/shared/i18n';

type TabKey =
  RequestStatus.PENDING | RequestStatus.APPROVED | RequestStatus.REJECTED;

// widgets/host-requests-panel: the host's side of a session -- how full it is, then the requests
// split into Pending / Approved / Declined. WITHDRAWN requests are left out: nothing for the host
// to do about them, and the design has no tab for them.
export function HostRequestPanel({
  session,
}: {
  session: SessionItemResponse;
}) {
  const { data: requests, isLoading } = useSessionRequests(session.id);
  const t = useT();
  const [tab, setTab] = useState<TabKey>(RequestStatus.PENDING);

  const filled = session.slotsTotal - session.slotsRemaining;
  const isFull = session.slotsRemaining === 0;

  const visible = (requests ?? []).filter(
    (r) => r.status !== RequestStatus.WITHDRAWN,
  );
  const countOf = (status: TabKey) =>
    visible.filter((r) => r.status === status).length;
  const rows = visible.filter((r) => r.status === tab);

  const tabs: { key: TabKey; label: string }[] = [
    { key: RequestStatus.PENDING, label: t.tabPending },
    { key: RequestStatus.APPROVED, label: t.tabApproved },
    { key: RequestStatus.REJECTED, label: t.tabDeclined },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-card grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 rounded-2xl border p-4">
        <div className="flex flex-col justify-center">
          <span className="text-4xl leading-none font-extrabold tracking-tight tabular-nums">
            {filled}/{session.slotsTotal}
          </span>
          <span className="text-muted-foreground text-xs font-semibold">
            {t.filledShort}
          </span>
        </div>
        <div className="flex flex-col justify-center gap-2.5">
          <SlotMeter
            slotsTotal={session.slotsTotal}
            slotsRemaining={session.slotsRemaining}
          />
          <span className="font-extrabold">
            {isFull
              ? t.noSlotsLeft
              : `${session.slotsRemaining} ${t.slotsLeftSuffix}`}
          </span>
        </div>
      </div>

      {isFull && (
        <div
          role="status"
          className="bg-foreground text-background flex gap-3 rounded-2xl p-4"
        >
          <Users className="size-5 flex-none" />
          <div className="flex flex-col gap-0.5">
            <span className="font-extrabold">{t.fullT}</span>
            <span className="text-sm">{t.fullB}</span>
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
        <TabsList className="h-12 w-full">
          {tabs.map(({ key, label }) => (
            <TabsTrigger
              key={key}
              value={key}
              className="text-xs font-extrabold sm:text-sm"
            >
              {label} · {countOf(key)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <div className="flex flex-col gap-1.5 px-1 py-6">
          <span className="text-lg font-extrabold">
            {tab === RequestStatus.PENDING
              ? t.noRequestsWaitingT
              : t.noOneHereT}
          </span>
          {tab === RequestStatus.PENDING && (
            <span className="text-muted-foreground text-sm">
              {t.noRequestsWaitingB}
            </span>
          )}
        </div>
      )}

      {!isLoading &&
        rows.map((r) => (
          <RequestCard
            key={r.user.id}
            request={r}
            minSkillLevel={session.minSkillLevel}
            actions={
              r.status === RequestStatus.PENDING ? (
                <div className="grid grid-cols-2 gap-2 pl-13">
                  <RejectButton request={r} className="min-h-11" />
                  <ApproveButton
                    request={r}
                    isFull={isFull}
                    className="min-h-11"
                  />
                </div>
              ) : (
                <div className="pl-13">
                  <UndoButton request={r} className="min-h-11" />
                </div>
              )
            }
          />
        ))}
    </div>
  );
}
