import { Badge } from '@/shared/ui/badge';
import { SessionStatus } from '@shuttle-connect/types';
import { useLanguageStore, sessionStatusNames } from '@/shared/i18n';

export const SessionStatusBadge = ({ status }: { status: SessionStatus }) => {
  const language = useLanguageStore((state) => state.language);

  // Per index.css's 60/30/10 note: OPEN is the common case (shows on most cards), so it gets the
  // neutral-leaning `primary` tag, not a loud color -- CANCELLED (rare, meaningful) is the one
  // that should stand out, hence `destructive`.
  const variant =
    status === SessionStatus.OPEN
      ? 'primary'
      : status === SessionStatus.CANCELLED
        ? 'destructive'
        : 'neutral';

  return (
    <Badge variant={variant}>{sessionStatusNames[status][language]}</Badge>
  );
};
