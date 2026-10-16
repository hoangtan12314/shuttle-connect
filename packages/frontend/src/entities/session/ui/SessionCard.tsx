import type { SessionOverview } from '@shuttle-connect/types';
import { SessionStatus } from '@shuttle-connect/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { SessionStatusBadge } from './SessionStatusBadge';
import { useT, useLanguageStore, shuttleTypeNames } from '@/shared/i18n';
import { formatDateTime } from '@/shared/lib';

export function SessionCard({
  session,
  action,
}: {
  session: SessionOverview;
  action?: React.ReactNode;
}) {
  const { court, startTime, slotsRemaining, slotsTotal, shuttleType, status } =
    session;
  const t = useT();
  const language = useLanguageStore((state) => state.language);

  // "Last slot" -- a genuinely occasional, meaningful highlight (one specific session state,
  // not a default look), exactly the bounded use the accent color is reserved for.
  const isLastSlot = status === SessionStatus.OPEN && slotsRemaining === 1;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{court.name}</CardTitle>
        <SessionStatusBadge status={status} />
      </CardHeader>
      <CardContent className="text-muted-foreground flex flex-col gap-1 text-sm">
        <span>{formatDateTime(startTime, language)}</span>
        <span className="flex items-center gap-2">
          <span>
            {slotsRemaining} / {slotsTotal} {t.slotsL.toLowerCase()}
          </span>
          {isLastSlot && <Badge variant="accent">{t.lastSlot}</Badge>}
        </span>
        <span>{shuttleTypeNames[shuttleType]}</span>
      </CardContent>
      {action && <CardFooter>{action}</CardFooter>}
    </Card>
  );
}
