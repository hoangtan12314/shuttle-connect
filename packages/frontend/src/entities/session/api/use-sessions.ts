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
    // Polling, not a websocket -- slots filling up or a host cancelling are the kind of changes
    // worth surfacing without the viewer refreshing. 30s: frequent enough to feel "live" on a
    // browse page people sit on, not so frequent it hammers the API for a value that rarely
    // changes second to second.
    refetchInterval: 30_000,
  });
}
