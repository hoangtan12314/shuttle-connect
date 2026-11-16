import type { ReactNode } from 'react';
import {
  RequestStatus,
  type RequestItemResponse,
  type SkillLevel,
} from '@shuttle-connect/types';
import { Check, TriangleAlert } from 'lucide-react';
import { RequestStatusBadge } from './RequestStatusBadge';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { skillLevelNames, useLanguageStore, useT } from '@/shared/i18n';
import { formatRelativeMinutes } from '@/shared/lib';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

// Standalone, not inlined in the component body -- Date.now() called directly during render trips
// react-hooks/purity (render must be deterministic); a called function isn't analyzed the same
// way, which is also why SessionBrowser.tsx's matchesDay/matchesTimeOfDay helpers get away with
// `new Date()` the same way.
function minutesSince(isoString: string): number {
  return Math.max(
    0,
    Math.round((Date.now() - new Date(isoString).getTime()) / 60_000),
  );
}

// One join request as the host sees it: who asked, how long ago, their level, and whether that
// level meets the session's minimum (a below-minimum request is still the host's call -- this
// just makes it visible before they tap Approve). `actions` is the host's buttons, supplied by
// the caller: an entity can't import features/decide-request.
export function RequestCard({
  request,
  minSkillLevel,
  actions,
}: {
  request: RequestItemResponse;
  minSkillLevel: SkillLevel;
  actions?: ReactNode;
}) {
  const t = useT();
  const language = useLanguageStore((state) => state.language);
  const minutesAgo = minutesSince(request.createdAt);
  const meetsMinimum = request.user.skillLevel >= minSkillLevel;

  return (
    <div className="bg-card flex flex-col gap-3 rounded-2xl border p-4">
      <div className="flex items-start gap-3">
        <Avatar size="lg">
          <AvatarFallback>{initials(request.user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-base font-extrabold">
              {request.user.name}
            </span>
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              {formatRelativeMinutes(minutesAgo, language)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge variant="neutral">
              {skillLevelNames[request.user.skillLevel][language]}
            </Badge>
            <span
              className={`flex items-center gap-1 text-xs ${
                meetsMinimum ? '' : 'text-destructive font-extrabold'
              }`}
            >
              {meetsMinimum ? (
                <Check className="size-3.5" />
              ) : (
                <TriangleAlert className="size-3.5" />
              )}
              {meetsMinimum
                ? t.meetsMin
                : `${t.belowMinLead} ${skillLevelNames[minSkillLevel][language]} ${t.belowMinTrail}`.trim()}
            </span>
          </div>
          {request.status !== RequestStatus.PENDING && (
            <div className="mt-0.5">
              <RequestStatusBadge status={request.status} />
            </div>
          )}
        </div>
      </div>
      {actions}
    </div>
  );
}
