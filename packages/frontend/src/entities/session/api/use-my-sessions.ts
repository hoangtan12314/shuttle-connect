import { useQuery } from '@tanstack/react-query';
import type { SessionOverview } from '@shuttle-connect/types';
import { apiRequest } from '@/shared/api';
import { sessionKeys } from '../model/query-keys';

export function useMySessions(enabled = true) {
  return useQuery({
    queryKey: sessionKeys.mine(),
    queryFn: () => apiRequest<SessionOverview[]>('/sessions/mine'),
    enabled,
  });
}
