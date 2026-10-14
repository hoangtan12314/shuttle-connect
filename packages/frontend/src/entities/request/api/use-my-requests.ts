import { useQuery } from '@tanstack/react-query';
import type { RequestItemResponse } from '@shuttle-connect/types';
import { apiRequest } from '@/shared/api';
import { requestKeys } from '../model/query-keys';

export function useMyRequests(enabled = true) {
  return useQuery({
    queryKey: requestKeys.mine(),
    queryFn: () => apiRequest<RequestItemResponse[]>('/requests/mine'),
    enabled,
  });
}
