import { useQuery } from '@tanstack/react-query';
import { requestKeys } from '../model/query-keys';
import { apiRequest } from '@/shared/api';
import type { RequestItemResponse } from '@shuttle-connect/types';

export function useSessionRequests(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: requestKeys.forSession(sessionId),
    queryFn: () =>
      apiRequest<RequestItemResponse[]>(`/sessions/${sessionId}/requests`),
    enabled,
  });
}
