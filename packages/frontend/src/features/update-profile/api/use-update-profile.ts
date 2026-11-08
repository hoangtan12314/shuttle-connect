import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UpdateProfileInput,
  UserItemResponse,
} from '@shuttle-connect/types';
import { apiRequest } from '@/shared/api';
import { userKeys } from '@/entities/user';

// features/update-profile/api: PATCH /users/me. The response is the full updated
// UserItemResponse, same contract as features/complete-onboarding's mutation, so it's written
// straight into the `me` cache instead of refetching.
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      apiRequest<UserItemResponse>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.me(), user);
    },
  });
}
