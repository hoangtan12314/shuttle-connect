import { Badge } from '@/shared/ui/badge';
import { RequestStatus } from '@shuttle-connect/types';
import { useLanguageStore, requestStatusNames } from '@/shared/i18n';

export const RequestStatusBadge = ({ status }: { status: RequestStatus }) => {
  const language = useLanguageStore((state) => state.language);

  const variant =
    status === RequestStatus.APPROVED
      ? 'primary'
      : status === RequestStatus.REJECTED
        ? 'destructive'
        : 'neutral';

  return (
    <Badge variant={variant}>{requestStatusNames[status][language]}</Badge>
  );
};
