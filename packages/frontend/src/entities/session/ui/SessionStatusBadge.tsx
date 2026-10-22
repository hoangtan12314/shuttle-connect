import { Badge } from '@/shared/ui/badge';
import { SessionStatus } from '@shuttle-connect/types';
import { useLanguageStore, sessionStatusNames } from '@/shared/i18n';

export const SessionStatusBadge = ({
  status,
  className,
}: {
  status: SessionStatus;
  className?: string;
}) => {
  const language = useLanguageStore((state) => state.language);

  // OPEN needs to read clearly as "you can still join" at a glance (it sits on the card's photo
  // header now, competing with a busy background), so it gets the dedicated `success` green
  // rather than the paler `primary` tag -- CANCELLED stays `destructive`, the other genuinely
  // attention-worthy state.
  const variant =
    status === SessionStatus.OPEN
      ? 'success'
      : status === SessionStatus.CANCELLED
        ? 'destructive'
        : 'neutral';

  return (
    <Badge variant={variant} className={className}>
      {sessionStatusNames[status][language]}
    </Badge>
  );
};
