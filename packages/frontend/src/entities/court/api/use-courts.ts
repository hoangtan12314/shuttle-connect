import type { Area, City, CourtItemOverview } from '@shuttle-connect/types';
import { useQuery } from '@tanstack/react-query';
import { courtKeys } from '../model/query-keys';
import { apiRequest } from '@/shared/api';

// entities/court/api: useCourts(city, area) -- GET /courts. Only enabled once both are chosen --
// the create-session form's district select starts empty, and ListCourtsByDistrictDto requires
// both city and area, so there's nothing valid to query until then.
export function useCourts(city: City | undefined, area: Area | undefined) {
  return useQuery({
    queryKey: courtKeys.list(city!, area!),
    queryFn: () =>
      apiRequest<CourtItemOverview[]>(`/courts?city=${city}&area=${area}`),
    enabled: !!city && !!area,
  });
}
