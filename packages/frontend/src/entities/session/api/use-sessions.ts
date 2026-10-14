import type { Area, City, SessionOverview } from '@shuttle-connect/types';
import { useQuery } from '@tanstack/react-query';
import { sessionKeys } from '../model/query-keys';
import { apiRequest } from '@/shared/api';

// entities/session/api: useSessions(city, area) -- GET /sessions
export function useSessions(city: City, area: Area) {
  return useQuery({
    queryKey: sessionKeys.list(city, area),
    queryFn: () =>
      apiRequest<SessionOverview[]>(`/sessions?city=${city}&area=${area}`),
  });
}
