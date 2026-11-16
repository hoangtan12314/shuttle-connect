import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  SessionItemResponse,
  UpdateSessionInput,
} from '@shuttle-connect/types';
import { apiRequest } from '@/shared/api';
import { sessionKeys } from '@/entities/session';

// features/edit-session/api: PATCH /sessions/:id. The response is the full updated session, so the
// detail cache is written directly; lists are only invalidated, since they hold SessionOverview
// items that carry the edited price/level/slots too.
export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      changes,
    }: {
      sessionId: string;
      changes: UpdateSessionInput;
    }) =>
      apiRequest<SessionItemResponse>(`/sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      }),
    onSuccess: async (session) => {
      queryClient.setQueryData(sessionKeys.detail(session.id), session);
      await queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}
