import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationListResponse } from '@shuttle-connect/types';
import { apiRequest } from '@/shared/api';
import { notificationKeys } from '@/entities/notification';

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiRequest<{ lastReadAt: string }>('/users/me/notifications/read', {
        method: 'PATCH',
      }),
    onSuccess: ({ lastReadAt }) => {
      // The full list doesn't change, only the read watermark -- write it directly instead of
      // refetching, same lesson as onboarding's setQueryData.
      queryClient.setQueryData<NotificationListResponse>(
        notificationKeys.list(),
        (old) => (old ? { ...old, lastReadAt } : old),
      );
    },
  });
}
