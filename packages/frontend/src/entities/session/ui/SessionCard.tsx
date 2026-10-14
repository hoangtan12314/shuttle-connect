import type { SessionOverview } from '@shuttle-connect/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { SessionStatusBadge } from './SessionStatusBadge';

export function SessionCard({
  session,
  action,
}: {
  session: SessionOverview;
  action?: React.ReactNode;
}) {
  const { court, startTime, slotsRemaining, slotsTotal, shuttleType, status } =
    session;

  const formattedTime = new Date(startTime).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{court.name}</CardTitle>
        <SessionStatusBadge status={status} />
      </CardHeader>
      <CardContent className="text-muted-foreground flex flex-col gap-1 text-sm">
        <span>{formattedTime}</span>
        <span>
          {slotsRemaining} / {slotsTotal} slots remaining
        </span>
        <span>{shuttleType}</span>
      </CardContent>
      {action && <CardFooter>{action}</CardFooter>}
    </Card>
  );
}
