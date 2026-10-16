import { Badge } from '@/shared/ui/badge';
import { RequestStatus } from '@shuttle-connect/types';

export const RequestStatusBadge = ({ status }: { status: RequestStatus }) => {
  const variant =
    status === RequestStatus.APPROVED
      ? 'default'
      : status === RequestStatus.REJECTED
        ? 'destructive'
        : 'outline';

  return <Badge variant={variant}>{status}</Badge>;
};
