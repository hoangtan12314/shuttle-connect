import { requestKeys } from '@/entities/request';
import { sessionKeys } from '@/entities/session';
import { apiRequest } from '@/shared/api';
import type {
  RequestItemResponse,
  RequestStatus,
} from '@shuttle-connect/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// features/decide-request/api: useDecideRequest() -- PATCH /sessions/:id/requests/:userId mutation
export function useDecideRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      userId,
      status,
    }: {
      sessionId: string;
      userId: string;
      status: RequestStatus;
    }) =>
      apiRequest<RequestItemResponse>(
        `/sessions/${sessionId}/requests/${userId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        },
      ),
    onSuccess: async (updatedRequest, { sessionId }) => {
      queryClient.setQueryData<RequestItemResponse[]>(
        requestKeys.forSession(sessionId),
        (old) =>
          old?.map((r) =>
            r.user.id === updatedRequest.user.id ? updatedRequest : r,
          ),
      );
      await queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}
