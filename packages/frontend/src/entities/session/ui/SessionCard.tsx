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
import { CourtPhoto } from './CourtPhoto';
import {
  useT,
  useLanguageStore,
  shuttleTypeNames,
  skillLevelNames,
  areaNames,
} from '@/shared/i18n';
import { formatPriceShort, formatSessionWindow } from '@/shared/lib';
import {
  Lock,
  MapPin,
  CalendarDays,
  Users,
  Coins,
  ChevronRight,
  Feather,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function SessionCard({
  session,
  action,
  myLevel,
  linkToDetail = false,
}: {
  session: SessionOverview;
  action?: React.ReactNode;
  /** The viewer's own skill level, if known -- dims the level tag into a warning when the
   *  session's minimum is above it. Omit when signed out or the level hasn't loaded yet. */
  myLevel?: SkillLevel;
  /** Wraps the header/content (not the action slot, to avoid nesting an interactive action
   *  inside an anchor) in a link to /sessions/:id. Only the browse grid wants this -- the
   *  session-detail page itself already renders this same component for its own id. */
  linkToDetail?: boolean;
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
  const priceText = samePrice
    ? formatPriceShort(priceMale, language)
    : `${t.maleL} ${formatPriceShort(priceMale, language)} · ${t.femaleL} ${formatPriceShort(priceFemale, language)}`;

  const header = (
    <>
      <CourtPhoto
        courtId={court.id}
        className="-mt-6 mb-4 aspect-[5/2] rounded-t-xl"
      >
        {court.district && (
          <Badge
            variant="neutral"
            className="absolute top-2 left-2 bg-white/90 text-neutral-800"
          >
            <MapPin /> {areaNames[court.district][language]}
          </Badge>
        )}
        <SessionStatusBadge
          status={status}
          className="absolute top-2 right-2"
        />
      </CourtPhoto>
      <CardHeader>
        <CardTitle>{court.name}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground flex flex-col gap-1 text-sm">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-4 shrink-0" />
          {formatSessionWindow(startTime, endTime, language)}
        </span>
        <span className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5">
            <Users className="size-4 shrink-0" />
            {slotsRemaining} / {slotsTotal} {t.slotsL.toLowerCase()}
          </span>
          {isLastSlot && <Badge variant="accent">{t.lastSlot}</Badge>}
          <Badge
            variant={isBelowLevel ? 'destructive' : 'warning'}
            title={isBelowLevel ? t.belowLevel : undefined}
          >
            {isBelowLevel && <Lock />}
            {skillLevelNames[minSkillLevel][language]}
          </Badge>
        </span>
        <span className="flex items-center gap-1.5">
          <Feather className="size-4 shrink-0" />
          {shuttleTypeNames[shuttleType]}
        </span>
      </CardContent>
    </>
  );

  return (
    <Card>
      {linkToDetail ? (
        <Link
          to="/sessions/$sessionId"
          params={{ sessionId: session.id }}
          className="contents"
        >
          {header}
        </Link>
      ) : (
        header
      )}
      <CardFooter className="items-center justify-between gap-2">
        <div>{action}</div>
        {linkToDetail ? (
          <Link
            to="/sessions/$sessionId"
            params={{ sessionId: session.id }}
            className="text-foreground flex items-center gap-1 text-sm font-medium"
          >
            <Coins className="text-muted-foreground size-4" />
            {priceText}
            <ChevronRight className="text-muted-foreground size-4" />
          </Link>
        ) : (
          <span className="text-foreground flex items-center gap-1 text-sm font-medium">
            <Coins className="text-muted-foreground size-4" />
            {priceText}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
