import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateRequestInput,
  RequestItemResponse,
} from '@shuttle-connect/types';
import { apiRequest } from '@/shared/api';
import { sessionKeys } from '@/entities/session';
import { requestKeys } from '@/entities/request';
import { toast } from 'sonner';

export function useJoinSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRequestInput) =>
      apiRequest<RequestItemResponse>('/requests', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      toast.success('Request sent');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
        queryClient.invalidateQueries({ queryKey: requestKeys.mine() }),
      ]);
    },
  });
}
