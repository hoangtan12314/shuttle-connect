import type { SessionItemResponse } from '@shuttle-connect/types';
import { useQuery } from '@tanstack/react-query';
import { sessionKeys } from '../model/query-keys';
import { apiRequest } from '@/shared/api';

// entities/session/api: useSession(id) -- GET /sessions/:id
export function useSession(id: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => apiRequest<SessionItemResponse>(`/sessions/${id}`),
  });
}
