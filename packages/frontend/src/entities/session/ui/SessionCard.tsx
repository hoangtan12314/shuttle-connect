import type { SessionOverview } from '@shuttle-connect/types';
import { SessionStatus, SkillLevel } from '@shuttle-connect/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { SessionStatusBadge } from './SessionStatusBadge';
import {
  useT,
  useLanguageStore,
  shuttleTypeNames,
  skillLevelNames,
} from '@/shared/i18n';
import { formatPrice, formatSessionWindow } from '@/shared/lib';
import { Lock } from 'lucide-react';

export function SessionCard({
  session,
  action,
  myLevel,
}: {
  session: SessionOverview;
  action?: React.ReactNode;
  /** The viewer's own skill level, if known -- dims the level tag into a warning when the
   *  session's minimum is above it. Omit when signed out or the level hasn't loaded yet. */
  myLevel?: SkillLevel;
}) {
  const {
    court,
    startTime,
    endTime,
    slotsRemaining,
    slotsTotal,
    shuttleType,
    minSkillLevel,
    priceMale,
    priceFemale,
    status,
  } = session;
  const t = useT();
  const language = useLanguageStore((state) => state.language);

  // "Last slot" -- a genuinely occasional, meaningful highlight (one specific session state,
  // not a default look), exactly the bounded use the accent color is reserved for.
  const isLastSlot = status === SessionStatus.OPEN && slotsRemaining === 1;
  const isBelowLevel = myLevel !== undefined && myLevel < minSkillLevel;
  const samePrice = priceMale === priceFemale;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{court.name}</CardTitle>
        <SessionStatusBadge status={status} />
      </CardHeader>
      <CardContent className="text-muted-foreground flex flex-col gap-1 text-sm">
        <span>{formatSessionWindow(startTime, endTime, language)}</span>
        <span className="flex flex-wrap items-center gap-2">
          <span>
            {slotsRemaining} / {slotsTotal} {t.slotsL.toLowerCase()}
          </span>
          {isLastSlot && <Badge variant="accent">{t.lastSlot}</Badge>}
          <Badge
            variant={isBelowLevel ? 'destructive' : 'neutral'}
            title={isBelowLevel ? t.belowLevel : undefined}
          >
            {isBelowLevel && <Lock />}
            {skillLevelNames[minSkillLevel][language]}
          </Badge>
        </span>
        <span>{shuttleTypeNames[shuttleType]}</span>
        <span>
          {samePrice
            ? formatPrice(priceMale, language)
            : `${t.priceM} ${formatPrice(priceMale, language)} · ${t.priceF} ${formatPrice(priceFemale, language)}`}
        </span>
      </CardContent>
      {action && <CardFooter>{action}</CardFooter>}
    </Card>
  );
}
