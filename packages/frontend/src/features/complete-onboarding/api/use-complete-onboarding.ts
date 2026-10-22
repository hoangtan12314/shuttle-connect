import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CompleteOnboardingInput,
  UserItemResponse,
} from '@shuttle-connect/types';
import { apiRequest } from '@/shared/api';
import { userKeys } from '@/entities/user';

// features/complete-onboarding/api: PATCH /users/me/onboarding. The response is the full updated
// UserItemResponse (onboarded: true), so it's written straight into the `me` cache instead of
// refetching -- which is also what releases the onboarding gate in app/routes/__root.tsx
// instantly. Errors toast via the global MutationCache handler (shared/api/query-client.ts).
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CompleteOnboardingInput) =>
      apiRequest<UserItemResponse>('/users/me/onboarding', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.me(), user);
    },
  });
}
