import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateSessionInput,
  SessionItemResponse,
} from '@shuttle-connect/types';
import { apiRequest } from '@/shared/api';
import { sessionKeys } from '@/entities/session';

// features/create-session/api: useCreateSession() -- POST /sessions mutation. The response is
// now a full SessionItemResponse (server-side fix -- see the session.mapper.ts overload), so the
// detail page's cache can be seeded directly instead of navigating and waiting on a refetch.
export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSessionInput) =>
      apiRequest<SessionItemResponse>('/sessions', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async (session) => {
      queryClient.setQueryData(sessionKeys.detail(session.id), session);
      await queryClient.invalidateQueries({ queryKey: sessionKeys.mine() });
    },
  });
}
