import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RequestItemResponse } from '@shuttle-connect/types';
import { apiRequest } from '@/shared/api';
import { sessionKeys } from '@/entities/session';
import { requestKeys } from '@/entities/request';

export function useWithdrawRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiRequest<RequestItemResponse>(
        `/sessions/${sessionId}/requests/mine/withdraw`,
        { method: 'PATCH' },
      ),
    onSuccess: async (updatedRequest, sessionId) => {
      queryClient.setQueryData<RequestItemResponse[]>(
        requestKeys.forSession(sessionId),
        (old) =>
          old?.map((r) =>
            r.user.id === updatedRequest.user.id ? updatedRequest : r,
          ),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
        queryClient.invalidateQueries({ queryKey: requestKeys.mine() }),
      ]);
    },
  });
}
