import type { ReactNode } from 'react';
import type { SessionItemResponse } from '@shuttle-connect/types';
import { SessionStatus, SkillLevel } from '@shuttle-connect/types';
import { Ban, Check, Lock, MapPin } from 'lucide-react';
import { CoverPhoto, SlotMeter } from '@/entities/session';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { PageHeader } from '@/shared/ui/page-header';
import {
  useT,
  useLanguageStore,
  shuttleTypeNames,
  skillLevelNames,
  areaNames,
} from '@/shared/i18n';
import {
  formatDayHeader,
  formatPriceShort,
  formatTimeRange,
} from '@/shared/lib';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function Tile({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`bg-card flex flex-col gap-1 rounded-xl p-4 ${className ?? ''}`}
    >
      <span className="text-[11px] font-semibold tracking-wider text-neutral-700 uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

// widgets/session-detail/ui: the shared layout both JoinerSessionView and HostSessionView render
// -- hero photo, big time/court header, fact-tile grid. Each caller supplies its own `badge`
// (the viewer's relation to this session) and `actionBar` (what they can do about it), since
// those differ by who's looking and what state the request/session is in.
export function SessionDetailView({
  session,
  myLevel,
  badge,
  actionBar,
}: {
  session: SessionItemResponse;
  myLevel?: SkillLevel;
  badge?: ReactNode;
  actionBar?: ReactNode;
}) {
  const t = useT();
  const language = useLanguageStore((state) => state.language);

  const {
    court,
    startTime,
    endTime,
    priceMale,
    priceFemale,
    shuttleType,
    minSkillLevel,
  } = session;
  const durationHours =
    (new Date(endTime).getTime() - new Date(startTime).getTime()) / 3_600_000;
  const samePrice = priceMale === priceFemale;
  const fitKnown = myLevel !== undefined;
  const fits = fitKnown && (myLevel as SkillLevel) >= minSkillLevel;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
      <PageHeader title={t.detailT} className="md:hidden" />

      <CoverPhoto
        courtId={court.id}
        imageUrl={session.coverUrl}
        className="aspect-[5/2] rounded-xl"
      />

      <div className="flex flex-col gap-1.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-primary-700 text-xs font-extrabold tracking-wider uppercase">
            {formatDayHeader(new Date(startTime), language)}
          </span>
          {badge}
        </div>
        <span className="text-4xl leading-none font-extrabold tracking-tight text-balance sm:text-5xl">
          {formatTimeRange(startTime, endTime, language)}
        </span>
        <span className="text-xl font-extrabold">{court.name}</span>
        <span className="flex items-start gap-1.5 text-sm">
          <MapPin className="mt-0.5 size-4 flex-none" />
          <span>
            <b className="font-extrabold">
              {areaNames[court.district][language]}
            </b>{' '}
            · {court.city}
          </span>
        </span>
      </div>

      {session.status === SessionStatus.CANCELLED && (
        <div
          role="status"
          className="bg-destructive flex gap-3 rounded-xl p-4 text-white"
        >
          <Ban className="size-6 flex-none" />
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-extrabold">{t.cancelledT}</span>
            <span className="text-sm font-medium">{t.cancelledB}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Tile label={t.slotsL} className="col-span-2 gap-2.5">
          <SlotMeter
            slotsTotal={session.slotsTotal}
            slotsRemaining={session.slotsRemaining}
          />
          <span className="text-xl font-extrabold">
            {session.slotsRemaining === 0
              ? t.noSlotsLeft
              : `${session.slotsRemaining}/${session.slotsTotal} ${t.slotsLeftSuffix}`}
          </span>
        </Tile>

        <Tile label={t.levelL}>
          <span className="text-xl font-extrabold">
            {skillLevelNames[minSkillLevel][language]}
          </span>
          {fitKnown && (
            <span
              className={`mt-1 flex items-start gap-1 text-xs font-extrabold ${
                fits ? '' : 'text-destructive'
              }`}
            >
              {fits ? (
                <Check className="mt-0.5 size-3.5 flex-none" />
              ) : (
                <Lock className="mt-0.5 size-3.5 flex-none" />
              )}
              {fits
                ? t.fitsLevel
                : `${t.needsLevelLead} ${skillLevelNames[minSkillLevel][language]}+ · ${t.youreLead} ${skillLevelNames[myLevel as SkillLevel][language]}`}
            </span>
          )}
        </Tile>

        <Tile label={t.priceL}>
          {samePrice ? (
            <span className="text-base font-extrabold">
              {formatPriceShort(priceMale, language)}
            </span>
          ) : (
            <>
              <span className="text-base font-extrabold">
                {t.maleL} {formatPriceShort(priceMale, language)}
              </span>
              <span className="text-base font-extrabold">
                {t.femaleL} {formatPriceShort(priceFemale, language)}
              </span>
            </>
          )}
        </Tile>

        <Tile label={t.shuttleL}>
          <span className="text-base font-extrabold">
            {shuttleTypeNames[shuttleType]}
          </span>
        </Tile>

        <Tile label={t.durL}>
          <span className="text-base font-extrabold">
            {durationHours} {t.hoursUnit}
          </span>
        </Tile>

        <div className="bg-card col-span-2 flex items-center gap-3 rounded-xl p-4">
          <Avatar size="lg">
            <AvatarFallback>{initials(session.host.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold tracking-wider text-neutral-700 uppercase">
              {t.hostL}
            </span>
            <span className="text-base font-extrabold">
              {session.host.name}
            </span>
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-1 p-4">
          <span className="text-[11px] font-semibold tracking-wider text-neutral-700 uppercase">
            {t.notesL}
          </span>
          <p className="text-wrap-pretty text-sm">
            {session.description || t.descEmptyT}
          </p>
        </div>
      </div>

      {actionBar}
    </div>
  );
}
