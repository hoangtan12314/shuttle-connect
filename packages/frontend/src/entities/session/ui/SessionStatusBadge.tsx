import { Badge } from '@/shared/ui/badge';
import type { SessionStatus } from '@shuttle-connect/types';

export const SessionStatusBadge = ({ status }: { status: SessionStatus }) => {
  const variant =
    status === 'OPEN'
      ? 'default'
      : status === 'CANCELLED'
        ? 'destructive'
        : 'outline';

  return <Badge variant={variant}>{status}</Badge>;
};
