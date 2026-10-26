import { useQuery } from '@tanstack/react-query';
import type { NotificationListResponse } from '@shuttle-connect/types';
import { apiRequest } from '@/shared/api';
import { notificationKeys } from '../model/query-keys';

// In-app only, polling-based (no WebSocket/push yet) -- 60s is the floor the plan settled on to
// keep API Gateway/DynamoDB request volume cheap at scale; refetchOnWindowFocus catches up
// sooner when the host actually looks at the tab.
export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () =>
      apiRequest<NotificationListResponse>('/users/me/notifications'),
    enabled,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
