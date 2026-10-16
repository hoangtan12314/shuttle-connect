import { useQuery } from '@tanstack/react-query';
import type { UserItemResponse } from '@shuttle-connect/types';
import { apiRequest } from '@/shared/api';
import { userKeys } from '../model/query-keys';

export function useMe(enabled = true) {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: () => apiRequest<UserItemResponse>('/users/me'),
    enabled,
  });
}
