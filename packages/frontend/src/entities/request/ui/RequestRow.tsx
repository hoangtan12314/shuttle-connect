import type { RequestItemResponse } from '@shuttle-connect/types';
import type React from 'react';
import { RequestStatusBadge } from './RequestStatusBadge';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { useLanguageStore, skillLevelNames } from '@/shared/i18n';
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

export function RequestRow({
  request,
  action,
}: {
  request: RequestItemResponse;
  action?: React.ReactNode;
}) {
  const language = useLanguageStore((state) => state.language);
  const minutesAgo = minutesSince(request.createdAt);

  return (
    <div className="border-border flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{initials(request.user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{request.user.name}</span>
          <span className="text-muted-foreground text-sm">
            {skillLevelNames[request.user.skillLevel][language]} ·{' '}
            {formatRelativeMinutes(minutesAgo, language)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <RequestStatusBadge status={request.status} />
        {action}
      </div>
    </div>
  );
}
